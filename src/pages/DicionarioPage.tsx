import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Info, Link2, RotateCcw, Search, Tag } from 'lucide-react'
import Gatekeeper from '../components/Gatekeeper'
import VetHeroPattern from '../components/VetHeroPattern'
import rawDictionaryData from '../data/vet_dictionary.json'

type DictionaryCategory =
  | 'clinica-semiologia'
  | 'sanidade-zoonoses'
  | 'diagnostico-patologia-clinica'
  | 'farmacologia-terapeutica'
  | 'reproducao-animal'
  | 'microbiologia-imunologia'
  | 'cirurgia-anestesiologia'
  | 'patologia-oncologia'

type CategoryFilter = 'all' | DictionaryCategory

interface DictionaryTerm {
  id: string
  term: string
  category: DictionaryCategory
  shortDefinition: string
  examHint: string
  relatedTerms: string[]
  tags: string[]
  discipline?: string
  warning?: string
}

const dictionaryData = rawDictionaryData as DictionaryTerm[]

const CATEGORY_ORDER: DictionaryCategory[] = [
  'clinica-semiologia',
  'sanidade-zoonoses',
  'diagnostico-patologia-clinica',
  'farmacologia-terapeutica',
  'reproducao-animal',
  'microbiologia-imunologia',
  'cirurgia-anestesiologia',
  'patologia-oncologia',
]

const CATEGORY_META: Record<DictionaryCategory, { label: string }> = {
  'clinica-semiologia': { label: 'Clínica e Semiologia' },
  'sanidade-zoonoses': { label: 'Sanidade e Zoonoses' },
  'diagnostico-patologia-clinica': { label: 'Diagnóstico e Patologia Clínica' },
  'farmacologia-terapeutica': { label: 'Farmacologia e Terapêutica' },
  'reproducao-animal': { label: 'Reprodução Animal' },
  'microbiologia-imunologia': { label: 'Microbiologia e Imunologia' },
  'cirurgia-anestesiologia': { label: 'Cirurgia e Anestesiologia' },
  'patologia-oncologia': { label: 'Patologia e Oncologia' },
}

const ALL_TERMS = [...dictionaryData].sort((termA, termB) => (
  termA.term.localeCompare(termB.term, 'pt-BR')
))

const TERM_BY_ID = new Map(ALL_TERMS.map(term => [term.id, term]))

const CATEGORY_COUNTS = ALL_TERMS.reduce<Record<DictionaryCategory, number>>((accumulator, term) => {
  accumulator[term.category] += 1
  return accumulator
}, {
  'clinica-semiologia': 0,
  'sanidade-zoonoses': 0,
  'diagnostico-patologia-clinica': 0,
  'farmacologia-terapeutica': 0,
  'reproducao-animal': 0,
  'microbiologia-imunologia': 0,
  'cirurgia-anestesiologia': 0,
  'patologia-oncologia': 0,
})

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getSearchRank(term: DictionaryTerm, normalizedQuery: string) {
  if (!normalizedQuery) return 99

  const normalizedTerm = normalizeText(term.term)
  const relatedLabels = term.relatedTerms.map(relatedId => TERM_BY_ID.get(relatedId)?.term ?? relatedId)

  if (normalizedTerm === normalizedQuery) return 0
  if (normalizedTerm.startsWith(normalizedQuery)) return 1

  const startsWithPool = [
    ...term.tags,
    ...term.relatedTerms,
    ...relatedLabels,
  ]

  if (startsWithPool.some(value => normalizeText(value).startsWith(normalizedQuery))) return 2
  if (normalizedTerm.includes(normalizedQuery)) return 3

  const containsPool = [
    term.shortDefinition,
    term.examHint,
    ...term.tags,
    ...term.relatedTerms,
    ...relatedLabels,
  ]

  if (containsPool.some(value => normalizeText(value).includes(normalizedQuery))) return 4

  return null
}

function CategoryChip({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean
  count: number
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-xs font-bold transition-all ${
        active
          ? 'border-primary-500/35 bg-primary-500/15 text-primary-300'
          : 'border-neutral-700/70 bg-neutral-800/80 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200'
      }`}
    >
      {label} ({count})
    </button>
  )
}

function TermCard({
  active,
  term,
  onClick,
}: {
  active: boolean
  term: DictionaryTerm
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ x: active ? 0 : 3 }}
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
        active
          ? 'border-primary-500/35 bg-primary-500/15 text-primary-300'
          : 'border-neutral-700/70 bg-neutral-800/70 text-neutral-300 hover:border-primary-500/30 hover:text-neutral-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{term.term}</p>
          <p className={`mt-1 text-[11px] font-semibold ${active ? 'text-primary-400/80' : 'text-neutral-500'}`}>
            {CATEGORY_META[term.category].label}
          </p>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
          active
            ? 'border-primary-500/30 bg-primary-500/10 text-primary-300'
            : 'border-neutral-700/70 bg-neutral-900/60 text-neutral-500'
        }`}>
          {term.tags[0] ?? 'termo'}
        </span>
      </div>
      <p className={`mt-2 line-clamp-2 text-xs leading-relaxed ${active ? 'text-primary-100/90' : 'text-neutral-400'}`}>
        {term.shortDefinition}
      </p>
    </motion.button>
  )
}

function DetailPanel({
  term,
  onSelectRelated,
}: {
  term: DictionaryTerm | null
  onSelectRelated: (termId: string) => void
}) {
  if (!term) {
    return (
      <div className="app-panel rounded-3xl p-5">
        <p className="app-text-primary text-sm font-bold">Selecione um termo para ver os detalhes.</p>
        <p className="app-text-secondary mt-1 text-xs leading-relaxed">
          A definição curta, a dica de prova e os termos relacionados aparecem aqui.
        </p>
      </div>
    )
  }

  const relatedTerms = term.relatedTerms
    .map(relatedId => TERM_BY_ID.get(relatedId))
    .filter((relatedTerm): relatedTerm is DictionaryTerm => Boolean(relatedTerm))

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={term.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className="space-y-3"
      >
        <div className="app-panel rounded-3xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-primary-500/25 bg-primary-500/10 px-2.5 py-0.5 text-[10px] font-bold text-primary-400">
                  {CATEGORY_META[term.category].label}
                </span>
                {term.discipline && (
                  <span className="rounded-full border border-neutral-700/70 bg-neutral-900/60 px-2.5 py-0.5 text-[10px] font-bold text-neutral-500">
                    {term.discipline}
                  </span>
                )}
              </div>
              <h2 className="app-text-primary text-2xl font-bold leading-tight">{term.term}</h2>
            </div>
          </div>
        </div>

        <div className="app-panel rounded-3xl p-5">
          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-primary-400">Definição</p>
          <p className="app-text-secondary text-sm leading-relaxed">{term.shortDefinition}</p>
        </div>

        <div className="app-panel rounded-3xl p-5">
          <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-primary-400">Dica de Prova</p>
          <p className="app-text-secondary text-sm leading-relaxed">{term.examHint}</p>
        </div>

        <div className="app-panel rounded-3xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <Tag size={14} className="text-primary-400" />
            <p className="text-[11px] font-black uppercase tracking-widest text-primary-400">Tags</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {term.tags.map(tag => (
              <span
                key={tag}
                className="rounded-full border border-neutral-700/70 bg-neutral-900/60 px-3 py-1 text-[11px] font-semibold text-neutral-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="app-panel rounded-3xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <Link2 size={14} className="text-primary-400" />
            <p className="text-[11px] font-black uppercase tracking-widest text-primary-400">Relacionados</p>
          </div>

          {relatedTerms.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {relatedTerms.map(relatedTerm => (
                <button
                  key={relatedTerm.id}
                  type="button"
                  onClick={() => onSelectRelated(relatedTerm.id)}
                  className="rounded-full border border-primary-500/25 bg-primary-500/10 px-3 py-1 text-[11px] font-bold text-primary-300 transition hover:bg-primary-500/15"
                >
                  {relatedTerm.term}
                </button>
              ))}
            </div>
          ) : (
            <p className="app-text-secondary text-sm">Nenhum termo relacionado disponível neste starter.</p>
          )}
        </div>

        {term.warning && (
          <div className="rounded-3xl border border-warning-500/25 bg-warning-500/8 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Info size={14} className="text-warning-400" />
              <p className="text-[11px] font-black uppercase tracking-widest text-warning-400">Atenção</p>
            </div>
            <p className="text-sm leading-relaxed text-warning-200">{term.warning}</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function DicionarioContent() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(ALL_TERMS[0]?.id ?? null)

  const normalizedQuery = normalizeText(query)

  const filteredTerms = useMemo(() => {
  const categoryFilteredTerms = category === 'all'
      ? ALL_TERMS
      : ALL_TERMS.filter(term => term.category === category)

    if (!normalizedQuery) return categoryFilteredTerms

    return categoryFilteredTerms
      .filter(term => getSearchRank(term, normalizedQuery) !== null)
      .sort((termA, termB) => termA.term.localeCompare(termB.term, 'pt-BR'))
  }, [category, normalizedQuery])

  useEffect(() => {
    setSelectedId(currentSelectedId => (
      filteredTerms.some(term => term.id === currentSelectedId)
        ? currentSelectedId
        : filteredTerms[0]?.id ?? null
    ))
  }, [filteredTerms])

  const selectedTerm = filteredTerms.find(term => term.id === selectedId) ?? null

  const clearFilters = () => {
    setQuery('')
    setCategory('all')
  }

  const openRelatedTerm = (termId: string) => {
    setQuery('')
    setCategory('all')
    setSelectedId(termId)
  }

  const hasActiveFilters = query.trim().length > 0 || category !== 'all'

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="app-panel relative mb-6 overflow-hidden rounded-3xl px-5 py-4">
        <VetHeroPattern variant="corner" className="absolute inset-y-0 right-0 w-40 opacity-85" />
        <div className="relative z-10">
          <div className="mb-1 flex items-center gap-2">
            <BookOpen size={22} className="text-primary-400" />
            <h1 className="app-text-primary text-2xl font-bold">Dicionário Vet</h1>
          </div>
          <p className="app-text-secondary text-sm">Termos técnicos para revisar rápido durante os estudos</p>
          <p className="app-text-muted mt-2 max-w-3xl text-xs leading-relaxed">
            Use como apoio. Para condutas clínicas e normas oficiais, confirme com aula, professor ou fonte atualizada.
          </p>
        </div>
      </div>

      <div className="mb-5 app-panel rounded-3xl p-4">
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar termo, definição, dica, tag ou relacionado..."
            value={query}
            onChange={event => setQuery(event.target.value)}
            className="app-input w-full rounded-2xl py-3 pl-11 pr-4 text-sm"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="flex min-w-max gap-2 pb-1">
            <CategoryChip
              active={category === 'all'}
              count={ALL_TERMS.length}
              label="Todos"
              onClick={() => setCategory('all')}
            />
            {CATEGORY_ORDER.map(categoryId => (
              <CategoryChip
                key={categoryId}
                active={category === categoryId}
                count={CATEGORY_COUNTS[categoryId]}
                label={CATEGORY_META[categoryId].label}
                onClick={() => setCategory(categoryId)}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="app-text-secondary">
            <span className="font-bold text-primary-400">{filteredTerms.length}</span> termos encontrados
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-[40px] items-center gap-2 self-start rounded-xl border border-neutral-700/70 bg-neutral-800/70 px-3 py-2 font-bold text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-200"
            >
              <RotateCcw size={13} />
              Limpar busca
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <div className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
            {filteredTerms.length > 0 ? (
              filteredTerms.map(term => (
                <TermCard
                  key={term.id}
                  active={term.id === selectedId}
                  term={term}
                  onClick={() => setSelectedId(term.id)}
                />
              ))
            ) : (
              <div className="app-panel rounded-3xl p-5 text-center">
                <p className="app-text-primary text-sm font-bold">Nenhum termo encontrado.</p>
                <p className="app-text-secondary mt-1 text-xs leading-relaxed">
                  Verifique a ortografia ou tente um termo mais geral.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-primary-500/25 bg-primary-500/10 px-3 py-2 text-xs font-bold text-primary-300 transition hover:bg-primary-500/15"
                >
                  <RotateCcw size={13} />
                  Limpar busca
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 lg:sticky lg:top-4 lg:self-start">
          <DetailPanel term={selectedTerm} onSelectRelated={openRelatedTerm} />
        </div>
      </div>
    </div>
  )
}

export default function DicionarioPage() {
  return (
    <Gatekeeper pageTitle="Dicionário Vet">
      <DicionarioContent />
    </Gatekeeper>
  )
}
