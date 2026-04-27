import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, ClipboardCheck, Network, CalendarDays,
  Plus, CheckCircle2, Trash2, RotateCcw, BookOpen,
  LayoutDashboard, TrendingUp, Target, Lightbulb,
  Clock, ChevronLeft, ChevronRight, Play, BarChart3,
} from 'lucide-react'
import Gatekeeper, { lockHub } from '../components/Gatekeeper'
import GlobalClinicalSearch from '../components/GlobalClinicalSearch'
import ProfileSelector from '../components/ProfileSelector'
import RevisaoPage   from './RevisaoPage'
import SimuladorPage from './SimuladorPage'
import MapasPage     from './MapasPage'
import centralDb from '../data/central_db.json'
import clinicalCases from '../data/clinical_cases.json'
import studyContentExample from '../data/studyContent.example.json'
import estralCycleModule from '../data/modules/reproducao-animal/estral_cycle_module.json'
import bovineReproductiveDiseasesModule from '../data/modules/clinica-ruminantes/bovine_reproductive_diseases_module.json'
import {
  clearActiveProfile,
  getActiveProfile,
  migrateLegacyProfileData,
  profileStorageKey,
  PROFILE_DATA_KEYS,
  setActiveProfile,
  type LocalProfile,
} from '../utils/profiles'
import {
  buildTodaySession,
  DAILY_STUDY_HISTORY_KEY,
  loadTodaySession,
  TODAY_SESSION_LAUNCH_KEY,
  type DailyStudyTrace,
  type TodaySession,
} from '../utils/buildTodaySession'
import {
  getMergedQuestionBank,
  loadProfileFlashcards,
  mergeStaticModule,
  mergeStudyContentForProfile,
  type StaticStudyModule,
} from '../utils/mergeStudyContent'
import { parseStudyContent, type StudyContentDocument } from '../utils/parseStudyContent'
import type { SearchTargetPage } from '../utils/globalClinicalSearch'
import {
  clinicalActivityEventName,
  loadClinicalFavorites,
  loadClinicalRecent,
  type ClinicalSavedItem,
} from '../utils/clinicalActivity'
import {
  caseProgressEventName,
  loadReviewHabit,
  loadReviewedCases,
  markCaseReviewed,
  reviewHabitEventName,
  type ReviewHabitState,
} from '../utils/reviewHabit'

const IS_DEV = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV)

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TIPOS LOCAIS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
interface Topic { id: string; name: string; studiedAt: string }
interface StudyItem { id: string; name: string; targetMin: number; doneMin: number }
interface QuizStats { total: number; correct: number; hours: number }
interface ClinicalCase {
  title: string
  species: string
  estimatedTime: string
  difficulty: 'facil' | 'media' | 'dificil'
  chiefComplaint: string
  history: string
  physicalExam: string[]
  labFindings: string[]
  clinicalQuestion: string
  diagnosis: string
  conduct: string[] | string
  drugs: string[]
  reasoning: string
  relatedDiseaseName: string
}

const CLINICAL_CASES = clinicalCases as ClinicalCase[]
const DISEASE_INDEX = (centralDb as { diseases: { id: string; name: string }[] }).diseases

function savedItemTypeLabel(type: ClinicalSavedItem['type']) {
  if (type === 'disease') return 'DoenÃ§a'
  if (type === 'drug') return 'FÃ¡rmaco'
  return 'Protocolo'
}

function openSavedClinicalItem(
  item: ClinicalSavedItem,
  onGlobalNavigate: (page: SearchTargetPage, id: string) => void,
) {
  if (item.targetPage && item.targetId) {
    onGlobalNavigate(item.targetPage, item.targetId)
    return
  }

  try {
    window.dispatchEvent(new CustomEvent('vetstudy_open_saved_clinical_item', { detail: item }))
  } catch {}
}

function normalizeLookup(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function findDiseaseIdByName(name: string) {
  const target = normalizeLookup(name)
  return DISEASE_INDEX.find(disease => {
    const current = normalizeLookup(disease.name)
    return current === target || current.includes(target) || target.includes(current)
  })?.id
}

function ensureList(value: string[] | string) {
  return Array.isArray(value) ? value : [value]
}

function streakMicrocopy(streak: number) {
  if (streak <= 0) return 'Comece sua sequÃªncia hoje'
  if (streak === 1) return 'Primeiro dia concluÃ­do'
  return 'VocÃª estÃ¡ mantendo o ritmo'
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HELPERS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function todayISO() { return new Date().toISOString().split('T')[0] }
function formatDateBR(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}`
}
function addDays(date: string, d: number) {
  const dt = new Date(date); dt.setDate(dt.getDate() + d)
  return dt.toISOString().split('T')[0]
}
function readJSON<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function saveJSON(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

const INTERVALS = [1, 7, 30, 90]
const INT_LABEL: Record<number, string> = { 1: 'R1', 7: 'R7', 30: 'R30', 90: 'R90' }
const INT_COLOR: Record<number, string> = { 1: 'bg-yellow-400', 7: 'bg-orange-400', 30: 'bg-red-400', 90: 'bg-red-500' }
const DAY_BG: Record<number, string> = {
  1: 'bg-yellow-400/25 text-yellow-100 border-yellow-400/30',
  7: 'bg-orange-400/25 text-orange-100 border-orange-400/30',
  30: 'bg-red-400/25 text-red-100 border-red-400/30',
  90: 'bg-red-500/30 text-red-100 border-red-500/40',
}

function dueReviewCount(topics: Topic[], date = todayISO()) {
  return topics.filter(topic => INTERVALS.some(interval => addDays(topic.studiedAt, interval) === date)).length
}

function calendarDayClass(dots: { interval: number }[], hasStudy = false) {
  if (dots.some(d => d.interval >= 30)) return DAY_BG[30]
  if (dots.some(d => d.interval === 7)) return DAY_BG[7]
  if (dots.some(d => d.interval === 1)) return DAY_BG[1]
  if (hasStudy) return 'bg-slate-700/70 text-slate-100 border-slate-600/70'
  return 'bg-slate-800/45 text-slate-500 border-slate-800/60'
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MINI CALENDÃRIO
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function MiniCalendario({ topics, storageKey: _sk }: { topics: Topic[]; storageKey: string }) {
  const today = todayISO()
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(today)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const dotMap: Record<string, { name: string; interval: number }[]> = {}
  topics.forEach(t => {
    INTERVALS.forEach(d => {
      const due = addDays(t.studiedAt, d)
      if (!dotMap[due]) dotMap[due] = []
      dotMap[due].push({ name: t.name, interval: d })
    })
  })

  const monthName = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const prevMonth = () => setViewDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n })
  const nextMonth = () => setViewDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n })
  const selectedItems = selectedDay ? (dotMap[selectedDay] || []) : []

  return (
    <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 text-slate-500 hover:text-teal-400 transition-colors rounded-lg hover:bg-slate-700/50">
          <ChevronLeft size={14} />
        </button>
        <p className="text-xs font-bold text-slate-300 capitalize">{monthName}</p>
        <button onClick={nextMonth} className="p-1 text-slate-500 hover:text-teal-400 transition-colors rounded-lg hover:bg-slate-700/50">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['D','S','T','Q','Q','S','S'].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-bold text-slate-600 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dots = dotMap[iso] || []
          const isToday = iso === today
          const isSel = iso === selectedDay

          return (
            <button key={day} onClick={() => setSelectedDay(iso === selectedDay ? null : iso)}
              className={`relative flex flex-col items-center py-1.5 rounded-lg border transition-all ${calendarDayClass(dots)} ${
                isSel ? 'ring-1 ring-teal-400/70' :
                isToday ? 'ring-1 ring-white/30 font-bold' :
                'hover:border-slate-500/70'
              }`}>
              <span className="text-[11px] leading-none">{day}</span>
              {dots.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dots.slice(0, 3).map((d, di) => (
                    <span key={di} className={`w-1 h-1 rounded-full ${INT_COLOR[d.interval]}`} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
      {selectedDay && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 border-t border-slate-700/50 pt-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            {selectedDay === today ? 'ðŸ“… Hoje' : formatDateBR(selectedDay)}
          </p>
          {selectedItems.length === 0
            ? <p className="text-xs text-slate-600 italic">Nenhuma revisÃ£o agendada.</p>
            : selectedItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${INT_COLOR[item.interval]}`} />
                  <p className="text-xs text-slate-300 flex-1 truncate">{item.name}</p>
                  <span className="text-[9px] text-slate-600 font-mono">{INT_LABEL[item.interval]}</span>
                </div>
              ))
          }
        </motion.div>
      )}
      <div className="flex gap-3 mt-3 pt-2 border-t border-slate-700/30 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-700" />
          <span className="text-[9px] text-slate-600">Sem atividade</span>
        </div>
        {INTERVALS.map(d => (
          <div key={d} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${INT_COLOR[d]}`} />
            <span className="text-[9px] text-slate-600">{INT_LABEL[d]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MINI CALENDÃRIO EXPANDIDO (com histÃ³rico de estudo)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function MiniCalendarioComHistorico({ topics, storageKey, dailyHistory }: {
  topics: Topic[]
  storageKey: string
  dailyHistory: DailyStudyTrace[]
}) {
  const today = todayISO()
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(today)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const dotMap: Record<string, { name: string; interval: number }[]> = {}
  topics.forEach(t => {
    INTERVALS.forEach(d => {
      const due = addDays(t.studiedAt, d)
      if (!dotMap[due]) dotMap[due] = []
      dotMap[due].push({ name: t.name, interval: d })
    })
  })

  const studyDates = new Set(dailyHistory.map(h => h.date))
  const monthName = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const prevMonth = () => setViewDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n })
  const nextMonth = () => setViewDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n })

  const selectedDots = selectedDay ? (dotMap[selectedDay] || []) : []
  const selectedTrace = selectedDay ? dailyHistory.find(h => h.date === selectedDay) : null
  const hasTrace = (iso: string) => studyDates.has(iso)

  return (
    <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 text-slate-500 hover:text-teal-400 transition-colors rounded-lg hover:bg-slate-700/50">
          <ChevronLeft size={14} />
        </button>
        <p className="text-xs font-bold text-slate-300 capitalize">{monthName}</p>
        <button onClick={nextMonth} className="p-1 text-slate-500 hover:text-teal-400 transition-colors rounded-lg hover:bg-slate-700/50">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['D','S','T','Q','Q','S','S'].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-bold text-slate-600 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dots = dotMap[iso] || []
          const isToday = iso === today
          const isSel = iso === selectedDay

          return (
            <button key={day} onClick={() => setSelectedDay(iso === selectedDay ? null : iso)}
              className={`relative flex flex-col items-center py-1.5 rounded-lg border transition-all ${calendarDayClass(dots, hasTrace(iso))} ${
                isSel ? 'ring-1 ring-teal-400/70' :
                isToday ? 'ring-1 ring-white/30 font-bold' :
                'hover:border-slate-500/70'
              }`}>
              <span className="text-[11px] leading-none">{day}</span>
              {hasTrace(iso) && <span title="Estudo de Hoje concluido" className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-400" />}
              {dots.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dots.slice(0, 2).map((d, di) => (
                    <span key={di} className={`w-1 h-1 rounded-full ${INT_COLOR[d.interval]}`} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
      {selectedDay && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 border-t border-slate-700/50 pt-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            {selectedDay === today ? 'Hoje' : formatDateBR(selectedDay)}
          </p>
          {!selectedTrace && selectedDots.length === 0 && (
            <p className="text-xs text-slate-600 italic">Nenhum estudo ou revisao neste dia.</p>
          )}
          {selectedTrace && (
            <div className="mb-2">
              <p className="text-xs font-bold text-slate-300 mb-2">Voce estudou neste dia:</p>
              <div className="flex gap-3 mb-2">
                <div className="text-center">
                  <p className="text-sm font-black text-white">{selectedTrace.types.questoes}</p>
                  <p className="text-[9px] text-slate-600">Questoes</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-blue-300">{selectedTrace.origins.revisao}</p>
                  <p className="text-[9px] text-slate-600">Revisao</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-amber-300">{selectedTrace.origins.reforco}</p>
                  <p className="text-[9px] text-slate-600">Reforco</p>
                </div>
              </div>
              {selectedTrace.topics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTrace.topics.slice(0, 4).map(t => (
                    <span key={t} className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          {selectedDots.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-600 uppercase font-bold mb-1">Revisoes agendadas</p>
              {selectedDots.map((item, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${INT_COLOR[item.interval]}`} />
                  <p className="text-xs text-slate-300 flex-1 truncate">{item.name}</p>
                  <span className="text-[9px] text-slate-600 font-mono">{INT_LABEL[item.interval]}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
      <div className="flex gap-4 mt-3 pt-2 border-t border-slate-700/30 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          <span className="text-[9px] text-slate-600">Sem atividade</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          <span className="text-[9px] text-slate-600">Estudo</span>
        </div>
        {INTERVALS.map(d => (
          <div key={d} className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${INT_COLOR[d]}`} />
            <span className="text-[9px] text-slate-600">{INT_LABEL[d]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   GRÃFICOS DE PERFORMANCE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function PerformanceCharts({ stats }: { stats: QuizStats }) {
  const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  const wrong = stats.total - stats.correct
  const pizzaDeg = Math.round((pct / 100) * 360)

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/60 p-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Total de QuestÃµes</p>
        <p className="text-3xl font-black text-white">{stats.total}</p>
        <div className="flex gap-2 mt-2">
          <span className="text-[10px] text-green-400">âœ“ {stats.correct}</span>
          <span className="text-[10px] text-red-400">âœ— {wrong}</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 to-teal-400 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/60 p-4 flex flex-col items-center">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 self-start">% Acertos</p>
        <div className="relative w-16 h-16 my-1" style={{
          background: `conic-gradient(#14b8a6 0deg ${pizzaDeg}deg, #1e293b ${pizzaDeg}deg 360deg)`,
          borderRadius: '50%',
        }}>
          <div className="absolute inset-2 rounded-full bg-slate-800/90 flex items-center justify-center">
            <span className="text-xs font-black text-white">{pct}%</span>
          </div>
        </div>
        <p className={`text-[10px] font-semibold mt-1 ${pct >= 70 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
          {pct >= 70 ? 'Ã“timo!' : pct >= 50 ? 'Regular' : 'Estudar mais'}
        </p>
      </div>
      <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/60 p-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Horas Estudadas</p>
        <p className="text-3xl font-black text-white">{stats.hours.toFixed(1)}<span className="text-sm text-slate-500 ml-1">h</span></p>
        <div className="flex items-end gap-1 mt-3 h-6">
          {[0.3, 0.7, 0.5, 1, 0.8, 0.6, stats.hours > 0 ? Math.min(1, stats.hours / 4) : 0.2].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-teal-500/30 transition-all duration-500"
              style={{ height: `${h * 100}%` }} />
          ))}
        </div>
        <p className="text-[9px] text-slate-600 mt-1">Ãºltimos 7 dias</p>
      </div>
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SEQUÃŠNCIA DE ESTUDOS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const DEFAULT_SEQ: StudyItem[] = [
  { id: '1', name: 'Anatomia do Trato Reprodutor',    targetMin: 45,  doneMin: 45 },
  { id: '2', name: 'Ciclo Estral e HormÃ´nios',        targetMin: 60,  doneMin: 30 },
  { id: '3', name: 'FotoperÃ­odo e Sazonalidade',      targetMin: 30,  doneMin: 0  },
  { id: '4', name: 'Protocolos IATF (Ovsynch)',       targetMin: 60,  doneMin: 0  },
  { id: '5', name: 'TransferÃªncia de EmbriÃµes (TE)',  targetMin: 30,  doneMin: 0  },
  { id: '6', name: 'IA em SuÃ­nos â€” TÃ©cnica Pipeta',   targetMin: 20,  doneMin: 0  },
  { id: '7', name: 'PuerpÃ©rio e PÃ³s-parto',           targetMin: 40,  doneMin: 0  },
]

function fmtMin(m: number) {
  if (m < 60) return `${m}min`
  return `${Math.floor(m / 60)}h${m % 60 > 0 ? String(m % 60).padStart(2,'0') : ''}`
}

function SequenciaEstudos({ storageKey }: { storageKey: string }) {
  const [items, setItems] = useState<StudyItem[]>(() => readJSON(storageKey, DEFAULT_SEQ))

  const addMin = (id: string, delta: number) => {
    const updated = items.map(it =>
      it.id === id
        ? { ...it, doneMin: Math.max(0, Math.min(it.targetMin, it.doneMin + delta)) }
        : it
    )
    setItems(updated); saveJSON(storageKey, updated)
  }

  const totalTarget = items.reduce((s, i) => s + i.targetMin, 0)
  const totalDone   = items.reduce((s, i) => s + i.doneMin, 0)
  const totalPct    = Math.round((totalDone / totalTarget) * 100)

  return (
    <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Play size={14} className="text-teal-400" />
          <p className="text-sm font-bold text-white">SequÃªncia de Estudos</p>
        </div>
        <span className="text-xs text-slate-500">{fmtMin(totalDone)} / {fmtMin(totalTarget)} Â· {totalPct}%</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full mb-4 overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
          animate={{ width: `${totalPct}%` }} transition={{ duration: 0.5 }} />
      </div>
      <div className="space-y-3">
        {items.map(item => {
          const pct = Math.round((item.doneMin / item.targetMin) * 100)
          const done = item.doneMin >= item.targetMin
          return (
            <div key={item.id} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${done ? 'bg-teal-500 border-teal-500' : 'border-slate-600'}`}>
                    {done && <CheckCircle2 size={10} className="text-white m-auto" />}
                  </div>
                  <p className={`text-xs font-medium ${done ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                    {item.name}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => addMin(item.id, -15)}
                    className="text-[10px] w-5 h-5 rounded bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center">âˆ’</button>
                  <span className="text-[10px] text-slate-500 w-14 text-center font-mono">
                    {fmtMin(item.doneMin)}/{fmtMin(item.targetMin)}
                  </span>
                  <button onClick={() => addMin(item.id, 15)}
                    className="text-[10px] w-5 h-5 rounded bg-teal-600/50 text-teal-300 hover:bg-teal-600 flex items-center justify-center">+</button>
                </div>
                {!done && <span className="text-[10px] text-slate-600 group-hover:hidden font-mono">{fmtMin(item.targetMin)}</span>}
              </div>
              <div className="h-1 bg-slate-700/60 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${done ? 'bg-teal-500' : 'bg-teal-600/70'}`}
                  animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CALENDÃRIO DE REVISÃƒO ESPAÃ‡ADA
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function CalendarioRevisao({ topics, setTopics, storageKey }: {
  topics: Topic[]
  setTopics: (t: Topic[]) => void
  storageKey: string
}) {
  const [newTopic, setNewTopic] = useState('')
  const today = todayISO()

  const add = () => {
    const name = newTopic.trim()
    if (!name) return
    const updated = [{ id: Date.now().toString(), name, studiedAt: today }, ...topics]
    setTopics(updated); saveJSON(storageKey, updated); setNewTopic('')
  }

  const remove = (id: string) => {
    const updated = topics.filter(t => t.id !== id)
    setTopics(updated); saveJSON(storageKey, updated)
  }

  const markDone = (topicId: string, interval: number) => {
    const nextInterval = INTERVALS[INTERVALS.indexOf(interval) + 1]
    if (!nextInterval) return
    const updated = topics.map(t => t.id !== topicId ? t : { ...t, studiedAt: today })
    setTopics(updated); saveJSON(storageKey, updated)
  }

  const schedule = topics.flatMap(t =>
    INTERVALS.map(days => ({ topic: t, dueDate: addDays(t.studiedAt, days), interval: days }))
  ).filter(s => s.dueDate >= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const dueToday  = schedule.filter(s => s.dueDate === today)
  const dueFuture = schedule.filter(s => s.dueDate > today).slice(0, 8)
  const groupedFuture = topics
    .map(topic => {
      const reviews = INTERVALS.map(interval => ({
        interval,
        dueDate: addDays(topic.studiedAt, interval),
      }))
      const next = reviews.find(review => review.dueDate > today)
      return { topic, reviews, nextInterval: next?.interval ?? null }
    })
    .filter(row => row.reviews.some(review => review.dueDate > today))

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input type="text" value={newTopic} onChange={e => setNewTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="ex: Ciclo Estral, PGF2Î±, Piometra Canina..."
          className="flex-1 px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition"
        />
        <button onClick={add}
          className="px-4 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition active:scale-95 flex items-center gap-1.5 text-sm">
          <Plus size={14} /> Estudei
        </button>
      </div>
        {dueToday.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <RotateCcw size={11} /> Revisar hoje â€” {dueToday.length} item{dueToday.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-1.5">
              {dueToday.map(s => (
                <div key={`${s.topic.id}-${s.interval}`}
                  className="flex items-center justify-between gap-3 bg-slate-800/50 rounded-xl px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200">{s.topic.name}</p>
                    <p className="text-xs text-amber-400/70">{INT_LABEL[s.interval]} â€” RevisÃ£o de {s.interval} dia{s.interval > 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => markDone(s.topic.id, s.interval)}
                    className="flex items-center gap-1 text-xs bg-teal-600/20 border border-teal-500/30 text-teal-400 px-2.5 py-1 rounded-xl hover:bg-teal-600/40 transition active:scale-95">
                    <CheckCircle2 size={12} /> Feito
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {groupedFuture.length > 0 && (
          <div className="bg-slate-800/40 rounded-2xl border border-slate-700/40 p-3">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">PrÃ³ximas revisÃµes</p>
            <div className="overflow-x-auto">
              <div className="min-w-[420px]">
                <div className="grid grid-cols-[minmax(0,1fr)_54px_54px_54px_54px] items-center gap-1.5 px-2 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                  <span>Conteudo</span>
                  {INTERVALS.map(interval => <span key={interval} className="text-center">{INT_LABEL[interval]}</span>)}
                </div>
                <div className="divide-y divide-slate-700/40 rounded-xl border border-slate-700/35 overflow-hidden">
                  {groupedFuture.map(row => (
                    <div key={row.topic.id} className="grid grid-cols-[minmax(0,1fr)_54px_54px_54px_54px] items-center gap-1.5 bg-slate-800/30 px-2 py-1">
                      <span className="text-xs text-slate-300 truncate">{row.topic.name}</span>
                      {row.reviews.map(review => {
                        const pending = review.dueDate > today
                        const isNext = row.nextInterval === review.interval
                        return (
                          <span key={review.interval}
                            className={`justify-self-center rounded-md px-1.5 py-0.5 text-[10px] font-mono ${
                              !pending ? 'text-slate-700 bg-slate-800/70' :
                              isNext ? 'text-slate-950 bg-teal-300 font-bold' :
                              'text-slate-500 bg-slate-700/40'
                            }`}>
                            {pending ? formatDateBR(review.dueDate) : '--'}
                          </span>
                        )
                      })}
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
        {topics.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <BookOpen size={10} /> Cadastrado ({topics.length})
            </p>
            <div className="overflow-x-auto">
              <div className="min-w-[440px]">
                <div className="grid grid-cols-[minmax(0,1fr)_58px_58px_58px_58px_24px] items-center gap-1.5 px-3 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                  <span>Conteudo</span>
                  {INTERVALS.map(d => <span key={d} className="text-center">D{d}</span>)}
                  <span />
                </div>
                <div className="divide-y divide-slate-700/35 rounded-xl border border-slate-700/35 overflow-hidden">
                  {topics.map(t => (
                    <div key={t.id} className="grid grid-cols-[minmax(0,1fr)_58px_58px_58px_58px_24px] items-center gap-1.5 bg-slate-800/30 px-3 py-1.5 group">
                      <p className="text-xs text-slate-300 font-medium truncate">{t.name}</p>
                      {INTERVALS.map(d => (
                        <span key={d} className={`justify-self-center rounded-md px-1.5 py-0.5 text-[10px] font-mono text-slate-950 ${INT_COLOR[d]}`}>
                          {formatDateBR(addDays(t.studiedAt, d))}
                        </span>
                      ))}
                    <button onClick={() => remove(t.id)}
                      className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden" aria-hidden="true">
            {topics.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-slate-800/30 rounded-xl px-3 py-2 group">
                <div>
                  <p className="text-xs text-slate-300 font-medium">{t.name}</p>
                  <p className="text-[10px] text-slate-600">InÃ­cio: {t.studiedAt}</p>
                </div>
                <button onClick={() => remove(t.id)}
                  className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {topics.length === 0 && (
        <div className="text-center py-8 text-slate-700">
          <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">Nenhum conteÃºdo cadastrado.</p>
        </div>
      )}
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CARD ESTUDO DE HOJE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function EstudoHojeCard({ profile, onOpenSimulator, onOpenDailyStudy }: {
  profile: LocalProfile
  onOpenSimulator: () => void
  onOpenDailyStudy: () => void
}) {
  const [session] = useState<TodaySession>(() => loadTodaySession(profile.id) ?? buildTodaySession(profile.id))
  const total = session.questions.length
  const estimatedMinutes = Math.max(5, total * 2)
  const progress = total > 0 ? Math.round((session.answeredCount / total) * 100) : 0
  const counts = session.questions.reduce<Record<'revisao' | 'reforco' | 'exploracao', number>>((acc, question) => {
    acc[question.origem]++
    return acc
  }, { revisao: 0, reforco: 0, exploracao: 0 })

  // Derivar os principais subtemas da sessÃ£o de hoje (mÃ¡x 3, sem repetiÃ§Ã£o)
  const bank = getMergedQuestionBank()
  const topTemas: string[] = Array.from(
    new Set(
      session.questions
        .map(item => bank.find(q => q.id === item.id))
        .filter(Boolean)
        .map(q => (q as { subtema?: string; tema: string }).subtema || (q as { tema: string }).tema)
    )
  ).slice(0, 3)

  return (
    <div className="bg-gradient-to-br from-amber-500/15 via-slate-800/80 to-teal-500/10 border border-amber-500/20 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Plano adaptativo</p>
          <h3 className="text-lg font-black text-white">ðŸ”¥ Estudo de Hoje</h3>
          <p className="text-xs text-slate-400 mt-1">
            {total} questÃµes Â· cerca de {estimatedMinutes} min
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-black text-white">{session.answeredCount}/{total}</p>
          <p className="text-[10px] text-slate-500">{progress}% concluÃ­do</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="rounded-xl bg-slate-900/50 border border-slate-700/50 px-3 py-2">
          <p className="text-[10px] text-slate-500 font-bold uppercase">RevisÃ£o</p>
          <p className="text-lg font-black text-blue-300">{counts.revisao}</p>
        </div>
        <div className="rounded-xl bg-slate-900/50 border border-slate-700/50 px-3 py-2">
          <p className="text-[10px] text-slate-500 font-bold uppercase">ReforÃ§o</p>
          <p className="text-lg font-black text-amber-300">{counts.reforco}</p>
        </div>
        <div className="rounded-xl bg-slate-900/50 border border-slate-700/50 px-3 py-2">
          <p className="text-[10px] text-slate-500 font-bold uppercase">ExploraÃ§Ã£o</p>
          <p className="text-lg font-black text-teal-300">{counts.exploracao}</p>
        </div>
      </div>

      {/* VocÃª vai estudar hoje */}
      {topTemas.length > 0 && !session.completed && (
        <div className="mt-3 pt-3 border-t border-amber-500/10">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            ðŸ‘‰ VocÃª vai estudar hoje:
          </p>
          <div className="space-y-1">
            {topTemas.map(tema => (
              <p key={tema} className="text-xs text-slate-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 flex-shrink-0" />
                {tema}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {session.completed ? (
          <>
            <div className="flex-1 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-green-300">
              <p className="text-sm font-bold">✓ SessÃ£o de hoje concluÃ­da</p>
              <p className="text-xs text-green-200/80 mt-1">Volte amanhÃ£ â€” sua prÃ³xima sessÃ£o jÃ¡ estÃ¡ sendo preparada.</p>
            </div>
            <button onClick={onOpenSimulator}
              className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold hover:border-teal-500/40 transition-all">
              Treino livre
            </button>
          </>
        ) : (
          <button onClick={onOpenDailyStudy}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-all active:scale-95">
            {session.answeredCount > 0 ? 'Continuar estudo de hoje' : 'ComeÃ§ar estudo de hoje'} <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DEV: IMPORTAÃ‡ÃƒO DE CONTEÃšDO (sÃ³ em desenvolvimento)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function DevStudyContentImport({ profile }: { profile: LocalProfile }) {
  const parsedExample = parseStudyContent(studyContentExample as StudyContentDocument, {
    startingQuestionId: 10000,
    banca: 'Aula',
  })
  const exampleQuestionIds = parsedExample.questoes.map(question => question.id)
  const readStatus = () => {
    const mergedIds = new Set(getMergedQuestionBank().map(question => question.id))
    const flashcardIds = new Set(loadProfileFlashcards(profile.id).map(card => card.id))
    return {
      inMergedBank: exampleQuestionIds.every(id => mergedIds.has(id)),
      savedFlashcards: parsedExample.flashcards.every(card => flashcardIds.has(card.id)),
      mergedTotal: mergedIds.size,
      flashcardTotal: flashcardIds.size,
    }
  }
  const [status, setStatus] = useState(readStatus)
  const [lastImport, setLastImport] = useState<{ added: number; skipped: number } | null>(null)
  const [moduleImport, setModuleImport] = useState<{ name: string; addedQuestions: number; skippedQuestions: number; addedFlashcards: number; skippedFlashcards: number } | null>(null)

  const importExample = () => {
    const result = mergeStudyContentForProfile(profile.id, parsedExample)
    setLastImport({ added: result.addedQuestionIds.length, skipped: result.skippedQuestionIds.length })
    setStatus(readStatus())
  }

  const importStaticModule = (name: string, content: StaticStudyModule) => {
    const result = mergeStaticModule(content, profile.id)
    setModuleImport({
      name,
      addedQuestions: result.addedQuestionIds.length,
      skippedQuestions: result.skippedQuestionIds.length,
      addedFlashcards: result.addedFlashcardIds.length,
      skippedFlashcards: result.skippedFlashcardIds.length,
    })
    setStatus(readStatus())
  }

  const importEstralModule = () => {
    importStaticModule('ciclo estral', estralCycleModule as StaticStudyModule)
  }

  const importBovineReproductiveDiseasesModule = () => {
    importStaticModule('doenÃ§as reprodutivas', bovineReproductiveDiseasesModule as StaticStudyModule)
  }

  return (
    <div className="bg-slate-900/70 border border-dashed border-violet-500/40 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">Dev/Teste de pipeline</p>
          <p className="text-sm font-bold text-white mt-0.5">Importar Anatomia do Reprodutor Masculino</p>
          <p className="text-xs text-slate-500 mt-1">
            {parsedExample.questoes.length} questoes Â· {parsedExample.flashcards.length} flashcards Â· IDs {exampleQuestionIds.join(', ')}
          </p>
        </div>
        <button onClick={importExample}
          className="px-3 py-2 rounded-xl bg-violet-600/80 text-white text-xs font-bold hover:bg-violet-600 transition active:scale-95">
          Importar exemplo
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="rounded-xl bg-slate-800/70 border border-slate-700/60 px-3 py-2">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Simulador</p>
          <p className={`text-xs font-bold ${status.inMergedBank ? 'text-green-300' : 'text-slate-500'}`}>
            {status.inMergedBank ? 'Banco combinado OK' : 'Ainda nao importado'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-800/70 border border-slate-700/60 px-3 py-2">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Estudo de Hoje</p>
          <p className={`text-xs font-bold ${status.inMergedBank ? 'text-green-300' : 'text-slate-500'}`}>
            {status.inMergedBank ? 'Elegivel no motor' : 'Pendente'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-800/70 border border-slate-700/60 px-3 py-2">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Flashcards</p>
          <p className={`text-xs font-bold ${status.savedFlashcards ? 'text-green-300' : 'text-slate-500'}`}>
            {status.savedFlashcards ? `${status.flashcardTotal} no perfil` : 'Pendente'}
          </p>
        </div>
      </div>
      {lastImport && (
        <p className="text-[11px] text-slate-500 mt-2">
          Ultima importacao: {lastImport.added} novas questoes, {lastImport.skipped} ignoradas por ID duplicado. Banco combinado: {status.mergedTotal} questoes.
        </p>
      )}
      <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-300">MÃ³dulo estÃ¡tico: ciclo estral</p>
          <p className="text-[11px] text-slate-500">Importa 20 questÃµes e 30 flashcards do JSON de aula.</p>
        </div>
        <button onClick={importEstralModule}
          className="px-3 py-2 rounded-xl bg-amber-600/80 text-white text-xs font-bold hover:bg-amber-600 transition active:scale-95">
          Importar mÃ³dulo ciclo estral
        </button>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-300">MÃ³dulo estÃ¡tico: doenÃ§as reprodutivas</p>
          <p className="text-[11px] text-slate-500">Importa 15 questÃµes e 25 flashcards do JSON de aula.</p>
        </div>
        <button onClick={importBovineReproductiveDiseasesModule}
          className="px-3 py-2 rounded-xl bg-amber-600/80 text-white text-xs font-bold hover:bg-amber-600 transition active:scale-95">
          Importar mÃ³dulo doenÃ§as reprodutivas
        </button>
      </div>
      {moduleImport && (
        <p className="text-[11px] text-green-300 mt-2">
          MÃ³dulo {moduleImport.name} importado: {moduleImport.addedQuestions} questÃµes novas, {moduleImport.skippedQuestions} questÃµes duplicadas; {moduleImport.addedFlashcards} flashcards novos, {moduleImport.skippedFlashcards} flashcards duplicados.
        </p>
      )}
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HUB DASHBOARD
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const DICAS = [
  'FolÃ­culo dominante â†’ estrogÃªnio â†’ cio. CL â†’ progesterona â†’ gestaÃ§Ã£o.',
  'PGF2Î± causa luteÃ³lise â€” D7 do Ovsynch. GnRH induz ovulaÃ§Ã£o â€” D0 e D9.',
  'CÃ©rvix: vaca = anÃ©is simples Â· porca = espiral Â· Ã©gua = roseta.',
  'Ciclo estral: bovino â‰ˆ 21d Â· suÃ­no â‰ˆ 21d Â· ovelha â‰ˆ 17d.',
  'Ovelha = dias curtos (outono). Ã‰gua = dias longos (primavera).',
  'BEN pÃ³s-parto â†’ â†“IGF-1 â†’ anestro prolongado. ECC ideal: 3,0â€“3,5.',
  'IATF = inseminaÃ§Ã£o sem detecÃ§Ã£o de cio. 100% do lote no mesmo dia.',
]
const SHOW_STUDY_SEQUENCE = false

function QuickSavedList({
  title,
  items,
  onOpenItem,
}: {
  title: string
  items: ClinicalSavedItem[]
  onOpenItem: (item: ClinicalSavedItem) => void
}) {
  return (
    <div className="bg-slate-900/55 border border-slate-800 rounded-2xl p-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">Nada por aqui ainda.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => onOpenItem(item)}
              className="w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-slate-700/60 bg-slate-800/45 hover:border-teal-500/25 transition-all"
            >
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{item.title}</p>
                <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/70 text-slate-300 border border-slate-600/60 flex-shrink-0">
                {savedItemTypeLabel(item.type)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DailyReviewCard({
  dueToday,
  pendingCases,
  streak,
  onStartReview,
  onStartCase,
}: {
  dueToday: number
  pendingCases: number
  streak: number
  onStartReview: () => void
  onStartCase: () => void
}) {
  const allClear = dueToday === 0 && pendingCases === 0
  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-slate-900/70 border border-amber-500/20 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">ðŸ“… RevisÃ£o de Hoje</p>
          {allClear ? (
            <>
              <p className="text-sm text-white font-semibold mt-1">Tudo em dia. Que tal resolver um caso clÃ­nico?</p>
              <p className="text-xs text-slate-400 mt-1">Seus cards estÃ£o organizados por hoje, mas vocÃª ainda pode treinar raciocÃ­nio clÃ­nico.</p>
            </>
          ) : (
            <>
              <p className="text-sm text-white font-semibold mt-1">
                VocÃª tem {dueToday} {dueToday === 1 ? 'revisÃ£o' : 'revisÃµes'} hoje
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {pendingCases} {pendingCases === 1 ? 'caso para treinar' : 'casos para treinar'}
              </p>
            </>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ðŸ”¥ SequÃªncia</p>
          <p className="text-lg font-black text-white mt-1">{streak} {streak === 1 ? 'dia' : 'dias'}</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-28">{streakMicrocopy(streak)}</p>
        </div>
      </div>
      {allClear ? (
        <button
          onClick={onStartCase}
          className="mt-4 w-full px-3 py-2 rounded-xl bg-fuchsia-500/90 text-white text-sm font-bold hover:bg-fuchsia-400 transition active:scale-[0.99]"
        >
          ComeÃ§ar raciocÃ­nio
        </button>
      ) : (
        <button
          onClick={onStartReview}
          className="mt-4 w-full px-3 py-2 rounded-xl bg-amber-500/90 text-slate-950 text-sm font-bold hover:bg-amber-400 transition active:scale-[0.99]"
        >
          Abrir flashcards
        </button>
      )}
    </div>
  )
}

function ClinicalCasesSection({
  profileId,
  onOpenDisease,
  focusToken,
  reviewedCases,
}: {
  profileId: string
  onOpenDisease: (diseaseId: string) => void
  focusToken: number
  reviewedCases: string[]
}) {
  const [openCaseTitle, setOpenCaseTitle] = useState<string | null>(null)
  const [revealedCaseTitle, setRevealedCaseTitle] = useState<string | null>(null)
  const nextSuggestedCase = (currentTitle: string) => CLINICAL_CASES.find(item => !reviewedCases.includes(item.title) && item.title !== currentTitle)

  const toggleCase = (title: string) => {
    setOpenCaseTitle(current => current === title ? null : title)
    setRevealedCaseTitle(current => current === title ? null : current)
  }

  useEffect(() => {
    if (!focusToken || CLINICAL_CASES.length === 0) return
    const firstCase = CLINICAL_CASES.find(item => !reviewedCases.includes(item.title)) ?? CLINICAL_CASES[0]
    setOpenCaseTitle(firstCase.title)
    const element = document.getElementById('hub-clinical-cases')
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [focusToken, reviewedCases])

  return (
    <div id="hub-clinical-cases">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={14} className="text-fuchsia-400" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ðŸ§  Casos ClÃ­nicos</p>
      </div>
      <div className="space-y-3">
        {CLINICAL_CASES.map(clinicalCase => {
          const isOpen = openCaseTitle === clinicalCase.title
          const isRevealed = revealedCaseTitle === clinicalCase.title
          const relatedDiseaseId = findDiseaseIdByName(clinicalCase.relatedDiseaseName)
          const caseCompleted = reviewedCases.includes(clinicalCase.title)
          const nextCase = nextSuggestedCase(clinicalCase.title)

          return (
            <div key={clinicalCase.title} className="bg-slate-900/55 border border-slate-800 rounded-2xl p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{clinicalCase.title}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                      {clinicalCase.species}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                      {clinicalCase.estimatedTime}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 capitalize">
                      {clinicalCase.difficulty}
                    </span>
                    {caseCompleted && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/25 text-teal-300">
                        concluÃ­do
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleCase(clinicalCase.title)}
                  className="min-h-[44px] w-full sm:w-auto px-3 py-2 rounded-xl bg-fuchsia-600/80 text-white text-xs font-bold hover:bg-fuchsia-600 transition active:scale-95 self-start"
                >
                  {isOpen ? 'Fechar caso' : 'Resolver caso'}
                </button>
              </div>

              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-3"
                >
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">1. Queixa + histÃ³ria</p>
                    <p className="text-sm text-slate-200 mt-1">{clinicalCase.chiefComplaint}</p>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{clinicalCase.history}</p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">2. Exame fÃ­sico</p>
                    <ul className="mt-2 space-y-1.5">
                      {clinicalCase.physicalExam.map(item => (
                        <li key={item} className="text-xs text-slate-300">â€¢ {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">3. Achados laboratoriais</p>
                    <ul className="mt-2 space-y-1.5">
                      {clinicalCase.labFindings.map(item => (
                        <li key={item} className="text-xs text-slate-300">â€¢ {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">4. Pergunta clÃ­nica</p>
                    <p className="text-sm text-slate-200 mt-1">{clinicalCase.clinicalQuestion}</p>
                  </div>

                  {!isRevealed ? (
                    <button
                      onClick={() => {
                        markCaseReviewed(clinicalCase.title, profileId)
                        setRevealedCaseTitle(clinicalCase.title)
                      }}
                      className="min-h-[44px] w-full px-3 py-2 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-bold hover:bg-teal-500/15 transition"
                    >
                      Mostrar resoluÃ§Ã£o
                    </button>
                  ) : (
                    <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">5. DiagnÃ³stico</p>
                        <p className="text-sm text-white mt-1">{clinicalCase.diagnosis}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">Conduta</p>
                        <ul className="mt-2 space-y-1.5">
                          {ensureList(clinicalCase.conduct).map(item => (
                            <li key={item} className="text-xs text-slate-200">â€¢ {item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">FÃ¡rmacos-chave</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {clinicalCase.drugs.map(drug => (
                            <span
                              key={drug}
                              className="px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-200"
                            >
                              {drug}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Por que isso importa?</p>
                        <div className="mt-1 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                          <p className="text-xs text-amber-100 leading-relaxed">{clinicalCase.reasoning}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => relatedDiseaseId && onOpenDisease(relatedDiseaseId)}
                        disabled={!relatedDiseaseId}
                        className={`min-h-[44px] w-full px-3 py-2 rounded-xl text-xs font-bold transition ${
                          relatedDiseaseId
                            ? 'bg-slate-800 text-white border border-slate-700 hover:border-teal-500/40'
                            : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        Ver doenÃ§a relacionada
                      </button>
                      {nextCase ? (
                        <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/8 p-3">
                          <p className="text-sm font-bold text-white">Quer tentar o prÃ³ximo caso?</p>
                          <p className="text-xs text-slate-400 mt-1">{nextCase.title}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenCaseTitle(nextCase.title)
                              setRevealedCaseTitle(null)
                            }}
                            className="mt-3 min-h-[44px] w-full rounded-xl bg-fuchsia-500/90 px-3 py-2 text-xs font-bold text-white transition hover:bg-fuchsia-400"
                          >
                            Abrir prÃ³ximo caso
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">
                          <p className="text-sm font-bold text-white">Bom trabalho.</p>
                          <p className="text-xs text-slate-400 mt-1">VocÃª concluiu os casos disponÃ­veis por enquanto.</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HubDashboard({ profile, topics, setTopics, stats, dailyHistory, topicsStorageKey, seqStorageKey, onOpenSimulator, onOpenDailyStudy, onOpenReview, onStartCase, onGlobalNavigate }: {
  profile: LocalProfile
  topics: Topic[]
  setTopics: (t: Topic[]) => void
  stats: QuizStats
  dailyHistory: DailyStudyTrace[]
  topicsStorageKey: string
  seqStorageKey: string
  onOpenSimulator: () => void
  onOpenDailyStudy: () => void
  onOpenReview: () => void
  onStartCase: () => void
  onGlobalNavigate: (page: SearchTargetPage, id: string) => void
}) {
  const dica = DICAS[new Date().getDay() % DICAS.length]
  const [favorites, setFavorites] = useState<ClinicalSavedItem[]>(() => loadClinicalFavorites())
  const [recent, setRecent] = useState<ClinicalSavedItem[]>(() => loadClinicalRecent())
  const [reviewHabit, setReviewHabit] = useState<ReviewHabitState>(() => loadReviewHabit(profile.id))
  const [reviewedCases, setReviewedCases] = useState<string[]>(() => loadReviewedCases(profile.id))
  const dueToday = dueReviewCount(topics)
  const pendingCases = Math.max(0, CLINICAL_CASES.length - reviewedCases.length)

  useEffect(() => {
    const handleRefresh = () => {
      setFavorites(loadClinicalFavorites())
      setRecent(loadClinicalRecent())
    }
    window.addEventListener(clinicalActivityEventName(), handleRefresh)
    return () => window.removeEventListener(clinicalActivityEventName(), handleRefresh)
  }, [])

  useEffect(() => {
    const refreshReviewState = () => {
      setReviewHabit(loadReviewHabit(profile.id))
      setReviewedCases(loadReviewedCases(profile.id))
    }
    window.addEventListener(reviewHabitEventName(), refreshReviewState)
    window.addEventListener(caseProgressEventName(), refreshReviewState)
    return () => {
      window.removeEventListener(reviewHabitEventName(), refreshReviewState)
      window.removeEventListener(caseProgressEventName(), refreshReviewState)
    }
  }, [profile.id])

  const openSavedItem = (item: ClinicalSavedItem) => openSavedClinicalItem(item, onGlobalNavigate)

  return (
    <div className="p-5 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">InÃ­cio</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
        </p>
      </div>

      <DailyReviewCard
        dueToday={dueToday}
        pendingCases={pendingCases}
        streak={reviewHabit.currentStreak}
        onStartReview={onOpenReview}
        onStartCase={onStartCase}
      />

      <div className="bg-gradient-to-br from-teal-500/15 to-slate-800/80 border border-teal-500/20 rounded-2xl p-4 flex items-start gap-3 backdrop-blur-sm">
        <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
          <Lightbulb size={15} className="text-teal-400" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Conceito do Dia</p>
          <p className="text-sm text-slate-300 leading-relaxed mt-0.5">{dica}</p>
        </div>
      </div>

      <EstudoHojeCard profile={profile} onOpenSimulator={onOpenSimulator} onOpenDailyStudy={onOpenDailyStudy} />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={14} className="text-teal-400" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Performance</p>
        </div>
        <PerformanceCharts stats={stats} />
      </div>

      <div className={SHOW_STUDY_SEQUENCE ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-1 gap-4'}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={13} className="text-teal-400" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">CalendÃ¡rio</p>
          </div>
          <MiniCalendarioComHistorico topics={topics} storageKey={topicsStorageKey} dailyHistory={dailyHistory} />
        </div>
        {SHOW_STUDY_SEQUENCE && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target size={13} className="text-teal-400" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">SequÃªncia A1</p>
            </div>
            <SequenciaEstudos storageKey={seqStorageKey} />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw size={13} className="text-amber-400" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">RevisÃ£o EspaÃ§ada 1-7-30-90</p>
        </div>
        <CalendarioRevisao topics={topics} setTopics={setTopics} storageKey={topicsStorageKey} />
      </div>

      {IS_DEV && <DevStudyContentImport profile={profile} />}
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TABS DO HUB
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
type HubTab = 'home' | 'simulador'

const TABS: { id: HubTab; label: string; icon: React.ElementType }[] = [
  { id: 'home',      label: 'InÃ­cio',    icon: LayoutDashboard },
  { id: 'simulador', label: 'Simulador',  icon: ClipboardCheck  },
]

function HubContent({
  profile,
  onOpenCases,
  onOpenReview,
}: {
  profile: LocalProfile
  onOpenCases: () => void
  onOpenReview: () => void
}) {
  const topicsKey = profileStorageKey(profile.id, PROFILE_DATA_KEYS.topics)
  const seqKey    = profileStorageKey(profile.id, 'vetstudy_study_seq')
  const statsKey  = profileStorageKey(profile.id, PROFILE_DATA_KEYS.quizStats)
  const histKey   = profileStorageKey(profile.id, DAILY_STUDY_HISTORY_KEY)

  const [tab,    setTab]    = useState<HubTab>('home')
  const [topics, setTopics] = useState<Topic[]>(() => readJSON<Topic[]>(topicsKey, []))
  const [stats,  setStats]  = useState<QuizStats>(() => readJSON<QuizStats>(statsKey, { total: 0, correct: 0, hours: 0 }))
  const [dailyHistory, setDailyHistory] = useState<DailyStudyTrace[]>(() => readJSON<DailyStudyTrace[]>(histKey, []))

  // Abrir simulador em modo diÃ¡rio (via EstudoHojeCard)
  const [pendingDailyLaunch, setPendingDailyLaunch] = useState(false)

  useEffect(() => {
    const handleStats = () => setStats(readJSON<QuizStats>(statsKey, { total: 0, correct: 0, hours: 0 }))
    const handleHistory = () => setDailyHistory(readJSON<DailyStudyTrace[]>(histKey, []))
    window.addEventListener('vetstudy_stats_update', handleStats)
    window.addEventListener('vetstudy_daily_history_update', handleHistory)
    return () => {
      window.removeEventListener('vetstudy_stats_update', handleStats)
      window.removeEventListener('vetstudy_daily_history_update', handleHistory)
    }
  }, [statsKey, histKey])

  const openDailyStudy = () => {
    try { localStorage.setItem(profileStorageKey(profile.id, TODAY_SESSION_LAUNCH_KEY), '1') } catch {}
    setPendingDailyLaunch(true)
    setTab('simulador')
  }

  useEffect(() => {
    if (pendingDailyLaunch && tab === 'simulador') setPendingDailyLaunch(false)
  }, [pendingDailyLaunch, tab])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-4 py-2.5 border-b border-slate-800 bg-slate-900/70 backdrop-blur-sm flex-shrink-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === id
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}>
            <Icon size={13} />{label}
          </button>
        ))}
        <button onClick={() => { lockHub(); window.location.reload() }}
          className="ml-auto text-[10px] text-slate-700 hover:text-slate-500 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors">
          Sair
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
            className="min-h-full">
            {tab === 'home'      && (
              <HubDashboard
                profile={profile}
                topics={topics}
                setTopics={(t) => { setTopics(t); saveJSON(topicsKey, t) }}
                stats={stats}
                dailyHistory={dailyHistory}
                topicsStorageKey={topicsKey}
                seqStorageKey={seqKey}
                onOpenSimulator={() => setTab('simulador')}
                onOpenDailyStudy={openDailyStudy}
                onOpenReview={onOpenReview}
                onStartCase={onOpenCases}
                onGlobalNavigate={() => {}}
              />
            )}
            {tab === 'simulador' && <SimuladorPage />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   EXPORT PRINCIPAL
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function HubPage({
  onOpenCases,
  onOpenReview,
}: {
  onOpenCases?: () => void
  onOpenReview?: () => void
} = {}) {
  const [profile, setProfile] = useState<LocalProfile | null>(() => getActiveProfile())

  useEffect(() => {
    if (profile) migrateLegacyProfileData(profile.id)
  }, [profile])

  const handleProfileSelected = (p: LocalProfile) => {
    setActiveProfile(p.id)
    migrateLegacyProfileData(p.id)
    setProfile(p)
  }

  const handleLogout = () => {
    clearActiveProfile()
    setProfile(null)
  }

  if (!profile) {
    return (
      <Gatekeeper pageTitle="InÃ­cio â€” RBC">
        <ProfileSelector onSelect={handleProfileSelected} />
      </Gatekeeper>
    )
  }

  return (
    <Gatekeeper pageTitle="InÃ­cio â€” RBC">
      <div className="flex flex-col h-full">
        <HubContent
          key={profile.id}
          profile={profile}
          onOpenCases={onOpenCases ?? (() => {})}
          onOpenReview={onOpenReview ?? (() => {})}
        />
      </div>
    </Gatekeeper>
  )
}

