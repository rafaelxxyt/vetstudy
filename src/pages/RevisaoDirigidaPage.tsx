import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Image,
  Lock,
  ShieldAlert,
} from 'lucide-react'
import Gatekeeper from '../components/Gatekeeper'
import VetHeroPattern from '../components/VetHeroPattern'
import reproQ27Image from '../assets/revisao/repro-q27.png'
import {
  cycleTable,
  hormoneTable,
  oralQuestions,
  pitfalls,
  priorityBusReviewFinalLine,
  priorityBusReviewList,
  priorityQ28ReadyAnswer,
  priorityReviewCards,
  priorityReviewMeta,
  priorityStudyOrder,
  priorityUltraSummary,
  q27Legend,
  q27Macete,
  q28Bovinos,
  quickReviewMustKnow,
  reviewPageMeta,
  reviewPlan,
  reviewQuestions,
  top25Points,
  type AnatomyLegendRow,
  type ReviewQuestion,
  type ReviewTag,
  type SummaryTableRow,
} from '../data/revisao_dirigida_reproducao'

type SectionId =
  | 'visao-geral'
  | 'tabelas-resumo'
  | 'questoes-1-26'
  | 'questao-27'
  | 'questao-28'

const SECTION_ITEMS: Array<{ id: SectionId; label: string }> = [
  { id: 'visao-geral', label: 'Visão Geral' },
  { id: 'tabelas-resumo', label: 'Tabelas-Resumo' },
  { id: 'questoes-1-26', label: 'Questões 1-26' },
  { id: 'questao-27', label: 'Questão 27' },
  { id: 'questao-28', label: 'Questão 28' },
]

const TAG_STYLES: Record<string, string> = {
  'Anatomia': 'border-primary-500/25 bg-primary-500/10 text-primary-300',
  'Ciclo Estral': 'border-success-500/25 bg-success-500/10 text-success-300',
  'Biotecnologias': 'border-accent-500/25 bg-accent-500/10 text-accent-300',
  'Caso Clínico': 'border-warning-500/25 bg-warning-500/10 text-warning-300',
  'Pequenos Animais': 'border-neutral-600/70 bg-neutral-800/80 text-neutral-300',
}

const PRIORITY_UNLOCK_STORAGE_KEY = 'vetfoco_revisao_prioritaria_unlocked'
const PRIORITY_PASSWORD = 'rbc1'

function scrollToSection(sectionId: SectionId) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary-400">{eyebrow}</p>
        <h2 className="app-text-primary mt-1 text-xl font-bold sm:text-2xl">{title}</h2>
      </div>
      {subtitle && <p className="app-text-secondary max-w-2xl text-sm leading-relaxed">{subtitle}</p>}
    </div>
  )
}

function CollapsibleCard({
  title,
  subtitle,
  open,
  onToggle,
  tone = 'default',
  children,
}: {
  title: string
  subtitle?: string
  open: boolean
  onToggle: () => void
  tone?: 'default' | 'warning'
  children: React.ReactNode
}) {
  const toneClasses = tone === 'warning'
    ? 'border-warning-500/25 bg-warning-500/8'
    : 'app-panel'

  const subtitleClasses = tone === 'warning' ? 'text-warning-100/80' : 'app-text-secondary'

  return (
    <div className={`${toneClasses} overflow-hidden rounded-3xl border p-0`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <p className={`text-sm font-bold ${tone === 'warning' ? 'text-warning-200' : 'app-text-primary'}`}>{title}</p>
          {subtitle && <p className={`mt-1 text-xs leading-relaxed ${subtitleClasses}`}>{subtitle}</p>}
        </div>
        <span className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border ${
          tone === 'warning'
            ? 'border-warning-500/20 bg-warning-500/10 text-warning-300'
            : 'border-neutral-700/70 bg-neutral-900/60 text-neutral-400'
        }`}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-neutral-700/60 px-5 py-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ResponsiveSummaryTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: SummaryTableRow[]
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-3xl border border-neutral-700/70 md:block">
        <table className="w-full table-fixed border-collapse">
          <thead className="bg-neutral-900/60">
            <tr>
              {headers.map(header => (
                <th key={header} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-primary-400">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${row.cells[0]}-${rowIndex}`} className="border-t border-neutral-700/60">
                {row.cells.map((cell, cellIndex) => (
                  <td key={`${row.cells[0]}-${cellIndex}`} className="px-4 py-3 align-top text-sm leading-relaxed text-neutral-200">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((row, rowIndex) => (
          <div key={`${row.cells[0]}-${rowIndex}`} className="app-panel rounded-3xl p-4">
            <div className="space-y-3">
              {row.cells.map((cell, cellIndex) => (
                <div key={`${row.cells[0]}-${cellIndex}`}>
                  <p className="text-[11px] font-black uppercase tracking-wider text-primary-400">{headers[cellIndex]}</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-200">{cell}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function QuestionCard({
  item,
  open,
  onToggle,
}: {
  item: ReviewQuestion
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className={`overflow-hidden rounded-3xl border ${
      item.isCase
        ? 'border-warning-500/25 bg-warning-500/8'
        : 'app-panel'
    }`}>
      <div className="border-b border-neutral-700/60 px-5 py-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
            item.isCase
              ? 'bg-warning-500/12 text-warning-300'
              : 'bg-primary-500/12 text-primary-300'
          }`}>
            Q{item.number}
          </span>
          {item.tags.map(tag => (
            <span key={`${item.number}-${tag}`} className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${TAG_STYLES[tag]}`}>
              {tag}
            </span>
          ))}
        </div>
        <h3 className={`text-base font-bold leading-snug ${item.isCase ? 'text-warning-100' : 'app-text-primary'}`}>
          {item.prompt}
        </h3>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-primary-400">Resposta curta</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-100">{item.shortAnswer}</p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className={`inline-flex min-h-[40px] items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold transition ${
            item.isCase
              ? 'border-warning-500/25 bg-warning-500/10 text-warning-300 hover:bg-warning-500/15'
              : 'border-neutral-700/70 bg-neutral-900/60 text-neutral-300 hover:border-primary-500/30 hover:text-primary-300'
          }`}
        >
          {open ? 'Recolher explicação' : 'Ver explicação'}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 border-t border-neutral-700/60 pt-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-primary-400">Explicação muito fácil</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-200">{item.explanation}</p>
                </div>

                {item.memorize && (
                  <div className="rounded-2xl border border-primary-500/18 bg-primary-500/8 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-primary-300">Como decorar</p>
                    <p className="mt-2 text-sm leading-relaxed text-primary-100/90">{item.memorize}</p>
                  </div>
                )}

                {item.attention && (
                  <div className="rounded-2xl border border-warning-500/20 bg-warning-500/8 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-warning-300">Atenção</p>
                    <p className="mt-2 text-sm leading-relaxed text-warning-100/90">{item.attention}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Q27Diagram() {
  return (
    <div className="app-panel overflow-hidden rounded-3xl border border-neutral-700/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Image size={16} className="text-primary-400" />
        <p className="text-sm font-bold text-white">Imagem anatômica real para revisão da Q27</p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-neutral-700/60 bg-neutral-950/40 p-3">
        <img
          src={reproQ27Image}
          alt="Imagem anatômica da questão 27 com vaca, porca, égua e cadela"
          className="w-full rounded-2xl object-contain"
        />
      </div>
      <p className="app-text-muted mt-3 text-xs leading-relaxed">
        Legenda conferida pela imagem: BOETA et al., 2018.
      </p>
    </div>
  )
}

function AnatomyLegendTable({ rows }: { rows: AnatomyLegendRow[] }) {
  const headers = ['Número', 'Estrutura', 'Função simples', 'Como reconhecer']
  const normalizedRows = rows.map(row => ({
    cells: [String(row.number), row.structure, row.function, row.recognition],
  }))

  return <ResponsiveSummaryTable headers={headers} rows={normalizedRows} />
}

function RevisaoDirigidaContent() {
  const [overviewOpen, setOverviewOpen] = useState({
    oral: false,
    pitfalls: false,
    plan: false,
  })
  const [openQuestions, setOpenQuestions] = useState<Record<number, boolean>>({})
  const [priorityBusOpen, setPriorityBusOpen] = useState(false)
  const [priorityPanelOpen, setPriorityPanelOpen] = useState(false)
  const [priorityUnlocked, setPriorityUnlocked] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(PRIORITY_UNLOCK_STORAGE_KEY) === 'true'
  })
  const [priorityPassword, setPriorityPassword] = useState('')
  const [priorityError, setPriorityError] = useState('')

  const questionGroups = useMemo(() => {
    const firstBlock = reviewQuestions.filter(item => item.number <= 13)
    const secondBlock = reviewQuestions.filter(item => item.number >= 14)
    return [firstBlock, secondBlock]
  }, [])

  const toggleQuestion = (questionNumber: number) => {
    setOpenQuestions(current => ({
      ...current,
      [questionNumber]: !current[questionNumber],
    }))
  }

  const handlePriorityUnlock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (priorityPassword.trim() === PRIORITY_PASSWORD) {
      setPriorityUnlocked(true)
      setPriorityError('')
      setPriorityPassword('')
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PRIORITY_UNLOCK_STORAGE_KEY, 'true')
      }
      return
    }

    setPriorityError('Senha incorreta.')
  }

  const handlePriorityLock = () => {
    setPriorityUnlocked(false)
    setPriorityPassword('')
    setPriorityError('')
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(PRIORITY_UNLOCK_STORAGE_KEY)
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="app-panel relative mb-6 overflow-hidden rounded-[2rem] px-5 py-5 md:px-7 md:py-6">
        <VetHeroPattern variant="hero" className="absolute inset-y-0 right-0 w-52 opacity-85" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-3">
            <BookOpen size={24} className="text-primary-400" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary-400">
                UC Reprodução Animal e Biotecnologias
              </p>
              <h1 className="app-text-primary text-2xl font-bold md:text-3xl">{reviewPageMeta.title}</h1>
            </div>
          </div>
          <p className="app-text-secondary max-w-3xl text-sm md:text-base">{reviewPageMeta.subtitle}</p>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {SECTION_ITEMS.map(section => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollToSection(section.id)}
            className="rounded-full border border-neutral-700/70 bg-neutral-900/60 px-3 py-2 text-xs font-bold text-neutral-300 transition hover:border-primary-500/30 hover:text-primary-300"
          >
            {section.label}
          </button>
        ))}
      </div>

      <section id="visao-geral" className="mb-12 scroll-mt-24">
        <SectionHeader
          eyebrow="Visão Geral"
          title="Resumo de prova para bater o olho"
          subtitle="Comece pelo bloco de alta prioridade e depois use as listas rápidas para revisar antes da prova."
        />

        <div className="mb-5 flex items-center justify-start">
          <button
            type="button"
            onClick={() => setPriorityPanelOpen(current => !current)}
            className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-neutral-700/70 bg-neutral-900/50 px-3 py-1.5 text-xs font-semibold text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-200"
          >
            <Lock size={13} />
            {priorityReviewMeta.triggerLabel}
            {priorityPanelOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {priorityPanelOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="mb-6 rounded-[1.75rem] border border-neutral-700/70 bg-neutral-950/45 p-4 sm:p-5">
                {!priorityUnlocked ? (
                  <div className="max-w-xl">
                    <div className="mb-4">
                      <p className="text-sm font-bold text-white">Área bloqueada</p>
                      <p className="app-text-secondary mt-1 text-sm leading-relaxed">
                        Digite a senha para abrir a revisão mínima de alta prioridade.
                      </p>
                    </div>

                    <form onSubmit={handlePriorityUnlock} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        type="password"
                        value={priorityPassword}
                        onChange={event => {
                          setPriorityPassword(event.target.value)
                          if (priorityError) setPriorityError('')
                        }}
                        placeholder="Senha"
                        className="app-text-primary w-full rounded-2xl border border-neutral-700/70 bg-neutral-900/70 px-4 py-3 text-sm outline-none transition placeholder:text-neutral-500 focus:border-primary-500/35"
                      />
                      <button
                        type="submit"
                        className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-primary-500/25 bg-primary-500/10 px-4 py-3 text-sm font-semibold text-primary-200 transition hover:bg-primary-500/15"
                      >
                        Desbloquear
                      </button>
                    </form>

                    {priorityError && (
                      <p className="mt-3 text-sm font-medium text-warning-300">{priorityError}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-lg font-bold text-white">{priorityReviewMeta.title}</p>
                        <p className="app-text-secondary mt-1 text-sm leading-relaxed">
                          {priorityReviewMeta.subtitle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handlePriorityLock}
                        className="inline-flex min-h-[36px] items-center justify-center rounded-full border border-neutral-700/70 bg-neutral-900/60 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:border-warning-500/25 hover:text-warning-200"
                      >
                        Bloquear novamente
                      </button>
                    </div>

                    <div className="rounded-2xl border border-primary-500/18 bg-primary-500/8 px-4 py-3">
                      <p className="text-sm leading-relaxed text-primary-100/95">{priorityReviewMeta.info}</p>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                      <div className="space-y-4">
                        {priorityReviewCards.map(card => (
                          <div
                            key={card.id}
                            className="rounded-[1.5rem] border border-neutral-700/70 bg-neutral-900/55 p-4"
                          >
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-white">{card.title}</p>
                              <span className="rounded-full border border-primary-500/20 bg-primary-500/10 px-2.5 py-1 text-[10px] font-bold text-primary-300">
                                {card.status}
                              </span>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <p className="text-[11px] font-black uppercase tracking-wider text-primary-400">
                                  Resposta mínima
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-neutral-100">{card.answer}</p>
                              </div>

                              <div className="rounded-2xl border border-neutral-700/60 bg-neutral-950/45 px-4 py-3">
                                <p className="text-[11px] font-black uppercase tracking-wider text-primary-400">
                                  Must remember
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {card.mustRemember.map(item => (
                                    <span
                                      key={`${card.id}-${item}`}
                                      className="rounded-full border border-neutral-700/70 bg-neutral-900/70 px-2.5 py-1 text-xs text-neutral-200"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-warning-500/15 bg-warning-500/8 px-4 py-3">
                                <p className="text-[11px] font-black uppercase tracking-wider text-warning-300">
                                  Risco de prova
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-warning-50">{card.risk}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[1.5rem] border border-neutral-700/70 bg-neutral-900/55 p-4">
                          <p className="text-sm font-bold text-white">Lista de prioridade de estudo</p>
                          <div className="mt-3 space-y-2">
                            {priorityStudyOrder.map(item => (
                              <div
                                key={item}
                                className="rounded-2xl border border-neutral-700/60 bg-neutral-950/45 px-4 py-3"
                              >
                                <p className="text-sm leading-relaxed text-neutral-200">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-neutral-700/70 bg-neutral-900/55 p-4">
                          <p className="text-sm font-bold text-white">Ultra-resumo — 1 frase por questão</p>
                          <div className="mt-3 space-y-2">
                            {priorityUltraSummary.map(item => (
                              <div
                                key={item}
                                className="rounded-2xl border border-primary-500/15 bg-primary-500/8 px-4 py-3"
                              >
                                <p className="text-sm leading-relaxed text-primary-100/95">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <CollapsibleCard
                          title="Resumo para revisar no ônibus"
                          subtitle="Bloco compacto de última hora, focado em leitura rápida."
                          open={priorityBusOpen}
                          onToggle={() => setPriorityBusOpen(current => !current)}
                        >
                          <div className="space-y-4">
                            <div className="rounded-2xl border border-primary-500/18 bg-primary-500/8 px-4 py-3">
                              <p className="text-sm font-bold text-white">{priorityQ28ReadyAnswer.title}</p>
                              <div className="mt-2 space-y-2">
                                {priorityQ28ReadyAnswer.points.map(item => (
                                  <p key={item} className="text-sm leading-relaxed text-primary-100/95">{item}</p>
                                ))}
                              </div>
                              <p className="mt-3 text-xs font-semibold text-primary-200">
                                {priorityQ28ReadyAnswer.memorize}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-neutral-700/60 bg-neutral-900/55 px-4 py-3">
                              <p className="text-sm font-bold text-white">Resumo para revisar no ônibus</p>
                              <div className="mt-2 grid gap-2">
                                {priorityBusReviewList.map(item => (
                                  <p key={item} className="text-sm leading-relaxed text-neutral-200">{item}</p>
                                ))}
                              </div>
                              <p className="mt-3 text-xs font-semibold text-warning-200">
                                {priorityBusReviewFinalLine}
                              </p>
                            </div>
                          </div>
                        </CollapsibleCard>

                        <div className="rounded-[1.5rem] border border-warning-500/18 bg-warning-500/8 px-4 py-3">
                          <p className="text-sm font-semibold text-warning-50">{priorityReviewMeta.finalReminder}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-primary-500/20 bg-gradient-to-br from-primary-500/14 to-neutral-900/80 p-5">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-primary-300" />
              <p className="text-base font-bold text-white">Se eu não souber nada, decore isso</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickReviewMustKnow.map(item => (
                <div key={item} className="rounded-2xl border border-primary-500/15 bg-primary-500/8 px-4 py-3">
                  <p className="text-sm leading-relaxed text-primary-100/95">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <CollapsibleCard
              title="15 perguntas orais rápidas"
              subtitle="Treino curto para revisar conceitos sem abrir cada questão comentada."
              open={overviewOpen.oral}
              onToggle={() => setOverviewOpen(current => ({ ...current, oral: !current.oral }))}
            >
              <div className="space-y-3">
                {oralQuestions.map(item => (
                  <div key={item.id} className="rounded-2xl border border-neutral-700/60 bg-neutral-900/50 px-4 py-3">
                    <p className="text-sm font-semibold text-white">{item.prompt}</p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-300">{item.answer}</p>
                  </div>
                ))}
              </div>
            </CollapsibleCard>

            <CollapsibleCard
              title="10 pegadinhas prováveis"
              subtitle="Use este bloco para revisar erros clássicos antes da prova."
              tone="warning"
              open={overviewOpen.pitfalls}
              onToggle={() => setOverviewOpen(current => ({ ...current, pitfalls: !current.pitfalls }))}
            >
              <div className="space-y-3">
                {pitfalls.map(item => (
                  <div key={item} className="rounded-2xl border border-warning-500/15 bg-warning-500/8 px-4 py-3">
                    <p className="text-sm leading-relaxed text-warning-50">{item}</p>
                  </div>
                ))}
              </div>
            </CollapsibleCard>

            <CollapsibleCard
              title="Plano de revisão de 40 minutos"
              subtitle="Um roteiro curto para revisar o essencial antes de dormir."
              open={overviewOpen.plan}
              onToggle={() => setOverviewOpen(current => ({ ...current, plan: !current.plan }))}
            >
              <div className="space-y-3">
                {reviewPlan.map(step => (
                  <div key={step} className="rounded-2xl border border-neutral-700/60 bg-neutral-900/50 px-4 py-3">
                    <p className="text-sm leading-relaxed text-neutral-200">{step}</p>
                  </div>
                ))}
              </div>
            </CollapsibleCard>
          </div>
        </div>

        <div className="mt-6 app-panel rounded-[2rem] p-5">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-primary-400" />
            <p className="text-base font-bold text-white">25 pontos mais importantes</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {top25Points.map(item => (
              <div key={item} className="rounded-2xl border border-neutral-700/60 bg-neutral-900/50 px-4 py-3">
                <p className="text-sm leading-relaxed text-neutral-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tabelas-resumo" className="mb-12 scroll-mt-24">
        <SectionHeader
          eyebrow="Tabelas-Resumo"
          title="Hormônios e fases do ciclo em formato de revisão"
          subtitle="No desktop, as tabelas ficam completas. No celular, cada linha vira um card para leitura rápida."
        />

        <div className="space-y-6">
          <div className="app-panel rounded-[2rem] p-5">
            <h3 className="mb-4 text-lg font-bold text-white">{hormoneTable.title}</h3>
            <ResponsiveSummaryTable headers={hormoneTable.headers} rows={hormoneTable.rows} />
          </div>

          <div className="app-panel rounded-[2rem] p-5">
            <h3 className="mb-4 text-lg font-bold text-white">{cycleTable.title}</h3>
            <ResponsiveSummaryTable headers={cycleTable.headers} rows={cycleTable.rows} />
          </div>
        </div>
      </section>

      <section id="questoes-1-26" className="mb-12 scroll-mt-24">
        <SectionHeader
          eyebrow="Questões 1-26"
          title="Gabarito comentado em cards"
          subtitle="Cada questão mostra a resposta curta primeiro. Abra a explicação, o macete e a atenção quando quiser aprofundar."
        />

        <div className="grid gap-5 xl:grid-cols-2">
          {questionGroups.map((group, groupIndex) => (
            <div key={`group-${groupIndex}`} className="space-y-4">
              {group.map(item => (
                <QuestionCard
                  key={item.number}
                  item={item}
                  open={Boolean(openQuestions[item.number])}
                  onToggle={() => toggleQuestion(item.number)}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section id="questao-27" className="mb-12 scroll-mt-24">
        <SectionHeader
          eyebrow="Questão 27"
          title="Imagem anatômica com legenda confirmada"
          subtitle="Esta seção usa a legenda confirmada para revisão direta da identificação anatômica."
        />

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Q27Diagram />

          <div className="space-y-5">
            <div className="app-panel rounded-[2rem] p-5">
              <p className="mb-3 text-base font-bold text-white">Legenda conferida</p>
              <div className="space-y-2">
                {q27Legend.map(item => (
                  <div key={item.number} className="rounded-2xl border border-neutral-700/60 bg-neutral-900/50 px-4 py-3">
                    <p className="text-sm font-bold text-white">
                      {item.number}. {item.structure}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-300">{item.function}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-primary-500/20 bg-gradient-to-br from-primary-500/14 to-neutral-900/80 p-5">
              <p className="text-base font-bold text-white">Macete para decorar</p>
              <p className="mt-2 text-sm leading-relaxed text-primary-100/95">{q27Macete}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 app-panel rounded-[2rem] p-5">
          <p className="mb-4 text-lg font-bold text-white">Tabela de resposta estruturada</p>
          <AnatomyLegendTable rows={q27Legend} />
        </div>
      </section>

      <section id="questao-28" className="scroll-mt-24">
        <SectionHeader
          eyebrow="Questão 28"
          title="Aplicação por espécie: bovinos"
          subtitle="Organizado em blocos curtos para revisar rapidamente importância econômica, biotecnologias e identificação de cio."
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="app-panel rounded-[2rem] p-5">
            <p className="text-base font-bold text-white">Importância da reprodução</p>
            <div className="mt-3 space-y-3">
              {q28Bovinos.importance.map(item => (
                <div key={item} className="rounded-2xl border border-neutral-700/60 bg-neutral-900/50 px-4 py-3">
                  <p className="text-sm leading-relaxed text-neutral-200">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="app-panel rounded-[2rem] p-5">
            <p className="text-base font-bold text-white">Biotecnologias utilizadas</p>
            <div className="mt-3 space-y-3">
              {q28Bovinos.biotechnologies.map(item => (
                <div key={item.title} className="rounded-2xl border border-neutral-700/60 bg-neutral-900/50 px-4 py-3">
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-300">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="app-panel rounded-[2rem] p-5">
            <p className="text-base font-bold text-white">Particularidades para identificação de cio</p>
            <div className="mt-3 space-y-3">
              {q28Bovinos.estrusDetection.map(item => (
                <div key={item} className="rounded-2xl border border-neutral-700/60 bg-neutral-900/50 px-4 py-3">
                  <p className="text-sm leading-relaxed text-neutral-200">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-primary-500/20 bg-gradient-to-br from-primary-500/14 to-neutral-900/80 p-5">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-primary-300" />
              <p className="text-base font-bold text-white">Resumo rápido</p>
            </div>
            <div className="space-y-3">
              {q28Bovinos.quickSummary.map(item => (
                <div key={item} className="rounded-2xl border border-primary-500/15 bg-primary-500/8 px-4 py-3">
                  <p className="text-sm leading-relaxed text-primary-100/95">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] border border-warning-500/20 bg-warning-500/8 px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 flex-shrink-0 text-warning-300" />
            <p className="text-sm leading-relaxed text-warning-50">
              Revisão direcionada para prova: use os blocos de cima para memorização rápida e depois volte às questões comentadas quando quiser reforçar o raciocínio.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function RevisaoDirigidaPage() {
  return (
    <Gatekeeper pageTitle={reviewPageMeta.title}>
      <RevisaoDirigidaContent />
    </Gatekeeper>
  )
}

