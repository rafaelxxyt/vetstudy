export interface LocalProfile {
  id: string
  name: string
  createdAt: number
}

const LS_PROFILES = 'vetstudy_profiles'
const LS_ACTIVE_PROFILE = 'vetstudy_active_profile'
const PROFILE_MIGRATION_KEY = 'legacy_migrated'

export const PROFILE_DATA_KEYS = {
  responses: 'responses',
  quizHistory: 'quiz_history',
  quizStats: 'quiz_stats',
  quizSession: 'quiz_session',
  topics: 'topics',
  studySeq: 'study_seq',
  flashcards: 'flashcards',
} as const

const LEGACY_KEYS: Record<string, string> = {
  [PROFILE_DATA_KEYS.responses]: 'vetstudy_respostas',
  [PROFILE_DATA_KEYS.quizHistory]: 'vetstudy_quiz_history',
  [PROFILE_DATA_KEYS.quizStats]: 'vetstudy_quiz_stats',
  [PROFILE_DATA_KEYS.topics]: 'vetstudy_topics',
  [PROFILE_DATA_KEYS.studySeq]: 'vetstudy_study_seq',
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function loadProfiles(): LocalProfile[] {
  return readJSON<LocalProfile[]>(LS_PROFILES, [])
}

export function saveProfiles(profiles: LocalProfile[]) {
  writeJSON(LS_PROFILES, profiles)
}

export function createProfile(name: string): LocalProfile {
  const profile: LocalProfile = {
    id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    createdAt: Date.now(),
  }
  saveProfiles([...loadProfiles(), profile])
  return profile
}

export function getActiveProfileId(): string | null {
  try {
    return localStorage.getItem(LS_ACTIVE_PROFILE)
  } catch {
    return null
  }
}

export function getActiveProfile(): LocalProfile | null {
  const activeId = getActiveProfileId()
  if (!activeId) return null
  return loadProfiles().find(profile => profile.id === activeId) ?? null
}

export function setActiveProfile(profileId: string) {
  try {
    localStorage.setItem(LS_ACTIVE_PROFILE, profileId)
  } catch {}
}

export function clearActiveProfile() {
  try {
    localStorage.removeItem(LS_ACTIVE_PROFILE)
  } catch {}
}

export function profileStorageKey(profileId: string, key: string): string {
  return `vetstudy_profile:${profileId}:${key}`
}

export function activeProfileStorageKey(key: string): string {
  const profileId = getActiveProfileId()
  if (!profileId) throw new Error('No active VetStudy profile')
  return profileStorageKey(profileId, key)
}

export function hasProfileData(profileId: string, key: string): boolean {
  try {
    return localStorage.getItem(profileStorageKey(profileId, key)) !== null
  } catch {
    return false
  }
}

export function migrateLegacyProfileData(profileId: string) {
  try {
    const markerKey = profileStorageKey(profileId, PROFILE_MIGRATION_KEY)
    if (localStorage.getItem(markerKey)) return

    const profileDataKeys = Object.values(PROFILE_DATA_KEYS)
    const alreadyHasProfileData = profileDataKeys.some(key => (
      localStorage.getItem(profileStorageKey(profileId, key)) !== null
    ))

    if (!alreadyHasProfileData) {
      Object.keys(LEGACY_KEYS).forEach(key => {
        const legacyValue = localStorage.getItem(LEGACY_KEYS[key])
        if (legacyValue !== null) {
          localStorage.setItem(profileStorageKey(profileId, key), legacyValue)
        }
      })
    }

    localStorage.setItem(markerKey, '1')
  } catch {}
}
