export type StudyDifficulty = 'facil' | 'media' | 'dificil'
export type StudyQuestionType = 'multipla_escolha' | 'verdadeiro_falso' | 'associacao'
export type QuestionOptionKey = 'A' | 'B' | 'C' | 'D'

export interface ReviewableItem {
  needsReview?: boolean
}

export interface Flashcard extends ReviewableItem {
  id: string
  pergunta: string
  resposta: string
  tema: string
  subtema: string
}

export interface MultipleChoiceQuestion extends ReviewableItem {
  id: number
  tipo: 'multipla_escolha'
  banca: string
  tema: string
  subtema?: string
  dificuldade: StudyDifficulty
  pergunta: string
  alternativas: Record<QuestionOptionKey, string>
  correta: QuestionOptionKey
  explicacao: string
}

export interface TrueFalseQuestion extends ReviewableItem {
  id: number
  tipo: 'verdadeiro_falso'
  banca: string
  tema: string
  subtema?: string
  dificuldade: StudyDifficulty
  pergunta: string
  correta: 'V' | 'F'
  explicacao: string
}

export interface AssociationQuestion extends ReviewableItem {
  id: number
  tipo: 'associacao'
  banca: string
  tema: string
  subtema?: string
  dificuldade: StudyDifficulty
  pergunta: string
  colunaA: string[]
  colunaB: string[]
  pares: number[]
  explicacao: string
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | AssociationQuestion

export interface ClinicalCaseStep extends ReviewableItem {
  id: string
  type: string
  title: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface ClinicalCase extends ReviewableItem {
  id: string
  number?: number
  title: string
  species: string
  speciesEmoji?: string
  category?: string
  difficulty?: StudyDifficulty
  estimatedTime?: string
  chiefComplaint: string
  history: string
  physicalExam: string[]
  labFindings: string[]
  clinicalQuestion: string
  diagnosis: string
  conduct: string[]
  drugs: string[]
  reasoning: string
  relatedDiseaseId?: string
  relatedDiseaseName?: string
  steps?: ClinicalCaseStep[]
}

export interface ClinicalTerm extends ReviewableItem {
  id: string
  termo: string
  explicacao: string
  tema: string
  subtema: string
  sinonimos?: string[]
  tags?: string[]
}

export interface StudyModuleTopic {
  name: string
  flashcards: Flashcard[]
  questions: Question[]
  clinicalTerms?: ClinicalTerm[]
  clinicalCases?: ClinicalCase[]
}

export interface StructuredStudyModule {
  disciplina?: string
  modulo?: string
  module: string
  source: string
  topics: StudyModuleTopic[]
}

