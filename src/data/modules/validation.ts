import type {
  ClinicalCase,
  ClinicalCaseStep,
  ClinicalTerm,
  Flashcard,
  MultipleChoiceQuestion,
  Question,
  QuestionOptionKey,
  StructuredStudyModule,
  StudyModuleTopic,
} from './types'

export type ValidationSeverity = 'info' | 'warning' | 'error'
export type ValidationItemType = 'question' | 'flashcard' | 'clinicalCase' | 'clinicalTerm' | 'module'

export interface ValidationIssue {
  code: string
  severity: ValidationSeverity
  itemType: ValidationItemType
  itemId: string | number
  topicName?: string
  message: string
}

export interface CorrectIndexDistribution {
  A: number
  B: number
  C: number
  D: number
  total: number
}

export interface StructuredContentValidationReport {
  issues: ValidationIssue[]
  correctIndexDistribution: CorrectIndexDistribution
}

export interface ValidatedStructuredStudyModule {
  content: StructuredStudyModule
  report: StructuredContentValidationReport
}

const OPTION_KEYS: QuestionOptionKey[] = ['A', 'B', 'C', 'D']
const EXPLANATION_MIN_LENGTH = 60
const EXPLANATION_MAX_LENGTH = 320
const BANNED_DISTRACTOR_PATTERNS = [
  /nenhuma das anteriores/i,
  /todas as anteriores/i,
  /todas as alternativas/i,
  /alternativas acima/i,
  /^ambas/i,
]

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function isMultipleChoiceQuestion(question: Question): question is MultipleChoiceQuestion {
  return question.tipo === 'multipla_escolha'
}

function cloneIssue(issue: ValidationIssue): ValidationIssue {
  return { ...issue }
}

export function checkOptionLength(question: Question): ValidationIssue[] {
  if (!isMultipleChoiceQuestion(question)) return []

  const lengths = OPTION_KEYS.map(key => question.alternativas[key].trim().length)
  const maxLength = Math.max(...lengths)
  const minLength = Math.min(...lengths)
  if (maxLength === 0) {
    return [{
      code: 'option-length-empty',
      severity: 'error',
      itemType: 'question',
      itemId: question.id,
      message: 'Question has an empty answer option.',
    }]
  }

  const spreadRatio = (maxLength - minLength) / maxLength
  if (spreadRatio <= 0.45) return []

  return [{
    code: 'option-length-spread',
    severity: 'warning',
    itemType: 'question',
    itemId: question.id,
    message: 'Answer option lengths are uneven enough to hint at the correct answer.',
  }]
}

export function getCorrectIndexDistribution(questions: Question[]): CorrectIndexDistribution {
  const multipleChoiceQuestions = questions.filter(isMultipleChoiceQuestion)
  return multipleChoiceQuestions.reduce<CorrectIndexDistribution>((acc, question) => {
    acc[question.correta] += 1
    acc.total += 1
    return acc
  }, { A: 0, B: 0, C: 0, D: 0, total: 0 })
}

export function checkCorrectIndexDistribution(questions: Question[]): ValidationIssue[] {
  const distribution = getCorrectIndexDistribution(questions)
  if (distribution.total < 4) return []

  const counts = OPTION_KEYS.map(key => distribution[key])
  const maxCount = Math.max(...counts)
  const minCount = Math.min(...counts)
  const issues: ValidationIssue[] = []

  if (counts.some(count => count === 0)) {
    issues.push({
      code: 'correct-index-missing-option',
      severity: 'warning',
      itemType: 'module',
      itemId: 'question-bank',
      message: 'At least one answer key never appears as the correct option.',
    })
  }

  if ((maxCount - minCount) / distribution.total > 0.35) {
    issues.push({
      code: 'correct-index-imbalanced',
      severity: 'warning',
      itemType: 'module',
      itemId: 'question-bank',
      message: 'Correct answer distribution is heavily skewed toward one option.',
    })
  }

  return issues
}

export function detectBadDistractors(question: Question): ValidationIssue[] {
  if (!isMultipleChoiceQuestion(question)) return []

  const issues: ValidationIssue[] = []
  const normalizedOptions = OPTION_KEYS.map(key => ({
    key,
    raw: question.alternativas[key],
    normalized: normalizeText(question.alternativas[key]),
  }))
  const correct = normalizedOptions.find(option => option.key === question.correta)
  if (!correct) return issues

  const seen = new Map<string, QuestionOptionKey>()

  for (const option of normalizedOptions) {
    if (!option.normalized) {
      issues.push({
        code: 'distractor-empty',
        severity: 'error',
        itemType: 'question',
        itemId: question.id,
        message: `Option ${option.key} is empty.`,
      })
      continue
    }

    if (seen.has(option.normalized)) {
      issues.push({
        code: 'distractor-duplicate',
        severity: 'warning',
        itemType: 'question',
        itemId: question.id,
        message: `Options ${seen.get(option.normalized)} and ${option.key} are effectively duplicates.`,
      })
    } else {
      seen.set(option.normalized, option.key)
    }

    if (option.key !== question.correta && option.normalized === correct.normalized) {
      issues.push({
        code: 'distractor-matches-correct',
        severity: 'error',
        itemType: 'question',
        itemId: question.id,
        message: `Option ${option.key} matches the correct answer too closely.`,
      })
    }

    if (option.key !== question.correta && BANNED_DISTRACTOR_PATTERNS.some(pattern => pattern.test(option.raw))) {
      issues.push({
        code: 'distractor-banned-pattern',
        severity: 'warning',
        itemType: 'question',
        itemId: question.id,
        message: `Option ${option.key} uses a weak distractor pattern.`,
      })
    }
  }

  return issues
}

export function checkExplanationLength(question: Question): ValidationIssue[] {
  const length = question.explicacao.trim().length
  if (length < EXPLANATION_MIN_LENGTH) {
    return [{
      code: 'explanation-too-short',
      severity: 'warning',
      itemType: 'question',
      itemId: question.id,
      message: 'Explanation is too short to teach the reasoning behind the answer.',
    }]
  }

  if (length > EXPLANATION_MAX_LENGTH) {
    return [{
      code: 'explanation-too-long',
      severity: 'warning',
      itemType: 'question',
      itemId: question.id,
      message: 'Explanation is long enough to be harder to scan during review.',
    }]
  }

  return []
}

function validateQuestion(question: Question, topicName: string): ValidationIssue[] {
  return [
    ...checkOptionLength(question),
    ...detectBadDistractors(question),
    ...checkExplanationLength(question),
  ].map(issue => ({ ...issue, topicName }))
}

function validateFlashcard(card: Flashcard, topicName: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (card.pergunta.trim().length < 8) {
    issues.push({
      code: 'flashcard-front-too-short',
      severity: 'warning',
      itemType: 'flashcard',
      itemId: card.id,
      topicName,
      message: 'Flashcard prompt is too short to be useful on its own.',
    })
  }

  if (card.resposta.trim().length < 12) {
    issues.push({
      code: 'flashcard-back-too-short',
      severity: 'warning',
      itemType: 'flashcard',
      itemId: card.id,
      topicName,
      message: 'Flashcard answer is too short to explain function or impact.',
    })
  }

  return issues
}

function validateClinicalTerm(term: ClinicalTerm, topicName: string): ValidationIssue[] {
  if (term.explicacao.trim().length >= 20) return []
  return [{
    code: 'clinical-term-explanation-too-short',
    severity: 'warning',
    itemType: 'clinicalTerm',
    itemId: term.id,
    topicName,
    message: 'Clinical term explanation is too short to guide a learner.',
  }]
}

function validateCaseStep(step: ClinicalCaseStep, caseId: string, topicName: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (step.options.length < 2) {
    issues.push({
      code: 'clinical-case-step-too-few-options',
      severity: 'error',
      itemType: 'clinicalCase',
      itemId: caseId,
      topicName,
      message: `Step ${step.id} needs at least two options.`,
    })
  }

  if (step.correctIndex < 0 || step.correctIndex >= step.options.length) {
    issues.push({
      code: 'clinical-case-step-invalid-correct-index',
      severity: 'error',
      itemType: 'clinicalCase',
      itemId: caseId,
      topicName,
      message: `Step ${step.id} has an invalid correctIndex.`,
    })
  }

  if (step.explanation.trim().length < EXPLANATION_MIN_LENGTH) {
    issues.push({
      code: 'clinical-case-step-explanation-too-short',
      severity: 'warning',
      itemType: 'clinicalCase',
      itemId: caseId,
      topicName,
      message: `Step ${step.id} explanation is too short.`,
    })
  }

  return issues
}

function validateClinicalCase(clinicalCase: ClinicalCase, topicName: string): ValidationIssue[] {
  return (clinicalCase.steps ?? []).flatMap(step => validateCaseStep(step, clinicalCase.id, topicName))
}

function setReviewFlag<T extends { id: string | number; needsReview?: boolean }>(
  items: T[],
  issues: ValidationIssue[],
  itemType: ValidationItemType,
): T[] {
  const reviewIds = new Set(
    issues
      .filter(issue => issue.itemType === itemType)
      .map(issue => String(issue.itemId))
  )

  return items.map(item => ({
    ...item,
    needsReview: reviewIds.has(String(item.id)),
  }))
}

function withReviewFlags(topic: StudyModuleTopic, issues: ValidationIssue[]): StudyModuleTopic {
  return {
    ...topic,
    flashcards: setReviewFlag(topic.flashcards, issues, 'flashcard'),
    questions: setReviewFlag(topic.questions, issues, 'question'),
    clinicalTerms: topic.clinicalTerms ? setReviewFlag(topic.clinicalTerms, issues, 'clinicalTerm') : undefined,
    clinicalCases: topic.clinicalCases ? setReviewFlag(topic.clinicalCases, issues, 'clinicalCase') : undefined,
  }
}

export function validateStructuredStudyModule(content: StructuredStudyModule): ValidatedStructuredStudyModule {
  const topicIssues = content.topics.flatMap(topic => [
    ...topic.flashcards.flatMap(card => validateFlashcard(card, topic.name)),
    ...topic.questions.flatMap(question => validateQuestion(question, topic.name)),
    ...(topic.clinicalTerms ?? []).flatMap(term => validateClinicalTerm(term, topic.name)),
    ...(topic.clinicalCases ?? []).flatMap(clinicalCase => validateClinicalCase(clinicalCase, topic.name)),
  ])
  const distributionIssues = checkCorrectIndexDistribution(content.topics.flatMap(topic => topic.questions))
  const issues = [...topicIssues, ...distributionIssues].map(cloneIssue)
  const report: StructuredContentValidationReport = {
    issues,
    correctIndexDistribution: getCorrectIndexDistribution(content.topics.flatMap(topic => topic.questions)),
  }

  return {
    content: {
      ...content,
      topics: content.topics.map(topic => withReviewFlags(topic, issues)),
    },
    report,
  }
}
