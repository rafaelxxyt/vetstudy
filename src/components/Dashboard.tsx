import { motion } from 'framer-motion'
import { CalendarDays, BookMarked, TrendingUp, CheckCircle2, Target, Lightbulb } from 'lucide-react'

const PROVAS = [
  { subject: 'Reprodução Animal (A1)',   date: '28/04', days: 13, color: 'bg-danger-500/10 text-danger-400 border border-danger-500/20'    },
  { subject: 'Clínica de Ruminantes',    date: '05/05', days: 20, color: 'bg-warning-500/10 text-warning-400 border border-warning-500/20' },
  { subject: 'Diagnóstico por Imagem',   date: '12/05', days: 27, color: 'bg-success-500/10 text-success-400 border border-success-500/20' },
]

const STATS = [
  { label: 'Matérias Ativas',  value: '5',  icon: BookMarked,   bg: 'bg-primary-500/10',   fg: 'text-primary-400'   },
  { label: 'Questões Hoje',    value: '24', icon: TrendingUp,   bg: 'bg-primary-500/10', fg: 'text-primary-400' },
  { label: 'Dias Seguidos',    value: '7',  icon: CalendarDays, bg: 'bg-warning-500/10',  fg: 'text-warning-400'  },
]

const DICAS = [
  'O folículo dominante produz estrogênio → desencadeia o cio.',
  'PGF2α causa luteólise — usada no D7 do protocolo Ovsynch.',
  'Cérvix da vaca: anéis simples. Porca: espiral. Égua: roseta.',
  'Ciclo estral bovino ≈ 21 dias. Suíno ≈ 21 dias. Égua ≈ 21 dias.',
  'Poliestral estacional de dias curtos: ovelha. Dias longos: égua.',
  'Progesterona mantém gestação e inibe manifestação de cio.',
  'GnRH → pulso de LH → ovulação do folículo dominante.',
]

export default function Dashboard() {
  const dica = DICAS[new Date().getDay() % DICAS.length]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Bom estudo, futuro(a) Médico(a) Veterinário(a)! 🐾
        </h1>
        <p className="text-neutral-400 mt-1 text-sm">
          5ª Fase · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
        </p>
      </div>

      {/* Dica do Dia */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-primary-500/15 to-neutral-800 border border-primary-500/25 rounded-2xl p-5 mb-6 flex items-start gap-4"
      >
        <div className="w-9 h-9 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
          <Lightbulb size={17} className="text-primary-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-1">Conceito do Dia</p>
          <p className="text-sm text-neutral-300 leading-relaxed">{dica}</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {STATS.map(({ label, value, icon: Icon, bg, fg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.2 }}
            whileHover={{ y: -3 }}
            className="bg-neutral-800 rounded-2xl p-5 border border-neutral-700/80"
          >
            <div className={`w-10 h-10 rounded-xl ${bg} ${fg} flex items-center justify-center mb-3`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-neutral-500 mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Próximas Provas */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.18 }}
          className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700/80"
        >
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays size={17} className="text-primary-400" />
            <h2 className="font-semibold text-neutral-200">Próximas Provas</h2>
          </div>
          <div className="space-y-4">
            {PROVAS.map(({ subject, date, days, color }) => (
              <div key={subject} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-neutral-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-neutral-300 leading-tight">{subject}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{date}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${color}`}>
                  {days}d
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Foco A1 — Reprodução */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.18 }}
          className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700/80"
        >
          <div className="flex items-center gap-2 mb-5">
            <Target size={17} className="text-primary-400" />
            <h2 className="font-semibold text-neutral-200">Foco A1 — Reprodução Animal</h2>
          </div>
          <div className="space-y-3">
            {[
              { tema: 'Anatomia do trato feminino',      ok: true  },
              { tema: 'Ciclo estral e hormônios',        ok: true  },
              { tema: 'Fotoperíodo e sazonalidade',      ok: false },
              { tema: 'IATF e protocolos hormonais',     ok: false },
              { tema: 'Transferência de embriões (TE)',  ok: false },
              { tema: 'IA em suínos (técnica pipeta)',   ok: false },
            ].map(({ tema, ok }) => (
              <div key={tema} className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${ok ? 'bg-primary-500/20 border-primary-500' : 'border-neutral-600'}`}>
                  {ok && <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />}
                </div>
                <p className={`text-sm ${ok ? 'text-neutral-400 line-through' : 'text-neutral-300'}`}>{tema}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
