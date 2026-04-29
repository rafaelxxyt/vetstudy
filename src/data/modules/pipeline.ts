import type {
  ClinicalCase,
  ClinicalCaseStep,
  ClinicalTerm,
  Flashcard,
  MultipleChoiceQuestion,
  Question,
  StructuredStudyModule,
  StudyModuleTopic,
} from './types'
import {
  validateStructuredStudyModule,
  type StructuredContentValidationReport,
  type ValidatedStructuredStudyModule,
} from './validation'

export interface StructuredTopicInput {
  name: string
  flashcards?: Flashcard[]
  questions?: Question[]
  clinicalTerms?: ClinicalTerm[]
  clinicalCases?: ClinicalCase[]
}

export interface StructuredContentInput {
  disciplina?: string
  modulo?: string
  module?: string
  source: string
  topics: StructuredTopicInput[]
}

export interface ManualPlaceholderOptions {
  topicName: string
  tema: string
  questionStartId?: number
  flashcards?: number
  questions?: number
  clinicalTerms?: number
  clinicalCases?: number
}

export interface StructuredPipelineResult extends ValidatedStructuredStudyModule {
  structuredContent: StructuredStudyModule
  formattedJson: string
  validation: StructuredContentValidationReport
}

function padNumber(value: number, size = 4) {
  return value.toString().padStart(size, '0')
}

function toModuleTopic(input: StructuredTopicInput): StudyModuleTopic {
  return {
    name: input.name,
    flashcards: input.flashcards ?? [],
    questions: input.questions ?? [],
    clinicalTerms: input.clinicalTerms ?? [],
    clinicalCases: input.clinicalCases ?? [],
  }
}

export function toStructuredContent(input: StructuredContentInput): StructuredStudyModule {
  const moduleName = input.module ?? input.modulo ?? 'Novo Modulo'
  return {
    disciplina: input.disciplina,
    modulo: input.modulo ?? moduleName,
    module: moduleName,
    source: input.source,
    topics: input.topics.map(toModuleTopic),
  }
}

function createFlashcardPlaceholder(options: ManualPlaceholderOptions, index: number): Flashcard {
  return {
    id: `fc_${padNumber(index + 1)}`,
    pergunta: `TODO: pergunta do flashcard ${index + 1}`,
    resposta: 'TODO: resposta curta com funcao, mecanismo ou impacto.',
    tema: options.tema,
    subtema: options.topicName,
  }
}

function createQuestionPlaceholder(options: ManualPlaceholderOptions, index: number): MultipleChoiceQuestion {
  const id = (options.questionStartId ?? 9000) + index
  return {
    id,
    tipo: 'multipla_escolha',
    banca: 'VetStudy',
    tema: options.tema,
    subtema: options.topicName,
    dificuldade: 'media',
    pergunta: `TODO: pergunta de multipla escolha ${index + 1}`,
    alternativas: {
      A: 'TODO alternativa A',
      B: 'TODO alternativa B',
      C: 'TODO alternativa C',
      D: 'TODO alternativa D',
    },
    correta: 'A',
    explicacao: 'TODO: explicacao com o raciocinio da resposta correta e por que as demais ficam menos adequadas.',
  }
}

function createClinicalTermPlaceholder(options: ManualPlaceholderOptions, index: number): ClinicalTerm {
  return {
    id: `term_${padNumber(index + 1)}`,
    termo: `TODO termo clinico ${index + 1}`,
    explicacao: 'TODO: explicacao curta e clara do termo clinico.',
    tema: options.tema,
    subtema: options.topicName,
  }
}

function createClinicalCaseStepPlaceholder(index: number): ClinicalCaseStep {
  return {
    id: `step_${index + 1}`,
    type: 'single_choice',
    title: `Etapa ${index + 1}`,
    question: `TODO: pergunta da etapa ${index + 1}`,
    options: [
      'TODO opcao 1',
      'TODO opcao 2',
      'TODO opcao 3',
      'TODO opcao 4',
    ],
    correctIndex: 0,
    explanation: 'TODO: explicacao curta da decisao clinica desta etapa.',
  }
}

function createClinicalCasePlaceholder(options: ManualPlaceholderOptions, index: number): ClinicalCase {
  return {
    id: `case_${padNumber(index + 1)}`,
    title: `TODO caso clinico ${index + 1}`,
    species: 'TODO especie',
    category: options.tema,
    chiefComplaint: 'TODO queixa principal',
    history: 'TODO historia clinica resumida',
    physicalExam: ['TODO achado de exame fisico 1'],
    labFindings: ['TODO achado laboratorial 1'],
    clinicalQuestion: 'TODO pergunta clinica central',
    diagnosis: 'TODO diagnostico',
    conduct: ['TODO conduta inicial'],
    drugs: ['TODO farmaco principal'],
    reasoning: 'TODO raciocinio clinico resumido',
    relatedDiseaseName: 'TODO doenca relacionada',
    steps: [createClinicalCaseStepPlaceholder(0)],
  }
}

export function createManualTopicPlaceholders(options: ManualPlaceholderOptions): StructuredTopicInput {
  return {
    name: options.topicName,
    flashcards: Array.from({ length: options.flashcards ?? 0 }, (_, index) =>
      createFlashcardPlaceholder(options, index)
    ),
    questions: Array.from({ length: options.questions ?? 0 }, (_, index) =>
      createQuestionPlaceholder(options, index)
    ),
    clinicalTerms: Array.from({ length: options.clinicalTerms ?? 0 }, (_, index) =>
      createClinicalTermPlaceholder(options, index)
    ),
    clinicalCases: Array.from({ length: options.clinicalCases ?? 0 }, (_, index) =>
      createClinicalCasePlaceholder(options, index)
    ),
  }
}

export function formatStructuredContentJson(content: StructuredStudyModule): string {
  return JSON.stringify(content, null, 2)
}

export function runStructuredContentPipeline(input: StructuredContentInput): StructuredPipelineResult {
  const structuredContent = toStructuredContent(input)
  const validated = validateStructuredStudyModule(structuredContent)

  return {
    ...validated,
    structuredContent,
    formattedJson: formatStructuredContentJson(validated.content),
    validation: validated.report,
  }
}
