import db from '../data/central_db.json'
import { getMergedQuestionBank, loadProfileFlashcards } from './mergeStudyContent'

export type SearchTargetPage = 'doencas' | 'medicamentos'

export type GlobalSearchResultType = 'disease' | 'drug' | 'protocol' | 'study'

export interface GlobalSearchResult {
  id: string
  type: GlobalSearchResultType
  groupLabel: 'Doenças' | 'Fármacos' | 'Protocolos' | 'Conteúdo de Estudo'
  title: string
  subtitle: string
  summary: string
  actionText: string
  details: string[]
  targetPage?: SearchTargetPage
  targetId?: string
  score: number
}

interface ClinicalProtocol {
  id: string
  title: string
  species: string
  category: string
  tags: string[]
  objective: string
  indications: string[]
  steps: string[]
}

const CLINICAL_PROTOCOLS: ClinicalProtocol[] = [
  {
    id: 'ovsynch',
    title: 'Protocolo Ovsynch',
    species: 'Bovino',
    category: 'Sincronização reprodutiva',
    tags: ['iatf', 'ovsynch', 'gnrh', 'pgf2alfa', 'reprodução'],
    objective: 'Sincronizar ovulação para inseminação em tempo fixo sem depender da observação de cio.',
    indications: ['IATF em vacas ciclando', 'Lotes com baixa detecção de cio', 'Organização reprodutiva do rebanho'],
    steps: [
      'D0: aplicar GnRH.',
      'D7: aplicar PGF2alfa para luteólise.',
      'D9: repetir GnRH.',
      'Realizar IATF cerca de 16 a 20 horas após a segunda aplicação.',
    ],
  },
  {
    id: 'cidr-ecg',
    title: 'IATF com progesterona + eCG',
    species: 'Bovino',
    category: 'Sincronização reprodutiva',
    tags: ['cidr', 'progesterona', 'ecg', 'anestro', 'iatf'],
    objective: 'Induzir retorno cíclico e sincronizar fêmeas, especialmente vacas em anestro pós-parto.',
    indications: ['Vacas em anestro', 'Lotes de corte no pós-parto', 'Sincronização com dispositivo intravaginal'],
    steps: [
      'D0: inserir dispositivo de progesterona e associar estradiol conforme protocolo.',
      'D7 a D9: retirar o dispositivo.',
      'Na retirada: aplicar eCG e PGF2alfa quando indicado.',
      'Realizar IATF de 48 a 56 horas após a retirada, conforme protocolo adotado.',
    ],
  },
  {
    id: 'timpanismo-emergencia',
    title: 'Conduta rápida no timpanismo bovino',
    species: 'Bovino',
    category: 'Emergência clínica',
    tags: ['timpanismo', 'rúmen', 'emergência', 'ruminantes'],
    objective: 'Aliviar rapidamente a distensão ruminal e reduzir risco de morte por insuficiência respiratória.',
    indications: ['Distensão aguda do flanco esquerdo', 'Dispneia em bovinos', 'Suspeita de gás livre ou espuma no rúmen'],
    steps: [
      'Avaliar gravidade respiratória e manter o animal em estação, se possível.',
      'Passar sonda orogástrica para diferenciar gás livre de timpanismo espumoso.',
      'Se houver espuma, usar antiespumante por sonda.',
      'Se houver risco imediato de morte, realizar trocarização no flanco esquerdo.',
    ],
  },
  {
    id: 'metrite-pos-parto',
    title: 'Abordagem inicial da metrite pós-parto',
    species: 'Bovino',
    category: 'Puerpério e útero',
    tags: ['metrite', 'pós-parto', 'útero', 'bovino'],
    objective: 'Controlar infecção uterina sistêmica e reduzir impacto sobre fertilidade e produção.',
    indications: ['Vaca recente parida com febre', 'Descarga uterina fétida', 'Apatia e queda de produção'],
    steps: [
      'Confirmar contexto pós-parto e presença de sinais sistêmicos.',
      'Instituir antimicrobiano sistêmico quando indicado clinicamente.',
      'Associar anti-inflamatório e suporte hídrico conforme estado geral.',
      'Reavaliar temperatura, apetite e involução uterina nos dias seguintes.',
    ],
  },
]

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function makeScore(query: string, weightedFields: Array<[string, number]>) {
  const normalizedQuery = normalizeText(query).trim()
  const queryTerms = tokenize(query)
  if (!normalizedQuery || queryTerms.length === 0) return 0

  return queryTerms.reduce((total, term) => (
    total + weightedFields.reduce((fieldTotal, [field, weight]) => {
      const normalizedField = normalizeText(field)
      const fieldTerms = tokenize(field)

      if (normalizedField.includes(term)) return fieldTotal + weight
      if (fieldTerms.some(fieldTerm => fieldTerm.startsWith(term))) return fieldTotal + Math.max(1, weight - 1)
      if (fieldTerms.some(fieldTerm => term.startsWith(fieldTerm) && fieldTerm.length >= 3)) return fieldTotal + 1
      return fieldTotal
    }, 0)
  ), 0)
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function buildDiseaseResults(query: string): GlobalSearchResult[] {
  return db.diseases
    .map(disease => ({
      id: disease.id,
      type: 'disease' as const,
      groupLabel: 'Doenças' as const,
      title: disease.name,
      subtitle: `${disease.species} · ${disease.category}`,
      summary: Array.isArray(disease.treatment) ? disease.treatment[0] : disease.treatment,
      actionText: `Conduta: ${Array.isArray(disease.treatment) ? disease.treatment[0] : disease.treatment}`,
      details: [
        `Etiologia: ${disease.etiology}`,
        ...(Array.isArray(disease.symptoms) ? disease.symptoms.slice(0, 2).map(symptom => `Sinal: ${symptom}`) : []),
      ],
      targetPage: 'doencas' as const,
      targetId: disease.id,
      score: makeScore(query, [
        [disease.name, 6],
        [disease.species, 3],
        [disease.category, 3],
        [disease.tags.join(' '), 4],
        [disease.etiology, 2],
        [Array.isArray(disease.symptoms) ? disease.symptoms.join(' ') : '', 2],
        [Array.isArray(disease.treatment) ? disease.treatment.join(' ') : disease.treatment, 2],
      ]),
    }))
    .filter(result => result.score > 0)
}

function buildDrugResults(query: string): GlobalSearchResult[] {
  return db.drugs
    .map(drug => {
      const firstSpecies = drug.species[0]
      return {
        id: drug.id,
        type: 'drug' as const,
        groupLabel: 'Fármacos' as const,
        title: drug.name,
        subtitle: `${drug.category} · ${uniqueStrings(drug.species.map(species => species.name)).join(', ')}`,
        summary: firstSpecies
          ? `${firstSpecies.name}: ${firstSpecies.dose} · ${firstSpecies.route}`
          : drug.mechanism,
        actionText: firstSpecies
          ? `Dose rápida: ${firstSpecies.name} ${firstSpecies.dose}`
          : drug.category,
        details: [
          `Indicação prática: ${drug.mechanism}`,
          ...drug.species.slice(0, 2).map(species => `${species.name}: ${species.dose} · ${species.interval}`),
        ],
        targetPage: 'medicamentos' as const,
        targetId: drug.id,
        score: makeScore(query, [
          [drug.name, 6],
          [drug.category, 3],
          [drug.tags.join(' '), 4],
          [drug.mechanism, 2],
          [drug.contraindications.join(' '), 1],
          [drug.species.map(species => `${species.name} ${species.dose} ${species.route} ${species.interval} ${species.notes}`).join(' '), 3],
        ]),
      }
    })
    .filter(result => result.score > 0)
}

function buildProtocolResults(query: string): GlobalSearchResult[] {
  return CLINICAL_PROTOCOLS
    .map(protocol => ({
      id: protocol.id,
      type: 'protocol' as const,
      groupLabel: 'Protocolos' as const,
      title: protocol.title,
      subtitle: `${protocol.species} · ${protocol.category}`,
      summary: protocol.objective,
      actionText: `Passos: ${protocol.steps.slice(0, 2).join(' ')}`,
      details: [
        `Objetivo: ${protocol.objective}`,
        `Indicações: ${protocol.indications.join(' · ')}`,
        ...protocol.steps.map((step, index) => `${index + 1}. ${step}`),
      ],
      score: makeScore(query, [
        [protocol.title, 6],
        [protocol.species, 3],
        [protocol.category, 3],
        [protocol.tags.join(' '), 4],
        [protocol.objective, 3],
        [protocol.indications.join(' '), 2],
        [protocol.steps.join(' '), 3],
      ]),
    }))
    .filter(result => result.score > 0)
}

function buildStudyResults(query: string, profileId?: string): GlobalSearchResult[] {
  if (!profileId) return []

  const questions = getMergedQuestionBank()
  const flashcards = loadProfileFlashcards(profileId)
  const groups = new Map<string, {
    tema: string
    subtema: string
    questionCount: number
    flashcardCount: number
    questionSnippets: string[]
    flashcardSnippets: string[]
    searchText: string[]
  }>()

  questions.forEach(question => {
    const key = `${question.tema}::${question.subtema}`
    const existing = groups.get(key) ?? {
      tema: question.tema,
      subtema: question.subtema,
      questionCount: 0,
      flashcardCount: 0,
      questionSnippets: [],
      flashcardSnippets: [],
      searchText: [],
    }
    existing.questionCount += 1
    if (existing.questionSnippets.length < 2) existing.questionSnippets.push(question.pergunta)
    existing.searchText.push(question.pergunta, question.explicacao, question.tema, question.subtema)
    groups.set(key, existing)
  })

  flashcards.forEach(card => {
    const key = `${card.tema}::${card.subtema}`
    const existing = groups.get(key) ?? {
      tema: card.tema,
      subtema: card.subtema,
      questionCount: 0,
      flashcardCount: 0,
      questionSnippets: [],
      flashcardSnippets: [],
      searchText: [],
    }
    existing.flashcardCount += 1
    if (existing.flashcardSnippets.length < 2) existing.flashcardSnippets.push(card.front)
    existing.searchText.push(card.front, card.back, card.tema, card.subtema)
    groups.set(key, existing)
  })

  return Array.from(groups.values())
    .map(group => ({
      id: `${group.tema}::${group.subtema}`,
      type: 'study' as const,
      groupLabel: 'Conteúdo de Estudo' as const,
      title: `${group.tema} › ${group.subtema}`,
      subtitle: `${group.questionCount} questões · ${group.flashcardCount} flashcards`,
      summary: group.flashcardSnippets[0] ?? group.questionSnippets[0] ?? 'Conteúdo disponível no banco de estudo.',
      actionText: group.questionCount > 0
        ? `${group.questionCount} questões já entram no simulador e no Estudo de Hoje`
        : `${group.flashcardCount} flashcards disponíveis para revisão`,
      details: [
        `Tema: ${group.tema}`,
        `Subtema: ${group.subtema}`,
        `Banco: ${group.questionCount} questões e ${group.flashcardCount} flashcards`,
        ...group.questionSnippets.slice(0, 2).map(item => `Questão: ${item}`),
        ...group.flashcardSnippets.slice(0, 2).map(item => `Flashcard: ${item}`),
      ],
      score: makeScore(query, [
        [group.tema, 4],
        [group.subtema, 5],
        [group.searchText.join(' '), 2],
      ]),
    }))
    .filter(result => result.score > 0)
}

function sortAndLimit(results: GlobalSearchResult[]) {
  return results
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'pt-BR'))
    .slice(0, 6)
}

export function searchGlobalClinicalContent(query: string, profileId?: string) {
  return {
    doencas: sortAndLimit(buildDiseaseResults(query)),
    farmacos: sortAndLimit(buildDrugResults(query)),
    protocolos: sortAndLimit(buildProtocolResults(query)),
    conteudo: sortAndLimit(buildStudyResults(query, profileId)),
  }
}
