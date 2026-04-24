import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Pill, AlertCircle, ChevronDown, FlaskConical } from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────────────────── */
interface SpeciesInfo {
  name: string
  emoji: string
  dose: string
  route: string
  interval: string
  notes: string
}

interface Drug {
  name: string
  category: string
  mechanism: string
  contraindications: string[]
  species: SpeciesInfo[]
}

/* ─── Data ───────────────────────────────────────────────────────────── */
const DRUGS: Drug[] = [
  {
    name: 'Dipirona',
    category: 'Analgésico / Antipirético',
    mechanism:
      'Inibição da síntese de prostaglandinas a nível central (SNC) com ação espasmolítica musculotrópica direta. Não possui ação anti-inflamatória periférica relevante.',
    contraindications: [
      'Hipersensibilidade a derivados pirazolonas',
      'Gatos — risco de toxicidade hematológica grave',
      'Anemia aplásica ou agranulocitose prévia',
      'Insuficiência hepática/renal severa',
    ],
    species: [
      {
        name: 'Cão', emoji: '🐕',
        dose: '25 mg/kg', route: 'IV / IM / SC / VO', interval: 'A cada 8h',
        notes: 'Via IV: diluir em SF 0,9% e infundir lentamente (mín. 5 min) para evitar hipotensão.',
      },
      {
        name: 'Gato', emoji: '🐈',
        dose: '⚠️ Não recomendado', route: '—', interval: '—',
        notes: 'Alta sensibilidade a metabólitos. Risco de metemoglobinemia e necrose hepática.',
      },
      {
        name: 'Bovino', emoji: '🐄',
        dose: '25–50 mg/kg', route: 'IV lenta / IM', interval: 'A cada 12h',
        notes: 'Uso extra-label no Brasil. Monitorar leucograma. Carência para abate: 28 dias.',
      },
      {
        name: 'Equino', emoji: '🐎',
        dose: '20–25 mg/kg', route: 'IV lenta', interval: 'A cada 12h',
        notes: 'Risco de choque anafilático. Ter adrenalina (0,01 mg/kg IV) disponível.',
      },
      {
        name: 'Suíno', emoji: '🐖',
        dose: '20 mg/kg', route: 'IM', interval: 'A cada 12h',
        notes: 'Uso peri-operatório ou pós-parto. Evitar uso crônico.',
      },
    ],
  },
  {
    name: 'Tramadol',
    category: 'Opioide Fraco / Analgésico Central',
    mechanism:
      'Agonista parcial de receptores µ-opioides + inibição da recaptação de serotonina e norepinefrina. Analgesia multimodal com menor depressão respiratória que opioides puros.',
    contraindications: [
      'Uso concomitante com IMAO (risco de síndrome serotoninérgica)',
      'Epilepsia não controlada (abaixa limiar convulsivo)',
      'Hipersensibilidade a opioides',
      'Insuficiência hepática grave',
    ],
    species: [
      {
        name: 'Cão', emoji: '🐕',
        dose: '2–5 mg/kg', route: 'VO / SC / IV', interval: 'A cada 8–12h',
        notes: 'Via IV: infusão lenta (>10 min). Boa biodisponibilidade VO (~65%).',
      },
      {
        name: 'Gato', emoji: '🐈',
        dose: '1–2 mg/kg', route: 'VO / SC', interval: 'A cada 12h',
        notes: 'Metabolismo hepático mais lento. Usar formulação palatável; comprimidos podem causar sialorréia.',
      },
      {
        name: 'Equino', emoji: '🐎',
        dose: '1–2 mg/kg', route: 'IV (infusão CRI)', interval: 'A cada 12h',
        notes: 'Monitorar excitação do SNC. Preferir CRI (taxa contínua) para estabilidade.',
      },
    ],
  },
  {
    name: 'Amoxicilina',
    category: 'Antibiótico β-Lactâmico (Aminopenicilina)',
    mechanism:
      'Inibição irreversível da transpeptidase bacteriana, impedindo síntese da parede celular. Bactericida tempo-dependente. Espectro ampliado vs. penicilina G (Gram+ e alguns Gram-).',
    contraindications: [
      'Hipersensibilidade a penicilinas ou cefalosporinas (reação cruzada ~10%)',
      'Coelhos, hamsters e porquinhos-da-índia — disbiose fatal',
      'Infecções documentadas por Pseudomonas, Klebsiella resistentes',
    ],
    species: [
      {
        name: 'Cão', emoji: '🐕',
        dose: '10–20 mg/kg', route: 'VO / SC / IM', interval: 'A cada 8–12h',
        notes: 'Associar com clavulanato (7:1) para cobertura de β-lactamases. Duração mínima: 5–7 dias.',
      },
      {
        name: 'Gato', emoji: '🐈',
        dose: '10–20 mg/kg', route: 'VO / SC', interval: 'A cada 12h',
        notes: 'Suspensão: agitar bem antes. Manter refrigerado após reconstituição.',
      },
      {
        name: 'Bovino', emoji: '🐄',
        dose: '7 mg/kg', route: 'IM / SC', interval: 'A cada 24h',
        notes: 'Carência para abate: 14 dias. Carência para leite: 60h.',
      },
      {
        name: 'Suíno', emoji: '🐖',
        dose: '15 mg/kg', route: 'IM / VO (água)', interval: 'A cada 24h',
        notes: 'Via oral na água: ajustar para consumo esperado diário.',
      },
    ],
  },
  {
    name: 'Meloxicam',
    category: 'AINE / Inibidor COX-2 Seletivo',
    mechanism:
      'Inibição preferencial da COX-2, reduzindo síntese de prostaglandinas inflamatórias. Menor gastropatia que AINEs não seletivos. Efeito analgésico, antipirético e anti-inflamatório.',
    contraindications: [
      'Insuficiência renal ou hepática',
      'Desidratação / hipovolemia (risco de IRA)',
      'Uso concomitante com corticoides ou outros AINEs',
      'Gestação (últimas 48h antes do parto)',
    ],
    species: [
      {
        name: 'Cão', emoji: '🐕',
        dose: '0,2 mg/kg (D1) → 0,1 mg/kg', route: 'SC / VO', interval: 'A cada 24h',
        notes: 'Dose de ataque no D1, manutenção a partir do D2. Uso crônico: monitorar função renal.',
      },
      {
        name: 'Gato', emoji: '🐈',
        dose: '0,3 mg/kg (dose única SC) ou 0,05 mg/kg VO', route: 'SC / VO', interval: '24h / uso curto',
        notes: 'Uso oral crônico controverso em felinos. Preferir dose única peri-operatória.',
      },
      {
        name: 'Bovino', emoji: '🐄',
        dose: '0,5 mg/kg', route: 'IV / SC', interval: 'Dose única ou A cada 24h',
        notes: 'Indicado em pneumonias e mastite. Carência: 15 dias (abate), 5 dias (leite).',
      },
      {
        name: 'Equino', emoji: '🐎',
        dose: '0,6 mg/kg', route: 'IV / VO', interval: 'A cada 24h',
        notes: 'Alternativa ao flunixin. Menor risco de úlcera gástrica equina.',
      },
    ],
  },
]

/* ─── Component ──────────────────────────────────────────────────────── */
export default function Vademecum() {
  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState<Drug>(DRUGS[0])
  const [expanded, setExpanded] = useState<string | null>('Cão')

  const filtered = query.trim()
    ? DRUGS.filter(d => d.name.toLowerCase().includes(query.toLowerCase()))
    : DRUGS

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
          <FlaskConical size={22} className="text-teal-600" />
          <h1 className="text-2xl font-bold text-slate-800">Vademecum Veterinário</h1>
        </div>
        <p className="text-slate-400 text-sm">Doses, vias de administração e observações clínicas por espécie</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar fármaco... ex: Dipirona, Tramadol, Meloxicam"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-700 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 transition"
        />
      </div>

      <div className="flex gap-5">
        {/* Drug List */}
        <div className="w-52 flex-shrink-0 space-y-1.5">
          {filtered.map(drug => {
            const active = selected.name === drug.name
            return (
              <motion.button
                key={drug.name}
                whileHover={{ x: active ? 0 : 3 }}
                onClick={() => select(drug)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  active
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:shadow-sm'
                }`}
              >
                <p className="font-semibold truncate">{drug.name}</p>
                <p className={`text-xs mt-0.5 truncate ${active ? 'text-teal-100' : 'text-slate-400'}`}>
                  {drug.category}
                </p>
              </motion.button>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-slate-400 px-2 py-3">Nenhum resultado encontrado.</p>
          )}
        </div>

        {/* Detail Panel */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {/* Header Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <Pill size={19} className="text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{selected.name}</h2>
                    <span className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-0.5 rounded-full font-medium">
                      {selected.category}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{selected.mechanism}</p>
              </div>

              {/* Species Accordion */}
              <div className="space-y-2">
                {selected.species.map(sp => {
                  const open = expanded === sp.name
                  const danger = sp.dose.startsWith('⚠️')
                  return (
                    <div key={sp.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/80 transition-colors"
                        onClick={() => setExpanded(open ? null : sp.name)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl leading-none">{sp.emoji}</span>
                          <span className="font-semibold text-slate-700 text-sm">{sp.name}</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            danger ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-teal-50 text-teal-700 border border-teal-100'
                          }`}>
                            {sp.dose}
                          </span>
                        </div>
                        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={15} className="text-slate-400" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4 pt-3 border-t border-slate-50 grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-slate-400 font-medium mb-1">Via de Administração</p>
                                <p className="text-sm font-semibold text-slate-700">{sp.route}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 font-medium mb-1">Intervalo</p>
                                <p className="text-sm font-semibold text-slate-700">{sp.interval}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 font-medium mb-1">Observação Clínica</p>
                                <p className="text-sm text-slate-600 leading-relaxed">{sp.notes}</p>
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
              <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                <div className="flex items-center gap-2 mb-2.5">
                  <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm font-semibold text-red-700">Contraindicações</p>
                </div>
                <ul className="space-y-1.5">
                  {selected.contraindications.map(c => (
                    <li key={c} className="text-sm text-red-600 flex items-start gap-2">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
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
