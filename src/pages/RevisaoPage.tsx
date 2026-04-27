import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, ChevronLeft, ChevronRight, RotateCcw, BookOpen } from 'lucide-react'
import Gatekeeper from '../components/Gatekeeper'
import db from '../data/central_db.json'
import { getActiveProfile } from '../utils/profiles'
import { markReviewCompleted } from '../utils/reviewHabit'

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   BANCO COMPLETO â€” 30 questÃµes do Estudo Dirigido da Profa.
   Fernanda BrandÃ£o (UNISUL) + cards do DB clínico
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const REPRO_CARDS = [

  /* â”€â”€ Q1 â”€â”€ Anatomia externa */
  { id: 'r01', tag: 'Anatomia â€” Trato Feminino',
    front: 'ðŸŒ¸ Q1 · Trato Reprodutor Feminino\nO que cada estrutura externa ajuda a proteger ou permitir?',
    back:  'Vulva protege a entrada; vestÃ­bulo e vagina recebem o sÃªmen; cÃ©rvix controla a passagem ao Ãºtero. Isso reduz infecÃ§Ã£o e permite cÃ³pula/parto.' },

  /* â”€â”€ Q2 â”€â”€ Vagina vs CÃ©rvix */
  { id: 'r02', tag: 'Anatomia â€” Trato Feminino',
    front: 'ðŸ” Q2 · Vagina vs CÃ©rvix\nO que muda na funÃ§Ã£o de cada uma?',
    back:  'A vagina recebe sÃªmen e serve de canal no parto. A cÃ©rvix abre no estro e fecha no diestro/gestaÃ§Ã£o para proteger o Ãºtero.' },

  /* â”€â”€ Q3 â”€â”€ CÃ©rvix comparada */
  { id: 'r03', tag: 'Anatomia â€” CÃ©rvix Comparada',
    front: 'ðŸ”¬ Q3 · CÃ©rvix Comparada\nPor que o formato da cÃ©rvix muda a tÃ©cnica de IA?',
    back:  'Vaca tem anÃ©is; porca tem espiral que prende a pipeta; Ã©gua tem pregas mais fÃ¡ceis no estro. A tÃ©cnica precisa respeitar essa anatomia.' },

  /* â”€â”€ Q4 â”€â”€ Camadas do Ãºtero */
  { id: 'r04', tag: 'Anatomia â€” Ãštero',
    front: 'ðŸ—ï¸ Q4 · Camadas do Ãštero\nO que cada camada faz para reproduÃ§Ã£o?',
    back:  'PerimÃ©trio reveste; miomÃ©trio contrai no parto; endomÃ©trio recebe e nutre o embriÃ£o. Juntas, protegem e sustentam a gestaÃ§Ã£o.' },

  /* â”€â”€ Q5 â”€â”€ Ovidutos */
  { id: 'r05', tag: 'Anatomia â€” Ovidutos',
    front: 'ðŸ”­ Q5 · Ovidutos\nO que os ovidutos fazem apÃ³s a ovulaÃ§Ã£o?',
    back:  'Captam e transportam o oÃ³cito; a ampola Ã© o local comum da fecundaÃ§Ã£o. Depois ajudam o embriÃ£o inicial a chegar ao Ãºtero.' },

  /* â”€â”€ Q6 â”€â”€ Folículo vs CL */
  { id: 'r06', tag: 'Ciclo Estral â€” Estruturas',
    front: 'ðŸŒ• Q6 · Folículo vs Corpo LÃºteo\nO que cada um faz no ciclo?',
    back:  'Folículo produz estrogÃªnio e prepara a ovulaÃ§Ã£o. Corpo lÃºteo vem depois e produz progesterona para preparar o Ãºtero.' },

  /* â”€â”€ Q7 â”€â”€ E2 vs P4 */
  { id: 'r07', tag: 'Ciclo Estral â€” HormÃ´nios',
    front: 'âš—ï¸ Q7 · EstrogÃªnio vs Progesterona\nComo cada hormÃ´nio muda o cio e o Ãºtero?',
    back:  'EstrogÃªnio mostra cio e facilita passagem de espermatozoides. Progesterona bloqueia novo cio e prepara o Ãºtero para gestaÃ§Ã£o.' },

  /* â”€â”€ Q8 â”€â”€ Caso clínico: muco cristalino */
  { id: 'r08', tag: 'Ciclo Estral â€” Caso ClÃ­nico',
    front: 'ðŸ„ Q8 · Muco claro + aceita monta\nO que isso indica e por que importa?',
    back:  'Indica estro e ovulaÃ§Ã£o prÃ³xima. Ã‰ a janela prática para cobrir ou inseminar com maior chance de concepÃ§Ã£o.' },

  /* â”€â”€ Q9 â”€â”€ Fases do ciclo */
  { id: 'r09', tag: 'Ciclo Estral â€” Fases',
    front: 'ðŸ”„ Q9 · Fases do ciclo\nPor que a ordem proestro â†’ estro â†’ metaestro â†’ diestro faz sentido?',
    back:  'Primeiro o folÃ­culo cresce, depois vem o cio/ovulaÃ§Ã£o, depois o corpo lÃºteo se forma e mantÃ©m progesterona. A ordem explica o manejo.' },

  /* â”€â”€ Q10 â”€â”€ DuraÃ§Ã£o do ciclo */
  { id: 'r10', tag: 'Ciclo Estral â€” DuraÃ§Ã£o',
    front: 'ðŸ“… Q10 · DuraÃ§Ã£o do ciclo\nPor que lembrar a duraÃ§Ã£o mÃ©dia ajuda no campo?',
    back:  'Vaca, porca e Ã©gua ficam perto de 21 dias; ovelha perto de 17. Isso ajuda a prever retorno ao cio ou suspeitar falha reprodutiva.' },

  /* â”€â”€ Q11 â”€â”€ Poliestral */
  { id: 'r11', tag: 'Sazonalidade',
    front: 'â˜€ï¸ Q11 · Poliestral anual vs estacional\nO que muda na prática?',
    back:  'Anual cicla o ano todo, como vaca e porca. Estacional cicla em certas Ã©pocas, entÃ£o o manejo precisa respeitar a estaÃ§Ã£o.' },

  /* â”€â”€ Q12 â”€â”€ FotoperÃ­odo */
  { id: 'r12', tag: 'Sazonalidade â€” FotoperÃ­odo',
    front: 'ðŸŒ— Q12 · FotoperÃ­odo\nPor que luz do dia muda a reproduÃ§Ã£o?',
    back:  'A luz altera melatonina, que sinaliza estaÃ§Ã£o ao eixo reprodutivo. Por isso ovelhas ciclam em dias curtos e Ã©guas em dias longos.' },

  /* â”€â”€ Q13 â”€â”€ Cabras no verÃ£o */
  { id: 'r13', tag: 'Sazonalidade â€” Caso ClÃ­nico',
    front: 'ðŸ Q13 · Cabras com pouco cio no verÃ£o\nQual a causa provÃ¡vel?',
    back:  'Cabras sÃ£o de dias curtos; no verÃ£o Ã© comum anestro fisiolÃ³gico. Manejo com efeito macho ou luz pode ajudar a induzir cio.' },

  /* â”€â”€ Q14 â”€â”€ Sinais de cio em bovinos */
  { id: 'r14', tag: 'DetecÃ§Ã£o de Cio â€” Bovinos',
    front: 'ðŸ‘ï¸ Q14 · Cio em bovinos\nQual sinal de campo Ã© mais Ãºtil?',
    back:  'Aceite de monta Ã© o sinal mais confiÃ¡vel; muco claro reforÃ§a a suspeita. Isso indica a melhor janela para inseminar.' },

  /* â”€â”€ Q15 â”€â”€ CondiÃ§Ã£o corporal */
  { id: 'r15', tag: 'NutriÃ§Ã£o Reprodutiva',
    front: 'âš–ï¸ Q15 · CondiÃ§Ã£o corporal pÃ³s-parto\nPor que vaca magra demora a ciclar?',
    back:  'Falta de energia reduz sinais que ativam GnRH/LH. O ovÃ¡rio demora a voltar, aumentando o anestro pÃ³s-parto.' },

  /* â”€â”€ Q16 â”€â”€ Muco cervical */
  { id: 'r16', tag: 'Ciclo Estral â€” Muco',
    front: 'ðŸ’§ Q16 · Muco cervical\nPor que ele muda entre estro e diestro?',
    back:  'No estro fica fluido para ajudar os espermatozoides. No diestro fica espesso para proteger o Ãºtero.' },

  /* â”€â”€ Q17 â”€â”€ IA suÃ­nos */
  { id: 'r17', tag: 'Biotecnologias â€” IA SuÃ­nos',
    front: 'ðŸ– Q17 · IA em suÃ­nos\nPor que a pipeta precisa â€œtravarâ€ na cÃ©rvix?',
    back:  'A cÃ©rvix da porca Ã© espiral. O travamento reduz refluxo e ajuda a dose chegar ao local certo.' },

  /* â”€â”€ Q18 â”€â”€ Cuidados com sÃªmen */
  { id: 'r18', tag: 'Biotecnologias â€” IA',
    front: 'ðŸ§Š Q18 · SÃªmen na IA\nO que mais derruba a fertilidade da dose?',
    back:  'Temperatura errada e contaminaÃ§Ã£o reduzem motilidade e viabilidade. Controlar isso protege a chance de fecundaÃ§Ã£o.' },

  /* â”€â”€ Q19 â”€â”€ IATF */
  { id: 'r19', tag: 'Biotecnologias â€” IATF',
    front: 'ðŸ”¬ Q19 · IATF\nPor que ela facilita o manejo do rebanho?',
    back:  'Sincroniza a ovulaÃ§Ã£o do lote e permite inseminar em horÃ¡rio fixo. Isso reduz dependÃªncia da observaÃ§Ã£o de cio.' },

  /* â”€â”€ Q20 â”€â”€ TransferÃªncia de embriÃµes */
  { id: 'r20', tag: 'Biotecnologias â€” TE',
    front: 'ðŸ§¬ Q20 · TransferÃªncia de EmbriÃµes\nPor que usar TE em uma doadora valiosa?',
    back:  'Multiplica a genÃ©tica da doadora em vÃ¡rias receptoras. O limite Ã© custo, equipe e necessidade de sincronizaÃ§Ã£o precisa.' },

  /* â”€â”€ Q21 â”€â”€ Caso clínico suÃ­no: retorno ao cio */
  { id: 'r21', tag: 'Biotecnologias â€” Caso ClÃ­nico',
    front: 'ðŸ· Q21 · SuÃ­na volta ao cio 21 dias apÃ³s IA\nO que isso sugere?',
    back:  'Sugere que nÃ£o houve prenhez, por falha de fecundaÃ§Ã£o ou perda embrionÃ¡ria precoce. Revise cio, sÃªmen e tÃ©cnica de IA.' },

  /* â”€â”€ Q22 â”€â”€ PuerpÃ©rio anormal */
  { id: 'r22', tag: 'PuerpÃ©rio / PÃ³s-parto',
    front: 'âš ï¸ Q22 · PuerpÃ©rio anormal\nPor que metrite e retenÃ§Ã£o de placenta prejudicam fertilidade?',
    back:  'Elas aumentam infecÃ§Ã£o e atrasam a recuperaÃ§Ã£o do Ãºtero. Isso dificulta nova prenhez no pÃ³s-parto.' },

  /* â”€â”€ Q23 â”€â”€ Anestro pÃ³s-parto */
  { id: 'r23', tag: 'PuerpÃ©rio / PÃ³s-parto',
    front: 'ðŸ¤• Q23 · Anestro pÃ³s-parto\nO que acontece quando energia e amamentaÃ§Ã£o pesam demais?',
    back:  'O eixo reprodutivo reduz GnRH/LH e o ovÃ¡rio demora a voltar. A vaca fica sem cio por mais tempo.' },

  /* â”€â”€ Q24 â”€â”€ Caso clínico: PGF2Î± no CL */
  { id: 'r24', tag: 'Biotecnologias â€” Caso ClÃ­nico',
    front: 'ðŸ’‰ Q24 · CL funcional + PGF2Î±\nO que acontece depois?',
    back:  'A PGF2Î± causa luteÃ³lise, derruba progesterona e permite novo crescimento folicular. O cio tende a aparecer alguns dias depois.' },

  /* â”€â”€ Q25 â”€â”€ Por que sincronizar */
  { id: 'r25', tag: 'Biotecnologias â€” SincronizaÃ§Ã£o',
    front: 'ðŸ“† Q25 · SincronizaÃ§Ã£o de cio\nPor que isso melhora o manejo?',
    back:  'Concentra inseminaÃ§Ãµes, partos e lotes de cria. Isso facilita rotina, genÃ©tica e planejamento do rebanho.' },

  /* â”€â”€ Q26 â”€â”€ IATF vs IA */
  { id: 'r26', tag: 'Biotecnologias â€” IATF',
    front: 'âš–ï¸ Q26 · IATF vs IA convencional\nQual problema a IATF resolve?',
    back:  'Ela reduz erro de detecÃ§Ã£o de cio e insemina o lote em dia fixo. Isso melhora a eficiÃªncia em rebanhos grandes.' },

  /* â”€â”€ Q27 â”€â”€ ProgestÃ¡geno exÃ³geno */
  { id: 'r27', tag: 'Biotecnologias â€” CIDR/Sincrogest',
    front: 'ðŸ® Q27 · CIDR/Sincrogest\nPor que retirar o progestÃ¡geno induz cio?',
    back:  'Enquanto estÃ¡ no animal, imita progesterona alta e segura o ciclo. Ao retirar, a queda libera LH e favorece cio/ovulaÃ§Ã£o.' },

  /* â”€â”€ Q28 â”€â”€ DetecÃ§Ã£o de cio na cadela */
  { id: 'r28', tag: 'DetecÃ§Ã£o de Cio â€” Cadela',
    front: 'ðŸ• Q28 · Cio em cadelas\nPor que a citologia vaginal ajuda?',
    back:  'No estro predominam cÃ©lulas superficiais cornificadas, sinal de estrogÃªnio alto. Isso ajuda a estimar a fase do ciclo.' },

  /* â”€â”€ Q29a â”€â”€ Anatomia: estruturas da vaca */
  { id: 'r29a', tag: 'Anatomia â€” Q29 Estruturas',
    front: 'ðŸ„ Q29 · Trato da vaca\nQual estrutura mais muda a tÃ©cnica de IA?',
    back:  'A cÃ©rvix com anÃ©is simples precisa ser transposta com cuidado. Isso define a tÃ©cnica via palpaÃ§Ã£o retal.' },

  /* â”€â”€ Q29b â”€â”€ Anatomia: estruturas da porca */
  { id: 'r29b', tag: 'Anatomia â€” Q29 Estruturas',
    front: 'ðŸ– Q29 · Trato da porca\nPor que a cÃ©rvix em espiral importa?',
    back:  'Ela permite travar a pipeta por rotaÃ§Ã£o. Isso reduz refluxo e melhora a deposiÃ§Ã£o do sÃªmen.' },

  /* â”€â”€ Q29c â”€â”€ Anatomia: estruturas da Ã©gua */
  { id: 'r29c', tag: 'Anatomia â€” Q29 Estruturas',
    front: 'ðŸŽ Q29 · Trato da Ã©gua\nPor que a fÃ³vea ovulatÃ³ria Ã© importante?',
    back:  'A ovulaÃ§Ã£o ocorre pela fÃ³vea, nÃ£o por qualquer ponto do ovÃ¡rio. Isso ajuda a entender a anatomia Ãºnica da espÃ©cie.' },

  /* â”€â”€ Q29d â”€â”€ Anatomia: estruturas da cadela */
  { id: 'r29d', tag: 'Anatomia â€” Q29 Estruturas',
    front: 'ðŸ• Q29 · Trato da cadela\nPor que cornos uterinos longos importam?',
    back:  'Eles acomodam ninhadas com vÃ¡rios fetos. A anatomia combina com gestaÃ§Ã£o mÃºltipla.' },

  /* â”€â”€ Q30 â”€â”€ ImportÃ¢ncia das biotecnologias */
  { id: 'r30', tag: 'Biotecnologias â€” EspÃ©cies',
    front: 'ðŸŒ Q30 · Biotecnologias reprodutivas\nPor que elas importam em bovinos?',
    back:  'IA, IATF e TE aumentam uso de genÃ©tica superior e organizam o manejo. Isso melhora produtividade e planejamento.' },
]

/* â”€â”€ UtilitÃ¡rio â”€â”€ */
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

/* â”€â”€ Cards do banco de dados â”€â”€ */
const ALL_CARDS = [
  ...db.drugs.map(d => ({
    id: `drug-${d.id}`, tag: d.category,
    front: `ðŸ’Š ${d.name}\nQual Ã© o mecanismo de aÃ§Ã£o?`,
    back: d.mechanism,
  })),
  ...db.drugs.map(d => ({
    id: `ci-${d.id}`, tag: d.category,
    front: `ðŸ’Š ${d.name}\nQuais as principais contraindicaÃ§Ãµes?`,
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
  { key: 'repro',    label: 'ðŸ„ Reprodução A1',  count: REPRO_CARDS.filter(c => !c.id.startsWith('r29')).length },
  { key: 'anatomia', label: 'ðŸ¦´ Anatomia Q29',   count: REPRO_CARDS.filter(c => c.id.startsWith('r29')).length },
  { key: 'farma',    label: 'ðŸ’Š Farmacologia',   count: db.drugs.length * 2 },
  { key: 'clinica',  label: 'ðŸ¥ Clínica',        count: db.diseases.length },
  { key: 'todos',    label: 'Todos',             count: 0 },
]

function filterCards(key: FilterKey) {
  if (key === 'repro')    return REPRO_CARDS.filter(c => !c.id.startsWith('r29'))
  if (key === 'anatomia') return REPRO_CARDS.filter(c => c.id.startsWith('r29'))
  if (key === 'farma')    return ALL_CARDS.filter(c => c.id.startsWith('drug') || c.id.startsWith('ci-'))
  if (key === 'clinica')  return ALL_CARDS.filter(c => c.id.startsWith('dis-'))
  return shuffle(ALL_CARDS).slice(0, 30)
}

/* â”€â”€ FlashCard 3D â”€â”€ */
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

/* â”€â”€ ConteÃºdo da RevisÃ£o â”€â”€ */
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
  const pct  = deck.length > 0 ? Math.round(((index + 1) / deck.length) * 100) : 0
  const sessionCompleted = deck.length > 0 && index === deck.length - 1 && flipped

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap size={22} className="text-teal-400" />
          <h1 className="text-2xl font-bold text-white">Flashcards</h1>
        </div>
        <p className="text-slate-400 text-sm">Memorização por repetição espaçada</p>
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
          <span className="text-xs text-slate-600">{flipped ? 'Resposta visível' : 'Toque no card para revelar'}</span>
          <span className="text-xs text-teal-500 font-bold">{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full mb-5 overflow-hidden border border-slate-700/40">
        <motion.div className="h-full bg-teal-500 rounded-full"
          animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }} />
      </div>

      {deck.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center">
          <p className="text-sm font-bold text-white">Nenhum flashcard disponível ainda.</p>
          <p className="text-xs text-slate-400 mt-1">Use o Início para começar uma sessão de estudo.</p>
        </div>
      )}

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div key={index}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.18 }}>
          {card && <FlashCard card={card} flipped={flipped} onFlip={handleFlip} />}
        </motion.div>
      </AnimatePresence>

      {/* NavegaÃ§Ã£o */}
      <div className="flex items-center justify-between mt-6">
        <button onClick={() => goTo(Math.max(0, index - 1))} disabled={deck.length === 0 || index === 0}
          className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:border-teal-500/40 hover:text-white disabled:opacity-30 transition-all">
          <ChevronLeft size={15} /> Anterior
        </button>
        <button onClick={restart} className="p-2 text-slate-600 hover:text-teal-400 transition-colors" title="Embaralhar">
          <RotateCcw size={15} />
        </button>
        <button onClick={() => goTo(Math.min(deck.length - 1, index + 1))} disabled={deck.length === 0 || index === deck.length - 1}
          className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-30 transition-all">
          Próximo <ChevronRight size={15} />
        </button>
      </div>
      {sessionCompleted && (
        <div className="mt-5 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/8 p-4">
          <p className="text-sm font-bold text-white">Boa! Quer aplicar isso em um caso clínico?</p>
          <p className="text-xs text-slate-400 mt-1">Leva só alguns minutos e ajuda a transformar revisão em decisão prática.</p>
          <button
            type="button"
            onClick={() => onRequestCase?.()}
            className="mt-3 min-h-[44px] w-full rounded-xl bg-fuchsia-500/90 px-3 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-400"
          >
            Começar raciocínio
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
  const resolvedProfileId = profileId ?? getActiveProfile()?.id ?? 'default'
  return (
    <Gatekeeper pageTitle="Flashcards">
      <RevisaoContent profileId={resolvedProfileId} onRequestCase={onRequestCase} />
    </Gatekeeper>
  )
}

