import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ChevronRight, ClipboardList, Pill, Search, Star, Stethoscope } from 'lucide-react'
import {
  searchGlobalClinicalContent,
  type GlobalSearchResult,
  type SearchTargetPage,
} from '../utils/globalClinicalSearch'
import {
  clinicalActivityEventName,
  isClinicalFavorite,
  pushClinicalRecent,
  toggleClinicalFavorite,
  type ClinicalSavedItem,
} from '../utils/clinicalActivity'

function GroupIcon({ label }: { label: GlobalSearchResult['groupLabel'] }) {
  if (label === 'Doenças') return <Stethoscope size={13} className="text-rose-300" />
  if (label === 'Fármacos') return <Pill size={13} className="text-teal-300" />
  if (label === 'Protocolos') return <ClipboardList size={13} className="text-amber-300" />
  return <BookOpen size={13} className="text-violet-300" />
}

function ResultCard({
  result,
  onClick,
  favorite,
  onToggleFavorite,
}: {
  result: GlobalSearchResult
  onClick: (result: GlobalSearchResult) => void
  favorite: boolean
  onToggleFavorite: (result: GlobalSearchResult) => void
}) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-800/55 px-4 py-3 hover:border-teal-500/35 hover:bg-slate-800 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button onClick={() => onClick(result)} className="text-left min-w-0">
            <p className="text-sm font-bold text-white truncate">{result.title}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{result.subtitle}</p>
          </button>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/70 text-slate-300 border border-slate-600/60">
            {result.groupLabel}
          </span>
          <button
            type="button"
            onClick={() => onToggleFavorite(result)}
            aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`p-1 rounded-lg border transition-colors ${
              favorite
                ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                : 'text-slate-500 border-slate-700 hover:text-amber-300 hover:border-amber-500/20'
            }`}
          >
            <Star size={13} fill={favorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      <button onClick={() => onClick(result)} className="w-full text-left">
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">{result.summary}</p>
        <p className="text-[11px] text-teal-300 mt-2">{result.actionText}</p>
      </button>
    </div>
  )
}

function toSavedItem(result: GlobalSearchResult): Omit<ClinicalSavedItem, 'updatedAt'> {
  return {
    id: result.id,
    type: result.type === 'disease' ? 'disease' : result.type === 'drug' ? 'drug' : 'protocol',
    title: result.title,
    subtitle: result.subtitle,
    targetPage: result.targetPage,
    targetId: result.targetId,
    queryHint: result.title,
  }
}

export default function GlobalClinicalSearch({
  profileId,
  onNavigate,
}: {
  profileId: string
  onNavigate: (page: SearchTargetPage, id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [focusedResult, setFocusedResult] = useState<GlobalSearchResult | null>(null)

  useEffect(() => {
    const handleRefresh = () => setRefreshKey(value => value + 1)
    window.addEventListener('vetstudy_questions_update', handleRefresh)
    window.addEventListener('vetstudy_flashcards_update', handleRefresh)
    window.addEventListener(clinicalActivityEventName(), handleRefresh)

    const handleOpenSaved = (event: Event) => {
      const detail = (event as CustomEvent<ClinicalSavedItem>).detail
      if (!detail || detail.type !== 'protocol') return
      setQuery(detail.queryHint ?? detail.title)
    }

    window.addEventListener('vetstudy_open_saved_clinical_item', handleOpenSaved as EventListener)
    return () => {
      window.removeEventListener('vetstudy_questions_update', handleRefresh)
      window.removeEventListener('vetstudy_flashcards_update', handleRefresh)
      window.removeEventListener(clinicalActivityEventName(), handleRefresh)
      window.removeEventListener('vetstudy_open_saved_clinical_item', handleOpenSaved as EventListener)
    }
  }, [])

  const results = useMemo(
    () => searchGlobalClinicalContent(query, profileId),
    [profileId, query, refreshKey],
  )

  const groups = [
    { label: 'Doenças' as const, items: results.doencas },
    { label: 'Fármacos' as const, items: results.farmacos },
    { label: 'Protocolos' as const, items: results.protocolos },
    { label: 'Conteúdo de Estudo' as const, items: results.conteudo },
  ]

  const visibleResults = groups.reduce((total, group) => total + group.items.length, 0)
  const hasQuery = query.trim().length > 0

  const handleResultClick = (result: GlobalSearchResult) => {
    if (result.targetPage && result.targetId) {
      pushClinicalRecent(toSavedItem(result))
      setFocusedResult(null)
      onNavigate(result.targetPage, result.targetId)
      return
    }
    setFocusedResult(result)
    if (result.type === 'protocol') {
      pushClinicalRecent(toSavedItem(result))
    }
  }

  useEffect(() => {
    if (!query.trim()) {
      setFocusedResult(null)
      return
    }

    if (focusedResult && focusedResult.type === 'protocol') {
      const nextProtocol = results.protocolos.find(item => item.id === focusedResult.id)
      if (nextProtocol) setFocusedResult(nextProtocol)
      return
    }

    if (!focusedResult && results.protocolos.length === 1 && results.doencas.length === 0 && results.farmacos.length === 0) {
      setFocusedResult(results.protocolos[0])
    }
  }, [focusedResult, query, results])

  const toggleFavoriteForResult = (result: GlobalSearchResult) => {
    toggleClinicalFavorite(toSavedItem(result))
  }

  return (
    <div className="space-y-3">
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Search size={15} className="text-teal-400" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Busca Clínica Global</p>
        </div>

        <div className="relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar doença, fármaco, protocolo..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-800 pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition"
          />
        </div>

        {!hasQuery && (
          <p className="text-xs text-slate-500 mt-2">
            Procure por espécie, categoria, sintomas, tratamento, dose, protocolo ou tema de estudo.
          </p>
        )}
      </div>

      {hasQuery && (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <div className="space-y-3">
            {groups.map(group => (
              group.items.length > 0 ? (
                <div key={group.label} className="bg-slate-900/55 border border-slate-800 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <GroupIcon label={group.label} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{group.label}</p>
                  </div>
                  <div className="space-y-2">
                    {group.items.map(item => (
                      <ResultCard
                        key={`${item.type}-${item.id}`}
                        result={item}
                        onClick={handleResultClick}
                        favorite={isClinicalFavorite(item.type === 'disease' ? 'disease' : item.type === 'drug' ? 'drug' : 'protocol', item.id)}
                        onToggleFavorite={toggleFavoriteForResult}
                      />
                    ))}
                  </div>
                </div>
              ) : null
            ))}

            {visibleResults === 0 && (
              <div className="bg-slate-900/55 border border-slate-800 rounded-2xl p-4">
                <p className="text-sm text-slate-400">Nenhum resultado encontrado para essa busca.</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900/55 border border-slate-800 rounded-2xl p-4 h-fit">
            {focusedResult ? (
              <>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <GroupIcon label={focusedResult.groupLabel} />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{focusedResult.groupLabel}</p>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">{focusedResult.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{focusedResult.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFavoriteForResult(focusedResult)}
                    className={`p-2 rounded-xl border transition-colors ${
                      isClinicalFavorite(focusedResult.type === 'disease' ? 'disease' : focusedResult.type === 'drug' ? 'drug' : 'protocol', focusedResult.id)
                        ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                        : 'text-slate-500 border-slate-700 hover:text-amber-300 hover:border-amber-500/20'
                    }`}
                  >
                    <Star size={14} fill={isClinicalFavorite(focusedResult.type === 'disease' ? 'disease' : focusedResult.type === 'drug' ? 'drug' : 'protocol', focusedResult.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{focusedResult.summary}</p>
                <div className="mt-3 space-y-2">
                  {focusedResult.details.map(detail => (
                    <p key={detail} className="text-xs text-slate-400 leading-relaxed">
                      {detail}
                    </p>
                  ))}
                </div>
                {(focusedResult.targetPage && focusedResult.targetId) && (
                  <button
                    onClick={() => onNavigate(focusedResult.targetPage!, focusedResult.targetId!)}
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-300 text-xs font-bold hover:bg-teal-500/20 transition"
                  >
                    Abrir item relacionado <ChevronRight size={13} />
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Painel rápido</p>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  Clique em um protocolo ou conteúdo de estudo para ver um resumo útil aqui. Em doenças e fármacos, o clique já abre o item na página clínica correspondente.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
