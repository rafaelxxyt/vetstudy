import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardCheck, CheckCircle2, XCircle, RotateCcw,
  ChevronRight, ArrowRight, Filter, Award,
} from 'lucide-react'
import Gatekeeper from '../components/Gatekeeper'
import { activeProfileStorageKey, getActiveProfile, PROFILE_DATA_KEYS, profileStorageKey, type LocalProfile } from '../utils/profiles'
import {
  loadTodaySession,
  saveTodaySession,
  TODAY_SESSION_LAUNCH_KEY,
  type TodaySession,
  type TodaySessionQuestion,
} from '../utils/buildTodaySession'
import { getMergedQuestionBank } from '../utils/mergeStudyContent'

/* ══════════════════════════════════════════════════════
   TIPOS INTERNOS (UI)
   ══════════════════════════════════════════════════════ */
type MC    = { type:'mc';    qid:number; banca:string; materia:string; subtema:string; dificuldade:string; question:string; options:string[]; correct:number; explanation:string }
type VF    = { type:'vf';    qid:number; banca:string; materia:string; subtema:string; dificuldade:string; question:string; correct:boolean; explanation:string }
type ASSOC = { type:'assoc'; qid:number; banca:string; materia:string; subtema:string; dificuldade:string; instruction:string; left:string[]; right:string[]; pairs:number[]; explanation:string }
type Question    = MC | VF | ASSOC
type AnswerState = number | boolean | number[] | null

/* ══════════════════════════════════════════════════════
   ADAPTER: JSON → tipos internos
   ══════════════════════════════════════════════════════ */
function adaptQuestions(): Question[] {
  return getMergedQuestionBank().map(q => {
    const base = { qid: q.id, banca: q.banca, materia: q.tema, subtema: q.subtema ?? '', dificuldade: q.dificuldade }

    if (q.tipo === 'multipla_escolha') {
      const alt = q.alternativas as unknown as Record<string, string>
      const options = ['A','B','C','D'].map(l => alt[l]).filter(Boolean)
      const correct = ['A','B','C','D'].indexOf(q.correta)
      return { type: 'mc', ...base, question: q.pergunta, options, correct, explanation: q.explicacao } as MC
    }

    if (q.tipo === 'verdadeiro_falso') {
      return { type: 'vf', ...base, question: q.pergunta, correct: q.correta === 'V', explanation: q.explicacao } as VF
    }

    // associacao
    const assocQ = q as typeof q & { colunaA: string[]; colunaB: string[]; pares: number[] }
    return {
      type: 'assoc', ...base,
      instruction: q.pergunta,
      left:  assocQ.colunaA,
      right: assocQ.colunaB,
      pairs: assocQ.pares,
      explanation: q.explicacao,
    } as ASSOC
  })
}

let ALL_QUESTIONS: Question[] = adaptQuestions()
if (typeof window !== 'undefined') {
  window.addEventListener('vetstudy_questions_update', () => {
    ALL_QUESTIONS = adaptQuestions()
  })
}

/* ══════════════════════════════════════════════════════
   LOCALSTORAGE
   ══════════════════════════════════════════════════════ */
const LS_STATS     = PROFILE_DATA_KEYS.quizStats
const LS_HISTORY   = PROFILE_DATA_KEYS.quizHistory
const LS_RESPOSTAS = PROFILE_DATA_KEYS.responses  // rastreamento por questionId
const LS_SESSION   = PROFILE_DATA_KEYS.quizSession

interface QuizStats { total:number; correct:number; hours:number }
interface QHistory  { id:string; correct:boolean }

// Rastreamento adaptativo — persiste entre sessões
interface Resposta { questionId:number; status:'acerto'|'erro'|'chute'; timestamp:number }

function loadJSON<T>(k:string, fb:T):T { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb } catch { return fb } }
function saveJSON(k:string, v:unknown) { try { localStorage.setItem(k,JSON.stringify(v)) } catch {} }
function removeJSON(k:string) { try { localStorage.removeItem(k) } catch {} }
function loadProfileJSON<T>(k:string, fb:T):T { return loadJSON<T>(activeProfileStorageKey(k), fb) }
function saveProfileJSON(k:string, v:unknown) { saveJSON(activeProfileStorageKey(k), v) }
function removeProfileJSON(k:string) { removeJSON(activeProfileStorageKey(k)) }

function loadRespostas(): Resposta[] {
  return loadProfileJSON<Resposta[]>(LS_RESPOSTAS, [])
}
function saveResposta(r: Resposta) {
  // Substitui resposta anterior da mesma questão — sem duplicatas
  const updated = [...loadRespostas().filter(x => x.questionId !== r.questionId), r]
  saveProfileJSON(LS_RESPOSTAS, updated)
}
function updateResposta(questionId: number, status: 'acerto'|'erro'|'chute') {
  const updated = loadRespostas().map(r =>
    r.questionId === questionId ? {...r, status, timestamp: Date.now()} : r
  )
  saveProfileJSON(LS_RESPOSTAS, updated)
}

/* ── Análise de desempenho por tema/subtema ──────────── */
interface WeakTopicStats { label:string; tema:string; subtema:string; total:number; erros:number; taxa:number }
function calcWeakTopicStats(): WeakTopicStats[] {
  const respostas = loadRespostas()
  const map: Record<string, { tema:string; subtema:string; total:number; erros:number }> = {}
  respostas.forEach(r => {
    const q = ALL_QUESTIONS.find(q => q.qid === r.questionId)
    if (!q) return
    const tema = q.materia.trim()
    const subtema = q.subtema.trim()
    const key = subtema && subtema !== tema ? `${tema}|||${subtema}` : tema
    if (!map[key]) map[key] = { tema, subtema, total:0, erros:0 }
    map[key].total++
    if (r.status === 'erro' || r.status === 'chute') map[key].erros++
  })
  return Object.entries(map)
    .map(([, { tema, subtema, total, erros }]) => ({
      tema,
      subtema,
      label: subtema && subtema !== tema ? `${tema} › ${subtema}` : tema,
      total,
      erros,
      taxa: total > 0 ? erros/total : 0,
    }))
    .filter(t => t.total >= 2)
    .sort((a, b) => b.taxa - a.taxa)
}

/* ── Ordenação inteligente ───────────────────────────── */
// Prioridade: erros/chutes recentes → nunca respondidas → acertos antigos
function sortAdaptativo(qs: Question[]): Question[] {
  const resMap: Record<number, Resposta> = {}
  loadRespostas().forEach(r => resMap[r.questionId] = r)

  return [...qs].sort((a, b) => {
    const ra = resMap[a.qid], rb = resMap[b.qid]
    const score = (r: Resposta|undefined): number => {
      if (!r) return 1
      if (r.status === 'erro' || r.status === 'chute') return 2
      return 0
    }
    const sa = score(ra), sb = score(rb)
    if (sa !== sb) return sb - sa
    if (ra && rb && sa === sb) {
      return sa === 0 ? ra.timestamp - rb.timestamp : rb.timestamp - ra.timestamp
    }
    return 0
  })
}

/* ══════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════ */
function shuffle<T>(arr:T[]):T[] { return [...arr].sort(()=>Math.random()-0.5) }

function displayBrandLabel(value: string): string {
  return value === 'VetStudy' ? 'VetFoco' : value
}

function isHit(q:Question, a:AnswerState):boolean {
  if (a===null) return false
  if (q.type==='mc')    return (a as number)===q.correct
  if (q.type==='vf')    return (a as boolean)===q.correct
  if (q.type==='assoc') return (a as number[]).every((v,i)=>v===(q as ASSOC).pairs[i])
  return false
}

const BADGE = {
  mc:    { label:'Múltipla Escolha',   cls:'bg-primary-500/10 text-primary-400 border-primary-500/20' },
  vf:    { label:'Verdadeiro / Falso', cls:'bg-primary-500/10 text-primary-400 border-primary-500/20' },
  assoc: { label:'Associação',         cls:'bg-warning-500/10 text-warning-400 border-warning-500/20' },
}

const ALL_BANCA_OPTION = 'Todas'
const ALL_MATERIA_OPTION = 'Todas'
const ALL_TOPICO_OPTION = 'Todos'
const ALL_SUBTEMA_OPTION = 'Todos'
const MIN_SUBTEMA_QUESTIONS = 5
const MIN_VISIBLE_SUBTEMAS = 2
const BANCA_PRIORITY = ['Faculdade', 'Vunesp', 'FCC', 'Cebraspe', 'Outros', 'VetStudy']
const MATERIA_PRIORITY = [
  'Reprodução Animal',
  'Anatomia Reprodutiva',
  'Clínica de Ruminantes',
  'Clínica de Pequenos',
  'Farmacologia Veterinária',
  'Saúde de Animais de Produção',
  'Clínica de Equídeos',
]
const TOPICO_PRIORITY = [
  'Brucelose | PNCEBT',
  'Tuberculose | PNCEBT',
  'AIE',
  'Mormo',
  'PNSE / PNCEBT',
  'PNCEBT',
  'PNSE',
]
const DIFS = ['Todas','facil','media','dificil'] as const
type DifFilter = typeof DIFS[number]

/* ══════════════════════════════════════════════════════
   COMPONENTE: Múltipla Escolha
   ══════════════════════════════════════════════════════ */
function MCQ({ q, answer, onAnswer }: { q:MC; answer:number|null; onAnswer:(i:number)=>void }) {
  const answered = answer !== null
  return (
    <div className="space-y-2.5">
      {q.options.map((opt,i) => {
        const sel=answer===i, right=answered&&i===q.correct, wrong=answered&&sel&&i!==q.correct
        return (
          <button key={i} onClick={()=>onAnswer(i)} disabled={answered}
            className={`w-full text-left px-4 py-3.5 rounded-2xl border text-sm font-medium transition-all active:scale-[0.98] ${
              right?'bg-success-500/15 border-success-500/40 text-success-300':
              wrong?'bg-danger-500/15 border-danger-500/40 text-danger-300':
              sel?'bg-primary-500/15 border-primary-500/40 text-primary-300':
              'bg-neutral-800 border-neutral-700/60 text-neutral-300 hover:border-primary-500/40 hover:bg-neutral-700/50'
            } ${answered&&!sel&&!right?'opacity-40':''}`}>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-neutral-700/60 text-xs font-bold mr-3">
              {String.fromCharCode(65+i)}
            </span>{opt}
          </button>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   COMPONENTE: Verdadeiro / Falso
   ══════════════════════════════════════════════════════ */
function VFQ({ q, answer, onAnswer }: { q:VF; answer:boolean|null; onAnswer:(v:boolean)=>void }) {
  const answered = answer !== null
  return (
    <div className="grid grid-cols-2 gap-4">
      {[true,false].map(val => {
        const sel=answer===val, right=answered&&val===q.correct, wrong=answered&&sel&&val!==q.correct
        return (
          <button key={String(val)} onClick={()=>onAnswer(val)} disabled={answered}
            className={`py-6 rounded-2xl border text-base font-black transition-all active:scale-[0.97] ${
              right?'bg-success-500/15 border-success-500/40 text-success-300':
              wrong?'bg-danger-500/15 border-danger-500/40 text-danger-300':
              sel?'bg-primary-500/15 border-primary-500/40 text-primary-300':
              'bg-neutral-800 border-neutral-700/60 text-neutral-400 hover:border-primary-500/40 hover:text-neutral-100'
            } ${answered&&!sel?'opacity-40':''}`}>
            {val?'✓  VERDADEIRO':'✗  FALSO'}
          </button>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   COMPONENTE: Associação por Clique
   ══════════════════════════════════════════════════════ */
function AssocQ({ q, answer, onAnswer }: { q:ASSOC; answer:number[]|null; onAnswer:(p:number[])=>void }) {
  const [selLeft, setSelLeft] = useState<number|null>(null)
  const [conn, setConn]       = useState<Record<number,number>>({})
  const answered  = answer !== null
  const usedRight = Object.values(conn)

  const clickLeft = (li:number) => { if (answered) return; setSelLeft(selLeft===li?null:li) }
  const clickRight = (ri:number) => {
    if (answered||selLeft===null) return
    const n={...conn}
    const old=Object.entries(n).find(([,v])=>v===ri)
    if (old) delete n[Number(old[0])]
    n[selLeft]=ri; setConn(n); setSelLeft(null)
    if (Object.keys(n).length===q.left.length) onAnswer(q.left.map((_,i)=>n[i]??-1))
  }

  const p=answered?answer!:conn
  const ok=(li:number)=>answered&&p[li]===q.pairs[li]
  const ko=(li:number)=>answered&&p[li]!==undefined&&p[li]!==q.pairs[li]

  const lClass=(li:number)=>ok(li)?'bg-primary-500/15 border-primary-500/40 text-primary-300':
    ko(li)?'bg-danger-500/15 border-danger-500/40 text-danger-300':
    selLeft===li?'bg-primary-500/25 border-primary-400 text-primary-200 scale-[1.02]':
    conn[li]!==undefined?'bg-primary-500/10 border-primary-600/30 text-primary-400':
    'bg-neutral-800 border-neutral-700/60 text-neutral-300 hover:border-neutral-500'
  const rClass=(ri:number)=>{
    const li=Object.entries(p as Record<number,number>).find(([,v])=>v===ri)?.[0]
    if (li!==undefined&&answered) return ok(Number(li))?'bg-primary-500/15 border-primary-500/40 text-primary-300':'bg-danger-500/15 border-danger-500/40 text-danger-300'
    if (usedRight.includes(ri)&&!answered) return 'bg-primary-500/10 border-primary-600/30 text-primary-400 opacity-60'
    if (selLeft!==null&&!usedRight.includes(ri)) return 'bg-neutral-700/60 border-primary-600/50 text-neutral-200 hover:bg-primary-500/20'
    return 'bg-neutral-800 border-neutral-700/60 text-neutral-400'
  }

  return (
    <div className="space-y-3">
      {!answered && (
        <div className="flex items-start gap-2 bg-neutral-800/60 border border-neutral-700/40 rounded-xl px-3 py-2.5">
          <ArrowRight size={13} className="text-primary-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-400">
            {selLeft===null?'Toque em um item da COLUNA A para selecionar.':`"${q.left[selLeft]}" selecionado → toque no item da COLUNA B.`}
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-[9px] font-black text-neutral-600 uppercase text-center">Coluna A</p>
          {q.left.map((item,li)=>(
            <button key={li} onClick={()=>clickLeft(li)} disabled={answered}
              className={`w-full px-3 py-3.5 rounded-xl border text-xs font-semibold text-center transition-all active:scale-[0.97] ${lClass(li)}`}>
              {item}
              {answered&&<span className="ml-1.5">{ok(li)?<CheckCircle2 size={12} className="inline text-success-400"/>:<XCircle size={12} className="inline text-danger-400"/>}</span>}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-[9px] font-black text-neutral-600 uppercase text-center">Coluna B</p>
          {q.right.map((item,ri)=>(
            <button key={ri} onClick={()=>clickRight(ri)} disabled={answered||(usedRight.includes(ri)&&selLeft===null)}
              className={`w-full px-3 py-3.5 rounded-xl border text-[11px] font-medium text-center transition-all active:scale-[0.97] ${rClass(ri)}`}>
              {item}
            </button>
          ))}
        </div>
      </div>
      {!answered&&Object.keys(conn).length>0&&(
        <button onClick={()=>{setConn({});setSelLeft(null)}}
          className="flex items-center gap-1.5 mx-auto text-xs text-neutral-600 hover:text-neutral-300 transition-colors py-1 px-2 rounded-lg hover:bg-neutral-800">
          <RotateCcw size={11}/> Limpar
        </button>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   PAINEL DE FILTROS
   ══════════════════════════════════════════════════════ */
interface FilterState {
  banca:       string
  materia:     string
  topico:      string
  subtema:     string
  tipo:        'todas' | 'mc' | 'vf' | 'assoc'
  dificuldade: DifFilter
  refazer:     'normal' | 'erradas' | 'acertadas' | 'reforco'
}

interface QuizSession {
  questionIds: number[]
  index: number
  answers: AnswerState[]
  startTime: number
  filters: FilterState
}

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function compareWithPriority(a: string, b: string, priority: string[]): number {
  const ai = priority.indexOf(a)
  const bi = priority.indexOf(b)

  if (ai !== -1 || bi !== -1) {
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  }

  return a.localeCompare(b, 'pt-BR')
}

function uniqueSortedOptions(values: string[], priority: string[] = []): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))]
    .sort((a, b) => compareWithPriority(a, b, priority))
}

function getQuestionSubtema(question: Pick<Question, 'materia' | 'subtema'>): string {
  return question.subtema.trim() || question.materia.trim()
}

function getQuestionTopico(question: Pick<Question, 'materia' | 'subtema'>): string {
  const subtema = getQuestionSubtema(question)
  const normalized = normalizeText(subtema)

  if (!subtema) return question.materia.trim()
  if (subtema.includes('|')) return subtema
  if (normalized.includes('brucelose')) return 'Brucelose | PNCEBT'
  if (normalized.includes('tuberculose')) return 'Tuberculose | PNCEBT'
  if (normalized.includes('anemia infecciosa equina') || normalized === 'aie' || normalized.includes('(aie)')) return 'AIE'
  if (normalized.includes('mormo')) return 'Mormo'
  if (normalized.includes('pnse') && normalized.includes('pncebt')) return 'PNSE / PNCEBT'
  if (normalized.includes('pncebt')) return 'PNCEBT'
  if (normalized.includes('pnse')) return 'PNSE'

  return subtema
}

function applyBaseFilters(
  questions: Question[],
  filters: Pick<FilterState, 'banca' | 'materia' | 'topico' | 'subtema'>,
): Question[] {
  let qs = [...questions]

  if (filters.banca !== ALL_BANCA_OPTION) {
    qs = qs.filter(q => q.banca === filters.banca)
  }

  if (filters.materia !== ALL_MATERIA_OPTION) {
    qs = qs.filter(q => q.materia === filters.materia)
  }

  if (filters.topico !== ALL_TOPICO_OPTION) {
    qs = qs.filter(q => getQuestionTopico(q) === filters.topico)
  }

  if (filters.subtema !== ALL_SUBTEMA_OPTION) {
    qs = qs.filter(q => getQuestionSubtema(q) === filters.subtema)
  }

  return qs
}

function getAvailableBancas(questions: Question[] = ALL_QUESTIONS): string[] {
  return [ALL_BANCA_OPTION, ...uniqueSortedOptions(questions.map(q => q.banca), BANCA_PRIORITY)]
}

function getAvailableMaterias(questions: Question[], banca: string): string[] {
  const scopedQuestions = banca === ALL_BANCA_OPTION
    ? questions
    : questions.filter(q => q.banca === banca)

  return [ALL_MATERIA_OPTION, ...uniqueSortedOptions(scopedQuestions.map(q => q.materia), MATERIA_PRIORITY)]
}

function getAvailableTopicos(questions: Question[], banca: string, materia: string): string[] {
  const scopedQuestions = applyBaseFilters(questions, {
    banca,
    materia,
    topico: ALL_TOPICO_OPTION,
    subtema: ALL_SUBTEMA_OPTION,
  })
  const groupedTopicos = scopedQuestions
    .map(question => ({
      topico: getQuestionTopico(question),
      subtema: getQuestionSubtema(question),
    }))
    .filter(({ topico, subtema }) => topico.includes('|') || topico !== subtema || TOPICO_PRIORITY.includes(topico))
    .map(({ topico }) => topico)

  return [ALL_TOPICO_OPTION, ...uniqueSortedOptions(groupedTopicos, TOPICO_PRIORITY)]
}

function getAvailableSubtemas(questions: Question[], banca: string, materia: string, topico: string): string[] {
  const scopedQuestions = applyBaseFilters(questions, {
    banca,
    materia,
    topico,
    subtema: ALL_SUBTEMA_OPTION,
  })
  const subtemaCounts = new Map<string, number>()

  scopedQuestions.forEach(question => {
    const subtema = getQuestionSubtema(question)
    subtemaCounts.set(subtema, (subtemaCounts.get(subtema) ?? 0) + 1)
  })

  return uniqueSortedOptions(
    [...subtemaCounts.entries()]
      .filter(([, count]) => count >= MIN_SUBTEMA_QUESTIONS)
      .map(([subtema]) => subtema),
  )
}

function shouldShowSubtemaSection(subtemas: string[]): boolean {
  return subtemas.length >= MIN_VISIBLE_SUBTEMAS
}

function getEffectiveFilters(filters: FilterState): FilterState {
  const next = normalizeFilters(filters)
  const availableSubtemas = getAvailableSubtemas(ALL_QUESTIONS, next.banca, next.materia, next.topico)

  if (
    !shouldShowSubtemaSection(availableSubtemas)
    || (next.subtema !== ALL_SUBTEMA_OPTION && !availableSubtemas.includes(next.subtema))
  ) {
    next.subtema = ALL_SUBTEMA_OPTION
  }

  return next
}

function normalizeFilters(raw?: Partial<FilterState> | null): FilterState {
  const tipo = raw?.tipo === 'mc' || raw?.tipo === 'vf' || raw?.tipo === 'assoc' ? raw.tipo : 'todas'
  const dificuldade = DIFS.includes(raw?.dificuldade as DifFilter) ? raw?.dificuldade as DifFilter : 'Todas'
  const refazer = raw?.refazer === 'erradas' || raw?.refazer === 'acertadas' || raw?.refazer === 'reforco'
    ? raw.refazer
    : 'normal'

  return {
    banca: typeof raw?.banca === 'string' && raw.banca.trim() ? raw.banca : ALL_BANCA_OPTION,
    materia: typeof raw?.materia === 'string' && raw.materia.trim() ? raw.materia : ALL_MATERIA_OPTION,
    topico: typeof raw?.topico === 'string' && raw.topico.trim() ? raw.topico : ALL_TOPICO_OPTION,
    subtema: typeof raw?.subtema === 'string' && raw.subtema.trim() ? raw.subtema : ALL_SUBTEMA_OPTION,
    tipo,
    dificuldade,
    refazer,
  }
}

function questionsFromIds(ids: number[]): Question[] | null {
  const qs = ids.map(id => ALL_QUESTIONS.find(q => q.qid === id))
  return qs.every(Boolean) ? qs as Question[] : null
}

function loadQuizSession(): QuizSession | null {
  const session = loadProfileJSON<QuizSession | null>(LS_SESSION, null)
  if (!session || !Array.isArray(session.questionIds) || !Array.isArray(session.answers)) return null
  if (!questionsFromIds(session.questionIds)) return null
  return { ...session, filters: normalizeFilters(session.filters) }
}

function clearQuizSession() {
  removeProfileJSON(LS_SESSION)
}

function hasDailyLaunch(profileId: string): boolean {
  try {
    return localStorage.getItem(profileStorageKey(profileId, TODAY_SESSION_LAUNCH_KEY)) === '1'
  } catch {
    return false
  }
}

function clearDailyLaunch(profileId: string) {
  try { localStorage.removeItem(profileStorageKey(profileId, TODAY_SESSION_LAUNCH_KEY)) } catch {}
}

function getDailyQuestions(session: TodaySession): Question[] | null {
  const questions = session.questions.map(item => ALL_QUESTIONS.find(q => q.qid === item.id))
  return questions.every(Boolean) ? questions as Question[] : null
}

const ORIGEM_LABEL: Record<TodaySessionQuestion['origem'], { text: string; cls: string }> = {
  revisao: { text: '📅 Revisão pendente', cls: 'bg-primary-500/10 text-primary-300 border-primary-500/20' },
  reforco: { text: '⚡ Você errou antes', cls: 'bg-warning-500/10 text-warning-300 border-warning-500/20' },
  exploracao: { text: '🆕 Conteúdo novo', cls: 'bg-primary-500/10 text-primary-300 border-primary-500/20' },
}

function FilterPanel({ filters, setFilters, history, total }: {
  filters: FilterState; setFilters:(f:FilterState)=>void; history:QHistory[]; total:number
}) {
  const erradas      = history.filter(h=>!h.correct).length
  const acertadas    = history.filter(h=>h.correct).length
  const respostas    = loadRespostas()
  const pontosFracos = calcWeakTopicStats().filter(t => t.taxa >= 0.4).slice(0, 2)
  const bancaOptions = getAvailableBancas()
  const materiaOptions = getAvailableMaterias(ALL_QUESTIONS, filters.banca)
  const topicoOptions = getAvailableTopicos(ALL_QUESTIONS, filters.banca, filters.materia)
  const availableSubtemas = getAvailableSubtemas(ALL_QUESTIONS, filters.banca, filters.materia, filters.topico)
  const showSubtemaSection = shouldShowSubtemaSection(availableSubtemas)
  const subtemaOptions = showSubtemaSection ? [ALL_SUBTEMA_OPTION, ...availableSubtemas] : []

  const syncFilters = (partial: Partial<FilterState>) => {
    const next = normalizeFilters({ ...filters, ...partial })
    const nextMaterias = getAvailableMaterias(ALL_QUESTIONS, next.banca)
    if (!nextMaterias.includes(next.materia)) next.materia = ALL_MATERIA_OPTION

    const nextTopicos = getAvailableTopicos(ALL_QUESTIONS, next.banca, next.materia)
    if (!nextTopicos.includes(next.topico)) next.topico = ALL_TOPICO_OPTION

    const nextSubtemas = getAvailableSubtemas(ALL_QUESTIONS, next.banca, next.materia, next.topico)
    if (
      !shouldShowSubtemaSection(nextSubtemas)
      || (next.subtema !== ALL_SUBTEMA_OPTION && !nextSubtemas.includes(next.subtema))
    ) {
      next.subtema = ALL_SUBTEMA_OPTION
    }

    setFilters(next)
  }

  return (
    <div className="bg-neutral-800/60 backdrop-blur-md rounded-2xl border border-neutral-700/60 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-primary-400" />
        <p className="app-text-primary text-sm font-bold">Filtros Avançados</p>
      </div>

      {/* ── Pontos Fracos (aparece quando há histórico suficiente) ── */}
      {pontosFracos.length > 0 && (
        <div className="bg-danger-500/8 border border-danger-500/20 rounded-xl px-3.5 py-3">
          <p className="text-[10px] font-bold text-danger-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span>⚡</span> Você está errando mais em:
          </p>
          <div className="space-y-1.5">
            {pontosFracos.map(t => (
              <div key={t.label} className="flex items-center justify-between gap-3">
                <span className="text-xs text-neutral-300 flex-1 truncate">{t.label}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-16 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-danger-400 rounded-full transition-all" style={{width:`${Math.round(t.taxa*100)}%`}} />
                  </div>
                  <span className="text-[10px] text-danger-400 font-bold w-8 text-right">{Math.round(t.taxa*100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banca */}
      <div>
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Banca</p>
        <div className="flex flex-wrap gap-1.5">
          {bancaOptions.map(b=>(
            <button key={b} onClick={()=>syncFilters({ banca: b })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                filters.banca===b?'bg-primary-500/20 text-primary-300 border-primary-500/30':'bg-neutral-800 text-neutral-500 border-neutral-700/60 hover:text-neutral-300'
              }`}>{displayBrandLabel(b)}</button>
          ))}
        </div>
      </div>

      {/* Matéria */}
      <div>
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Matéria / Disciplina</p>
        <div className="flex flex-wrap gap-1.5">
          {materiaOptions.map(m=>(
            <button key={m} onClick={()=>syncFilters({ materia: m })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                filters.materia===m?'bg-primary-500/20 text-primary-300 border-primary-500/30':'bg-neutral-800 text-neutral-500 border-neutral-700/60 hover:text-neutral-300'
              }`}>{m}</button>
          ))}
        </div>
      </div>

      {/* Tópico */}
      <div>
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Tópico</p>
        <div className="flex flex-wrap gap-1.5">
          {topicoOptions.map(topico=>(
            <button key={topico} onClick={()=>syncFilters({ topico })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                filters.topico===topico?'bg-primary-500/20 text-primary-300 border-primary-500/30':'bg-neutral-800 text-neutral-500 border-neutral-700/60 hover:text-neutral-300'
              }`}>{topico}</button>
          ))}
        </div>
      </div>

      {/* Subtema */}
      {showSubtemaSection && (
        <div>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Subtema</p>
          <div className="flex flex-wrap gap-1.5">
            {subtemaOptions.map(subtema=>(
              <button key={subtema} onClick={()=>syncFilters({ subtema })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  filters.subtema===subtema?'bg-primary-500/20 text-primary-300 border-primary-500/30':'bg-neutral-800 text-neutral-500 border-neutral-700/60 hover:text-neutral-300'
                }`}>{subtema}</button>
            ))}
          </div>
        </div>
      )}

      {/* Tipo */}
      <div>
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Tipo</p>
        <div className="flex gap-1.5 flex-wrap">
          {([['todas','Todas'],['mc','Múltipla Escolha'],['vf','V/F'],['assoc','Colunas']] as const).map(([k,l])=>(
            <button key={k} onClick={()=>syncFilters({ tipo: k })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                filters.tipo===k?'bg-primary-500/20 text-primary-300 border-primary-500/30':'bg-neutral-800 text-neutral-500 border-neutral-700/60 hover:text-neutral-300'
              }`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Dificuldade */}
      <div>
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Dificuldade</p>
        <div className="flex gap-1.5 flex-wrap">
          {([['Todas','Todas'],['facil','Fácil'],['media','Média'],['dificil','Difícil']] as const).map(([k,l])=>(
            <button key={k} onClick={()=>syncFilters({ dificuldade: k as DifFilter })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                filters.dificuldade===k?'bg-warning-500/20 text-warning-300 border-warning-500/30':'bg-neutral-800 text-neutral-500 border-neutral-700/60 hover:text-neutral-300'
              }`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Modo de Estudo */}
      <div>
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Modo de Estudo</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>syncFilters({ refazer: 'reforco' })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              filters.refazer==='reforco'?'bg-primary-500/20 text-primary-300 border-primary-500/30':'bg-neutral-800 text-neutral-500 border-neutral-700/60 hover:text-primary-400'
            }`}>
            ⚡ Reforço Inteligente
          </button>
          <button onClick={()=>syncFilters({ refazer: 'erradas' })} disabled={erradas===0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-30 ${
              filters.refazer==='erradas'?'bg-danger-500/20 text-danger-300 border-danger-500/30':'bg-neutral-800 text-neutral-500 border-neutral-700/60 hover:text-danger-400'
            }`}>
            <XCircle size={12}/> Só Erradas ({erradas})
          </button>
          <button onClick={()=>syncFilters({ refazer: 'acertadas' })} disabled={acertadas===0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-30 ${
              filters.refazer==='acertadas'?'bg-success-500/20 text-success-300 border-success-500/30':'bg-neutral-800 text-neutral-500 border-neutral-700/60 hover:text-success-400'
            }`}>
            <CheckCircle2 size={12}/> Só Acertadas ({acertadas})
          </button>
          <button onClick={()=>syncFilters({ refazer: 'normal' })}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              filters.refazer==='normal'?'bg-neutral-700 text-neutral-100 border-neutral-600':'bg-neutral-800 text-neutral-500 border-neutral-700/60 hover:text-neutral-300'
            }`}>Todas</button>
        </div>
        {filters.refazer==='reforco' && (
          <p className="text-[10px] text-primary-400/70 mt-1.5 pl-1">
            Prioriza: erros recentes → nunca respondidas → acertos antigos
          </p>
        )}
      </div>

      <div className="border-t border-neutral-700/50 pt-3 flex items-center justify-between">
        <p className="text-xs text-neutral-500">{total} questão{total!==1?'s':''} disponível{total!==1?'is':''}</p>
        {respostas.length > 0 && (
          <p className="text-[10px] text-neutral-600">{respostas.length} respondida{respostas.length!==1?'s':''} no histórico</p>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   SIMULADOR PRINCIPAL
   ══════════════════════════════════════════════════════ */
function SimuladorContent({ profile }: { profile: LocalProfile }) {
  const defaultFilters: FilterState = normalizeFilters()
  const initialDailySession = hasDailyLaunch(profile.id) ? loadTodaySession(profile.id) : null
  const initialDailyQuestions = initialDailySession ? getDailyQuestions(initialDailySession) : null
  const startsDailyMode = Boolean(initialDailySession && initialDailyQuestions && !initialDailySession.completed)
  const [savedSession, setSavedSession] = useState<QuizSession | null>(() => loadQuizSession())
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>(() => getEffectiveFilters(normalizeFilters(savedSession?.filters ?? defaultFilters)))
  const [history, setHistory] = useState<QHistory[]>(()=>loadProfileJSON<QHistory[]>(LS_HISTORY,[]))
  const [dailyMode, setDailyMode] = useState(startsDailyMode)
  const [dailySession, setDailySession] = useState<TodaySession | null>(() => startsDailyMode ? initialDailySession : null)
  const [dailyStartAnsweredCount] = useState(()=>startsDailyMode && initialDailySession ? initialDailySession.answeredCount : 0)

  const getFiltered = ():Question[] => {
    const effectiveFilters = getEffectiveFilters(filters)
    let qs = applyBaseFilters(ALL_QUESTIONS, effectiveFilters)
    if (filters.tipo!=='todas')        qs=qs.filter(q=>q.type===filters.tipo)
    if (filters.dificuldade!=='Todas') qs=qs.filter(q=>q.dificuldade===filters.dificuldade)
    if (filters.refazer==='erradas') {
      const ids=new Set(history.filter(h=>!h.correct).map(h=>h.id))
      if (ids.size>0) qs=qs.filter(q=>ids.has((q.type==='assoc'?q.instruction:q.question).slice(0,40)))
    }
    if (filters.refazer==='acertadas') {
      const ids=new Set(history.filter(h=>h.correct).map(h=>h.id))
      if (ids.size>0) qs=qs.filter(q=>ids.has((q.type==='assoc'?q.instruction:q.question).slice(0,40)))
    }
    // Reforço inteligente: reordena por prioridade (não filtra)
    if (filters.refazer==='reforco') return sortAdaptativo(qs)
    return shuffle(qs)
  }

  const [questions, setQuestions] = useState<Question[]>(()=>startsDailyMode && initialDailyQuestions ? initialDailyQuestions : shuffle(ALL_QUESTIONS))
  const [index,     setIndex]     = useState(()=>startsDailyMode && initialDailySession ? Math.min(initialDailySession.answeredCount, Math.max(0, initialDailySession.questions.length-1)) : 0)
  const [answers,   setAnswers]   = useState<AnswerState[]>(()=>Array(startsDailyMode && initialDailyQuestions ? initialDailyQuestions.length : ALL_QUESTIONS.length).fill(null))
  const [submitted, setSubmit]    = useState(false)
  const [started,   setStarted]   = useState(startsDailyMode)
  const [startTime, setStartTime] = useState<number>(()=>startsDailyMode ? Date.now() : 0)

  const q        = questions[index]
  const answered = answers[index]!==null
  const score    = answers.filter((a,i)=>isHit(questions[i],a)).length
  const dailyOrigin = dailyMode ? dailySession?.questions.find(item => item.id === q?.qid)?.origem : undefined
  const dailyLabel = dailyOrigin ? ORIGEM_LABEL[dailyOrigin] : null

  const applyAndStart=()=>{
    const f=getFiltered(); if(f.length===0) return
    setQuestions(f); setAnswers(Array(f.length).fill(null))
    setIndex(0); setSubmit(false); setStarted(true)
    setSavedSession(null)
    setDailyMode(false); setDailySession(null); clearDailyLaunch(profile.id)
    setStartTime(Date.now()); setShowFilters(false)
  }

  const restoreSavedSession=()=>{
    const session=loadQuizSession()
    const savedQuestions=session ? questionsFromIds(session.questionIds) : null
    if (!session || !savedQuestions) {
      clearQuizSession(); setSavedSession(null)
      return
    }
    const restoredAnswers=savedQuestions.map((_,i)=>session.answers[i] ?? null)
    setQuestions(savedQuestions); setAnswers(restoredAnswers)
    setIndex(Math.max(0,Math.min(session.index,savedQuestions.length-1)))
    setFilters(getEffectiveFilters(normalizeFilters(session.filters))); setSubmit(false); setStarted(true)
    setStartTime(session.startTime || Date.now()); setShowFilters(false)
  }

  const updateDailyProgress=(nextAnswers: AnswerState[])=>{
    if (!dailyMode || !dailySession) return
    const answeredCount = nextAnswers.reduce<number>((count, answer, answerIndex) => (
      answerIndex < dailyStartAnsweredCount ? count : count + (answer !== null ? 1 : 0)
    ), dailyStartAnsweredCount)
    const updatedSession: TodaySession = {
      ...dailySession,
      answeredCount,
      completed: answeredCount >= dailySession.questions.length,
    }
    saveTodaySession(profile.id, updatedSession)
    setDailySession(updatedSession)
  }

  const persistStats=(finalScore:number,total:number)=>{
    const elapsed=(Date.now()-startTime)/3600000
    const prev=loadProfileJSON<QuizStats>(LS_STATS,{total:0,correct:0,hours:0})
    saveProfileJSON(LS_STATS,{total:prev.total+total,correct:prev.correct+finalScore,hours:+(prev.hours+elapsed).toFixed(2)})
    const prevHist=loadProfileJSON<QHistory[]>(LS_HISTORY,[])
    const newHist=questions.map((q,i)=>({id:(q.type==='assoc'?q.instruction:q.question).slice(0,40),correct:isHit(q,answers[i])}))
    const updatedHist=[...prevHist,...newHist].slice(-200)
    saveProfileJSON(LS_HISTORY,updatedHist)
    setHistory(updatedHist)
    window.dispatchEvent(new Event('vetstudy_stats_update'))
  }

  const finishQuiz=()=>{
    setSubmit(true); persistStats(score,questions.length)
    if (dailyMode && dailySession) {
      const completedSession = {...dailySession, answeredCount: questions.length, completed: true}
      saveTodaySession(profile.id, completedSession)
      setDailySession(completedSession)
    }
    clearQuizSession(); setSavedSession(null)
  }

  useEffect(()=>{
    if (!started || submitted || dailyMode) return
    saveProfileJSON(LS_SESSION,{
      questionIds: questions.map(q=>q.qid),
      index,
      answers,
      startTime,
      filters,
    } satisfies QuizSession)
  },[answers,filters,index,questions,startTime,started,submitted,dailyMode])

  useEffect(()=>{
    clearDailyLaunch(profile.id)
  },[profile.id])

  /* ── Tela de filtros / entrada ─────────────────────── */
  if (!started||showFilters) return (
    <div className="p-5 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="app-text-primary flex items-center gap-2 text-xl font-bold">
            <ClipboardCheck size={20} className="text-primary-400"/> Simulador de Prova
          </h2>
          <p className="text-xs text-neutral-400 mt-1">Reprodução Animal A1 · UNISUL 2025/2</p>
        </div>
        {started&&<button onClick={()=>setShowFilters(false)} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">← Voltar</button>}
      </div>
      <FilterPanel filters={filters} setFilters={setFilters} history={history} total={getFiltered().length}/>
      {savedSession&&!started&&(
        <button onClick={restoreSavedSession}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-neutral-800 border border-primary-500/30 text-primary-300 rounded-2xl text-sm font-bold hover:bg-primary-500/10 transition-colors active:scale-95">
          Continuar de onde parei <ChevronRight size={16}/>
        </button>
      )}
      <button onClick={applyAndStart} disabled={getFiltered().length===0}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent-500 text-white rounded-2xl font-bold hover:bg-accent-600 transition-colors shadow-lg shadow-primary-950/50 active:scale-95 disabled:opacity-40">
        {started?'🔄 Reiniciar com estes filtros':'Iniciar Simulado'} <ChevronRight size={18}/>
      </button>
      <div className="flex gap-2 flex-wrap justify-center">
        {(['mc','vf','assoc'] as const).map(t=>{
          const cnt=getFiltered().filter(q=>q.type===t).length
          return <span key={t} className={`text-xs px-3 py-1.5 rounded-full border font-bold ${BADGE[t].cls}`}>{BADGE[t].label} ({cnt})</span>
        })}
      </div>
    </div>
  )

  /* ── Tela de resultado ─────────────────────────────── */
  if (submitted) return (
    <div className="p-5 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="app-text-primary mb-3 text-2xl font-bold">Resultado Final</h2>
        <div className={`text-6xl font-black mb-2 ${score/questions.length>=0.6?'text-success-400':'text-danger-400'}`}>
          {score}/{questions.length}
        </div>
        <p className="text-neutral-400">{Math.round(score/questions.length*100)}% de aproveitamento</p>
        <p className={`text-sm mt-1 font-bold ${score/questions.length>=0.7?'text-success-400':score/questions.length>=0.6?'text-warning-400':'text-danger-400'}`}>
          {score/questions.length>=0.7?'🎓 Excelente!':score/questions.length>=0.6?'✅ Aprovado':'📖 Estudar mais'}
        </p>
      </div>
      <div className="space-y-2 mb-5 max-h-[40vh] overflow-y-auto pr-1">
        {questions.map((q,i)=>{
          const hit=isHit(q,answers[i])
          return (
            <div key={i} className={`rounded-2xl p-3.5 border ${hit?'bg-success-500/5 border-success-500/20':'bg-danger-500/5 border-danger-500/20'}`}>
              <div className="flex items-start gap-2.5">
                {hit?<CheckCircle2 size={13} className="text-success-400 flex-shrink-0 mt-0.5"/>:<XCircle size={13} className="text-danger-400 flex-shrink-0 mt-0.5"/>}
                <div>
                  <p className="text-[10px] font-bold text-neutral-600 mb-0.5">Q{i+1} · {BADGE[q.type].label} · {displayBrandLabel(q.banca)}</p>
                  <p className="text-xs text-neutral-300 font-medium mb-1">{q.type==='assoc'?q.instruction:q.question}</p>
                  <p className="text-xs text-neutral-500 leading-relaxed whitespace-pre-line">{q.explanation}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-3">
        <button onClick={()=>{setShowFilters(true);setSubmit(false)}}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-2xl text-sm font-bold hover:border-primary-500/40 transition-all active:scale-95">
          <Filter size={14}/> Filtrar
        </button>
        <button onClick={applyAndStart}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-accent-500 text-white rounded-2xl text-sm font-bold hover:bg-accent-600 transition-all active:scale-95">
          <RotateCcw size={14}/> Novo Simulado
        </button>
      </div>
    </div>
  )

  /* ── Tela de questão ───────────────────────────────── */
  const badge=BADGE[q.type]
  return (
    <div className="p-5 max-w-2xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={17} className="text-primary-400"/>
            <span className="app-text-primary text-sm font-bold">Simulador</span>
            {q.banca&&<span className="text-[10px] text-neutral-600 bg-neutral-800 px-2 py-0.5 rounded-lg">{displayBrandLabel(q.banca)}</span>}
            {q.dificuldade&&<span className="text-[10px] text-neutral-600 bg-neutral-800 px-2 py-0.5 rounded-lg">{q.dificuldade}</span>}
          </div>
          <div className="flex items-center gap-2">
            {dailyLabel&&<span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${dailyLabel.cls}`}>{dailyLabel.text}</span>}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>
            {!dailyMode&&(
              <button onClick={()=>setShowFilters(true)} className="p-1.5 text-neutral-500 hover:text-primary-400 hover:bg-neutral-800 rounded-lg transition-colors">
                <Filter size={14}/>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-neutral-500 tabular-nums">Q {index+1} / {questions.length}</span>
          <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
            {questions.map((_,i)=>(
              <button key={i} onClick={()=>setIndex(i)}
                className={`w-5 h-5 rounded text-[9px] font-bold transition-all ${
                  i===index?'bg-primary-500 text-white':
                  answers[i]!==null?(isHit(questions[i],answers[i])?'bg-success-500/30 text-success-400':'bg-danger-500/30 text-danger-400'):
                  'bg-neutral-700 text-neutral-500'}`}>{i+1}
              </button>
            ))}
          </div>
        </div>
        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary-500 rounded-full"
            animate={{width:`${((index+1)/questions.length)*100}%`}} transition={{duration:0.3}}/>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.16}} className="space-y-4">
          <div className="bg-neutral-800/60 backdrop-blur-md rounded-2xl p-5 border border-neutral-700/80">
            {/* Breadcrumb de identidade do conteúdo */}
            {(q.materia || q.subtema) && (
              <p className="text-[10px] text-neutral-500 mb-2.5 flex items-center gap-1 font-medium">
                <span>📚</span>
                <span>{q.materia}</span>
                {q.subtema && q.subtema !== q.materia && (
                  <>
                    <span className="text-neutral-700">›</span>
                    <span className="text-neutral-400">{q.subtema}</span>
                  </>
                )}
              </p>
            )}
            <p className="app-text-primary text-sm font-semibold leading-relaxed">{q.type==='assoc'?q.instruction:q.question}</p>
          </div>

          {q.type==='mc'    && <MCQ    q={q} answer={answers[index] as number|null}
            onAnswer={i=>{const n=[...answers];n[index]=i;setAnswers(n);updateDailyProgress(n);saveResposta({questionId:q.qid,status:i===q.correct?'acerto':'erro',timestamp:Date.now()})}}/>}
          {q.type==='vf'    && <VFQ    q={q} answer={answers[index] as boolean|null}
            onAnswer={v=>{const n=[...answers];n[index]=v;setAnswers(n);updateDailyProgress(n);saveResposta({questionId:q.qid,status:v===q.correct?'acerto':'erro',timestamp:Date.now()})}}/>}
          {q.type==='assoc' && <AssocQ q={q} answer={answers[index] as number[]|null}
            onAnswer={p=>{const n=[...answers];n[index]=p;setAnswers(n);updateDailyProgress(n);const hit=p.every((v,i)=>v===(q as ASSOC).pairs[i]);saveResposta({questionId:q.qid,status:hit?'acerto':'erro',timestamp:Date.now()})}}/>}

          {answered&&(
            <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
              className={`rounded-2xl p-4 border backdrop-blur-sm ${
                isHit(q,answers[index])?'bg-success-500/10 border-success-500/20':'bg-danger-500/10 border-danger-500/20'}`}>
              <div className="flex items-start gap-2.5">
                {isHit(q,answers[index])
                  ?<CheckCircle2 size={14} className="text-success-400 flex-shrink-0 mt-0.5"/>
                  :<XCircle     size={14} className="text-danger-400 flex-shrink-0 mt-0.5"/>}
                <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-line flex-1">{q.explanation}</p>
              </div>
              {/* Botão Chutei — só aparece em erros */}
              {!isHit(q,answers[index]) && (
                <button onClick={()=>updateResposta(q.qid,'chute')}
                  className="mt-3 flex items-center gap-1.5 text-[11px] text-warning-400/70 hover:text-warning-400 transition-colors px-2 py-1 rounded-lg hover:bg-warning-500/10 border border-transparent hover:border-warning-500/20">
                  🎲 Chutei esta resposta
                </button>
              )}
            </motion.div>
          )}

          <div className="flex justify-between pt-1 pb-4">
            <button onClick={()=>setIndex(i=>Math.max(0,i-1))} disabled={index===0}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-400 transition-all hover:text-neutral-100 disabled:opacity-30 active:scale-95">
              <ChevronRight size={13} className="rotate-180"/> Anterior
            </button>
            {index<questions.length-1?(
              <button onClick={()=>setIndex(i=>i+1)} disabled={!answered}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-500 text-white rounded-xl text-sm font-bold hover:bg-accent-600 disabled:opacity-40 transition-all active:scale-95">
                Próxima <ChevronRight size={13}/>
              </button>
            ):(
              <button onClick={finishQuiz} disabled={dailyMode ? !dailySession?.completed : answers.some(a=>a===null)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-500 text-white rounded-xl text-sm font-bold hover:bg-accent-600 disabled:opacity-40 transition-all active:scale-95">
                Finalizar <Award size={13}/>
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function SimuladorPage() {
  const profile = getActiveProfile()

  return (
    <Gatekeeper pageTitle="Simulador de Prova">
      {profile ? (
        <SimuladorContent key={profile.id} profile={profile} />
      ) : (
        <div className="p-5 max-w-xl mx-auto text-center text-sm text-neutral-500">
          Selecione um perfil local para usar o simulador.
        </div>
      )}
    </Gatekeeper>
  )
}
