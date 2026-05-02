import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, ChevronLeft, ChevronRight, RotateCcw, BookOpen } from 'lucide-react'
import Gatekeeper from '../components/Gatekeeper'
import db from '../data/central_db.json'
import { getMergedFlashcardBank } from '../utils/mergeStudyContent'
import type { ParsedFlashcard } from '../utils/parseStudyContent'
import { getActiveProfile } from '../utils/profiles'
import { markReviewCompleted } from '../utils/reviewHabit'

type PrimaryDeckKey = 'mixed' | 'repro' | 'farma' | 'clinica' | 'producao'
type ContentDeckKey = Exclude<PrimaryDeckKey, 'mixed'>

type Card = {
  id: string
  tag: string
  front: string
  back: string
  primaryDeck: ContentDeckKey
  secondaryLabel?: string
  tema?: string
  subtema?: string
}

type SecondaryFilter = {
  key: string
  label: string
  cards: Card[]
}

type PrimaryDeck = {
  key: PrimaryDeckKey
  label: string
  countLabel?: string
  cards: Card[]
  secondaryFilters: SecondaryFilter[]
}

const DEFAULT_PRIMARY_DECK: PrimaryDeckKey = 'repro'
const MIXED_SESSION_LIMIT = 30
const ALL_SECONDARY_KEY = 'all'

const REPRO_CARDS: Card[] = [
  {
    id: 'r01',
    tag: 'Anatomia · Trato feminino',
    front: '🌸 O que a vulva protege no sistema reprodutor feminino?',
    back: 'Protege a entrada do trato genital e ajuda a reduzir contaminações externas.',
    primaryDeck: 'repro',
    secondaryLabel: 'Anatomia Reprodutiva',
  },
  {
    id: 'r02',
    tag: 'Anatomia · Cérvix',
    front: '🔍 Qual é a função principal da cérvix?',
    back: 'Controlar a passagem para o útero. Ela protege o ambiente uterino e muda conforme a fase do ciclo.',
    primaryDeck: 'repro',
    secondaryLabel: 'Anatomia Reprodutiva',
  },
  {
    id: 'r03',
    tag: 'Anatomia · Ovidutos',
    front: '🔬 O que os ovidutos fazem após a ovulação?',
    back: 'Captam o oócito e servem como local comum da fecundação antes da chegada ao útero.',
    primaryDeck: 'repro',
    secondaryLabel: 'Anatomia Reprodutiva',
  },
  {
    id: 'r04',
    tag: 'Ciclo estral · Estruturas',
    front: '🌕 Qual a diferença entre folículo e corpo lúteo?',
    back: 'O folículo produz estrogênio e antecede a ovulação. O corpo lúteo produz progesterona depois da ovulação.',
    primaryDeck: 'repro',
    secondaryLabel: 'Ciclo Estral',
  },
  {
    id: 'r05',
    tag: 'Ciclo estral · Hormônios',
    front: '⚗️ O que o estrogênio faz no estro?',
    back: 'Favorece sinais de cio e facilita o ambiente para a reprodução naquele momento.',
    primaryDeck: 'repro',
    secondaryLabel: 'Ciclo Estral',
  },
  {
    id: 'r06',
    tag: 'Ciclo estral · Hormônios',
    front: '⚗️ Por que a progesterona é importante após a ovulação?',
    back: 'Ela prepara e mantém o útero mais estável para uma possível gestação.',
    primaryDeck: 'repro',
    secondaryLabel: 'Ciclo Estral',
  },
  {
    id: 'r07',
    tag: 'Ciclo estral · Fases',
    front: '🔄 Por que a ordem das fases do ciclo importa no manejo?',
    back: 'Porque ela ajuda a prever cio, ovulação e o melhor momento para cobertura ou inseminação.',
    primaryDeck: 'repro',
    secondaryLabel: 'Ciclo Estral',
  },
  {
    id: 'r08',
    tag: 'Detecção de cio',
    front: '👁️ O que o aceite de monta indica em bovinos?',
    back: 'É um dos sinais mais confiáveis de estro e ajuda a escolher a janela de inseminação.',
    primaryDeck: 'repro',
    secondaryLabel: 'Ciclo Estral',
  },
  {
    id: 'r09',
    tag: 'Sazonalidade',
    front: '☀️ Como o fotoperíodo influencia a reprodução?',
    back: 'A luz altera sinais hormonais e pode ativar ou limitar o ciclo em espécies estacionais.',
    primaryDeck: 'repro',
    secondaryLabel: 'Ciclo Estral',
  },
  {
    id: 'r10',
    tag: 'Sazonalidade',
    front: '🌗 Por que ovelhas e éguas não respondem igual ao comprimento do dia?',
    back: 'Porque cada espécie tem padrão sazonal diferente e ativa a reprodução em épocas distintas.',
    primaryDeck: 'repro',
    secondaryLabel: 'Ciclo Estral',
  },
  {
    id: 'r11',
    tag: 'Nutrição reprodutiva',
    front: '⚖️ O que acontece quando a vaca perde muita condição corporal no pós-parto?',
    back: 'O retorno da atividade ovariana pode atrasar, prolongando o anestro.',
    primaryDeck: 'repro',
    secondaryLabel: 'Reprodução Animal',
  },
  {
    id: 'r12',
    tag: 'Biotecnologias · IA',
    front: '🐖 Por que a técnica de IA muda entre espécies?',
    back: 'Porque a anatomia reprodutiva muda e exige adaptação da pipeta e do manejo.',
    primaryDeck: 'repro',
    secondaryLabel: 'Biotecnologias',
  },
  {
    id: 'r13',
    tag: 'Biotecnologias · IATF',
    front: '💉 O que a IATF facilita no manejo do rebanho?',
    back: 'Permite sincronizar lotes e reduzir a dependência da observação direta do cio.',
    primaryDeck: 'repro',
    secondaryLabel: 'Biotecnologias',
  },
  {
    id: 'r14',
    tag: 'Biotecnologias · Hormônios',
    front: '💉 O que a PGF2α faz quando há corpo lúteo funcional?',
    back: 'Promove luteólise, reduz progesterona e favorece um novo avanço do ciclo.',
    primaryDeck: 'repro',
    secondaryLabel: 'Biotecnologias',
  },
  {
    id: 'r15',
    tag: 'Biotecnologias · TE',
    front: '🧬 Por que usar transferência de embriões em uma doadora valiosa?',
    back: 'Porque aumenta o aproveitamento genético da fêmea em várias receptoras.',
    primaryDeck: 'repro',
    secondaryLabel: 'Biotecnologias',
  },
]

const FARMACOLOGIA_CARDS: Card[] = [
  ...db.drugs.map(drug => ({
    id: `drug-${drug.id}`,
    tag: drug.category,
    front: `💊 ${drug.name}\nQual é o mecanismo de ação?`,
    back: drug.mechanism,
    primaryDeck: 'farma' as const,
    secondaryLabel: drug.category,
  })),
  ...db.drugs.map(drug => ({
    id: `ci-${drug.id}`,
    tag: drug.category,
    front: `💊 ${drug.name}\nQuais são as principais contraindicações?`,
    back: `• ${drug.contraindications.join('\n• ')}`,
    primaryDeck: 'farma' as const,
    secondaryLabel: drug.category,
  })),
]

const CLINICA_CARDS: Card[] = db.diseases.map(disease => ({
  id: `dis-${disease.id}`,
  tag: disease.category,
  front: `${disease.emoji} ${disease.name}\nQuais são os principais sinais clínicos?`,
  back: `• ${(disease.symptoms as string[]).slice(0, 5).join('\n• ')}`,
  primaryDeck: 'clinica' as const,
  secondaryLabel: disease.category,
}))

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function normalizeForMatch(value?: string) {
  return (value ?? '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function inferReproductionSecondaryLabel(...values: Array<string | undefined>) {
  const text = normalizeForMatch(values.filter(Boolean).join(' '))

  if (
    text.includes('anatomia') ||
    text.includes('cervix') ||
    text.includes('ovidut') ||
    text.includes('vulva')
  ) {
    return 'Anatomia Reprodutiva'
  }

  if (
    text.includes('biotecnolog') ||
    text.includes('insemin') ||
    text.includes('iatf') ||
    text.includes('transferencia') ||
    text.includes('te ') ||
    text.endsWith(' te') ||
    text.includes('pgf')
  ) {
    return 'Biotecnologias'
  }

  if (
    text.includes('ciclo') ||
    text.includes('estro') ||
    text.includes('cio') ||
    text.includes('sazonal') ||
    text.includes('fotoperiod')
  ) {
    return 'Ciclo Estral'
  }

  return 'Reprodução Animal'
}

function inferPrimaryDeck(card: ParsedFlashcard): ContentDeckKey | null {
  const text = normalizeForMatch([card.tema, card.subtema, card.tag].filter(Boolean).join(' '))

  if (
    text.includes('saude de animais de producao') ||
    text.includes('pncebt') ||
    text.includes('pnse') ||
    text.includes('tuberculose') ||
    text.includes('brucelose') ||
    text.includes('aie') ||
    text.includes('mormo')
  ) {
    return 'producao'
  }

  if (text.includes('farmacolog')) return 'farma'

  if (
    text.includes('reproduc') ||
    text.includes('reprodut') ||
    text.includes('anatomia') ||
    text.includes('estro') ||
    text.includes('cio') ||
    text.includes('biotecnolog') ||
    text.includes('gesta')
  ) {
    return 'repro'
  }

  if (
    text.includes('clinica') ||
    text.includes('doenca') ||
    text.includes('patologia') ||
    text.includes('ruminante') ||
    text.includes('pequenos')
  ) {
    return 'clinica'
  }

  return null
}

function parsedFlashcardToCard(card: ParsedFlashcard): Card | null {
  const primaryDeck = inferPrimaryDeck(card)
  if (!primaryDeck) return null

  const secondaryLabel = primaryDeck === 'producao'
    ? card.subtema || card.tag || card.tema
    : primaryDeck === 'repro'
      ? inferReproductionSecondaryLabel(card.subtema, card.tag, card.tema)
      : card.tag || card.subtema || card.tema

  return {
    id: card.id,
    tag: card.tag || card.subtema,
    front: card.front,
    back: card.back,
    primaryDeck,
    secondaryLabel,
    tema: card.tema,
    subtema: card.subtema,
  }
}

function buildSecondaryFilters(deckKey: ContentDeckKey, cards: Card[]): SecondaryFilter[] {
  const groups = new Map<string, Card[]>()

  cards.forEach(card => {
    const label = card.secondaryLabel?.trim()
    if (!label) return

    const groupedCards = groups.get(label) ?? []
    groupedCards.push(card)
    groups.set(label, groupedCards)
  })

  const preferredReproOrder = [
    'Anatomia Reprodutiva',
    'Ciclo Estral',
    'Biotecnologias',
    'Reprodução Animal',
  ]

  return Array.from(groups.entries())
    .sort(([labelA, cardsA], [labelB, cardsB]) => {
      if (deckKey === 'repro') {
        const orderA = preferredReproOrder.indexOf(labelA)
        const orderB = preferredReproOrder.indexOf(labelB)
        if (orderA !== -1 || orderB !== -1) {
          return (orderA === -1 ? Number.MAX_SAFE_INTEGER : orderA)
            - (orderB === -1 ? Number.MAX_SAFE_INTEGER : orderB)
        }
      }

      if (deckKey === 'producao' && cardsA.length !== cardsB.length) {
        return cardsB.length - cardsA.length
      }

      return labelA.localeCompare(labelB, 'pt-BR')
    })
    .map(([label, groupedCards]) => ({
      key: label,
      label,
      cards: groupedCards,
    }))
}

function buildDeck(cards: Card[], primaryKey: PrimaryDeckKey) {
  if (primaryKey === 'mixed') return shuffle(cards).slice(0, MIXED_SESSION_LIMIT)
  return shuffle(cards)
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
          className="absolute inset-0 flex flex-col justify-between rounded-3xl border border-neutral-700 bg-neutral-800 p-7"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="self-start rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-400">
            {card.tag}
          </span>
          <p className="flex flex-1 items-center justify-center whitespace-pre-line px-2 text-center text-[15px] font-semibold leading-relaxed text-neutral-200">
            {card.front}
          </p>
          <p className="text-center text-xs text-neutral-600">Toque no card para revelar</p>
        </div>

        <div
          className="absolute inset-0 flex flex-col justify-center overflow-y-auto rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-900/30 to-neutral-800 p-7"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="whitespace-pre-line text-center text-sm leading-relaxed text-neutral-300">
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
  const [extraCards, setExtraCards] = useState<Card[]>(() => (
    getMergedFlashcardBank(profileId)
      .map(parsedFlashcardToCard)
      .filter((card): card is Card => card !== null)
  ))
  const [primaryFilter, setPrimaryFilter] = useState<PrimaryDeckKey>(DEFAULT_PRIMARY_DECK)
  const [secondaryFilter, setSecondaryFilter] = useState(ALL_SECONDARY_KEY)
  const [deck, setDeck] = useState<Card[]>(() => shuffle(REPRO_CARDS))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    const refreshFlashcards = () => {
      setExtraCards(
        getMergedFlashcardBank(profileId)
          .map(parsedFlashcardToCard)
          .filter((card): card is Card => card !== null)
      )
    }

    refreshFlashcards()
    window.addEventListener('vetstudy_flashcards_update', refreshFlashcards)
    return () => window.removeEventListener('vetstudy_flashcards_update', refreshFlashcards)
  }, [profileId])

  const reproCards = useMemo(() => [
    ...REPRO_CARDS,
    ...extraCards.filter(card => card.primaryDeck === 'repro'),
  ], [extraCards])

  const farmacologiaCards = useMemo(() => [
    ...FARMACOLOGIA_CARDS,
    ...extraCards.filter(card => card.primaryDeck === 'farma'),
  ], [extraCards])

  const clinicaCards = useMemo(() => [
    ...CLINICA_CARDS,
    ...extraCards.filter(card => card.primaryDeck === 'clinica'),
  ], [extraCards])

  const producaoCards = useMemo(() => (
    extraCards.filter(card => card.primaryDeck === 'producao')
  ), [extraCards])

  const allCards = useMemo(() => [
    ...reproCards,
    ...farmacologiaCards,
    ...clinicaCards,
    ...producaoCards,
  ], [clinicaCards, farmacologiaCards, producaoCards, reproCards])

  const primaryDecks = useMemo<PrimaryDeck[]>(() => ([
    {
      key: 'mixed',
      label: 'Sessão mista',
      cards: allCards,
      secondaryFilters: [],
    },
    {
      key: 'repro',
      label: 'Reprodução A1',
      countLabel: String(reproCards.length),
      cards: reproCards,
      secondaryFilters: buildSecondaryFilters('repro', reproCards),
    },
    {
      key: 'farma',
      label: 'Farmacologia',
      countLabel: String(farmacologiaCards.length),
      cards: farmacologiaCards,
      secondaryFilters: buildSecondaryFilters('farma', farmacologiaCards),
    },
    {
      key: 'clinica',
      label: 'Clínica',
      countLabel: String(clinicaCards.length),
      cards: clinicaCards,
      secondaryFilters: buildSecondaryFilters('clinica', clinicaCards),
    },
    {
      key: 'producao',
      label: 'Saúde de Animais de Produção',
      countLabel: String(producaoCards.length),
      cards: producaoCards,
      secondaryFilters: buildSecondaryFilters('producao', producaoCards),
    },
  ]), [allCards, clinicaCards, farmacologiaCards, producaoCards, reproCards])

  const selectedPrimaryDeck = primaryDecks.find(deckItem => deckItem.key === primaryFilter) ?? primaryDecks[0]
  const showSecondaryFilters = selectedPrimaryDeck.key !== 'mixed' && selectedPrimaryDeck.secondaryFilters.length > 0
  const availableSecondaryKeys = new Set(selectedPrimaryDeck.secondaryFilters.map(filterItem => filterItem.key))
  const normalizedSecondaryFilter = showSecondaryFilters && availableSecondaryKeys.has(secondaryFilter)
    ? secondaryFilter
    : ALL_SECONDARY_KEY

  useEffect(() => {
    if (secondaryFilter !== normalizedSecondaryFilter) {
      setSecondaryFilter(normalizedSecondaryFilter)
    }
  }, [normalizedSecondaryFilter, secondaryFilter])

  const activeCards = useMemo(() => {
    if (selectedPrimaryDeck.key === 'mixed') return selectedPrimaryDeck.cards
    if (normalizedSecondaryFilter === ALL_SECONDARY_KEY) return selectedPrimaryDeck.cards

    return selectedPrimaryDeck.secondaryFilters.find(filterItem => filterItem.key === normalizedSecondaryFilter)?.cards ?? selectedPrimaryDeck.cards
  }, [normalizedSecondaryFilter, selectedPrimaryDeck])

  useEffect(() => {
    setDeck(buildDeck(activeCards, selectedPrimaryDeck.key))
    setIndex(0)
    setFlipped(false)
  }, [activeCards, selectedPrimaryDeck.key])

  const card = deck[index] ?? deck[0]
  const pct = deck.length > 0 ? Math.round(((index + 1) / deck.length) * 100) : 0
  const sessionCompleted = deck.length > 0 && index === deck.length - 1 && flipped
  const progressLabel = deck.length === 0
    ? '0 / 0'
    : selectedPrimaryDeck.key === 'mixed'
      ? `${index + 1} / ${deck.length} · sessão mista`
      : `${index + 1} / ${deck.length}`

  const applyPrimaryFilter = (nextFilter: PrimaryDeckKey) => {
    setPrimaryFilter(nextFilter)
    setSecondaryFilter(ALL_SECONDARY_KEY)
  }

  const applySecondaryFilter = (nextFilter: string) => {
    setSecondaryFilter(nextFilter)
  }

  const goTo = (next: number) => {
    setFlipped(false)
    setTimeout(() => setIndex(next), 150)
  }

  const restart = () => {
    setDeck(buildDeck(activeCards, selectedPrimaryDeck.key))
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
          <GraduationCap size={22} className="text-primary-400" />
          <h1 className="text-2xl font-bold text-neutral-100">Flashcards</h1>
        </div>
        <p className="text-sm text-neutral-400">Memorização por repetição espaçada</p>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {primaryDecks.map(deckItem => (
          <button
            key={deckItem.key}
            onClick={() => applyPrimaryFilter(deckItem.key)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
              primaryFilter === deckItem.key
                ? 'border-primary-500/30 bg-primary-500/20 text-primary-300'
                : 'border-neutral-700/60 bg-neutral-800 text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {deckItem.label}
            {deckItem.countLabel ? ` (${deckItem.countLabel})` : ''}
          </button>
        ))}
      </div>

      {showSecondaryFilters && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => applySecondaryFilter(ALL_SECONDARY_KEY)}
            className={`rounded-xl border px-3 py-1 text-[11px] font-semibold transition-all ${
              normalizedSecondaryFilter === ALL_SECONDARY_KEY
                ? 'border-primary-500/30 bg-primary-500/16 text-primary-300'
                : 'border-neutral-700/50 bg-neutral-900/70 text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Todos
          </button>
          {selectedPrimaryDeck.secondaryFilters.map(filterItem => (
            <button
              key={filterItem.key}
              onClick={() => applySecondaryFilter(filterItem.key)}
              className={`rounded-xl border px-3 py-1 text-[11px] font-semibold transition-all ${
                normalizedSecondaryFilter === filterItem.key
                  ? 'border-primary-500/30 bg-primary-500/16 text-primary-300'
                  : 'border-neutral-700/50 bg-neutral-900/70 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {filterItem.label}
            </button>
          ))}
        </div>
      )}

      {selectedPrimaryDeck.key === 'mixed' && (
        <p className="mb-4 text-xs text-neutral-500">
          Sessão com 30 cards aleatórios entre {allCards.length} disponíveis.
        </p>
      )}

      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-sm text-neutral-500 tabular-nums">
          {progressLabel}
        </span>
        <div className="flex items-center gap-2">
          <BookOpen size={12} className="text-neutral-600" />
          <span className="text-xs text-neutral-600">
            {flipped ? 'Resposta visível' : selectedPrimaryDeck.key === 'mixed' ? selectedPrimaryDeck.label : 'Toque no card para revelar'}
          </span>
          <span className="text-xs font-bold text-primary-500">{pct}%</span>
        </div>
      </div>

      <div className="mb-5 h-1.5 overflow-hidden rounded-full border border-neutral-700/40 bg-neutral-800">
        <motion.div
          className="h-full rounded-full bg-primary-500"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {deck.length === 0 || !card ? (
        <div className="app-panel rounded-2xl p-5 text-center">
          <p className="text-sm font-bold text-white">Nenhum flashcard disponível ainda.</p>
          <p className="mt-1 text-xs text-neutral-400">Use o Início para começar uma sessão de estudo.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedPrimaryDeck.key}-${normalizedSecondaryFilter}-${index}`}
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
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-2.5 text-sm font-semibold text-neutral-300 transition-all hover:border-primary-500/40 hover:text-neutral-100 disabled:opacity-30"
        >
          <ChevronLeft size={15} /> Anterior
        </button>
        <button
          onClick={restart}
          title="Embaralhar"
          className="p-2 text-neutral-600 transition-colors hover:text-primary-400"
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={() => goTo(Math.min(deck.length - 1, index + 1))}
          disabled={deck.length === 0 || index === deck.length - 1}
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-600 disabled:opacity-30"
        >
          Próximo <ChevronRight size={15} />
        </button>
      </div>

      {sessionCompleted && (
        <div className="mt-5 rounded-2xl border border-accent-500/20 bg-accent-500/8 p-4">
          <p className="text-sm font-bold text-white">Boa! Quer aplicar isso em um caso clínico?</p>
          <p className="mt-1 text-xs text-neutral-400">
            Leva só alguns minutos e ajuda a transformar revisão em decisão prática.
          </p>
          <button
            type="button"
            onClick={() => onRequestCase?.()}
            className="mt-3 min-h-[44px] w-full rounded-xl bg-accent-500/90 px-3 py-2 text-sm font-bold text-white transition hover:bg-accent-400"
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
