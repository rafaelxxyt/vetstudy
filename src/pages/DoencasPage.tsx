import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, BookOpen, Stethoscope, Microscope, Pill,
  ShieldAlert, TrendingUp, ChevronRight, Tag,
} from 'lucide-react'
import db from '../data/central_db.json'

type Disease = typeof db.diseases[0]

const SECTION_ICONS: Record<string, React.ElementType> = {
  'Etiologia':    Microscope,
  'Sintomas':     Stethoscope,
  'Diagnóstico':  Search,
  'Tratamento':   Pill,
  'Prevenção':    ShieldAlert,
  'Prognóstico':  TrendingUp,
}

export default function DoencasPage() {
  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState<Disease>(db.diseases[0])
  const [section,  setSection]  = useState<string | null>('Sintomas')

  const filtered = query.trim()
    ? db.diseases.filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.tags.some(t => t.toLowerCase().includes(query.toLowerCase())) ||
        d.species.toLowerCase().includes(query.toLowerCase())
      )
    : db.diseases

  const select = (d: Disease) => { setSelected(d); setQuery(''); setSection('Sintomas') }

  const sections = [
    { label: 'Etiologia',   content: selected.etiology    },
    { label: 'Sintomas',    content: selected.symptoms    },
    { label: 'Diagnóstico', content: selected.diagnosis   },
    { label: 'Tratamento',  content: selected.treatment   },
    { label: 'Prevenção',   content: selected.prevention  },
    { label: 'Prognóstico', content: selected.prognosis   },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
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

      <div className="flex gap-5">
        {/* Lista */}
        <div className="w-52 flex-shrink-0 space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
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
