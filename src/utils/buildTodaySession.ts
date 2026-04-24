import { PROFILE_DATA_KEYS, profileStorageKey } from './profiles'
import { getMergedQuestionBank } from './mergeStudyContent'

type SessionOrigin = 'revisao' | 'reforco' | 'exploracao'

export interface TodaySessionQuestion {
  id: number
  origem: SessionOrigin
}

export interface TodaySession {
  date: string
  questions: TodaySessionQuestion[]
  answeredCount: number
  completed: boolean
}

export interface DailyStudyTrace {
  date: string
  topics: string[]
  types: {
    questoes: number
    revisoes: number
    flashcards: number
  }
  origins: Record<SessionOrigin, number>
  summary: string
}

interface ProfileResponse {
  questionId: number
  status: 'acerto' | 'erro' | 'chute'
  timestamp: number
}

interface Topic {
  id: string
  name: string
  studiedAt: string
}

interface BankQuestion {
  id: number
  tema: string
  subtema?: string
  pergunta: string
}

interface TopicStat {
  total: number
  erros: number
  taxa: number
  peso: number
}

export const TODAY_SESSION_KEY = 'vetstudy_session_today'
export const TODAY_SESSION_LAUNCH_KEY = 'vetstudy_launch_today'
export const DAILY_STUDY_HISTORY_KEY = 'vetstudy_daily_study_history'
const TARGET_SESSION_SIZE = 12
const TARGET_BY_ORIGIN: Record<SessionOrigin, number> = {
  revisao: 4,
  reforco: 4,
  exploracao: 4,
}
const MIN_WEAK_BY_ORIGIN: Record<SessionOrigin, number> = {
  revisao: 2,
  reforco: 2,
  exploracao: 2,
}
const MAX_PER_THEME = 4
const REVIEW_INTERVAL_DAYS = [1, 7, 30, 90]
const WEAK_TOPIC_ERROR_RATE = 0.5
const HIGH_ERROR_WEIGHT = 3
const NORMAL_WEIGHT = 1
const MASTERED_WEIGHT = 0.3

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

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

function addDays(date: string, days: number): string {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next.toISOString().split('T')[0]
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function topicMatchesQuestion(topic: Topic, question: BankQuestion): boolean {
  const topicText = normalize(topic.name)
  const questionText = normalize(`${question.tema} ${question.subtema ?? ''} ${question.pergunta}`)
  const tokens = topicText.split(/[^a-z0-9]+/).filter(token => token.length >= 4)

  return questionText.includes(topicText) || tokens.some(token => questionText.includes(token))
}

function dueTopics(topics: Topic[], date: string): Topic[] {
  return topics.filter(topic => (
    REVIEW_INTERVAL_DAYS.some(days => addDays(topic.studiedAt, days) <= date)
  ))
}

function uniqueQuestions(questions: BankQuestion[]): BankQuestion[] {
  const seen = new Set<number>()
  return questions.filter(question => {
    if (seen.has(question.id)) return false
    seen.add(question.id)
    return true
  })
}

function topicKey(question: Pick<BankQuestion, 'tema' | 'subtema'>): string {
  return question.subtema && question.subtema !== question.tema
    ? `${question.tema}|||${question.subtema}`
    : question.tema
}

function buildTopicWeights(
  questions: BankQuestion[],
  responses: ProfileResponse[],
): Map<string, TopicStat> {
  const questionById = new Map(questions.map(question => [question.id, question]))
  const stats = new Map<string, { total: number; erros: number }>()

  responses.forEach(response => {
    const question = questionById.get(response.questionId)
    if (!question) return

    const key = topicKey(question)
    const current = stats.get(key) ?? { total: 0, erros: 0 }
    current.total += 1
    if (response.status === 'erro' || response.status === 'chute') current.erros += 1
    stats.set(key, current)
  })

  return new Map(
    Array.from(stats.entries()).map(([key, value]) => {
      const taxa = value.total > 0 ? value.erros / value.total : 0
      const peso = value.total < 2
        ? NORMAL_WEIGHT
        : taxa >= WEAK_TOPIC_ERROR_RATE
          ? HIGH_ERROR_WEIGHT
          : taxa <= 0.2
            ? MASTERED_WEIGHT
            : NORMAL_WEIGHT

      return [key, { ...value, taxa, peso }]
    })
  )
}

function weightCandidates(
  candidates: BankQuestion[],
  topicWeights: Map<string, TopicStat>,
): BankQuestion[] {
  return candidates
    .map((question, index) => ({
      question,
      index,
      peso: topicWeights.get(topicKey(question))?.peso ?? 1,
    }))
    .sort((a, b) => {
      if (b.peso !== a.peso) return b.peso - a.peso
      return a.index - b.index
    })
    .map(item => item.question)
}

function isWeakTopicQuestion(
  question: BankQuestion,
  topicWeights: Map<string, TopicStat>,
): boolean {
  return (topicWeights.get(topicKey(question))?.peso ?? NORMAL_WEIGHT) >= HIGH_ERROR_WEIGHT
}

function pickQuestions(
  candidates: BankQuestion[],
  origem: SessionOrigin,
  count: number,
  selectedIds: Set<number>,
  themeCounts: Map<string, number>,
  topicWeights: Map<string, TopicStat>,
  weakTarget = 0,
): TodaySessionQuestion[] {
  const picked: TodaySessionQuestion[] = []
  const weakCandidates = candidates.filter(question => isWeakTopicQuestion(question, topicWeights))
  const regularCandidates = candidates.filter(question => !isWeakTopicQuestion(question, topicWeights))

  const tryPick = (question: BankQuestion) => {
    if (picked.length >= count) return
    if (selectedIds.has(question.id)) return

    const themeCount = themeCounts.get(question.tema) ?? 0
    if (themeCount >= MAX_PER_THEME) return

    selectedIds.add(question.id)
    themeCounts.set(question.tema, themeCount + 1)
    picked.push({ id: question.id, origem })
  }

  weakCandidates.forEach(question => {
    if (picked.length >= Math.min(count, weakTarget)) return
    tryPick(question)
  })

  ;[...weakCandidates, ...regularCandidates].forEach(tryPick)

  return picked
}

function readProfileData<T>(profileId: string, key: string, fallback: T): T {
  return readJSON<T>(profileStorageKey(profileId, key), fallback)
}

function buildStudySummary(topics: string[], revisoes: number): string {
  if (topics.length === 0) return 'Voce concluiu uma sessao de questoes adaptativas.'
  const mainTopic = topics[0].toLocaleLowerCase('pt-BR')
  const reviewText = revisoes > 0 ? ' e revisou conteudos recentes' : ''
  return `Voce focou em ${mainTopic}${reviewText}.`
}

function buildDailyStudyTrace(session: TodaySession): DailyStudyTrace {
  const questions = getMergedQuestionBank() as BankQuestion[]
  const sessionQuestions = session.questions
    .map(item => questions.find(question => question.id === item.id))
    .filter(Boolean) as BankQuestion[]
  const topics = Array.from(new Set(
    sessionQuestions
      .flatMap(question => [question.tema, question.subtema])
      .filter(Boolean) as string[]
  )).slice(0, 8)
  const origins = session.questions.reduce<Record<SessionOrigin, number>>((acc, question) => {
    acc[question.origem] += 1
    return acc
  }, { revisao: 0, reforco: 0, exploracao: 0 })

  return {
    date: session.date,
    topics,
    types: {
      questoes: session.questions.length,
      revisoes: origins.revisao,
      flashcards: 0,
    },
    origins,
    summary: buildStudySummary(topics, origins.revisao),
  }
}

function saveDailyStudyTrace(profileId: string, session: TodaySession) {
  const key = profileStorageKey(profileId, DAILY_STUDY_HISTORY_KEY)
  const trace = buildDailyStudyTrace(session)
  const history = readJSON<DailyStudyTrace[]>(key, [])
  const updated = [trace, ...history.filter(item => item.date !== trace.date)]
    .sort((a, b) => b.date.localeCompare(a.date))
  saveJSON(key, updated)
  try { window.dispatchEvent(new Event('vetstudy_daily_history_update')) } catch {}
}

export function loadTodaySession(profileId: string, date = todayISO()): TodaySession | null {
  const session = readProfileData<TodaySession | null>(profileId, TODAY_SESSION_KEY, null)
  return session?.date === date ? session : null
}

export function saveTodaySession(profileId: string, session: TodaySession) {
  saveJSON(profileStorageKey(profileId, TODAY_SESSION_KEY), session)
  if (session.completed) saveDailyStudyTrace(profileId, session)
}

export function buildTodaySession(profileId: string): TodaySession {
  const date = todayISO()
  const questions = getMergedQuestionBank() as BankQuestion[]
  const responses = readProfileData<ProfileResponse[]>(profileId, PROFILE_DATA_KEYS.responses, [])
  const topics = readProfileData<Topic[]>(profileId, PROFILE_DATA_KEYS.topics, [])
  const selectedIds = new Set<number>()
  const themeCounts = new Map<string, number>()
  const answeredIds = new Set(responses.map(response => response.questionId))
  const topicWeights = buildTopicWeights(questions, responses)

  const due = dueTopics(topics, date)
  const reviewCandidates = weightCandidates(uniqueQuestions(
    due.flatMap(topic => questions.filter(question => topicMatchesQuestion(topic, question)))
  ), topicWeights)

  const reinforceIds = responses
    .filter(response => response.status === 'erro' || response.status === 'chute')
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(response => response.questionId)
  const reinforceCandidates = weightCandidates(reinforceIds
    .map(id => questions.find(question => question.id === id))
    .filter(Boolean) as BankQuestion[], topicWeights)

  const exploreCandidates = weightCandidates(
    questions.filter(question => !answeredIds.has(question.id)),
    topicWeights,
  )
  const fallbackCandidates = weightCandidates(questions, topicWeights)

  const sessionQuestions = [
    ...pickQuestions(reviewCandidates, 'revisao', TARGET_BY_ORIGIN.revisao, selectedIds, themeCounts, topicWeights, MIN_WEAK_BY_ORIGIN.revisao),
    ...pickQuestions(reinforceCandidates, 'reforco', TARGET_BY_ORIGIN.reforco, selectedIds, themeCounts, topicWeights, MIN_WEAK_BY_ORIGIN.reforco),
    ...pickQuestions(exploreCandidates, 'exploracao', TARGET_BY_ORIGIN.exploracao, selectedIds, themeCounts, topicWeights, MIN_WEAK_BY_ORIGIN.exploracao),
  ]

  if (sessionQuestions.length < TARGET_SESSION_SIZE) {
    sessionQuestions.push(
      ...pickQuestions(
        fallbackCandidates,
        'exploracao',
        TARGET_SESSION_SIZE - sessionQuestions.length,
        selectedIds,
        themeCounts,
        topicWeights,
      )
    )
  }

  const session: TodaySession = {
    date,
    questions: sessionQuestions,
    answeredCount: 0,
    completed: false,
  }

  saveJSON(profileStorageKey(profileId, TODAY_SESSION_KEY), session)
  return session
}
