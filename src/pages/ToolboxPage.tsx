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
  { id: 'dose' as Tool, label: 'Calculadora de Dose', icon: Calculator, color: 'text-primary-400', activeClass: 'bg-primary-500/10 border-primary-500/25' },
  { id: 'fluido' as Tool, label: 'Fluidoterapia IV', icon: Droplets, color: 'text-primary-400', activeClass: 'bg-primary-500/10 border-primary-500/25' },
  { id: 'lab' as Tool, label: 'Valores de Referência', icon: FlaskConical, color: 'text-primary-400', activeClass: 'bg-primary-500/10 border-primary-500/25' },
]

const EQUINE_LAB = {
  label: 'Equino',
  emoji: '🐎',
  hematology: [
    { param: 'Eritrócitos', unit: 'x10⁶/µL', min: 6.5, max: 12.5 },
    { param: 'Hemoglobina', unit: 'g/dL', min: 11.0, max: 19.0 },
    { param: 'Hematócrito', unit: '%', min: 32.0, max: 53.0 },
    { param: 'Leucócitos', unit: 'x10³/µL', min: 5.4, max: 14.3 },
    { param: 'Neutrófilos', unit: '%', min: 35, max: 75 },
    { param: 'Plaquetas', unit: 'x10³/µL', min: 100, max: 350 },
  ],
  biochemistry: [
    { param: 'ALT (TGP)', unit: 'U/L', min: 3, max: 23 },
    { param: 'AST (TGO)', unit: 'U/L', min: 160, max: 412 },
    { param: 'GGT', unit: 'U/L', min: 4, max: 44 },
    { param: 'Creatinina', unit: 'mg/dL', min: 0.8, max: 2.0 },
    { param: 'Ureia', unit: 'mg/dL', min: 10, max: 24 },
    { param: 'Glicose', unit: 'mg/dL', min: 60, max: 100 },
    { param: 'Proteínas Tot.', unit: 'g/dL', min: 5.2, max: 7.9 },
    { param: 'Fibrinogênio', unit: 'mg/dL', min: 100, max: 400 },
  ],
}

const ALL_SPECIES: Record<
  string,
  {
    label: string
    emoji: string
    hematology: { param: string; unit: string; min: number; max: number }[]
    biochemistry: { param: string; unit: string; min: number; max: number }[]
  }
> = {
  dog: { ...db.labReferenceValues.dog },
  cat: { ...db.labReferenceValues.cat },
  bovine: { ...db.labReferenceValues.bovine },
  equine: EQUINE_LAB,
}

function AvisoLegal() {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-warning-500/25 bg-warning-500/10 px-4 py-3 backdrop-blur-sm">
      <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-warning-400" />
      <p className="text-xs leading-relaxed text-warning-300/80">
        <span className="font-bold text-warning-400">⚠️ Uso orientativo e acadêmico.</span>{' '}
        Imprescindível consulta à bula oficial e avaliação clínica individualizada antes de qualquer prescrição.
      </p>
    </div>
  )
}

function DoseCalc() {
  const [weight, setWeight] = useState('')
  const [dose, setDose] = useState('')
  const [conc, setConc] = useState('')
  const [result, setResult] = useState<{ total: number; vol: number | null } | null>(null)

  const calc = () => {
    const w = parseFloat(weight.replace(',', '.'))
    const d = parseFloat(dose.replace(',', '.'))
    const c = parseFloat(conc.replace(',', '.'))
    if (isNaN(w) || isNaN(d) || w <= 0 || d <= 0) return
    const total = w * d
    const vol = !isNaN(c) && c > 0 ? total / c : null
    setResult({ total, vol })
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <AvisoLegal />

      <div className="space-y-4 rounded-2xl border border-neutral-700/60 bg-neutral-800/60 p-5 backdrop-blur-md">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: 'Peso do animal', value: weight, set: setWeight, ph: 'ex: 15', unit: 'kg' },
            { label: 'Dose prescrita', value: dose, set: setDose, ph: 'ex: 25', unit: 'mg/kg' },
          ].map(field => (
            <div key={field.label}>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-400">{field.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder={field.ph}
                  value={field.value}
                  onChange={event => {
                    field.set(event.target.value)
                    setResult(null)
                  }}
                  className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900/60 px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                />
                <span className="w-12 flex-shrink-0 font-mono text-xs text-neutral-500">{field.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-400">
            Concentração do produto <span className="font-normal text-neutral-600">(opcional)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="ex: 500"
              value={conc}
              onChange={event => {
                setConc(event.target.value)
                setResult(null)
              }}
              className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900/60 px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            />
            <span className="w-12 flex-shrink-0 font-mono text-xs text-neutral-500">mg/mL</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={calc}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-600"
        >
          <Calculator size={15} /> Calcular
        </motion.button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-primary-500/25 bg-primary-500/10 p-5 backdrop-blur-md"
          >
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-primary-400">Resultado</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs text-neutral-500">Dose total</p>
                <p className="text-3xl font-black text-white">
                  {result.total.toFixed(1)}
                  <span className="ml-1.5 text-sm text-neutral-400">mg</span>
                </p>
              </div>
              {result.vol !== null ? (
                <div>
                  <p className="mb-1 text-xs text-neutral-500">Volume final</p>
                  <p className="text-3xl font-black text-primary-300">
                    {result.vol.toFixed(2)}
                    <span className="ml-1.5 text-sm text-neutral-400">mL</span>
                  </p>
                </div>
              ) : (
                <div className="flex items-center">
                  <p className="text-xs text-neutral-600">Informe a concentração para calcular o volume.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FluidCalc() {
  const [species, setSpecies] = useState<'cao' | 'gato' | 'bovino' | 'equino'>('cao')
  const [weight, setWeight] = useState('')
  const [dehydPct, setDehydPct] = useState('5')
  const [hours, setHours] = useState('24')
  const [result, setResult] = useState<{ deficit: number; manut: number; total: number; rate: number } | null>(null)

  const MANUT: Record<string, number> = { cao: 60, gato: 60, bovino: 50, equino: 60 }
  const OPTS = [
    { id: 'cao', label: 'Cão', emoji: '🐕' },
    { id: 'gato', label: 'Gato', emoji: '🐈' },
    { id: 'bovino', label: 'Bovino', emoji: '🐄' },
    { id: 'equino', label: 'Equino', emoji: '🐎' },
  ] as const

  const calc = () => {
    const w = parseFloat(weight.replace(',', '.'))
    const d = parseFloat(dehydPct)
    const h = parseFloat(hours)
    if (isNaN(w) || isNaN(d) || isNaN(h) || w <= 0) return
    const deficit = (d / 100) * w * 1000
    const manut = MANUT[species] * w
    setResult({ deficit, manut, total: deficit + manut, rate: (deficit + manut) / h })
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <AvisoLegal />

      <div className="space-y-4 rounded-2xl border border-neutral-700/60 bg-neutral-800/60 p-5 backdrop-blur-md">
        <div>
          <p className="mb-2 text-xs font-semibold text-neutral-400">Espécie</p>
          <div className="flex flex-wrap gap-2">
            {OPTS.map(option => (
              <button
                key={option.id}
                onClick={() => {
                  setSpecies(option.id)
                  setResult(null)
                }}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  species === option.id
                    ? 'border-primary-500/30 bg-primary-500/20 text-primary-300'
                    : 'border-neutral-700 bg-neutral-900/60 text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {option.emoji} {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Peso', value: weight, set: setWeight, unit: 'kg', ph: '15' },
            { label: 'Desidratação', value: dehydPct, set: setDehydPct, unit: '%', ph: '5' },
            { label: 'Janela (h)', value: hours, set: setHours, unit: 'h', ph: '24' },
          ].map(field => (
            <div key={field.label}>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-400">{field.label}</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  placeholder={field.ph}
                  value={field.value}
                  onChange={event => {
                    field.set(event.target.value)
                    setResult(null)
                  }}
                  className="min-w-0 flex-1 rounded-xl border border-neutral-700 bg-neutral-900/60 px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                />
                <span className="font-mono text-xs text-neutral-500">{field.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 rounded-xl border border-neutral-700/40 bg-neutral-900/40 p-3">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0 text-neutral-500" />
          <p className="text-xs text-neutral-500">
            Manutenção: {MANUT[species]} mL/kg/dia. Adicionar perdas contínuas (vômito, diarreia, lactação).
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={calc}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-600"
        >
          <Droplets size={15} /> Calcular plano
        </motion.button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-primary-500/25 bg-primary-500/10 p-5 backdrop-blur-md"
          >
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-primary-400">Plano de fluidos</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: 'Déficit hídrico', value: result.deficit.toFixed(0), unit: 'mL', color: 'text-white' },
                { label: 'Manutenção', value: result.manut.toFixed(0), unit: 'mL', color: 'text-white' },
                { label: 'Volume total', value: result.total.toFixed(0), unit: 'mL', color: 'text-primary-200 font-black' },
                { label: 'Taxa de infusão', value: result.rate.toFixed(1), unit: 'mL/h', color: 'text-primary-300 font-black' },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-neutral-700/60 bg-neutral-800/80 p-3">
                  <p className="mb-1 text-[10px] text-neutral-500">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>
                    {item.value}
                    <span className="ml-1 text-xs text-neutral-500">{item.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LabRef() {
  const [species, setSpecies] = useState<LabSpecies>('dog')
  const [tab, setTab] = useState<LabTab>('hematology')
  const data = ALL_SPECIES[species]

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.entries(ALL_SPECIES) as [LabSpecies, typeof EQUINE_LAB][]).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setSpecies(key)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
              species === key
                ? 'border-primary-500/30 bg-primary-500/20 text-primary-300'
                : 'border-neutral-700/60 bg-neutral-800 text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <span>{value.emoji}</span>
            {value.label}
          </button>
        ))}
      </div>

      <div className="w-fit max-w-full rounded-xl border border-neutral-700/50 bg-neutral-800/60 p-1">
        {(['hematology', 'biochemistry'] as const).map(currentTab => (
          <button
            key={currentTab}
            onClick={() => setTab(currentTab)}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              tab === currentTab ? 'bg-primary-500/20 text-primary-300' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {currentTab === 'hematology' ? '🩸 Hematologia' : '⚗️ Bioquímica'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${species}-${tab}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-x-auto"
        >
          <div className="min-w-[36rem] overflow-hidden rounded-2xl border border-neutral-700/80 bg-neutral-800/80 backdrop-blur-md">
            <div className="grid grid-cols-4 border-b border-neutral-700/60 bg-neutral-700/50 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-neutral-500">
              <span>Parâmetro</span>
              <span className="text-center">Mín.</span>
              <span className="text-center">Máx.</span>
              <span className="text-center">Unidade</span>
            </div>
            {data[tab].map((row, index) => (
              <div
                key={row.param}
                className={`grid grid-cols-4 px-5 py-3 text-sm ${index % 2 === 0 ? 'bg-neutral-800' : 'bg-neutral-800/40'} hover:bg-primary-500/5`}
              >
                <span className="font-semibold text-neutral-300">{row.param}</span>
                <span className="text-center font-mono font-bold text-primary-400">{row.min}</span>
                <span className="text-center font-mono font-bold text-primary-400">{row.max}</span>
                <span className="text-center text-xs text-neutral-500">{row.unit}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="text-center text-xs text-neutral-600">Fonte: Jain (2018) · Stockham & Scott (2019) · Thrall et al. (2022)</p>
    </div>
  )
}

export default function FerramentasPage({
  onNavigate,
}: {
  onNavigate: (page: SearchTargetPage, id: string) => void
}) {
  const [active, setActive] = useState<Tool>('dose')
  const profileId = getActiveProfile()?.id

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <Wrench size={22} className="text-primary-400" />
          <h1 className="text-2xl font-bold text-white">Consulta Rápida</h1>
        </div>
        <p className="text-sm text-neutral-400">Pesquise por doença, fármaco, dose, sintoma ou protocolo.</p>
      </div>

      {profileId && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Search size={14} className="text-primary-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Busca Clínica</p>
          </div>
          <GlobalClinicalSearch profileId={profileId} onNavigate={onNavigate} />
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-3">
        {TOOLS.map(({ id, label, icon: Icon, color, activeClass }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex items-center gap-2.5 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all ${
              active === id
                ? `${activeClass} text-white shadow-lg`
                : 'border-neutral-700/60 bg-neutral-800/60 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
            }`}
          >
            <Icon size={16} className={active === id ? color : ''} />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {active === 'dose' && <DoseCalc />}
          {active === 'fluido' && <FluidCalc />}
          {active === 'lab' && <LabRef />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
