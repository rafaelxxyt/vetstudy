import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, ChevronLeft, ChevronRight, RotateCcw, BookOpen } from 'lucide-react'
import Gatekeeper from '../components/Gatekeeper'
import db from '../data/central_db.json'
import { getActiveProfile } from '../utils/profiles'
import { markReviewCompleted } from '../utils/reviewHabit'

/* ════════════════════════════════════════════════════════════
   BANCO COMPLETO — 30 questões do Estudo Dirigido da Profa.
   Fernanda Brandão (UNISUL) + cards do DB clínico
   ════════════════════════════════════════════════════════════ */
const REPRO_CARDS = [

  /* ── Q1 ── Anatomia externa */
  { id: 'r01', tag: 'Anatomia — Trato Feminino',
    front: '🌸 Q1 · Trato Reprodutor Feminino\nO que cada estrutura externa ajuda a proteger ou permitir?',
    back:  'Vulva protege a entrada; vestíbulo e vagina recebem o sêmen; cérvix controla a passagem ao útero. Isso reduz infecção e permite cópula/parto.' },

  /* ── Q2 ── Vagina vs Cérvix */
  { id: 'r02', tag: 'Anatomia — Trato Feminino',
    front: '🔍 Q2 · Vagina vs Cérvix\nO que muda na função de cada uma?',
    back:  'A vagina recebe sêmen e serve de canal no parto. A cérvix abre no estro e fecha no diestro/gestação para proteger o útero.' },

  /* ── Q3 ── Cérvix comparada */
  { id: 'r03', tag: 'Anatomia — Cérvix Comparada',
    front: '🔬 Q3 · Cérvix Comparada\nPor que o formato da cérvix muda a técnica de IA?',
    back:  'Vaca tem anéis; porca tem espiral que prende a pipeta; égua tem pregas mais fáceis no estro. A técnica precisa respeitar essa anatomia.' },

  /* ── Q4 ── Camadas do útero */
  { id: 'r04', tag: 'Anatomia — Útero',
    front: '🏗️ Q4 · Camadas do Útero\nO que cada camada faz para reprodução?',
    back:  'Perimétrio reveste; miométrio contrai no parto; endométrio recebe e nutre o embrião. Juntas, protegem e sustentam a gestação.' },

  /* ── Q5 ── Ovidutos */
  { id: 'r05', tag: 'Anatomia — Ovidutos',
    front: '🔭 Q5 · Ovidutos\nO que os ovidutos fazem após a ovulação?',
    back:  'Captam e transportam o oócito; a ampola é o local comum da fecundação. Depois ajudam o embrião inicial a chegar ao útero.' },

  /* ── Q6 ── Folículo vs CL */
  { id: 'r06', tag: 'Ciclo Estral — Estruturas',
    front: '🌕 Q6 · Folículo vs Corpo Lúteo\nO que cada um faz no ciclo?',
    back:  'Folículo produz estrogênio e prepara a ovulação. Corpo lúteo vem depois e produz progesterona para preparar o útero.' },

  /* ── Q7 ── E2 vs P4 */
  { id: 'r07', tag: 'Ciclo Estral — Hormônios',
    front: '⚗️ Q7 · Estrogênio vs Progesterona\nComo cada hormônio muda o cio e o útero?',
    back:  'Estrogênio mostra cio e facilita passagem de espermatozoides. Progesterona bloqueia novo cio e prepara o útero para gestação.' },

  /* ── Q8 ── Caso clínico: muco cristalino */
  { id: 'r08', tag: 'Ciclo Estral — Caso Clínico',
    front: '🐄 Q8 · Muco claro + aceita monta\nO que isso indica e por que importa?',
    back:  'Indica estro e ovulação próxima. É a janela prática para cobrir ou inseminar com maior chance de concepção.' },

  /* ── Q9 ── Fases do ciclo */
  { id: 'r09', tag: 'Ciclo Estral — Fases',
    front: '🔄 Q9 · Fases do ciclo\nPor que a ordem proestro → estro → metaestro → diestro faz sentido?',
    back:  'Primeiro o folículo cresce, depois vem o cio/ovulação, depois o corpo lúteo se forma e mantém progesterona. A ordem explica o manejo.' },

  /* ── Q10 ── Duração do ciclo */
  { id: 'r10', tag: 'Ciclo Estral — Duração',
    front: '📅 Q10 · Duração do ciclo\nPor que lembrar a duração média ajuda no campo?',
    back:  'Vaca, porca e égua ficam perto de 21 dias; ovelha perto de 17. Isso ajuda a prever retorno ao cio ou suspeitar falha reprodutiva.' },

  /* ── Q11 ── Poliestral */
  { id: 'r11', tag: 'Sazonalidade',
    front: '☀️ Q11 · Poliestral anual vs estacional\nO que muda na prática?',
    back:  'Anual cicla o ano todo, como vaca e porca. Estacional cicla em certas épocas, então o manejo precisa respeitar a estação.' },

  /* ── Q12 ── Fotoperíodo */
  { id: 'r12', tag: 'Sazonalidade — Fotoperíodo',
    front: '🌗 Q12 · Fotoperíodo\nPor que luz do dia muda a reprodução?',
    back:  'A luz altera melatonina, que sinaliza estação ao eixo reprodutivo. Por isso ovelhas ciclam em dias curtos e éguas em dias longos.' },

  /* ── Q13 ── Cabras no verão */
  { id: 'r13', tag: 'Sazonalidade — Caso Clínico',
    front: '🐐 Q13 · Cabras com pouco cio no verão\nQual a causa provável?',
    back:  'Cabras são de dias curtos; no verão é comum anestro fisiológico. Manejo com efeito macho ou luz pode ajudar a induzir cio.' },

  /* ── Q14 ── Sinais de cio em bovinos */
  { id: 'r14', tag: 'Detecção de Cio — Bovinos',
    front: '👁️ Q14 · Cio em bovinos\nQual sinal de campo é mais útil?',
    back:  'Aceite de monta é o sinal mais confiável; muco claro reforça a suspeita. Isso indica a melhor janela para inseminar.' },

  /* ── Q15 ── Condição corporal */
  { id: 'r15', tag: 'Nutrição Reprodutiva',
    front: '⚖️ Q15 · Condição corporal pós-parto\nPor que vaca magra demora a ciclar?',
    back:  'Falta de energia reduz sinais que ativam GnRH/LH. O ovário demora a voltar, aumentando o anestro pós-parto.' },

  /* ── Q16 ── Muco cervical */
  { id: 'r16', tag: 'Ciclo Estral — Muco',
    front: '💧 Q16 · Muco cervical\nPor que ele muda entre estro e diestro?',
    back:  'No estro fica fluido para ajudar os espermatozoides. No diestro fica espesso para proteger o útero.' },

  /* ── Q17 ── IA suínos */
  { id: 'r17', tag: 'Biotecnologias — IA Suínos',
    front: '🐖 Q17 · IA em suínos\nPor que a pipeta precisa “travar” na cérvix?',
    back:  'A cérvix da porca é espiral. O travamento reduz refluxo e ajuda a dose chegar ao local certo.' },

  /* ── Q18 ── Cuidados com sêmen */
  { id: 'r18', tag: 'Biotecnologias — IA',
    front: '🧊 Q18 · Sêmen na IA\nO que mais derruba a fertilidade da dose?',
    back:  'Temperatura errada e contaminação reduzem motilidade e viabilidade. Controlar isso protege a chance de fecundação.' },

  /* ── Q19 ── IATF */
  { id: 'r19', tag: 'Biotecnologias — IATF',
    front: '🔬 Q19 · IATF\nPor que ela facilita o manejo do rebanho?',
    back:  'Sincroniza a ovulação do lote e permite inseminar em horário fixo. Isso reduz dependência da observação de cio.' },

  /* ── Q20 ── Transferência de embriões */
  { id: 'r20', tag: 'Biotecnologias — TE',
    front: '🧬 Q20 · Transferência de Embriões\nPor que usar TE em uma doadora valiosa?',
    back:  'Multiplica a genética da doadora em várias receptoras. O limite é custo, equipe e necessidade de sincronização precisa.' },

  /* ── Q21 ── Caso clínico suíno: retorno ao cio */
  { id: 'r21', tag: 'Biotecnologias — Caso Clínico',
    front: '🐷 Q21 · Suína volta ao cio 21 dias após IA\nO que isso sugere?',
    back:  'Sugere que não houve prenhez, por falha de fecundação ou perda embrionária precoce. Revise cio, sêmen e técnica de IA.' },

  /* ── Q22 ── Puerpério anormal */
  { id: 'r22', tag: 'Puerpério / Pós-parto',
    front: '⚠️ Q22 · Puerpério anormal\nPor que metrite e retenção de placenta prejudicam fertilidade?',
    back:  'Elas aumentam infecção e atrasam a recuperação do útero. Isso dificulta nova prenhez no pós-parto.' },

  /* ── Q23 ── Anestro pós-parto */
  { id: 'r23', tag: 'Puerpério / Pós-parto',
    front: '🤕 Q23 · Anestro pós-parto\nO que acontece quando energia e amamentação pesam demais?',
    back:  'O eixo reprodutivo reduz GnRH/LH e o ovário demora a voltar. A vaca fica sem cio por mais tempo.' },

  /* ── Q24 ── Caso clínico: PGF2α no CL */
  { id: 'r24', tag: 'Biotecnologias — Caso Clínico',
    front: '💉 Q24 · CL funcional + PGF2α\nO que acontece depois?',
    back:  'A PGF2α causa luteólise, derruba progesterona e permite novo crescimento folicular. O cio tende a aparecer alguns dias depois.' },

  /* ── Q25 ── Por que sincronizar */
  { id: 'r25', tag: 'Biotecnologias — Sincronização',
    front: '📆 Q25 · Sincronização de cio\nPor que isso melhora o manejo?',
    back:  'Concentra inseminações, partos e lotes de cria. Isso facilita rotina, genética e planejamento do rebanho.' },

  /* ── Q26 ── IATF vs IA */
  { id: 'r26', tag: 'Biotecnologias — IATF',
    front: '⚖️ Q26 · IATF vs IA convencional\nQual problema a IATF resolve?',
    back:  'Ela reduz erro de detecção de cio e insemina o lote em dia fixo. Isso melhora a eficiência em rebanhos grandes.' },

  /* ── Q27 ── Progestágeno exógeno */
  { id: 'r27', tag: 'Biotecnologias — CIDR/Sincrogest',
    front: '🐮 Q27 · CIDR/Sincrogest\nPor que retirar o progestágeno induz cio?',
    back:  'Enquanto está no animal, imita progesterona alta e segura o ciclo. Ao retirar, a queda libera LH e favorece cio/ovulação.' },

  /* ── Q28 ── Detecção de cio na cadela */
  { id: 'r28', tag: 'Detecção de Cio — Cadela',
    front: '🐕 Q28 · Cio em cadelas\nPor que a citologia vaginal ajuda?',
    back:  'No estro predominam células superficiais cornificadas, sinal de estrogênio alto. Isso ajuda a estimar a fase do ciclo.' },

  /* ── Q29a ── Anatomia: estruturas da vaca */
  { id: 'r29a', tag: 'Anatomia — Q29 Estruturas',
    front: '🐄 Q29 · Trato da vaca\nQual estrutura mais muda a técnica de IA?',
    back:  'A cérvix com anéis simples precisa ser transposta com cuidado. Isso define a técnica via palpação retal.' },

  /* ── Q29b ── Anatomia: estruturas da porca */
  { id: 'r29b', tag: 'Anatomia — Q29 Estruturas',
    front: '🐖 Q29 · Trato da porca\nPor que a cérvix em espiral importa?',
    back:  'Ela permite travar a pipeta por rotação. Isso reduz refluxo e melhora a deposição do sêmen.' },

  /* ── Q29c ── Anatomia: estruturas da égua */
  { id: 'r29c', tag: 'Anatomia — Q29 Estruturas',
    front: '🐎 Q29 · Trato da égua\nPor que a fóvea ovulatória é importante?',
    back:  'A ovulação ocorre pela fóvea, não por qualquer ponto do ovário. Isso ajuda a entender a anatomia única da espécie.' },

  /* ── Q29d ── Anatomia: estruturas da cadela */
  { id: 'r29d', tag: 'Anatomia — Q29 Estruturas',
    front: '🐕 Q29 · Trato da cadela\nPor que cornos uterinos longos importam?',
    back:  'Eles acomodam ninhadas com vários fetos. A anatomia combina com gestação múltipla.' },

  /* ── Q30 ── Importância das biotecnologias */
  { id: 'r30', tag: 'Biotecnologias — Espécies',
    front: '🌐 Q30 · Biotecnologias reprodutivas\nPor que elas importam em bovinos?',
    back:  'IA, IATF e TE aumentam uso de genética superior e organizam o manejo. Isso melhora produtividade e planejamento.' },
]

/* ── Utilitário ── */
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

/* ── Cards do banco de dados ── */
const ALL_CARDS = [
  ...db.drugs.map(d => ({
    id: `drug-${d.id}`, tag: d.category,
    front: `💊 ${d.name}\nQual é o mecanismo de ação?`,
    back: d.mechanism,
  })),
  ...db.drugs.map(d => ({
    id: `ci-${d.id}`, tag: d.category,
    front: `💊 ${d.name}\nQuais as principais contraindicações?`,
    back: '• ' + d.contraindications.join('\n• '),
  })),
  ...db.diseases.map(d => ({
    id: `dis-${d.id}`, tag: d.category,
    front: `${d.emoji} ${d.name}\nQuais os principais sinais clínicos?`,
    back: '• ' + (d.symptoms as string[]).slice(0, 5).join('\n• '),
  })),
  ...REPRO_CARDS,
]

type FilterKey = 'repro' | 'anatomia' | 'farma' | 'clinica' | 'todos'

const FILTERS: { key: FilterKey; label: string; count: number }[] = [
  { key: 'repro',    label: '🐄 Reprodução A1',  count: REPRO_CARDS.filter(c => !c.id.startsWith('r29')).length },
  { key: 'anatomia', label: '🦴 Anatomia Q29',   count: REPRO_CARDS.filter(c => c.id.startsWith('r29')).length },
  { key: 'farma',    label: '💊 Farmacologia',   count: db.drugs.length * 2 },
  { key: 'clinica',  label: '🏥 Clínica',        count: db.diseases.length },
  { key: 'todos',    label: 'Todos',             count: 0 },
]

function filterCards(key: FilterKey) {
  if (key === 'repro')    return REPRO_CARDS.filter(c => !c.id.startsWith('r29'))
  if (key === 'anatomia') return REPRO_CARDS.filter(c => c.id.startsWith('r29'))
  if (key === 'farma')    return ALL_CARDS.filter(c => c.id.startsWith('drug') || c.id.startsWith('ci-'))
  if (key === 'clinica')  return ALL_CARDS.filter(c => c.id.startsWith('dis-'))
  return shuffle(ALL_CARDS).slice(0, 30)
}

/* ── FlashCard 3D ── */
function FlashCard({ card, flipped, onFlip }: { card: { tag: string; front: string; back: string }; flipped: boolean; onFlip: () => void }) {
  return (
    <div onClick={onFlip} style={{ perspective: 1200 }} className="cursor-pointer select-none">
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full h-64"
      >
        {/* Frente */}
        <div className="absolute inset-0 bg-slate-800 border border-slate-700 rounded-3xl p-7 flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden' }}>
          <span className="text-xs text-teal-400 font-bold uppercase tracking-wider bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full self-start">
            {card.tag}
          </span>
          <p className="text-slate-200 font-semibold text-[15px] leading-relaxed whitespace-pre-line text-center flex-1 flex items-center justify-center px-2">
            {card.front}
          </p>
          <p className="text-xs text-slate-600 text-center">Toque para revelar</p>
        </div>
        {/* Verso */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/30 to-slate-800 border border-teal-500/30 rounded-3xl p-7 flex flex-col justify-center overflow-y-auto"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line text-center">
            {card.back}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Conteúdo da Revisão ── */
function RevisaoContent({
  profileId,
  onRequestCase,
}: {
  profileId?: string
  onRequestCase?: () => void
}) {
  const [filter,  setFilter]  = useState<FilterKey>('repro')
  const [deck,    setDeck]    = useState(() => filterCards('repro'))
  const [index,   setIndex]   = useState(0)
  const [flipped, setFlipped] = useState(false)

  const applyFilter = (key: FilterKey) => {
    setFilter(key); setDeck(shuffle(filterCards(key))); setIndex(0); setFlipped(false)
  }
  const goTo = (next: number) => { setFlipped(false); setTimeout(() => setIndex(next), 150) }
  const restart = () => { setDeck(shuffle(filterCards(filter))); setIndex(0); setFlipped(false) }
  const handleFlip = () => {
    if (!flipped) markReviewCompleted(profileId)
    setFlipped(current => !current)
  }
  const card = deck[index]
  const pct  = Math.round(((index + 1) / deck.length) * 100)
  const sessionCompleted = deck.length > 0 && index === deck.length - 1 && flipped

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap size={22} className="text-teal-400" />
          <h1 className="text-2xl font-bold text-white">Revisão Master</h1>
        </div>
        <p className="text-slate-400 text-sm">Flashcards do Estudo Dirigido + banco clínico · memorização pura</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => applyFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filter === f.key
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700/60 hover:text-slate-300'
            }`}>
            {f.label}{f.count > 0 ? ` (${f.count})` : ''}
          </button>
        ))}
      </div>

      {/* Progresso */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-500 font-mono tabular-nums">{index + 1} / {deck.length}</span>
        <div className="flex items-center gap-2">
          <BookOpen size={12} className="text-slate-600" />
          <span className="text-xs text-slate-600">{flipped ? 'Resposta visível' : 'Toque para ver'}</span>
          <span className="text-xs text-teal-500 font-bold">{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full mb-5 overflow-hidden border border-slate-700/40">
        <motion.div className="h-full bg-teal-500 rounded-full"
          animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }} />
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div key={index}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.18 }}>
          {card && <FlashCard card={card} flipped={flipped} onFlip={handleFlip} />}
        </motion.div>
      </AnimatePresence>

      {/* Navegação */}
      <div className="flex items-center justify-between mt-6">
        <button onClick={() => goTo(Math.max(0, index - 1))} disabled={index === 0}
          className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:border-teal-500/40 hover:text-white disabled:opacity-30 transition-all">
          <ChevronLeft size={15} /> Anterior
        </button>
        <button onClick={restart} className="p-2 text-slate-600 hover:text-teal-400 transition-colors" title="Embaralhar">
          <RotateCcw size={15} />
        </button>
        <button onClick={() => goTo(Math.min(deck.length - 1, index + 1))} disabled={index === deck.length - 1}
          className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-30 transition-all">
          Próximo <ChevronRight size={15} />
        </button>
      </div>
      {sessionCompleted && (
        <div className="mt-5 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/8 p-4">
          <p className="text-sm font-bold text-white">Boa! Quer aplicar isso em um caso cl?nico?</p>
          <p className="text-xs text-slate-400 mt-1">Leva s? alguns minutos e ajuda a transformar revis?o em decis?o pr?tica.</p>
          <button
            type="button"
            onClick={() => onRequestCase?.()}
            className="mt-3 min-h-[44px] w-full rounded-xl bg-fuchsia-500/90 px-3 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-400"
          >
            Resolver caso
          </button>
        </div>
      )}
    </div>
  )
}

export default function RevisaoPage({
  profileId,
  onRequestCase,
}: {
  profileId?: string
  onRequestCase?: () => void
} = {}) {
  const resolvedProfileId = profileId ?? getActiveProfile()?.id
  return (
    <Gatekeeper pageTitle="Revisão Master">
      <RevisaoContent profileId={resolvedProfileId} onRequestCase={onRequestCase} />
    </Gatekeeper>
  )
}
