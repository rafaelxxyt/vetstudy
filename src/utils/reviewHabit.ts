import { getActiveProfile, profileStorageKey } from './profiles'

const REVIEW_HABIT_KEY = 'vetstudy_review_habit'
const REVIEWED_CASES_KEY = 'vetstudy_reviewed_cases'
const REVIEW_HABIT_EVENT = 'vetstudy_review_habit_update'
const CASE_PROGRESS_EVENT = 'vetstudy_case_progress_update'
const CASE_PROGRESS_KEY_PREFIX = 'vetstudy_case_'

export interface ReviewHabitState {
  currentStreak: number
  lastReviewDate: string | null
}

export interface CaseProgressState {
  status: 'in_progress' | 'completed'
  stepAnswers?: number[]
  score?: number
  currentStepIndex?: number
  revealed?: boolean
  selfEvaluation?: 'acertei' | 'errei'
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function getProfileId(explicitProfileId?: string) {
  return explicitProfileId ?? getActiveProfile()?.id ?? 'default'
}

function keyFor(profileId: string, suffix: string) {
  return profileStorageKey(profileId, suffix)
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function diffDays(currentISO: string, previousISO: string) {
  const current = new Date(`${currentISO}T00:00:00`)
  const previous = new Date(`${previousISO}T00:00:00`)
  return Math.round((current.getTime() - previous.getTime()) / 86400000)
}

export function reviewHabitEventName() {
  return REVIEW_HABIT_EVENT
}

export function caseProgressEventName() {
  return CASE_PROGRESS_EVENT
}

export function loadReviewHabit(profileId?: string): ReviewHabitState {
  const resolvedProfileId = getProfileId(profileId)
  return readJSON<ReviewHabitState>(keyFor(resolvedProfileId, REVIEW_HABIT_KEY), {
    currentStreak: 0,
    lastReviewDate: null,
  })
}

export function markReviewCompleted(profileId?: string, date = todayISO()) {
  const resolvedProfileId = getProfileId(profileId)
  const current = loadReviewHabit(resolvedProfileId)

  if (current.lastReviewDate === date) {
    return current
  }

  const nextStreak = !current.lastReviewDate
    ? 1
    : diffDays(date, current.lastReviewDate) === 1
      ? current.currentStreak + 1
      : 1

  const nextState: ReviewHabitState = {
    currentStreak: nextStreak,
    lastReviewDate: date,
  }

  saveJSON(keyFor(resolvedProfileId, REVIEW_HABIT_KEY), nextState)
  try { window.dispatchEvent(new Event(REVIEW_HABIT_EVENT)) } catch {}
  return nextState
}

export function loadReviewedCases(profileId?: string) {
  const resolvedProfileId = getProfileId(profileId)
  return readJSON<string[]>(keyFor(resolvedProfileId, REVIEWED_CASES_KEY), [])
}

export function loadCaseProgress(caseId: string, profileId?: string) {
  const resolvedProfileId = getProfileId(profileId)
  return readJSON<CaseProgressState | null>(keyFor(resolvedProfileId, `${CASE_PROGRESS_KEY_PREFIX}${caseId}`), null)
}

export function saveCaseProgress(caseId: string, progress: CaseProgressState, profileId?: string) {
  const resolvedProfileId = getProfileId(profileId)
  saveJSON(keyFor(resolvedProfileId, `${CASE_PROGRESS_KEY_PREFIX}${caseId}`), progress)
  try { window.dispatchEvent(new Event(CASE_PROGRESS_EVENT)) } catch {}
  return progress
}

export function clearCaseProgress(caseId: string, caseTitle?: string, profileId?: string) {
  const resolvedProfileId = getProfileId(profileId)
  try {
    localStorage.removeItem(keyFor(resolvedProfileId, `${CASE_PROGRESS_KEY_PREFIX}${caseId}`))
  } catch {}

  if (caseTitle) {
    const reviewedCases = loadReviewedCases(resolvedProfileId)
    const nextReviewedCases = reviewedCases.filter(title => title !== caseTitle)
    saveJSON(keyFor(resolvedProfileId, REVIEWED_CASES_KEY), nextReviewedCases)
  }

  try { window.dispatchEvent(new Event(CASE_PROGRESS_EVENT)) } catch {}
}

export function markCaseReviewed(caseTitle: string, profileId?: string) {
  const resolvedProfileId = getProfileId(profileId)
  const current = loadReviewedCases(resolvedProfileId)
  if (current.includes(caseTitle)) return current
  const next = [...current, caseTitle]
  saveJSON(keyFor(resolvedProfileId, REVIEWED_CASES_KEY), next)
  try { window.dispatchEvent(new Event(CASE_PROGRESS_EVENT)) } catch {}
  return next
}
