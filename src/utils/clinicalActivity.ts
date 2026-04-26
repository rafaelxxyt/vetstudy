import { getActiveProfileId, profileStorageKey } from './profiles'
import type { SearchTargetPage } from './globalClinicalSearch'

export type ClinicalSavedItemType = 'disease' | 'drug' | 'protocol'

export interface ClinicalSavedItem {
  id: string
  type: ClinicalSavedItemType
  title: string
  subtitle: string
  targetPage?: SearchTargetPage
  targetId?: string
  queryHint?: string
  updatedAt: number
}

const FAVORITES_KEY = 'clinical_favorites'
const RECENT_KEY = 'clinical_recent'
const UPDATE_EVENT = 'vetstudy_clinical_activity_update'
const MAX_RECENT_ITEMS = 15

function storageKey(suffix: string) {
  const profileId = getActiveProfileId()
  return profileId
    ? profileStorageKey(profileId, `vetstudy_${suffix}`)
    : `vetstudy_${suffix}`
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

function emitUpdate() {
  try { window.dispatchEvent(new Event(UPDATE_EVENT)) } catch {}
}

function sameItem(a: Pick<ClinicalSavedItem, 'id' | 'type'>, b: Pick<ClinicalSavedItem, 'id' | 'type'>) {
  return a.id === b.id && a.type === b.type
}

export function loadClinicalFavorites() {
  return readJSON<ClinicalSavedItem[]>(storageKey(FAVORITES_KEY), [])
}

export function loadClinicalRecent() {
  return readJSON<ClinicalSavedItem[]>(storageKey(RECENT_KEY), [])
}

export function isClinicalFavorite(type: ClinicalSavedItemType, id: string) {
  return loadClinicalFavorites().some(item => item.type === type && item.id === id)
}

export function toggleClinicalFavorite(item: Omit<ClinicalSavedItem, 'updatedAt'>) {
  const favorites = loadClinicalFavorites()
  const existing = favorites.find(saved => sameItem(saved, item))

  if (existing) {
    saveJSON(storageKey(FAVORITES_KEY), favorites.filter(saved => !sameItem(saved, item)))
    emitUpdate()
    return false
  }

  saveJSON(storageKey(FAVORITES_KEY), [{ ...item, updatedAt: Date.now() }, ...favorites])
  emitUpdate()
  return true
}

export function pushClinicalRecent(item: Omit<ClinicalSavedItem, 'updatedAt'>) {
  const recent = loadClinicalRecent().filter(saved => !sameItem(saved, item))
  const next = [{ ...item, updatedAt: Date.now() }, ...recent].slice(0, MAX_RECENT_ITEMS)
  saveJSON(storageKey(RECENT_KEY), next)
  emitUpdate()
}

export function clinicalActivityEventName() {
  return UPDATE_EVENT
}
