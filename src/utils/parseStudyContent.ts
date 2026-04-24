export type StudyDifficulty = 'facil' | 'media' | 'dificil'
export type StudyQuestionType = 'multipla_escolha' | 'verdadeiro_falso' | 'associacao'

export interface StudyConcept {
  id: string
  titulo: string
  resumo: string
  detalhes?: string[]
  tags?: string[]
}

export interface StudyFlashcardInput {
  id?: string
  frente: string
  verso: string
  tag?: string
}

export interface StudyMultipleChoiceInput {
  tipo: 'multipla_escolha'
  pergunta: string
  alternativas: {
    A: string
    B: string
    C: string
    D: string
  }
  correta: 'A' | 'B' | 'C' | 'D'
  explicacao: string
  dificuldade?: StudyDifficulty
}

export interface StudyTrueFalseInput {
  tipo: 'verdadeiro_falso'
  pergunta: string
  correta: boolean
  explicacao: string
  dificuldade?: StudyDifficulty
}

export interface StudyAssociationInput {
  tipo: 'associacao'
  pergunta: string
  colunaA: string[]
  colunaB: string[]
  pares: number[]
  explicacao: string
  dificuldade?: StudyDifficulty
}

export type StudyQuestionInput =
  | StudyMultipleChoiceInput
  | StudyTrueFalseInput
  | StudyAssociationInput

export interface StudyContentBlock {
  tema: string
  subtema: string
  conceitos: StudyConcept[]
  flashcards?: StudyFlashcardInput[]
  questoes?: StudyQuestionInput[]
}

export interface StudyContentDocument {
  fonte?: string
  tema: string
  subtemas: StudyContentBlock[]
}

export interface ParsedFlashcard {
  id: string
  tag: string
  front: string
  back: string
  tema: string
  subtema: string
}

export type ParsedQuestion =
  | {
      id: number
      banca: string
      tema: string
      subtema: string
      dificuldade: StudyDifficulty
      tipo: 'multipla_escolha'
      pergunta: string
      alternativas: Record<'A' | 'B' | 'C' | 'D', string>
      correta: 'A' | 'B' | 'C' | 'D'
      explicacao: string
    }
  | {
      id: number
      banca: string
      tema: string
      subtema: string
      dificuldade: StudyDifficulty
      tipo: 'verdadeiro_falso'
      pergunta: string
      correta: 'V' | 'F'
      explicacao: string
    }
  | {
      id: number
      banca: string
      tema: string
      subtema: string
      dificuldade: StudyDifficulty
      tipo: 'associacao'
      pergunta: string
      colunaA: string[]
      colunaB: string[]
      pares: number[]
      explicacao: string
    }

export interface ParsedStudyContent {
  topics: { id: string; name: string; tema: string; subtema: string }[]
  flashcards: ParsedFlashcard[]
  questoes: ParsedQuestion[]
}

export interface ParseStudyContentOptions {
  startingQuestionId?: number
  banca?: string
  defaultDifficulty?: StudyDifficulty
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function conceptToFlashcard(block: StudyContentBlock, concept: StudyConcept): ParsedFlashcard {
  return {
    id: `concept-${slugify(block.tema)}-${slugify(block.subtema)}-${slugify(concept.id)}`,
    tag: block.subtema,
    front: concept.titulo,
    back: [concept.resumo, ...(concept.detalhes ?? [])].join('\n'),
    tema: block.tema,
    subtema: block.subtema,
  }
}

function explicitFlashcardToParsed(
  block: StudyContentBlock,
  card: StudyFlashcardInput,
  index: number,
): ParsedFlashcard {
  return {
    id: card.id ?? `card-${slugify(block.tema)}-${slugify(block.subtema)}-${index + 1}`,
    tag: card.tag ?? block.subtema,
    front: card.frente,
    back: card.verso,
    tema: block.tema,
    subtema: block.subtema,
  }
}

function parseQuestion(
  block: StudyContentBlock,
  question: StudyQuestionInput,
  id: number,
  banca: string,
  defaultDifficulty: StudyDifficulty,
): ParsedQuestion {
  const base = {
    id,
    banca,
    tema: block.tema,
    subtema: block.subtema,
    dificuldade: question.dificuldade ?? defaultDifficulty,
    pergunta: question.pergunta,
    explicacao: question.explicacao,
  }

  if (question.tipo === 'multipla_escolha') {
    return {
      ...base,
      tipo: question.tipo,
      alternativas: question.alternativas,
      correta: question.correta,
    }
  }

  if (question.tipo === 'verdadeiro_falso') {
    return {
      ...base,
      tipo: question.tipo,
      correta: question.correta ? 'V' : 'F',
    }
  }

  return {
    ...base,
    tipo: question.tipo,
    colunaA: question.colunaA,
    colunaB: question.colunaB,
    pares: question.pares,
  }
}

export function parseStudyContent(
  document: StudyContentDocument,
  options: ParseStudyContentOptions = {},
): ParsedStudyContent {
  const banca = options.banca ?? 'Aula'
  const defaultDifficulty = options.defaultDifficulty ?? 'media'
  let nextQuestionId = options.startingQuestionId ?? 10000

  const topics = document.subtemas.map(block => ({
    id: `topic-${slugify(block.tema)}-${slugify(block.subtema)}`,
    name: `${block.tema} - ${block.subtema}`,
    tema: block.tema,
    subtema: block.subtema,
  }))

  const flashcards = document.subtemas.flatMap(block => [
    ...block.conceitos.map(concept => conceptToFlashcard(block, concept)),
    ...(block.flashcards ?? []).map((card, index) => explicitFlashcardToParsed(block, card, index)),
  ])

  const questoes = document.subtemas.flatMap(block =>
    (block.questoes ?? []).map(question =>
      parseQuestion(block, question, nextQuestionId++, banca, defaultDifficulty)
    )
  )

  return { topics, flashcards, questoes }
}

export const anatomiaReprodutorMasculinoExample: StudyContentDocument = {
  fonte: 'Exemplo interno para pipeline de PDFs',
  tema: 'Anatomia do Reprodutor Masculino',
  subtemas: [
    {
      tema: 'Anatomia Reprodutiva',
      subtema: 'Reprodutor Masculino',
      conceitos: [
        {
          id: 'testiculos',
          titulo: 'Testiculos',
          resumo: 'Gonadas masculinas responsaveis pela producao de espermatozoides e testosterona.',
          detalhes: [
            'A espermatogenese ocorre nos tubulos seminiferos.',
            'As celulas de Leydig produzem testosterona sob estimulo de LH.',
          ],
        },
        {
          id: 'epididimo',
          titulo: 'Epididimo',
          resumo: 'Estrutura associada ao testiculo onde ocorre maturacao, concentracao e armazenamento dos espermatozoides.',
          detalhes: [
            'Divide-se em cabeca, corpo e cauda.',
            'A cauda do epididimo e importante reservatorio espermatico.',
          ],
        },
      ],
      flashcards: [
        {
          frente: 'Qual a funcao principal das celulas de Leydig?',
          verso: 'Produzir testosterona em resposta ao LH.',
          tag: 'Fisiologia testicular',
        },
      ],
      questoes: [
        {
          tipo: 'multipla_escolha',
          dificuldade: 'facil',
          pergunta: 'Qual estrutura e o principal local de maturacao dos espermatozoides?',
          alternativas: {
            A: 'Prostata',
            B: 'Epididimo',
            C: 'Vesicula seminal',
            D: 'Uretra pelvica',
          },
          correta: 'B',
          explicacao: 'O epididimo promove maturacao, concentracao e armazenamento dos espermatozoides antes da ejaculacao.',
        },
        {
          tipo: 'verdadeiro_falso',
          dificuldade: 'media',
          pergunta: 'As celulas de Leydig produzem testosterona sob estimulo de LH.',
          correta: true,
          explicacao: 'O LH estimula as celulas de Leydig, que sintetizam testosterona no intersticio testicular.',
        },
      ],
    },
  ],
}
