import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wrench, Calculator, Droplets, FlaskConical, AlertCircle, Search } from 'lucide-react'
import db from '../data/central_db.json'
import GlobalClinicalSearch from '../components/GlobalClinicalSearch'
import { getActiveProfile } from '../utils/profiles'
import type { SearchTargetPage } from '../utils/globalClinicalSearch'

type Tool = 'dose' | 'fluido' | 'lab'
type LabSpecies = 'dog' | 'cat' | 'bovine' | 'equine'
type LabTab = 'hematology' | 'biochemistry'

const TOOLS = [
  { id: 'dose'   as Tool, label: 'Calculadora de Dose',   icon: Calculator,  color: 'text-teal-400',   activeClass: 'bg-teal-500/10 border-teal-500/25' },
  { id: 'fluido' as Tool, label: 'Fluidoterapia IV',      icon: Droplets,    color: 'text-blue-400',   activeClass: 'bg-blue-500/10 border-blue-500/25' },
  { id: 'lab'    as Tool, label: 'Valores de Referência', icon: FlaskConical,color: 'text-purple-400', activeClass: 'bg-purple-500/10 border-purple-500/25' },
]

const EQUINE_LAB = {
  label: 'Equino', emoji: '🐎',
  hematology: [
    { param: 'Eritrócitos', unit: 'x10⁶/µL', min: 6.5,  max: 12.5 },
    { param: 'Hemoglobina', unit: 'g/dL',     min: 11.0, max: 19.0 },
    { param: 'Hematócrito', unit: '%',        min: 32.0, max: 53.0 },
    { param: 'Leucócitos',  unit: 'x10³/µL',  min: 5.4,  max: 14.3 },
    { param: 'Neutrófilos', unit: '%',        min: 35,   max: 75   },
    { param: 'Plaquetas',   unit: 'x10³/µL',  min: 100,  max: 350  },
  ],
  biochemistry: [
    { param: 'ALT (TGP)',     unit: 'U/L',   min: 3,   max: 23  },
    { param: 'AST (TGO)',     unit: 'U/L',   min: 160, max: 412 },
    { param: 'GGT',           unit: 'U/L',   min: 4,   max: 44  },
    { param: 'Creatinina',    unit: 'mg/dL', min: 0.8, max: 2.0 },
    { param: 'Ureia',         unit: 'mg/dL', min: 10,  max: 24  },
    { param: 'Glicose',       unit: 'mg/dL', min: 60,  max: 100 },
    { param: 'Proteínas Tot.',unit: 'g/dL',  min: 5.2, max: 7.9 },
    { param: 'Fibrinogênio',  unit: 'mg/dL', min: 100, max: 400 },
  ],
}

const ALL_SPECIES: Record<string, { label: string; emoji: string; hematology: { param: string; unit: string; min: number; max: number }[]; biochemistry: { param: string; unit: string; min: number; max: number }[] }> = {
  dog:    { ...db.labReferenceValues.dog },
  cat:    { ...db.labReferenceValues.cat },
  bovine: { ...db.labReferenceValues.bovine },
  equine: EQUINE_LAB,
}

/* ── Aviso Legal reutilizável ── */
const AvisoLegal = () => (
  <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-3 backdrop-blur-sm">
    <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
    <p className="text-xs text-amber-300/80 leading-relaxed">
      <span className="font-bold text-amber-400">⚠️ Uso orientativo e acadêmico.</span>{' '}
      Imprescindível consulta à bula oficial e avaliação clínica individualizada antes de qualquer prescrição.
    </p>
  </div>
)

/* ── Calculadora de Dose ── */
function DoseCalc() {
  const [weight, setWeight] = useState('')
  const [dose,   setDose]   = useState('')
  const [conc,   setConc]   = useState('')
  const [result, setResult] = useState<{ total: number; vol: number | null } | null>(null)

  const calc = () => {
    const w = parseFloat(weight.replace(',', '.'))
    const d = parseFloat(dose.replace(',', '.'))
    const c = parseFloat(conc.replace(',', '.'))
    if (isNaN(w) || isNaN(d) || w <= 0 || d <= 0) return
    const total = w * d
    const vol   = !isNaN(c) && c > 0 ? total / c : null
    setResult({ total, vol })
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <AvisoLegal />

      <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/60 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Peso do Animal', value: weight, set: setWeight, ph: 'ex: 15', unit: 'kg' },
            { label: 'Dose Prescrita', value: dose,   set: setDose,   ph: 'ex: 25', unit: 'mg/kg' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs text-slate-400 font-semibold block mb-1.5">{f.label}</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" placeholder={f.ph} value={f.value}
                  onChange={e => { f.set(e.target.value); setResult(null) }}
                  className="flex-1 px-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition"
                />
                <span className="text-xs text-slate-500 w-12 flex-shrink-0 font-mono">{f.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs text-slate-400 font-semibold block mb-1.5">
            Concentração do Produto <span className="text-slate-600 font-normal">(opcional)</span>
          </label>
          <div className="flex items-center gap-2">
            <input type="number" min="0" placeholder="ex: 500" value={conc}
              onChange={e => { setConc(e.target.value); setResult(null) }}
              className="flex-1 px-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition"
            />
            <span className="text-xs text-slate-500 w-12 flex-shrink-0 font-mono">mg/mL</span>
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={calc}
          className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-950/50 flex items-center justify-center gap-2">
          <Calculator size={15} /> Calcular
        </motion.button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-teal-500/10 backdrop-blur-md border border-teal-500/25 rounded-2xl p-5">
            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mb-3">Resultado</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Dose Total</p>
                <p className="text-3xl font-black text-white">
                  {result.total.toFixed(1)}<span className="text-sm text-slate-400 ml-1.5">mg</span>
                </p>
              </div>
              {result.vol !== null ? (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Volume Final</p>
                  <p className="text-3xl font-black text-teal-300">
                    {result.vol.toFixed(2)}<span className="text-sm text-slate-400 ml-1.5">mL</span>
                  </p>
                </div>
              ) : (
                <div className="flex items-center">
                  <p className="text-xs text-slate-600">Informe a concentração para calcular o volume</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Fluidoterapia ── */
function FluidCalc() {
  const [species,  setSpecies]  = useState<'cao' | 'gato' | 'bovino' | 'equino'>('cao')
  const [weight,   setWeight]   = useState('')
  const [dehydPct, setDehydPct] = useState('5')
  const [hours,    setHours]    = useState('24')
  const [result,   setResult]   = useState<{ deficit: number; manut: number; total: number; rate: number } | null>(null)

  const MANUT: Record<string, number> = { cao: 60, gato: 60, bovino: 50, equino: 60 }

  const calc = () => {
    const w = parseFloat(weight.replace(',', '.')); const d = parseFloat(dehydPct); const h = parseFloat(hours)
    if (isNaN(w) || isNaN(d) || isNaN(h) || w <= 0) return
    const deficit = (d / 100) * w * 1000; const manut = MANUT[species] * w
    setResult({ deficit, manut, total: deficit + manut, rate: (deficit + manut) / h })
  }

  const OPTS = [{ id: 'cao', label: 'Cão', emoji: '🐕' }, { id: 'gato', label: 'Gato', emoji: '🐈' }, { id: 'bovino', label: 'Bovino', emoji: '🐄' }, { id: 'equino', label: 'Equino', emoji: '🐎' }] as const

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <AvisoLegal />

      <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/60 p-5 space-y-4">
        <div>
          <p className="text-xs text-slate-400 font-semibold mb-2">Espécie</p>
          <div className="flex gap-2 flex-wrap">
            {OPTS.map(s => (
              <button key={s.id} onClick={() => { setSpecies(s.id); setResult(null) }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  species === s.id ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-slate-900/60 text-slate-500 border-slate-700 hover:text-slate-300'
                }`}>
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Peso', value: weight, set: setWeight, unit: 'kg', ph: '15' },
            { label: 'Desidratação', value: dehydPct, set: setDehydPct, unit: '%', ph: '5' },
            { label: 'Janela (h)', value: hours, set: setHours, unit: 'h', ph: '24' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs text-slate-400 font-semibold block mb-1.5">{f.label}</label>
              <div className="flex items-center gap-1.5">
                <input type="number" min="0" placeholder={f.ph} value={f.value}
                  onChange={e => { f.set(e.target.value); setResult(null) }}
                  className="flex-1 px-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition min-w-0"
                />
                <span className="text-xs text-slate-500 font-mono">{f.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/40 rounded-xl p-3 flex gap-2 border border-slate-700/40">
          <AlertCircle size={13} className="text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500">Manutenção: {MANUT[species]} mL/kg/dia. Adicionar perdas contínuas (vômito, diarreia, lactação).</p>
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={calc}
          className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2">
          <Droplets size={15} /> Calcular Plano
        </motion.button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-blue-500/10 backdrop-blur-md border border-blue-500/25 rounded-2xl p-5">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-3">Plano de Fluidos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Déficit Hídrico', value: result.deficit.toFixed(0), unit: 'mL',   color: 'text-white' },
                { label: 'Manutenção',      value: result.manut.toFixed(0),   unit: 'mL',   color: 'text-white' },
                { label: 'Volume Total',    value: result.total.toFixed(0),   unit: 'mL',   color: 'text-blue-200 font-black' },
                { label: 'Taxa de Infusão', value: result.rate.toFixed(1),    unit: 'mL/h', color: 'text-blue-300 font-black' },
              ].map(r => (
                <div key={r.label} className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                  <p className="text-[10px] text-slate-500 mb-1">{r.label}</p>
                  <p className={`text-xl font-bold ${r.color}`}>{r.value}<span className="text-xs text-slate-500 ml-1">{r.unit}</span></p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Valores de Referência ── */
function LabRef() {
  const [species, setSpecies] = useState<LabSpecies>('dog')
  const [tab,     setTab]     = useState<LabTab>('hematology')
  const data = ALL_SPECIES[species]

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.entries(ALL_SPECIES) as [LabSpecies, typeof EQUINE_LAB][]).map(([key, val]) => (
          <button key={key} onClick={() => setSpecies(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              species === key
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700/60 hover:text-slate-300'
            }`}>
            <span>{val.emoji}</span>{val.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50 w-fit max-w-full">
        {(['hematology', 'biochemistry'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === t ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'
            }`}>
            {t === 'hematology' ? '🩸 Hematologia' : '⚗️ Bioquímica'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`${species}-${tab}`}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-x-auto">
          <div className="min-w-[36rem] bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 overflow-hidden">
            <div className="grid grid-cols-4 px-5 py-2.5 bg-slate-700/50 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-700/60">
              <span>Parâmetro</span><span className="text-center">Mín.</span><span className="text-center">Máx.</span><span className="text-center">Unidade</span>
            </div>
            {data[tab].map((row, i) => (
              <div key={row.param} className={`grid grid-cols-4 px-5 py-3 text-sm ${i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/40'} hover:bg-teal-500/5`}>
                <span className="text-slate-300 font-semibold">{row.param}</span>
                <span className="text-center text-teal-400 font-mono font-bold">{row.min}</span>
                <span className="text-center text-teal-400 font-mono font-bold">{row.max}</span>
                <span className="text-center text-slate-500 text-xs">{row.unit}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="text-xs text-slate-600 text-center">
        Fonte: Jain (2018) · Stockham & Scott (2019) · Thrall et al. (2022)
      </p>
    </div>
  )
}

/* ── Página principal ── */
export default function FerramentasPage({
  onNavigate,
}: {
  onNavigate: (page: SearchTargetPage, id: string) => void
}) {
  const [active, setActive] = useState<Tool>('dose')
  const profileId = getActiveProfile()?.id

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Wrench size={22} className="text-teal-400" />
          <h1 className="text-2xl font-bold text-white">Central Clínica</h1>
        </div>
        <p className="text-slate-400 text-sm">Busca rápida, calculadoras e referências para consulta prática</p>
      </div>

      {profileId && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Search size={14} className="text-teal-400" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Busca Clínica</p>
          </div>
          <GlobalClinicalSearch profileId={profileId} onNavigate={onNavigate} />
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        {TOOLS.map(({ id, label, icon: Icon, color, activeClass }) => (
          <button key={id} onClick={() => setActive(id)}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all ${
              active === id
                ? `${activeClass} text-white shadow-lg`
                : 'bg-slate-800/60 border-slate-700/60 text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}>
            <Icon size={16} className={active === id ? color : ''} />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={active}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          {active === 'dose'   && <DoseCalc />}
          {active === 'fluido' && <FluidCalc />}
          {active === 'lab'    && <LabRef />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
