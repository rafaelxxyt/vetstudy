import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Pill, AlertCircle, ChevronDown, FlaskConical,
  Tag, Info, Calculator, Beaker, RotateCcw, Star,
} from 'lucide-react'
import db from '../data/central_db.json'
import {
  clinicalActivityEventName,
  isClinicalFavorite,
  pushClinicalRecent,
  toggleClinicalFavorite,
} from '../utils/clinicalActivity'

type Drug = typeof db.drugs[0]
type SpeciesEntry = Drug['species'][0]
type TabKey = 'sobre' | 'doses' | 'farmaco'

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'sobre',  label: 'Sobre',              icon: Info       },
  { key: 'doses',  label: 'Doses & Calculadora', icon: Calculator },
  { key: 'farmaco',label: 'Farmacologia',        icon: Beaker     },
]

/* ── Calculadora inline por espécie ── */
function SpeciesCalc({ sp }: { sp: SpeciesEntry }) {
  const [weight, setWeight] = useState('')
  const [conc,   setConc]   = useState('')
  const [result, setResult] = useState<{ total: number; vol: number | null } | null>(null)

  const open = sp.dose.startsWith('⚠️')

  // Extrai o primeiro número da dose (ex: "25 mg/kg" → 25, "0,2 mg/kg" → 0.2)
  const doseNum = (() => {
    const raw = sp.dose.replace(',', '.')
    const m = raw.match(/(\d+\.?\d*)/)
    return m ? parseFloat(m[1]) : null
  })()

  const calc = () => {
    const w = parseFloat(weight)
    const c = parseFloat(conc.replace(',', '.'))
    if (!doseNum || isNaN(w) || w <= 0) return
    const total = w * doseNum
    const vol = !isNaN(c) && c > 0 ? total / c : null
    setResult({ total, vol })
  }

  const reset = () => { setWeight(''); setConc(''); setResult(null) }

  if (open) return (
    <div className="px-5 pb-4 pt-3 border-t border-neutral-700/50">
      <div className="bg-danger-950/30 rounded-xl p-3 border border-danger-500/20 text-xs text-danger-400">
        ⚠️ Calculadora desabilitada — uso não recomendado para esta espécie.
      </div>
    </div>
  )

  return (
    <div className="px-5 pb-5 pt-3 border-t border-neutral-700/50 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
        {/* Via e Intervalo */}
        <div>
          <p className="text-[10px] text-neutral-500 font-medium mb-1 uppercase tracking-wider">Via</p>
          <p className="text-sm font-semibold text-neutral-200">{sp.route}</p>
        </div>
        <div>
          <p className="text-[10px] text-neutral-500 font-medium mb-1 uppercase tracking-wider">Intervalo</p>
          <p className="text-sm font-semibold text-neutral-200">{sp.interval}</p>
        </div>
        {/* Peso */}
        <div>
          <label className="text-[10px] text-neutral-500 font-medium mb-1 uppercase tracking-wider block">
            Peso (kg)
          </label>
          <input
            type="number" min="0" placeholder="ex: 15" value={weight}
            onChange={e => { setWeight(e.target.value); setResult(null) }}
            className="w-full px-3 py-2 bg-neutral-700/60 border border-neutral-600/60 rounded-lg text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition"
          />
        </div>
        {/* Concentração */}
        <div>
          <label className="text-[10px] text-neutral-500 font-medium mb-1 uppercase tracking-wider block">
            Conc. (mg/mL)
          </label>
          <input
            type="number" min="0" placeholder="ex: 500" value={conc}
            onChange={e => { setConc(e.target.value); setResult(null) }}
            className="w-full px-3 py-2 bg-neutral-700/60 border border-neutral-600/60 rounded-lg text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={calc}
          className="flex-1 py-2 bg-accent-500 text-white rounded-xl text-xs font-bold hover:bg-accent-600 transition-colors flex items-center justify-center gap-1.5">
          <Calculator size={12} /> Calcular Volume
        </button>
        <button onClick={reset}
          className="p-2 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50 rounded-xl transition-colors">
          <RotateCcw size={13} />
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-primary-500/10 border border-primary-500/25 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <div>
              <p className="text-[10px] text-neutral-500 mb-0.5">Dose Total</p>
              <p className="text-xl font-black text-white">
                {result.total.toFixed(1)}<span className="text-xs text-neutral-400 ml-1">mg</span>
              </p>
            </div>
            {result.vol !== null ? (
              <div>
                <p className="text-[10px] text-neutral-500 mb-0.5">Volume Final</p>
                <p className="text-xl font-black text-primary-300">
                  {result.vol.toFixed(2)}<span className="text-xs text-neutral-400 ml-1">mL</span>
                </p>
              </div>
            ) : (
              <div className="flex items-center">
                <p className="text-xs text-neutral-600">Informe a concentração para calcular o volume</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {sp.notes && (
        <div className="flex items-start gap-2 bg-warning-500/5 border border-warning-500/15 rounded-xl p-3">
          <AlertCircle size={12} className="text-warning-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-warning-300/80 leading-relaxed">{sp.notes}</p>
        </div>
      )}
    </div>
  )
}

/* ── Painel de detalhes ── */
function DrugDetail({ drug }: { drug: Drug }) {
  const [tab,      setTab]      = useState<TabKey>('sobre')
  const [expanded, setExpanded] = useState<string | null>(drug.species[0]?.name ?? null)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={drug.id}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
        className="space-y-3"
      >
        {/* Cabeçalho */}
        <div className="bg-neutral-800 rounded-2xl p-5 border border-neutral-700/80">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-primary-500/15 flex items-center justify-center flex-shrink-0">
              <Pill size={20} className="text-primary-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white leading-tight">{drug.name}</h2>
              <span className="text-xs bg-primary-500/10 text-primary-400 border border-primary-500/20 px-2.5 py-0.5 rounded-full font-medium mt-1 inline-block">
                {drug.category}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {drug.tags.map(t => (
              <span key={t} className="inline-flex items-center gap-1 text-[10px] bg-neutral-700/60 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700/40">
                <Tag size={8} />{t}
              </span>
            ))}
          </div>
        </div>

        {/* Abas */}
        <div className="flex flex-wrap gap-1.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                tab === key
                  ? 'bg-primary-500/20 text-primary-300 border-primary-500/30'
                  : 'bg-neutral-800 text-neutral-500 border-neutral-700/60 hover:text-neutral-300 hover:border-neutral-600'
              }`}
            >
              <Icon size={12} />{label}
            </button>
          ))}
        </div>

        {/* ── Aba: Sobre ── */}
        {tab === 'sobre' && (
          <motion.div key="sobre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
            className="bg-neutral-800 rounded-2xl p-5 border border-neutral-700/80 space-y-4">
            <div>
              <p className="text-xs text-primary-400 font-bold uppercase tracking-wider mb-2">Mecanismo de Ação</p>
              <p className="text-sm text-neutral-300 leading-relaxed">{drug.mechanism}</p>
            </div>
            <div>
              <p className="text-xs text-danger-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertCircle size={11} /> Contraindicações
              </p>
              <ul className="space-y-1.5">
                {drug.contraindications.map(c => (
                  <li key={c} className="flex items-start gap-2 text-sm text-danger-300/80">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-danger-500/50 flex-shrink-0" />{c}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* ── Aba: Doses & Calculadora ── */}
        {tab === 'doses' && (
          <motion.div key="doses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
            className="space-y-2">
            <p className="text-xs text-neutral-500 px-1">
              Informe Peso e Concentração em cada espécie para calcular o volume final automaticamente.
            </p>
            {drug.species.map(sp => {
              const open   = expanded === sp.name
              const danger = sp.dose.startsWith('⚠️')
              return (
                <div key={sp.name} className="bg-neutral-800 rounded-2xl border border-neutral-700/80 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-neutral-700/40 transition-colors"
                    onClick={() => setExpanded(open ? null : sp.name)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl leading-none">{sp.emoji}</span>
                      <span className="font-semibold text-neutral-200 text-sm">{sp.name}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        danger
                          ? 'bg-danger-500/10 text-danger-400 border-danger-500/20'
                          : 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                      }`}>
                        {sp.dose}
                      </span>
                    </div>
                    <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={15} className="text-neutral-500" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <SpeciesCalc sp={sp} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* ── Aba: Farmacologia ── */}
        {tab === 'farmaco' && (
          <motion.div key="farmaco" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
            className="space-y-3">

            <div className="bg-neutral-800 rounded-2xl p-5 border border-neutral-700/80">
              <p className="text-xs text-primary-400 font-bold uppercase tracking-wider mb-2">Classe Farmacológica</p>
              <p className="text-sm text-neutral-300">{drug.category}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {drug.tags.map(t => (
                  <span key={t} className="text-[11px] bg-primary-500/10 text-primary-400 border border-primary-500/20 px-2.5 py-0.5 rounded-full font-medium">{t}</span>
                ))}
              </div>
            </div>

            <div className="bg-neutral-800 rounded-2xl p-5 border border-neutral-700/80">
              <p className="text-xs text-primary-400 font-bold uppercase tracking-wider mb-2">Mecanismo de Ação Detalhado</p>
              <p className="text-sm text-neutral-300 leading-relaxed">{drug.mechanism}</p>
            </div>

            <div className="bg-danger-950/30 rounded-2xl p-5 border border-danger-500/20">
              <p className="text-xs text-danger-400 font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <AlertCircle size={11} /> Contraindicações e Precauções
              </p>
              <ul className="space-y-2">
                {drug.contraindications.map(c => (
                  <li key={c} className="flex items-start gap-2 text-sm text-danger-300/80">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-danger-500/50 flex-shrink-0" />{c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-neutral-800/50 rounded-2xl p-4 border border-neutral-700/50">
              <p className="text-xs text-neutral-500 leading-relaxed">
                <span className="text-neutral-400 font-semibold">Referências: </span>
                Plumb's Veterinary Drug Handbook (10ª ed.) · Merck Veterinary Manual · Vetsmart Clinical Database
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/* ── Página principal ── */
interface MedicamentosPageProps {
  initialSelectedId?: string
  initialQuery?: string
  selectionToken?: number
}

export default function MedicamentosPage({ initialSelectedId, initialQuery, selectionToken }: MedicamentosPageProps = {}) {
  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState<Drug>(() => (
    db.drugs.find(drug => drug.id === initialSelectedId) ?? db.drugs[0]
  ))
  const [, setFavoriteRefreshKey] = useState(0)

  useEffect(() => {
    if (initialSelectedId) {
      const nextSelected = db.drugs.find(drug => drug.id === initialSelectedId)
      if (nextSelected) setSelected(nextSelected)
    }
    setQuery(initialQuery ?? '')
  }, [initialQuery, initialSelectedId, selectionToken])

  useEffect(() => {
    const handleRefresh = () => setFavoriteRefreshKey(value => value + 1)
    window.addEventListener(clinicalActivityEventName(), handleRefresh)
    return () => window.removeEventListener(clinicalActivityEventName(), handleRefresh)
  }, [])

  useEffect(() => {
    pushClinicalRecent({
      id: selected.id,
      type: 'drug',
      title: selected.name,
      subtitle: selected.category,
      targetPage: 'medicamentos',
      targetId: selected.id,
    })
  }, [selected.id])

  const toggleFavorite = (drug: Drug) => {
    toggleClinicalFavorite({
      id: drug.id,
      type: 'drug',
      title: drug.name,
      subtitle: drug.category,
      targetPage: 'medicamentos',
      targetId: drug.id,
    })
    setFavoriteRefreshKey(value => value + 1)
  }

  const filtered = query.trim()
    ? db.drugs.filter(d => {
        const terms = normalizeText(query).split(/\s+/).filter(Boolean)
        const haystack = normalizeText(`${d.name} ${d.category} ${d.tags.join(' ')}`)
        return terms.some(term => haystack.includes(term))
      })
    : db.drugs

  const select = (drug: Drug) => {
    setSelected(drug)
    setQuery('')
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical size={22} className="text-primary-400" />
          <h1 className="text-2xl font-bold text-white">Bulário Inteligente</h1>
        </div>
        <p className="text-neutral-400 text-sm">
          {db.drugs.length} fármacos · calculadora integrada por espécie · Plumb's + Merck
        </p>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar fármaco, classe ou tag... ex: AINE, GnRH, antibiótico"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-2xl text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Lista lateral */}
        <div className="w-full lg:w-52 lg:flex-shrink-0 space-y-1 max-h-[36vh] lg:max-h-[75vh] overflow-y-auto pr-1 custom-scroll">
          {filtered.map(drug => {
            const active = selected.id === drug.id
            const favorite = isClinicalFavorite('drug', drug.id)
            return (
              <motion.button
                key={drug.id}
                whileHover={{ x: active ? 0 : 3 }}
                onClick={() => select(drug)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  active
                    ? 'bg-primary-500/20 text-primary-300 border-primary-500/40 shadow-sm'
                    : 'bg-neutral-800/60 text-neutral-400 border-neutral-700/60 hover:border-primary-600/40 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <p className="font-semibold truncate flex-1">{drug.name}</p>
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); toggleFavorite(drug) }}
                    className={`p-1 rounded-lg border ${
                      favorite
                        ? 'text-warning-300 border-warning-500/30 bg-warning-500/10'
                        : 'text-neutral-600 border-transparent hover:text-warning-300'
                    }`}
                  >
                    <Star size={12} fill={favorite ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <p className={`text-xs mt-0.5 truncate ${active ? 'text-primary-400/70' : 'text-neutral-600'}`}>
                  {drug.category}
                </p>
              </motion.button>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-neutral-500 px-2 py-3">Nenhum resultado.</p>
          )}
        </div>

        {/* Painel de detalhe */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => toggleFavorite(selected)}
              className={`p-2 rounded-xl border ${
                isClinicalFavorite('drug', selected.id)
                  ? 'text-warning-300 border-warning-500/30 bg-warning-500/10'
                  : 'text-neutral-500 border-neutral-700 hover:text-warning-300 hover:border-warning-500/20'
              }`}
            >
              <Star size={14} fill={isClinicalFavorite('drug', selected.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
          <DrugDetail drug={selected} />
        </div>
      </div>
    </div>
  )
}
