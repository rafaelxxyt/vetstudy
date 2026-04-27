import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, ChevronLeft, ChevronRight, RotateCcw, BookOpen } from 'lucide-react'
import Gatekeeper from '../components/Gatekeeper'
import db from '../data/central_db.json'
import { getActiveProfile } from '../utils/profiles'
import { markReviewCompleted } from '../utils/reviewHabit'

type Card = {
  id: string
  tag: string
  front: string
  back: string
}

const REPRO_CARDS: Card[] = [
  { id: 'r01', tag: 'Anatomia · Trato feminino', front: '🌸 O que a vulva protege no sistema reprodutor feminino?', back: 'Protege a entrada do trato genital e ajuda a reduzir contaminações externas.' },
  { id: 'r02', tag: 'Anatomia · Cérvix', front: '🔍 Qual é a função principal da cérvix?', back: 'Controlar a passagem para o útero. Ela protege o ambiente uterino e muda conforme a fase do ciclo.' },
  { id: 'r03', tag: 'Anatomia · Ovidutos', front: '🔬 O que os ovidutos fazem após a ovulação?', back: 'Captam o oócito e servem como local comum da fecundação antes da chegada ao útero.' },
  { id: 'r04', tag: 'Ciclo estral · Estruturas', front: '🌕 Qual a diferença entre folículo e corpo lúteo?', back: 'O folículo produz estrogênio e antecede a ovulação. O corpo lúteo produz progesterona depois da ovulação.' },
  { id: 'r05', tag: 'Ciclo estral · Hormônios', front: '⚗️ O que o estrogênio faz no estro?', back: 'Favorece sinais de cio e facilita o ambiente para a reprodução naquele momento.' },
  { id: 'r06', tag: 'Ciclo estral · Hormônios', front: '⚗️ Por que a progesterona é importante após a ovulação?', back: 'Ela prepara e mantém o útero mais estável para uma possível gestação.' },
  { id: 'r07', tag: 'Ciclo estral · Fases', front: '🔄 Por que a ordem das fases do ciclo importa no manejo?', back: 'Porque ela ajuda a prever cio, ovulação e o melhor momento para cobertura ou inseminação.' },
  { id: 'r08', tag: 'Detecção de cio', front: '👁️ O que o aceite de monta indica em bovinos?', back: 'É um dos sinais mais confiáveis de estro e ajuda a escolher a janela de inseminação.' },
  { id: 'r09', tag: 'Sazonalidade', front: '☀️ Como o fotoperíodo influencia a reprodução?', back: 'A luz altera sinais hormonais e pode ativar ou limitar o ciclo em espécies estacionais.' },
  { id: 'r10', tag: 'Sazonalidade', front: '🌗 Por que ovelhas e éguas não respondem igual ao comprimento do dia?', back: 'Porque cada espécie tem padrão sazonal diferente e ativa a reprodução em épocas distintas.' },
  { id: 'r11', tag: 'Nutrição reprodutiva', front: '⚖️ O que acontece quando a vaca perde muita condição corporal no pós-parto?', back: 'O retorno da atividade ovariana pode atrasar, prolongando o anestro.' },
  { id: 'r12', tag: 'Biotecnologias · IA', front: '🐖 Por que a técnica de IA muda entre espécies?', back: 'Porque a anatomia reprodutiva muda e exige adaptação da pipeta e do manejo.' },
  { id: 'r13', tag: 'Biotecnologias · IATF', front: '💉 O que a IATF facilita no manejo do rebanho?', back: 'Permite sincronizar lotes e reduzir a dependência da observação direta do cio.' },
  { id: 'r14', tag: 'Biotecnologias · Hormônios', front: '💉 O que a PGF2α faz quando há corpo lúteo funcional?', back: 'Promove luteólise, reduz progesterona e favorece um novo avanço do ciclo.' },
  { id: 'r15', tag: 'Biotecnologias · TE', front: '🧬 Por que usar transferência de embriões em uma doadora valiosa?', back: 'Porque aumenta o aproveitamento genético da fêmea em várias receptoras.' },
]

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

const ALL_CARDS: Card[] = [
  ...db.drugs.map(drug => ({
    id: `drug-${drug.id}`,
    tag: drug.category,
    front: `💊 ${drug.name}\nQual é o mecanismo de ação?`,
    back: drug.mechanism,
  })),
  ...db.drugs.map(drug => ({
    id: `ci-${drug.id}`,
    tag: drug.category,
    front: `💊 ${drug.name}\nQuais são as principais contraindicações?`,
    back: `• ${drug.contraindications.join('\n• ')}`,
  })),
  ...db.diseases.map(disease => ({
    id: `dis-${disease.id}`,
    tag: disease.category,
    front: `${disease.emoji} ${disease.name}\nQuais são os principais sinais clínicos?`,
    back: `• ${(disease.symptoms as string[]).slice(0, 5).join('\n• ')}`,
  })),
  ...REPRO_CARDS,
]

type FilterKey = 'repro' | 'farma' | 'clinica' | 'todos'

const FILTERS: { key: FilterKey; label: string; count: number }[] = [
  { key: 'repro', label: '🐄 Reprodução A1', count: REPRO_CARDS.length },
  { key: 'farma', label: '💊 Farmacologia', count: db.drugs.length * 2 },
  { key: 'clinica', label: '🏥 Clínica', count: db.diseases.length },
  { key: 'todos', label: 'Todos', count: 0 },
]

function filterCards(key: FilterKey) {
  if (key === 'repro') return REPRO_CARDS
  if (key === 'farma') return ALL_CARDS.filter(card => card.id.startsWith('drug-') || card.id.startsWith('ci-'))
  if (key === 'clinica') return ALL_CARDS.filter(card => card.id.startsWith('dis-'))
  return shuffle(ALL_CARDS).slice(0, 30)
}

function FlashCard({
  card,
  flipped,
  onFlip,
}: {
  card: Card
  flipped: boolean
  onFlip: () => void
}) {
  return (
    <div onClick={onFlip} style={{ perspective: 1200 }} className="cursor-pointer select-none">
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative h-64 w-full"
      >
        <div
          className="absolute inset-0 flex flex-col justify-between rounded-3xl border border-slate-700 bg-slate-800 p-7"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="self-start rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400">
            {card.tag}
          </span>
          <p className="flex flex-1 items-center justify-center whitespace-pre-line px-2 text-center text-[15px] font-semibold leading-relaxed text-slate-200">
            {card.front}
          </p>
          <p className="text-center text-xs text-slate-600">Toque no card para revelar</p>
        </div>

        <div
          className="absolute inset-0 flex flex-col justify-center overflow-y-auto rounded-3xl border border-teal-500/30 bg-gradient-to-br from-teal-900/30 to-slate-800 p-7"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="whitespace-pre-line text-center text-sm leading-relaxed text-slate-300">
            {card.back}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

function RevisaoContent({
  profileId,
  onRequestCase,
}: {
  profileId?: string
  onRequestCase?: () => void
}) {
  const [filter, setFilter] = useState<FilterKey>('repro')
  const [deck, setDeck] = useState<Card[]>(() => shuffle(filterCards('repro')))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const card = deck[index]
  const pct = deck.length > 0 ? Math.round(((index + 1) / deck.length) * 100) : 0
  const sessionCompleted = deck.length > 0 && index === deck.length - 1 && flipped

  const applyFilter = (nextFilter: FilterKey) => {
    setFilter(nextFilter)
    setDeck(shuffle(filterCards(nextFilter)))
    setIndex(0)
    setFlipped(false)
  }

  const goTo = (next: number) => {
    setFlipped(false)
    setTimeout(() => setIndex(next), 150)
  }

  const restart = () => {
    setDeck(shuffle(filterCards(filter)))
    setIndex(0)
    setFlipped(false)
  }

  const handleFlip = () => {
    if (!flipped) markReviewCompleted(profileId)
    setFlipped(current => !current)
  }

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-8">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <GraduationCap size={22} className="text-teal-400" />
          <h1 className="text-2xl font-bold text-white">Flashcards</h1>
        </div>
        <p className="text-sm text-slate-400">Memorização por repetição espaçada</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map(item => (
          <button
            key={item.key}
            onClick={() => applyFilter(item.key)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
              filter === item.key
                ? 'border-teal-500/30 bg-teal-500/20 text-teal-300'
                : 'border-slate-700/60 bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {item.label}
            {item.count > 0 ? ` (${item.count})` : ''}
          </button>
        ))}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-sm text-slate-500 tabular-nums">
          {deck.length === 0 ? '0 / 0' : `${index + 1} / ${deck.length}`}
        </span>
        <div className="flex items-center gap-2">
          <BookOpen size={12} className="text-slate-600" />
          <span className="text-xs text-slate-600">
            {flipped ? 'Resposta visível' : 'Toque no card para revelar'}
          </span>
          <span className="text-xs font-bold text-teal-500">{pct}%</span>
        </div>
      </div>

      <div className="mb-5 h-1.5 overflow-hidden rounded-full border border-slate-700/40 bg-slate-800">
        <motion.div
          className="h-full rounded-full bg-teal-500"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {deck.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center">
          <p className="text-sm font-bold text-white">Nenhum flashcard disponível ainda.</p>
          <p className="mt-1 text-xs text-slate-400">Use o Início para começar uma sessão de estudo.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.18 }}
          >
            <FlashCard card={card} flipped={flipped} onFlip={handleFlip} />
          </motion.div>
        </AnimatePresence>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => goTo(Math.max(0, index - 1))}
          disabled={deck.length === 0 || index === 0}
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:border-teal-500/40 hover:text-white disabled:opacity-30"
        >
          <ChevronLeft size={15} /> Anterior
        </button>
        <button
          onClick={restart}
          title="Embaralhar"
          className="p-2 text-slate-600 transition-colors hover:text-teal-400"
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={() => goTo(Math.min(deck.length - 1, index + 1))}
          disabled={deck.length === 0 || index === deck.length - 1}
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-teal-700 disabled:opacity-30"
        >
          Próximo <ChevronRight size={15} />
        </button>
      </div>

      {sessionCompleted && (
        <div className="mt-5 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/8 p-4">
          <p className="text-sm font-bold text-white">Boa! Quer aplicar isso em um caso clínico?</p>
          <p className="mt-1 text-xs text-slate-400">
            Leva só alguns minutos e ajuda a transformar revisão em decisão prática.
          </p>
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
  const resolvedProfileId = useMemo(() => profileId ?? getActiveProfile()?.id, [profileId])

  return (
    <Gatekeeper pageTitle="Flashcards">
      <RevisaoContent profileId={resolvedProfileId} onRequestCase={onRequestCase} />
    </Gatekeeper>
  )
}
