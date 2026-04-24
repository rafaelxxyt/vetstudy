import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Pill, AlertCircle, ChevronDown, FlaskConical, Tag } from 'lucide-react'
import db from '../data/central_db.json'

type Drug = typeof db.drugs[0]

export default function VademecumPage() {
  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState<Drug>(db.drugs[0])
  const [expanded, setExpanded] = useState<string | null>(db.drugs[0].species[0]?.name ?? null)

  const filtered = query.trim()
    ? db.drugs.filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
      )
    : db.drugs

  const select = (drug: Drug) => {
    setSelected(drug)
    setQuery('')
    setExpanded(drug.species[0]?.name ?? null)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical size={22} className="text-teal-400" />
          <h1 className="text-2xl font-bold text-white">Vademecum PRO</h1>
        </div>
        <p className="text-slate-400 text-sm">
          {db.drugs.length} fármacos · doses por espécie · mecanismo e contraindicações
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar fármaco ou tag... ex: AINE, opioide, reprodução"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition"
        />
      </div>

      <div className="flex gap-5">
        {/* Drug List */}
        <div className="w-52 flex-shrink-0 space-y-1.5">
          {filtered.map(drug => {
            const active = selected.name === drug.name
            return (
              <motion.button
                key={drug.id}
                whileHover={{ x: active ? 0 : 3 }}
                onClick={() => select(drug)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  active
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:border-teal-600/40 hover:text-slate-200'
                }`}
              >
                <p className="font-semibold truncate">{drug.name}</p>
                <p className={`text-xs mt-0.5 truncate ${active ? 'text-teal-400/70' : 'text-slate-600'}`}>
                  {drug.category}
                </p>
              </motion.button>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-slate-500 px-2 py-3">Nenhum resultado.</p>
          )}
        </div>

        {/* Detail Panel */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {/* Header Card */}
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/80">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center flex-shrink-0">
                    <Pill size={19} className="text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                    <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-0.5 rounded-full font-medium">
                      {selected.category}
                    </span>
                  </div>
                </div>
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selected.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">
                      <Tag size={9} />
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{selected.mechanism}</p>
              </div>

              {/* Species Accordion */}
              <div className="space-y-2">
                {selected.species.map(sp => {
                  const open   = expanded === sp.name
                  const danger = sp.dose.startsWith('⚠️')
                  return (
                    <div key={sp.name} className="bg-slate-800 rounded-2xl border border-slate-700/80 overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-700/40 transition-colors"
                        onClick={() => setExpanded(open ? null : sp.name)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl leading-none">{sp.emoji}</span>
                          <span className="font-semibold text-slate-200 text-sm">{sp.name}</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            danger
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                          }`}>
                            {sp.dose}
                          </span>
                        </div>
                        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={15} className="text-slate-500" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            key="body"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4 pt-3 border-t border-slate-700/50 grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-slate-500 font-medium mb-1">Via</p>
                                <p className="text-sm font-semibold text-slate-200">{sp.route}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 font-medium mb-1">Intervalo</p>
                                <p className="text-sm font-semibold text-slate-200">{sp.interval}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 font-medium mb-1">Observação</p>
                                <p className="text-sm text-slate-400 leading-relaxed">{sp.notes}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>

              {/* Contraindications */}
              <div className="bg-red-950/30 rounded-2xl p-4 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2.5">
                  <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                  <p className="text-sm font-semibold text-red-400">Contraindicações</p>
                </div>
                <ul className="space-y-1.5">
                  {selected.contraindications.map(c => (
                    <li key={c} className="text-sm text-red-300/80 flex items-start gap-2">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-red-500/60 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
