import { Fragment, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, BookOpen, Stethoscope, Microscope, Pill,
  ShieldAlert, TrendingUp, ChevronRight, Tag,
} from 'lucide-react'
import db from '../data/central_db.json'

type Disease = typeof db.diseases[0]

const SECTION_ICONS: Record<string, React.ElementType> = {
  'Etiologia':    Microscope,
  'Referência Anatômica': Microscope,
  'Sintomas':     Stethoscope,
  'Estruturas Anatômicas': Stethoscope,
  'Diagnóstico':  Search,
  'Avaliação Anatômica': Search,
  'Tratamento':   Pill,
  'Observações': Pill,
  'Prevenção':    ShieldAlert,
  'Aplicações': ShieldAlert,
  'Prognóstico':  TrendingUp,
}

function isAnatomyReference(disease: Disease) {
  return disease.etiology.toLowerCase().includes('referência anatômica')
}

function cleanAnatomyLabel(item: string) {
  return item.replace(/^Estrutura\s*\d+\s*[—-]\s*/i, '')
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const DRUG_REFERENCE_INDEX = db.drugs.map(drug => {
  const primaryName = drug.name.split(' â€” ')[0].trim()
  const aliases = Array.from(new Set([
    primaryName,
    primaryName.split(' / ')[0].trim(),
    primaryName.split(' ')[0].trim(),
  ])).filter(alias => alias.length >= 4)

  return { id: drug.id, name: primaryName, aliases }
})

function getTreatmentLines(disease: Disease) {
  return Array.isArray(disease.treatment) ? disease.treatment : [disease.treatment]
}

function extractReferencedDrugs(lines: string[]) {
  const content = normalizeText(lines.join(' '))
  return DRUG_REFERENCE_INDEX.filter(drug =>
    drug.aliases.some(alias => content.includes(normalizeText(alias)))
  )
}

function splitQuickAction(lines: string[]) {
  const firstLine = lines[0] ?? 'Sem conduta principal registrada.'
  const supportLines = lines.slice(1).filter(line => (
    /anti|suporte|fluido|transfus|monitor|hidr|adjuv|meloxicam|dipirona|analg/i.test(line)
  ))

  return {
    firstLine,
    supportLine: supportLines[0] ?? lines[1] ?? 'Reavaliar sinais clínicos e ajustar suporte conforme estado geral.',
    summary: `${firstLine}${lines[1] ? ` ${lines[1]}` : ''}`.slice(0, 220),
  }
}

interface DoencasPageProps {
  initialSelectedId?: string
  selectionToken?: number
  onOpenDrug?: (drugId: string) => void
}

export default function DoencasPage({ initialSelectedId, selectionToken, onOpenDrug }: DoencasPageProps = {}) {
  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState<Disease>(() => (
    db.diseases.find(disease => disease.id === initialSelectedId) ?? db.diseases[0]
  ))
  const [section,  setSection]  = useState<string | null>('Sintomas')
  const [showProtocol, setShowProtocol] = useState(false)

  useEffect(() => {
    if (!initialSelectedId) return
    const nextSelected = db.diseases.find(disease => disease.id === initialSelectedId)
    if (!nextSelected) return
    setSelected(nextSelected)
    setQuery('')
    setSection('Sintomas')
    setShowProtocol(false)
  }, [initialSelectedId, selectionToken])

  const filtered = query.trim()
    ? db.diseases.filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.tags.some(t => t.toLowerCase().includes(query.toLowerCase())) ||
        d.species.toLowerCase().includes(query.toLowerCase())
      )
    : db.diseases

  const select = (d: Disease) => { setSelected(d); setQuery(''); setSection('Sintomas'); setShowProtocol(false) }

  const anatomyReference = isAnatomyReference(selected)
  const treatmentLines = useMemo(() => getTreatmentLines(selected), [selected])
  const referencedDrugs = useMemo(() => extractReferencedDrugs(treatmentLines), [treatmentLines])
  const quickAction = useMemo(() => splitQuickAction(treatmentLines), [treatmentLines])
  const hasProtocol = useMemo(() => {
    const text = normalizeText(treatmentLines.join(' '))
    return treatmentLines.length > 1 || text.includes('protocolo') || text.includes('primeira escolha')
  }, [treatmentLines])
  const treatmentRegex = useMemo(() => {
    const aliases = referencedDrugs
      .flatMap(drug => drug.aliases.map(alias => ({ alias, id: drug.id })))
      .sort((a, b) => b.alias.length - a.alias.length)

    if (aliases.length === 0) return null

    return {
      regex: new RegExp(`(${aliases.map(item => escapeRegExp(item.alias)).join('|')})`, 'gi'),
      aliases,
    }
  }, [referencedDrugs])

  const renderWithDrugLinks = (text: string) => {
    if (!treatmentRegex) return text

    return text.split(treatmentRegex.regex).map((part, index) => {
      const matched = treatmentRegex.aliases.find(item => normalizeText(item.alias) === normalizeText(part))
      if (!matched) return <Fragment key={`${part}-${index}`}>{part}</Fragment>

      return (
        <button
          key={`${part}-${index}`}
          type="button"
          onClick={() => onOpenDrug?.(matched.id)}
          className={`inline-flex items-center rounded-full px-2 py-0.5 mx-0.5 text-[11px] font-bold border ${
            onOpenDrug
              ? 'bg-teal-500/15 border-teal-500/30 text-teal-300 hover:bg-teal-500/20'
              : 'bg-slate-700/70 border-slate-600/70 text-white'
          }`}
        >
          {part}
        </button>
      )
    })
  }
  const sections = anatomyReference
    ? [
        { label: 'Referência Anatômica', content: selected.etiology.replace(/^Referência anatômica para/i, 'Referência anatômica de') },
        { label: 'Estruturas Anatômicas', content: selected.symptoms.map(cleanAnatomyLabel) },
        { label: 'Avaliação Anatômica', content: selected.diagnosis },
        { label: 'Observações', content: selected.treatment },
        { label: 'Aplicações', content: selected.prevention },
        { label: 'Prognóstico', content: selected.prognosis },
      ]
    : [
        { label: 'Etiologia',   content: selected.etiology    },
        { label: 'Sintomas',    content: selected.symptoms    },
        { label: 'Diagnóstico', content: selected.diagnosis   },
        { label: 'Tratamento',  content: selected.treatment   },
        { label: 'Prevenção',   content: selected.prevention  },
        { label: 'Prognóstico', content: selected.prognosis   },
      ]

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={22} className="text-teal-400" />
          <h1 className="text-2xl font-bold text-white">Doenças e Patologias</h1>
        </div>
        <p className="text-slate-400 text-sm">{db.diseases.length} doenças · etiologia, diagnóstico e protocolos</p>
      </div>

      <div className="relative mb-6">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar doença, espécie ou tag... ex: bovino, zoonose, cisto"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Lista */}
        <div className="w-full lg:w-52 lg:flex-shrink-0 space-y-1.5 max-h-[36vh] lg:max-h-[70vh] overflow-y-auto pr-1">
          {filtered.map(d => {
            const active = selected.id === d.id
            return (
              <motion.button key={d.id} whileHover={{ x: active ? 0 : 3 }} onClick={() => select(d)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  active ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:border-teal-600/40 hover:text-slate-200'
                }`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base leading-none">{d.emoji}</span>
                  <p className="font-semibold truncate text-xs">{d.name}</p>
                </div>
                <p className={`text-[10px] truncate ${active ? 'text-teal-400/70' : 'text-slate-600'}`}>{d.species}</p>
              </motion.button>
            )
          })}
          {filtered.length === 0 && <p className="text-sm text-slate-500 px-2 py-3">Nenhum resultado.</p>}
        </div>

        {/* Detalhe */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="space-y-3">
              {/* Header */}
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/80">
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{selected.emoji}</span>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white leading-tight">{selected.name}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-0.5 rounded-full font-medium">{selected.species}</span>
                      <span className="text-xs bg-slate-700 text-slate-400 px-2.5 py-0.5 rounded-full">{selected.category}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selected.tags.slice(0, 5).map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 text-[10px] bg-slate-700/60 text-slate-500 px-2 py-0.5 rounded-full">
                          <Tag size={8} />{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {selected.classification && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selected.classification as string[]).map(c => (
                      <span key={c} className="text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium">{c}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabs de seção */}
              {!anatomyReference && (
                <div className="bg-slate-800 rounded-2xl p-4 border border-amber-500/20">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <h3 className="text-sm font-bold text-white">⚡ Conduta Rápida</h3>
                    <button
                      type="button"
                      onClick={() => { if (hasProtocol) setShowProtocol(open => !open) }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        hasProtocol
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/15'
                          : 'bg-slate-700/40 border-slate-700 text-slate-500 cursor-default'
                      }`}
                    >
                      Ver protocolo completo
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-900/60 border border-slate-700/70 p-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Antibiótico / Principal tratamento</p>
                      <p className="text-sm text-slate-200 leading-relaxed">{renderWithDrugLinks(quickAction.firstLine)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 border border-slate-700/70 p-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Anti-inflamatório / suporte</p>
                      <p className="text-sm text-slate-200 leading-relaxed">{renderWithDrugLinks(quickAction.supportLine)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 border border-slate-700/70 p-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ação clínica resumida</p>
                      <p className="text-sm text-slate-200 leading-relaxed">{renderWithDrugLinks(quickAction.summary)}</p>
                    </div>
                  </div>

                  {referencedDrugs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {referencedDrugs.map(drug => (
                        <button
                          key={drug.id}
                          type="button"
                          onClick={() => onOpenDrug?.(drug.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            onOpenDrug
                              ? 'bg-teal-500/15 border-teal-500/25 text-teal-300 hover:bg-teal-500/20'
                              : 'bg-slate-700/60 border-slate-600/60 text-slate-200'
                          }`}
                        >
                          {drug.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {showProtocol && hasProtocol && (
                    <div className="mt-3 rounded-xl bg-slate-900/60 border border-slate-700/70 p-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Protocolo completo</p>
                      <div className="space-y-2">
                        {treatmentLines.map((line, index) => (
                          <p key={`${line}-${index}`} className="text-sm text-slate-300 leading-relaxed">
                            <span className="text-slate-500 mr-2">{index + 1}.</span>
                            {renderWithDrugLinks(line)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-1.5 flex-wrap">
                {sections.map(({ label }) => {
                  const Icon = SECTION_ICONS[label] ?? ChevronRight
                  const active = section === label
                  return (
                    <button key={label} onClick={() => setSection(active ? null : label)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        active ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700/60 hover:text-slate-300'
                      }`}>
                      <Icon size={11} />{label}
                    </button>
                  )
                })}
              </div>

              {/* Conteúdo */}
              <AnimatePresence mode="wait">
                {section && (
                  <motion.div key={section} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                    className="bg-slate-800 rounded-2xl p-5 border border-slate-700/80">
                    <div className="flex items-center gap-2 mb-3">
                      {(() => { const Icon = SECTION_ICONS[section] ?? ChevronRight; return <Icon size={16} className="text-teal-400" /> })()}
                      <h3 className="font-semibold text-slate-200 text-sm">{section}</h3>
                    </div>
                    {(() => {
                      const sec = sections.find(s => s.label === section)
                      if (!sec) return null
                      if (Array.isArray(sec.content)) {
                        return (
                          <ul className="space-y-2">
                            {(sec.content as string[]).map((item, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-teal-500/50 flex-shrink-0" />{item}
                              </li>
                            ))}
                          </ul>
                        )
                      }
                      return <p className="text-sm text-slate-400 leading-relaxed">{sec.content as string}</p>
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
