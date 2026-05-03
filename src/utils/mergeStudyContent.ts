import questionsData from '../data/questions.json'
import { staticStudyModules } from '../data/modules'
import type {
  Flashcard as ModuleFlashcard,
  Question as ModuleQuestion,
  StructuredStudyModule,
  StudyModuleTopic,
} from '../data/modules/types'
import { getActiveProfileId, PROFILE_DATA_KEYS, profileStorageKey } from './profiles'
import type { ParsedFlashcard, ParsedQuestion, ParsedStudyContent } from './parseStudyContent'

export const EXTRA_QUESTIONS_KEY = 'vetstudy_extra_questions'

export interface MergeStudyContentResult {
  addedQuestionIds: number[]
  skippedQuestionIds: number[]
  questoes: ParsedQuestion[]
}

export type StaticModuleFlashcard = ModuleFlashcard
export type StaticModuleQuestion = ModuleQuestion
export type StaticModuleTopic = StudyModuleTopic
export type StaticStudyModule = StructuredStudyModule

export interface SaveFlashcardsResult {
  addedFlashcardIds: string[]
  skippedFlashcardIds: string[]
  flashcards: ParsedFlashcard[]
}

export interface MergeStaticModuleResult extends MergeStudyContentResult, SaveFlashcardsResult {
  fixedQuestionTemas: number
}

const DEFAULT_QUESTION_TEMA = 'Reprodução Animal'
const CANONICAL_TEMAS = [
  DEFAULT_QUESTION_TEMA,
  'Anatomia Reprodutiva',
  'Clínica de Ruminantes',
  'Clínica de Pequenos',
  'Farmacologia Veterinária',
]

function readJSON<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function byId(question: { id: number }) {
  return question.id
}

function byFlashcardId(card: { id: string }) {
  return card.id
}

function normalizeForMatch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const ESTRAL_MODULE_KEY = normalizeForMatch('Ciclo Estral e Reprodução Animal')

const CURATED_STATIC_QUESTION_SKIPS = new Map<number, string>([
  [9001, 'Coberto pelo banco base em estro, estrogênio e receptividade sexual.'],
  [9002, 'Coberto pelo banco base em anestro pós-parto e balanço energético negativo.'],
  [9004, 'Coberto pelo banco base em detecção de cio e janela de maior fertilidade.'],
  [9006, 'Coberto pelo banco base na sequência das fases do ciclo estral.'],
  [9009, 'Coberto pelo banco base em diestro, corpo lúteo funcional e progesterona alta.'],
  [9010, 'Coberto pelo banco base em luteólise fisiológica por PGF2α.'],
  [9013, 'Coberto pelo banco base em pico de LH e ovulação.'],
  [9014, 'Coberto pelo banco base em estrogênio e manifestação de cio.'],
  [9015, 'Coberto pelo banco base em progesterona do diestro e inibição de novo cio.'],
  [9016, 'Coberto pelo banco base em duração média do ciclo estral bovino.'],
  [9017, 'Coberto pelo banco base em sazonalidade de dias curtos na ovelha.'],
])

const CURATED_STATIC_FLASHCARD_SKIPS = new Map<string, string>([
  ['fc_estral_0003', 'Duplica sinais de estro já cobertos nos cards antigos.'],
  ['fc_estral_0004', 'Duplica visão geral de anestro já coberta no deck atual.'],
  ['fc_estral_0005', 'Duplica corpo lúteo e progesterona após ovulação.'],
  ['fc_estral_0006', 'Duplica importância prática da detecção de cio.'],
  ['fc_estral_0009', 'Duplica a ordem das fases do ciclo estral.'],
  ['fc_estral_0011', 'Duplica o estro como fase mais visível no campo.'],
  ['fc_estral_0013', 'Duplica o papel do diestro e da progesterona.'],
  ['fc_estral_0014', 'Duplica a leitura de progesterona alta no diestro.'],
  ['fc_estral_0015', 'Duplica luteólise por ausência de reconhecimento da gestação.'],
  ['fc_estral_0019', 'Duplica estrogênio alto e sinais de cio.'],
  ['fc_estral_0020', 'Duplica progesterona após ovulação.'],
  ['fc_estral_0021', 'Duplica o efeito da PGF2α sobre o corpo lúteo.'],
  ['fc_estral_0028', 'Duplica sazonalidade da égua já presente no deck atual.'],
  ['fc_estral_0029', 'Duplica sazonalidade de ovelhas e cabras já presente no deck atual.'],
])

function shouldSkipCuratedQuestionId(questionId: number) {
  return CURATED_STATIC_QUESTION_SKIPS.has(questionId)
}

function shouldSkipCuratedFlashcardId(flashcardId: string) {
  return CURATED_STATIC_FLASHCARD_SKIPS.has(flashcardId)
}

function getStaticModuleSkipIds(content: StaticStudyModule) {
  if (normalizeForMatch(content.module) !== ESTRAL_MODULE_KEY) {
    return {
      questionIds: new Set<number>(),
      flashcardIds: new Set<string>(),
    }
  }

  return {
    questionIds: new Set(CURATED_STATIC_QUESTION_SKIPS.keys()),
    flashcardIds: new Set(CURATED_STATIC_FLASHCARD_SKIPS.keys()),
  }
}

function normalizeQuestionTema(tema: unknown) {
  if (typeof tema !== 'string') return DEFAULT_QUESTION_TEMA

  const trimmed = tema.trim()
  if (!trimmed) return DEFAULT_QUESTION_TEMA

  const normalized = normalizeForMatch(trimmed)
  const exactCanonical = CANONICAL_TEMAS.find(canonical => normalizeForMatch(canonical) === normalized)
  if (exactCanonical) return exactCanonical

  if (normalized.includes('reproducao') || normalized.includes('reprodutiv')) return DEFAULT_QUESTION_TEMA
  if (normalized.includes('anatomia')) return 'Anatomia Reprodutiva'
  if (normalized.includes('ruminante') || normalized.includes('bovino')) return 'Clínica de Ruminantes'
  if (normalized.includes('pequeno')) return 'Clínica de Pequenos'
  if (normalized.includes('farmacologia')) return 'Farmacologia Veterinária'

  return trimmed
}

function getModuleTema(content: StaticStudyModule, fallbackTema?: unknown) {
  if (typeof content.disciplina === 'string' && content.disciplina.trim()) {
    return content.disciplina.trim()
  }

  if (typeof fallbackTema === 'string' && fallbackTema.trim()) {
    return normalizeQuestionTema(fallbackTema)
  }

  return normalizeQuestionTema(content.module)
}

function repairStoredExtraQuestionTemas(moduleQuestions: ParsedQuestion[]) {
  const expectedTemaById = new Map(moduleQuestions.map(question => [question.id, question.tema]))
  const existingExtra = loadExtraQuestions()
  let fixed = 0

  const repairedExtra = existingExtra.map(question => {
    const expectedTema = expectedTemaById.get(question.id)
    if (!expectedTema) return question

    const normalizedCurrentTema = normalizeQuestionTema(question.tema)
    const nextTema = normalizedCurrentTema === expectedTema ? normalizedCurrentTema : expectedTema
    if (question.tema === nextTema) return question

    fixed += 1
    return { ...question, tema: nextTema }
  })

  if (fixed > 0) {
    saveJSON(EXTRA_QUESTIONS_KEY, repairedExtra)
    try { window.dispatchEvent(new Event('vetstudy_questions_update')) } catch {}
  }

  return fixed
}

export function loadExtraQuestions(): ParsedQuestion[] {
  return readJSON<ParsedQuestion[]>(EXTRA_QUESTIONS_KEY, []).filter(
    question => !shouldSkipCuratedQuestionId(question.id)
  )
}

function loadStaticModuleQuestions(): ParsedQuestion[] {
  const staticIds = new Set<number>()

  return staticStudyModules.flatMap(module => {
    const { parsedContent } = staticModuleToParsedContent(module)
    return parsedContent.questoes.filter(question => {
      if (staticIds.has(question.id)) return false
      staticIds.add(question.id)
      return true
    })
  })
}

function loadStaticModuleFlashcards(): ParsedFlashcard[] {
  const staticIds = new Set<string>()

  return staticStudyModules.flatMap(module => {
    const { parsedContent } = staticModuleToParsedContent(module)
    return parsedContent.flashcards.filter(card => {
      if (staticIds.has(card.id)) return false
      staticIds.add(card.id)
      return true
    })
  })
}

export function getMergedQuestionBank(): ParsedQuestion[] {
  const baseQuestions = questionsData.questoes as ParsedQuestion[]
  const staticQuestions = loadStaticModuleQuestions()
  const knownIds = new Set([...baseQuestions, ...staticQuestions].map(byId))
  const extraQuestions = loadExtraQuestions().filter(question => !knownIds.has(question.id))
  const extraIds = new Set<number>()
  const uniqueExtraQuestions = extraQuestions.filter(question => {
    if (extraIds.has(question.id)) return false
    extraIds.add(question.id)
    return true
  })

  return [...baseQuestions, ...staticQuestions, ...uniqueExtraQuestions]
}

export function getMergedFlashcardBank(profileId?: string | null): ParsedFlashcard[] {
  const staticFlashcards = loadStaticModuleFlashcards()
  if (!profileId) return staticFlashcards

  const knownIds = new Set(staticFlashcards.map(byFlashcardId))
  const profileFlashcards = loadProfileFlashcards(profileId).filter(card => !knownIds.has(card.id))
  const extraIds = new Set<string>()
  const uniqueProfileFlashcards = profileFlashcards.filter(card => {
    if (extraIds.has(card.id)) return false
    extraIds.add(card.id)
    return true
  })

  return [...staticFlashcards, ...uniqueProfileFlashcards]
}

export function mergeStudyContent(content: ParsedStudyContent): MergeStudyContentResult {
  const baseIds = new Set((questionsData.questoes as ParsedQuestion[]).map(byId))
  const existingExtra = loadExtraQuestions()
  const existingExtraIds = new Set(existingExtra.map(byId))
  const addedQuestionIds: number[] = []
  const skippedQuestionIds: number[] = []
  const nextExtra = [...existingExtra]

  content.questoes.forEach(question => {
    if (shouldSkipCuratedQuestionId(question.id) || baseIds.has(question.id) || existingExtraIds.has(question.id)) {
      skippedQuestionIds.push(question.id)
      return
    }

    nextExtra.push(question)
    existingExtraIds.add(question.id)
    addedQuestionIds.push(question.id)
  })

  saveJSON(EXTRA_QUESTIONS_KEY, nextExtra)
  try { window.dispatchEvent(new Event('vetstudy_questions_update')) } catch {}

  return {
    addedQuestionIds,
    skippedQuestionIds,
    questoes: getMergedQuestionBank(),
  }
}

export function loadProfileFlashcards(profileId: string): ParsedFlashcard[] {
  return readJSON<ParsedFlashcard[]>(profileStorageKey(profileId, PROFILE_DATA_KEYS.flashcards), []).filter(
    card => !shouldSkipCuratedFlashcardId(card.id)
  )
}

export function saveProfileFlashcards(profileId: string, flashcards: ParsedFlashcard[]): SaveFlashcardsResult {
  const key = profileStorageKey(profileId, PROFILE_DATA_KEYS.flashcards)
  const existing = loadProfileFlashcards(profileId)
  const existingIds = new Set(existing.map(card => card.id))
  const addedFlashcardIds: string[] = []
  const skippedFlashcardIds: string[] = []
  const next = [...existing]

  flashcards.forEach(card => {
    if (shouldSkipCuratedFlashcardId(card.id) || existingIds.has(card.id)) {
      skippedFlashcardIds.push(card.id)
      return
    }
    next.push(card)
    existingIds.add(card.id)
    addedFlashcardIds.push(card.id)
  })

  saveJSON(key, next)
  try { window.dispatchEvent(new Event('vetstudy_flashcards_update')) } catch {}

  return {
    addedFlashcardIds,
    skippedFlashcardIds,
    flashcards: next,
  }
}

export function mergeStudyContentForProfile(
  profileId: string,
  content: ParsedStudyContent,
): MergeStudyContentResult {
  const result = mergeStudyContent(content)
  saveProfileFlashcards(profileId, content.flashcards)
  return result
}

function staticModuleToParsedContent(content: StaticStudyModule): { parsedContent: ParsedStudyContent; fixedQuestionTemas: number } {
  let fixedQuestionTemas = 0
  const moduleLabel = typeof content.modulo === 'string' && content.modulo.trim()
    ? content.modulo.trim()
    : content.module
  const firstTopic = content.topics[0]
  const fallbackTema = firstTopic?.questions[0]?.tema ?? firstTopic?.flashcards[0]?.tema ?? content.module
  const moduleTema = getModuleTema(content, fallbackTema)
  const skipIds = getStaticModuleSkipIds(content)

  const parsedContent: ParsedStudyContent = {
    topics: content.topics.map(topic => ({
      id: `module-${content.module}-${topic.name}`,
      name: `${moduleLabel} - ${topic.name}`,
      tema: moduleTema,
      subtema: topic.name,
    })),
    flashcards: content.topics.flatMap(topic =>
      topic.flashcards
        .filter(card => !skipIds.flashcardIds.has(card.id))
        .map(card => ({
        id: card.id,
        tag: card.subtema || topic.name,
        front: card.pergunta,
        back: card.resposta,
        tema: moduleTema,
        subtema: card.subtema || topic.name,
      }))
    ),
    questoes: content.topics.flatMap(topic =>
      topic.questions
        .filter(question => !skipIds.questionIds.has(question.id))
        .map(question => {
        const normalizedTema = getModuleTema(content, question.tema)
        if (normalizedTema !== question.tema) fixedQuestionTemas += 1

        return {
          ...question,
          tema: normalizedTema,
          subtema: question.subtema ?? topic.name,
        }
      })
    ),
  }

  return { parsedContent, fixedQuestionTemas }
}

export function mergeStaticModule(
  content: StaticStudyModule,
  profileId = getActiveProfileId(),
): MergeStaticModuleResult {
  if (!profileId) throw new Error('No active VetStudy profile for static module import')

  const { parsedContent, fixedQuestionTemas } = staticModuleToParsedContent(content)
  const repairedStoredQuestionTemas = repairStoredExtraQuestionTemas(parsedContent.questoes)
  const totalFixedQuestionTemas = fixedQuestionTemas + repairedStoredQuestionTemas
  console.debug(`[VetStudy] mergeStaticModule fixed ${totalFixedQuestionTemas} question tema value(s)`)
  const questionResult = mergeStudyContent(parsedContent)
  const flashcardResult = saveProfileFlashcards(profileId, parsedContent.flashcards)

  return {
    ...questionResult,
    ...flashcardResult,
    fixedQuestionTemas: totalFixedQuestionTemas,
  }
}

