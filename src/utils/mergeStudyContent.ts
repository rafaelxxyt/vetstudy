import questionsData from '../data/questions.json'
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

function normalizeForMatch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
  return readJSON<ParsedQuestion[]>(EXTRA_QUESTIONS_KEY, [])
}

export function getMergedQuestionBank(): ParsedQuestion[] {
  const baseQuestions = questionsData.questoes as ParsedQuestion[]
  const baseIds = new Set(baseQuestions.map(byId))
  const extraQuestions = loadExtraQuestions().filter(question => !baseIds.has(question.id))
  const extraIds = new Set<number>()
  const uniqueExtraQuestions = extraQuestions.filter(question => {
    if (extraIds.has(question.id)) return false
    extraIds.add(question.id)
    return true
  })

  return [...baseQuestions, ...uniqueExtraQuestions]
}

export function mergeStudyContent(content: ParsedStudyContent): MergeStudyContentResult {
  const baseIds = new Set((questionsData.questoes as ParsedQuestion[]).map(byId))
  const existingExtra = loadExtraQuestions()
  const existingExtraIds = new Set(existingExtra.map(byId))
  const addedQuestionIds: number[] = []
  const skippedQuestionIds: number[] = []
  const nextExtra = [...existingExtra]

  content.questoes.forEach(question => {
    if (baseIds.has(question.id) || existingExtraIds.has(question.id)) {
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
  return readJSON<ParsedFlashcard[]>(profileStorageKey(profileId, PROFILE_DATA_KEYS.flashcards), [])
}

export function saveProfileFlashcards(profileId: string, flashcards: ParsedFlashcard[]): SaveFlashcardsResult {
  const key = profileStorageKey(profileId, PROFILE_DATA_KEYS.flashcards)
  const existing = loadProfileFlashcards(profileId)
  const existingIds = new Set(existing.map(card => card.id))
  const addedFlashcardIds: string[] = []
  const skippedFlashcardIds: string[] = []
  const next = [...existing]

  flashcards.forEach(card => {
    if (existingIds.has(card.id)) {
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
  const parsedContent: ParsedStudyContent = {
    topics: content.topics.map(topic => ({
      id: `module-${content.module}-${topic.name}`,
      name: `${content.module} - ${topic.name}`,
      tema: content.module,
      subtema: topic.name,
    })),
    flashcards: content.topics.flatMap(topic =>
      topic.flashcards.map(card => ({
        id: card.id,
        tag: card.subtema || topic.name,
        front: card.pergunta,
        back: card.resposta,
        tema: card.tema,
        subtema: card.subtema || topic.name,
      }))
    ),
    questoes: content.topics.flatMap(topic =>
      topic.questions.map(question => {
        const normalizedTema = normalizeQuestionTema(question.tema)
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

