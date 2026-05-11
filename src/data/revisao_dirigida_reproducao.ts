export type ReviewTag =
  | 'Anatomia'
  | 'Ciclo Estral'
  | 'Biotecnologias'
  | 'Caso ClÃ­nico'
  | 'Pequenos Animais'

export interface OverviewQuestion {
  id: string
  prompt: string
  answer: string
}

export interface SummaryTableRow {
  cells: string[]
}

export interface ReviewQuestion {
  number: number
  prompt: string
  shortAnswer: string
  explanation: string
  memorize?: string
  attention?: string
  tags: ReviewTag[]
  isCase?: boolean
}

export interface AnatomyLegendRow {
  number: number
  structure: string
  function: string
  recognition: string
}

export interface PriorityReviewCard {
  id: string
  title: string
  status: string
  answer: string
  mustRemember: string[]
  risk: string
}

export const reviewPageMeta = {
  sidebarLabel: 'RevisÃ£o Dirigida',
  title: 'ReproduÃ§Ã£o Animal - RevisÃ£o Dirigida',
  subtitle: 'Resumo visual para revisÃ£o rÃ¡pida da prova',
}

export const quickReviewMustKnow = [
  'Fases do ciclo: Proestro -> Estro -> Metaestro -> Diestro.',
  'Cio = estrogÃªnio. GestaÃ§Ã£o = progesterona.',
  'Muco claro = cio. Muco espesso = diestro.',
  'Vaca: ciclo em torno de 21 dias e cio curto.',
  'Corpo lÃºteo produz progesterona e PGF2Î± uterina causa luteÃ³lise.',
  'Ovelha e cabra ciclam em dias curtos. Ã‰gua cicla em dias longos.',
  'Cadela Ã© monoÃ©strica e aceita monta no estro, nÃ£o no proestro.',
  'Trompa uterina = fecundaÃ§Ã£o. Ãštero = implantaÃ§Ã£o e gestaÃ§Ã£o.',
  'IA multiplica genÃ©tica do macho. TE multiplica genÃ©tica da fÃªmea.',
  'ECC baixo e balanÃ§o energÃ©tico negativo prolongam o anestro pÃ³s-parto.',
]

export const top25Points = [
  'Ciclo estral = receptividade sexual em intervalos tÃ­picos da espÃ©cie.',
  'Ordem das fases: Proestro -> Estro -> Metaestro -> Diestro.',
  'Proestro e Estro sÃ£o fases mais estrogÃªnicas.',
  'Metaestro e Diestro sÃ£o fases mais progesterÃ´nicas.',
  'Vaca e porca sÃ£o poliÃ©stricas anuais com ciclo em torno de 21 dias.',
  'O cio da vaca Ã© curto e exige atenÃ§Ã£o ao manejo.',
  'O cio da porca Ã© mais longo que o da vaca.',
  'Ovelha e cabra respondem a dias curtos.',
  'Ã‰gua e gata respondem a dias longos.',
  'Cadela Ã© monoÃ©strica.',
  'FotoperÃ­odo age via melatonina no eixo hipotÃ¡lamo-hipÃ³fise-gÃ´nadas.',
  'FolÃ­culo dominante produz estrogÃªnio e antecede a ovulaÃ§Ã£o.',
  'Corpo lÃºteo produz progesterona e mantÃ©m a fase lÃºtea.',
  'PGF2Î± Ã© o principal hormÃ´nio luteolÃ­tico.',
  'LuteÃ³lise reduz progesterona e permite reinÃ­cio do ciclo.',
  'Muco claro e cristalino sugere estro.',
  'Muco espesso e opaco sugere diestro.',
  'A fecundaÃ§Ã£o ocorre na trompa uterina, nÃ£o no Ãºtero.',
  'EndomÃ©trio = implantaÃ§Ã£o e PGF2Î±. MiomÃ©trio = contraÃ§Ã£o. PerimÃ©trio = proteÃ§Ã£o.',
  'CÃ©rvix da vaca tem anÃ©is. CÃ©rvix da porca Ã© espiral. CÃ©rvix da Ã©gua Ã© mais simples.',
  'IA multiplica genÃ©tica de machos. TE multiplica genÃ©tica de fÃªmeas.',
  'IATF permite inseminaÃ§Ã£o em lote sem depender da observaÃ§Ã£o do cio.',
  'BalanÃ§o energÃ©tico negativo prolonga o anestro pÃ³s-parto.',
  'Na cadela, o estro mostra cÃ©lulas queratinizadas anucleares na citologia.',
  'Sangramento da cadela aparece no proestro e nÃ£o significa aceitaÃ§Ã£o de monta.',
]

export const oralQuestions: OverviewQuestion[] = [
  { id: 'p1', prompt: 'Qual hormÃ´nio o folÃ­culo dominante produz?', answer: 'EstrogÃªnio.' },
  { id: 'p2', prompt: 'Qual hormÃ´nio o corpo lÃºteo produz?', answer: 'Progesterona.' },
  { id: 'p3', prompt: 'Qual hormÃ´nio causa a luteÃ³lise?', answer: 'PGF2Î± produzida pelo Ãºtero.' },
  { id: 'p4', prompt: 'Onde ocorre a fecundaÃ§Ã£o?', answer: 'Na trompa uterina, tambÃ©m chamada de oviduto.' },
  { id: 'p5', prompt: 'Quanto dura o cio da vaca?', answer: 'Em geral, 12 a 18 horas.' },
  { id: 'p6', prompt: 'A cadela Ã© poliÃ©strica ou monoÃ©strica?', answer: 'MonoÃ©strica.' },
  { id: 'p7', prompt: 'A Ã©gua cicla em dias longos ou curtos?', answer: 'Dias longos.' },
  { id: 'p8', prompt: 'A ovelha cicla em dias longos ou curtos?', answer: 'Dias curtos.' },
  { id: 'p9', prompt: 'Qual cÃ©lula predomina na citologia vaginal da cadela no estro?', answer: 'CÃ©lula queratinizada anuclear.' },
  { id: 'p10', prompt: 'Qual a diferenÃ§a entre IA e TE em termos de benefÃ­cio genÃ©tico?', answer: 'IA multiplica genÃ©tica do macho. TE multiplica genÃ©tica da fÃªmea.' },
  { id: 'p11', prompt: 'O que Ã© IATF?', answer: 'InseminaÃ§Ã£o Artificial em Tempo Fixo apÃ³s sincronizaÃ§Ã£o, sem detecÃ§Ã£o de cio.' },
  { id: 'p12', prompt: 'Por que ECC baixo prolonga anestro pÃ³s-parto?', answer: 'Porque o balanÃ§o energÃ©tico negativo inibe pulsos de GnRH e LH.' },
  { id: 'p13', prompt: 'O que acontece apÃ³s PGF2Î± em vaca com CL funcional?', answer: 'LuteÃ³lise, queda de progesterona e retorno ao cio em poucos dias.' },
  { id: 'p14', prompt: 'Quais sÃ£o as trÃªs camadas do Ãºtero?', answer: 'EndomÃ©trio, miomÃ©trio e perimÃ©trio.' },
  { id: 'p15', prompt: 'No cio, o muco cervical Ã© claro ou espesso?', answer: 'Claro, elÃ¡stico e cristalino.' },
]

export const pitfalls = [
  'A fecundaÃ§Ã£o ocorre no Ãºtero. Errado: ocorre na trompa uterina.',
  'A cadela Ã© poliÃ©strica. Errado: ela Ã© monoÃ©strica.',
  'O sangramento da cadela indica aceitaÃ§Ã£o de monta. Errado: isso acontece no proestro, antes da receptividade.',
  'A ovelha se reproduz no verÃ£o. Errado: ela responde a dias curtos, em geral no outono e inverno.',
  'A luteÃ³lise Ã© causada pela queda de LH. Errado: a PGF2Î± uterina Ã© o fator luteolÃ­tico principal.',
  'O corpo lÃºteo produz estrogÃªnio. Errado: o folÃ­culo produz estrogÃªnio; o CL produz progesterona.',
  'TE serve para multiplicar genÃ©tica de touros. Errado: isso Ã© mais associado Ã  IA.',
  'Qualquer fase do ciclo responde Ã  PGF2Î±. Errado: ela depende de CL funcional.',
  'IATF sempre tem taxa de concepÃ§Ã£o maior que a IA convencional. Errado: a principal vantagem Ã© operacional.',
  'AmamentaÃ§Ã£o nÃ£o afeta o ciclo. Errado: pode prolongar o anestro pÃ³s-parto.',
]

export const reviewPlan = [
  '0-8 min: fechar o texto e recitar a sequÃªncia hormonal atÃ© a luteÃ³lise.',
  '8-16 min: falar em voz alta as fases do ciclo e o padrÃ£o sazonal das espÃ©cies.',
  '16-24 min: revisar IA, IATF e TE, alÃ©m do efeito do progestÃ¡geno exÃ³geno.',
  '24-32 min: reler os casos 8, 13, 20 e 22 e responder de memÃ³ria.',
  '32-38 min: revisar as pegadinhas e dizer por que cada uma estÃ¡ errada.',
  '38-40 min: reler o bloco de alta prioridade e encerrar a revisÃ£o.',
]

export const hormoneTable = {
  title: 'Tabela dos HormÃ´nios',
  headers: ['HormÃ´nio', 'Quem produz', 'FunÃ§Ã£o', 'Quando predomina'],
  rows: [
    { cells: ['GnRH', 'HipotÃ¡lamo', 'Estimula a hipÃ³fise a liberar FSH e LH.', 'Pulsos contÃ­nuos; pico ligado Ã  ovulaÃ§Ã£o.'] },
    { cells: ['FSH', 'HipÃ³fise anterior', 'Estimula crescimento folicular.', 'Proestro.'] },
    { cells: ['LH', 'HipÃ³fise anterior', 'Pico prÃ©-ovulatÃ³rio e suporte Ã  funÃ§Ã£o lÃºtea.', 'Final do estro.'] },
    { cells: ['Prolactina', 'HipÃ³fise anterior', 'ProduÃ§Ã£o de leite e participaÃ§Ã£o no pÃ³s-parto.', 'LactaÃ§Ã£o e pÃ³s-parto.'] },
    { cells: ['Ocitocina', 'Neuro-hipÃ³fise', 'ContraÃ§Ã£o uterina no parto e ejeÃ§Ã£o do leite.', 'Parto e amamentaÃ§Ã£o.'] },
    { cells: ['EstrogÃªnio', 'OvÃ¡rio (folÃ­culo)', 'Induz cio, prolifera endomÃ©trio e gera muco claro.', 'Proestro e estro.'] },
    { cells: ['Progesterona', 'OvÃ¡rio (CL) e placenta', 'MantÃ©m gestaÃ§Ã£o, fecha cÃ©rvix e inibe cio.', 'Metaestro, diestro e gestaÃ§Ã£o.'] },
    { cells: ['Inibina', 'OvÃ¡rio (granulosa)', 'Inibe FSH e regula recrutamento folicular.', 'Fase folicular.'] },
    { cells: ['PGF2Î±', 'Ãštero (endomÃ©trio)', 'Promove luteÃ³lise e reinÃ­cio do ciclo.', 'Final do diestro sem prenhez.'] },
    { cells: ['Relaxina', 'CL ou placenta', 'Favorece relaxamento do canal do parto.', 'Final da gestaÃ§Ã£o.'] },
  ] satisfies SummaryTableRow[],
}

export const cycleTable = {
  title: 'Tabela das Fases do Ciclo Estral',
  headers: ['Fase', 'O que acontece', 'HormÃ´nio predominante', 'Sinais observados'],
  rows: [
    { cells: ['Proestro', 'RegressÃ£o do CL anterior e rÃ¡pido desenvolvimento folicular.', 'EstrogÃªnio em ascensÃ£o.', 'FÃªmea ainda nÃ£o aceita monta; vulva comeÃ§a a inchar.'] },
    { cells: ['Estro', 'Pico de estrogÃªnio, receptividade plena e ovulaÃ§Ã£o ao final.', 'EstrogÃªnio no pico.', 'Aceita monta, muco claro, inquietaÃ§Ã£o e vulva hiperemiada.'] },
    { cells: ['Metaestro', 'PÃ³s-ovulaÃ§Ã£o imediata com formaÃ§Ã£o do CL.', 'TransiÃ§Ã£o para progesterona.', 'Pode ocorrer sangramento leve em bovinos.'] },
    { cells: ['Diestro', 'CL maduro e funcional; fase mais longa.', 'Progesterona dominante.', 'Sem cio, muco espesso e ambiente uterino estÃ¡vel.'] },
    { cells: ['Anestro', 'Inatividade reprodutiva, sazonal ou por outras causas.', 'Progesterona baixa ou nula.', 'Sem cio e ovÃ¡rios inativos.'] },
  ] satisfies SummaryTableRow[],
}

export const reviewQuestions: ReviewQuestion[] = [
  {
    number: 1,
    prompt: 'Partes externas do trato reprodutor feminino e funÃ§Ã£o principal de cada uma.',
    shortAnswer: 'A genitÃ¡lia externa Ã© formada pelo vestÃ­bulo, lÃ¡bios vulvares e clitÃ³ris. O vestÃ­bulo Ã© a regiÃ£o de entrada/transiÃ§Ã£o para a vagina, os lÃ¡bios vulvares protegem a abertura externa e o clitÃ³ris estÃ¡ relacionado Ã  sensibilidade sexual.',
    explanation: 'Quando a pergunta pede genitÃ¡lia externa, a resposta deve incluir vestÃ­bulo, lÃ¡bios vulvares e clitÃ³ris. O vestÃ­bulo funciona como regiÃ£o de entrada e transiÃ§Ã£o para a vagina, os lÃ¡bios vulvares fazem a proteÃ§Ã£o externa e o clitÃ³ris participa da sensibilidade sexual.',
    memorize: 'VestÃ­bulo + lÃ¡bios vulvares + clitÃ³ris.',
    attention: 'Se a pergunta for sobre partes externas, evite colocar vagina e cÃ©rvix como resposta principal.',
    tags: ['Anatomia'],
  },
  {
    number: 2,
    prompt: 'DiferenÃ§a entre vagina e cÃ©rvix quanto Ã  funÃ§Ã£o no acasalamento e na proteÃ§Ã£o uterina.',
    shortAnswer: 'A vagina recebe o pÃªnis e o sÃªmen. A cÃ©rvix protege o Ãºtero e sÃ³ relaxa adequadamente no estro para favorecer a passagem espermÃ¡tica.',
    explanation: 'A vagina Ã© um canal de trÃ¢nsito. JÃ¡ a cÃ©rvix Ã© uma barreira fisiolÃ³gica: no cio ela permite passagem com muco mais favorÃ¡vel; fora dele, mantÃ©m proteÃ§Ã£o com muco espesso.',
    memorize: 'Vagina = via de entrada. CÃ©rvix = guarda do Ãºtero.',
    attention: 'A dificuldade tÃ©cnica da IA depende muito do formato da cÃ©rvix de cada espÃ©cie.',
    tags: ['Anatomia'],
  },
  {
    number: 3,
    prompt: 'Como Ã© a cÃ©rvix de vacas, porcas e Ã©guas, e por que isso muda a tÃ©cnica de inseminaÃ§Ã£o?',
    shortAnswer: 'Na vaca hÃ¡ anÃ©is cervicais; na porca, formato espiralado; na Ã©gua, canal mais simples e relaxÃ¡vel. Isso muda a forma de passagem do cateter.',
    explanation: 'A vaca tem cÃ©rvix mais tortuosa e exige maior habilidade de manipulaÃ§Ã£o. A porca usa cateter compatÃ­vel com a configuraÃ§Ã£o espiral. A Ã©gua tem passagem mais direta, o que facilita a tÃ©cnica transcervical.',
    memorize: 'Vaca = anÃ©is. Porca = espiral. Ã‰gua = simples.',
    attention: 'A Ã©gua tem cÃ©rvix mais simples, mas a ovulaÃ§Ã£o exige acompanhamento reprodutivo cuidadoso.',
    tags: ['Anatomia', 'Biotecnologias'],
  },
  {
    number: 4,
    prompt: 'TrÃªs camadas do Ãºtero e funÃ§Ã£o simples de cada uma.',
    shortAnswer: 'EndomÃ©trio Ã© a camada interna ligada Ã  implantaÃ§Ã£o; miomÃ©trio Ã© a camada muscular; perimÃ©trio Ã© a camada externa protetora.',
    explanation: 'O endomÃ©trio participa da nutriÃ§Ã£o embrionÃ¡ria e de sinais uterinos como a PGF2Î±. O miomÃ©trio responde pelas contraÃ§Ãµes. O perimÃ©trio recobre e protege externamente o Ã³rgÃ£o.',
    memorize: 'Endo = dentro. Mio = mÃºsculo. Peri = por fora.',
    attention: 'O endomÃ©trio Ã© frequentemente associado Ã  produÃ§Ã£o de PGF2Î± e Ã  luteÃ³lise.',
    tags: ['Anatomia', 'Ciclo Estral'],
  },
  {
    number: 5,
    prompt: 'FunÃ§Ã£o principal das trompas uterinas (ovidutos).',
    shortAnswer: 'SÃ£o o local da fecundaÃ§Ã£o e a via de transporte do oÃ³cito ou embriÃ£o inicial em direÃ§Ã£o ao Ãºtero.',
    explanation: 'A trompa conecta ovÃ¡rio e Ãºtero. Ã‰ nela que ocorre o encontro entre espermatozoide e oÃ³cito, seguido do deslocamento do embriÃ£o precoce atÃ© o Ãºtero.',
    memorize: 'Trompa = fecundaÃ§Ã£o + estrada do embriÃ£o.',
    attention: 'FecundaÃ§Ã£o ocorre na trompa, nÃ£o no Ãºtero.',
    tags: ['Anatomia'],
  },
  {
    number: 6,
    prompt: 'O que Ã© um folÃ­culo dominante e o que Ã© um corpo lÃºteo?',
    shortAnswer: 'FolÃ­culo dominante Ã© o principal folÃ­culo do ciclo e produz estrogÃªnio. Corpo lÃºteo Ã© a estrutura formada apÃ³s a ovulaÃ§Ã£o e produz progesterona.',
    explanation: 'O folÃ­culo dominante cresce, amadurece o oÃ³cito e conduz ao cio e Ã  ovulaÃ§Ã£o. Depois que ele rompe, o local se transforma em corpo lÃºteo, mudando o padrÃ£o hormonal do ciclo.',
    memorize: 'FolÃ­culo -> estrogÃªnio -> cio -> ovulaÃ§Ã£o -> CL -> progesterona.',
    attention: 'Se nÃ£o houver gestaÃ§Ã£o, o CL regride pela aÃ§Ã£o luteolÃ­tica da PGF2Î±.',
    tags: ['Anatomia', 'Ciclo Estral'],
  },
  {
    number: 7,
    prompt: 'DiferenÃ§a entre estrogÃªnio e progesterona quanto ao comportamento de cio e ao Ãºtero.',
    shortAnswer: 'EstrogÃªnio favorece cio, receptividade e muco claro. Progesterona suprime cio, mantÃ©m o Ãºtero em ambiente secretor e fecha a cÃ©rvix com muco espesso.',
    explanation: 'EstrogÃªnio Ã© o hormÃ´nio mais ligado Ã  fase folicular, ao comportamento sexual e ao preparo para ovulaÃ§Ã£o. Progesterona domina a fase lÃºtea e a gestaÃ§Ã£o, estabilizando o Ãºtero.',
    memorize: 'Estro = estrogÃªnio. GestaÃ§Ã£o = progesterona.',
    attention: 'NÃ£o confundir a origem hormonal: folÃ­culo produz estrogÃªnio; CL produz progesterona.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 8,
    prompt: 'Caso clÃ­nico: vaca com muco claro e cristalino mais inquietaÃ§Ã£o. Qual a fase e a conduta?',
    shortAnswer: 'A fase provÃ¡vel Ã© o estro, com predomÃ­nio de estrogÃªnio, muco claro e receptividade/inquietaÃ§Ã£o. Esse perÃ­odo se relaciona Ã  fase proliferativa; a fase secretora ocorre sob aÃ§Ã£o da progesterona, principalmente no metaestro/diestro.',
    explanation: 'Muco claro e comportamento inquieto sÃ£o sinais clÃ¡ssicos de aÃ§Ã£o estrogÃªnica elevada. Essa combinaÃ§Ã£o aponta para receptividade sexual ativa, compatÃ­vel com o cio. A conduta continua sendo confirmar o cio e inseminar ou manejar dentro da janela adequada.',
    memorize: 'Estro = estrogÃªnio = fase proliferativa. Metaestro/diestro = progesterona = fase secretora.',
    attention: 'NÃ£o confundir com proestro, em que a receptividade ainda nÃ£o estÃ¡ plena, nem com diestro, em que o muco tende a ser espesso.',
    tags: ['Ciclo Estral', 'Caso ClÃ­nico', 'Biotecnologias'],
    isCase: true,
  },
  {
    number: 9,
    prompt: 'Fases do ciclo estral em ordem cronolÃ³gica e hormÃ´nios predominantes.',
    shortAnswer: 'As fases sÃ£o proestro, estro, metaestro e diestro. O estrogÃªnio predomina no proestro e estro; a progesterona predomina no metaestro e diestro.',
    explanation: 'No proestro ocorre crescimento folicular e aumento de estrogÃªnio. No estro hÃ¡ receptividade sexual e ovulaÃ§Ã£o ao final. Metaestro marca a transiÃ§Ã£o com formaÃ§Ã£o do CL, e diestro representa a fase lÃºtea funcional.',
    memorize: 'P-E-M-D.',
    attention: 'A ovulaÃ§Ã£o ocorre no final do estro, nÃ£o no inÃ­cio.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 10,
    prompt: 'DuraÃ§Ã£o mÃ©dia do ciclo estral em vacas e porcas.',
    shortAnswer: 'Vaca e porca apresentam ciclo em torno de 21 dias.',
    explanation: 'As duas espÃ©cies tÃªm duraÃ§Ã£o cÃ­clica parecida, o que ajuda bastante na memorizaÃ§Ã£o. O que muda mais entre elas Ã© a duraÃ§Ã£o do estro.',
    memorize: 'Vaca = 21 e porca = 21.',
    attention: 'O cio da vaca Ã© curto, enquanto o da porca Ã© mais prolongado.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 11,
    prompt: 'DiferenÃ§a entre poliestral anual e poliestral estacional.',
    shortAnswer: 'Poliestral anual significa ciclar ao longo do ano todo. Poliestral estacional significa ciclar apenas em determinada Ã©poca do ano.',
    explanation: 'EspÃ©cies anuais mantÃªm ciclos relativamente regulares sem pausa sazonal importante. EspÃ©cies estacionais alternam uma Ã©poca de atividade reprodutiva com outra de anestro.',
    memorize: 'Anual = o ano todo. Estacional = sÃ³ em parte do ano.',
    attention: 'Cadela Ã© monoÃ©strica e nÃ£o entra nesse grupo poliÃ©strico clÃ¡ssico.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 12,
    prompt: 'Por que o fotoperÃ­odo influencia a reproduÃ§Ã£o de ovelhas e Ã©guas?',
    shortAnswer: 'O fotoperÃ­odo influencia a reproduÃ§Ã£o porque a luz altera a secreÃ§Ã£o de melatonina, que interfere no eixo hipotÃ¡lamo-hipÃ³fise-gÃ´nadas e modifica a atividade reprodutiva. Ovelhas e cabras ciclam melhor em dias curtos; Ã©guas ciclam melhor em dias longos.',
    explanation: 'A retina capta luz e escuridÃ£o, e a pineal ajusta a melatonina. Em ovelhas, dias curtos favorecem ciclicidade. Em Ã©guas, dias longos favorecem ciclicidade.',
    memorize: 'Ovelha: inverno. Ã‰gua: verÃ£o.',
    attention: 'Trocar a direÃ§Ã£o do fotoperÃ­odo entre espÃ©cies Ã© uma pegadinha muito comum.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 13,
    prompt: 'Caso clÃ­nico: cabras com baixa manifestaÃ§Ã£o de cio no verÃ£o. Causa provÃ¡vel e manejo.',
    shortAnswer: 'A principal hipÃ³tese Ã© anestro estacional. Um manejo simples Ã© explorar o efeito macho ou manejar fotoperÃ­odo.',
    explanation: 'Cabras costumam responder melhor a dias curtos. No verÃ£o, com noites mais curtas, a atividade reprodutiva pode cair e o cio se expressa menos.',
    attention: 'Quando o problema aparece de forma ampla no lote e coincide com a estaÃ§Ã£o, pense primeiro em fisiologia sazonal antes de doenÃ§a.',
    tags: ['Ciclo Estral', 'Caso ClÃ­nico'],
    isCase: true,
  },
  {
    number: 14,
    prompt: 'Dois sinais prÃ¡ticos de cio observÃ¡veis em bovinos.',
    shortAnswer: 'Aceitar ser montada e apresentar muco claro e cristalino sÃ£o dois sinais clÃ¡ssicos.',
    explanation: 'O reflexo de imobilidade Ã© o sinal comportamental mais confiÃ¡vel. O muco claro e filante Ã© um bom apoio semiolÃ³gico para reconhecer o estro.',
    memorize: 'Muco claro + deixa montar = cio bovino.',
    attention: 'Como o cio bovino pode ser curto, a observaÃ§Ã£o inadequada reduz muito a detecÃ§Ã£o.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 15,
    prompt: 'Por que a condiÃ§Ã£o corporal influencia o retorno ao ciclo apÃ³s o parto?',
    shortAnswer: 'Porque baixo ECC e balanÃ§o energÃ©tico negativo reduzem suporte metabÃ³lico ao eixo reprodutivo e prolongam o anestro pÃ³s-parto.',
    explanation: 'Quando a fÃªmea precisa priorizar manutenÃ§Ã£o e lactaÃ§Ã£o, a reproduÃ§Ã£o perde prioridade biolÃ³gica. Isso reduz pulsos hormonais importantes para crescimento folicular e ovulaÃ§Ã£o.',
    memorize: 'ECC baixo = eixo bloqueado = anestro mais longo.',
    attention: 'Esse raciocÃ­nio Ã© muito cobrado em vacas leiteiras e porcas em lactaÃ§Ã£o.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 16,
    prompt: 'FunÃ§Ã£o do muco cervical no estro e no diestro.',
    shortAnswer: 'No estro, o muco facilita passagem e sobrevivÃªncia dos espermatozoides. No diestro, o muco protege o Ãºtero como tampÃ£o cervical.',
    explanation: 'Sob estrogÃªnio, o muco fica claro, elÃ¡stico e favorÃ¡vel ao trÃ¢nsito espermÃ¡tico. Sob progesterona, torna-se viscoso e protetor.',
    memorize: 'Estro abre a porta. Diestro fecha a porta.',
    attention: 'Tipo de muco ajuda muito a reconhecer a fase do ciclo.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 17,
    prompt: 'Dois cuidados bÃ¡sicos com sÃªmen e material na IA.',
    shortAnswer: 'Evitar variaÃ§Ã£o de temperatura/choque tÃ©rmico, manter higiene e manipular corretamente o sÃªmen e o material, respeitando tempo e temperatura de descongelamento.',
    explanation: 'O sÃªmen Ã© sensÃ­vel a erros de manejo. Uma boa tÃ©cnica de descongelaÃ§Ã£o e um material limpo e termicamente protegido ajudam a preservar viabilidade espermÃ¡tica.',
    memorize: 'Descongelar certo, nÃ£o contaminar e nÃ£o esfriar.',
    attention: 'O fator humano do inseminador pesa muito na taxa de concepÃ§Ã£o.',
    tags: ['Biotecnologias'],
  },
  {
    number: 18,
    prompt: 'O que Ã© IATF e qual sua principal vantagem?',
    shortAnswer: 'Ã‰ a inseminaÃ§Ã£o realizada em momento fixo apÃ³s sincronizaÃ§Ã£o do ciclo. Sua maior vantagem Ã© inseminar o lote sem depender da observaÃ§Ã£o individual do cio.',
    explanation: 'A IATF transforma um processo muito observacional em um manejo planejado. Isso facilita aplicaÃ§Ã£o em rebanhos grandes e reduz perdas por falha de detecÃ§Ã£o.',
    memorize: 'IATF = todo mundo no mesmo dia, sem detectar cio.',
    attention: 'A principal vantagem Ã© operacional, nÃ£o uma promessa automÃ¡tica de maior concepÃ§Ã£o por fÃªmea.',
    tags: ['Biotecnologias'],
  },
  {
    number: 19,
    prompt: 'Na transferÃªncia de embriÃµes, cite uma vantagem e uma desvantagem.',
    shortAnswer: 'A vantagem Ã© multiplicar rapidamente a genÃ©tica de fÃªmeas superiores. A desvantagem Ã© o custo e a necessidade de manejo mais complexo.',
    explanation: 'Com a TE, uma doadora pode gerar vÃ¡rios embriÃµes para receptoras. Em compensaÃ§Ã£o, o processo exige sincronizaÃ§Ã£o, estrutura e equipe treinada.',
    memorize: 'TE multiplica fÃªmea boa, mas custa mais e dÃ¡ mais trabalho.',
    attention: 'IA e TE nÃ£o sÃ£o a mesma lÃ³gica de melhoramento genÃ©tico.',
    tags: ['Biotecnologias'],
  },
  {
    number: 20,
    prompt: 'Caso clÃ­nico: vÃ¡rias matrizes suÃ­nas retornando ao cio cerca de 21 dias apÃ³s IA. HipÃ³tese e checagem prÃ¡tica.',
    shortAnswer: 'A hipÃ³tese principal Ã© falha de concepÃ§Ã£o em lote. Vale revisar momento da IA, qualidade do sÃªmen e tÃ©cnica de deposiÃ§Ã£o.',
    explanation: 'Quando vÃ¡rias porcas retornam ao cio no intervalo tÃ­pico do ciclo, o padrÃ£o sugere falha reprodutiva coletiva e nÃ£o um evento individual isolado.',
    attention: 'Retorno regular ao redor de 21 dias sugere nÃ£o concepÃ§Ã£o. Retornos mais irregulares levantam outras hipÃ³teses.',
    tags: ['Biotecnologias', 'Caso ClÃ­nico'],
    isCase: true,
  },
  {
    number: 21,
    prompt: 'O que Ã© anestro pÃ³s-parto e qual fator nutricional o agrava?',
    shortAnswer: 'Ã‰ o perÃ­odo pÃ³s-parto sem ciclos estrais funcionais. O balanÃ§o energÃ©tico negativo Ã© um dos principais fatores que o prolongam.',
    explanation: 'Algum grau de anestro pÃ³s-parto Ã© esperado, mas ele se torna mais longo quando a condiÃ§Ã£o metabÃ³lica da fÃªmea estÃ¡ comprometida, especialmente em alta produÃ§Ã£o.',
    memorize: 'Anestro pÃ³s-parto + vaca magra = recuperaÃ§Ã£o reprodutiva mais lenta.',
    attention: 'AmamentaÃ§Ã£o tambÃ©m pode participar do prolongamento do anestro.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 22,
    prompt: 'Caso clÃ­nico: vaca com CL funcional recebe PGF2Î±. O que acontece com o CL e com o cio?',
    shortAnswer: 'A PGF2Î± causa luteÃ³lise do corpo lÃºteo funcional, reduz a progesterona e permite retorno ao cio nos prÃ³ximos dias.',
    explanation: 'A PGF2Î± promove luteÃ³lise quando hÃ¡ CL funcional. Com isso, o bloqueio progesterÃ´nico Ã© removido e o eixo reprodutivo volta a avanÃ§ar rumo a um novo estro.',
    attention: 'PGF2Î± nÃ£o tem efeito luteolÃ­tico Ãºtil se nÃ£o houver CL funcional presente.',
    tags: ['Ciclo Estral', 'Caso ClÃ­nico', 'Biotecnologias'],
    isCase: true,
  },
  {
    number: 23,
    prompt: 'Por que Ã© importante realizar sincronizaÃ§Ã£o de cio?',
    shortAnswer: 'Porque organiza o manejo reprodutivo em lote, reduz observaÃ§Ã£o individual e favorece concentraÃ§Ã£o de inseminaÃ§Ãµes e partos.',
    explanation: 'A sincronizaÃ§Ã£o ajuda a padronizar o grupo, melhora o planejamento e viabiliza biotecnologias em escala produtiva.',
    memorize: 'SincronizaÃ§Ã£o = todo mundo no mesmo ritmo.',
    tags: ['Biotecnologias'],
  },
  {
    number: 24,
    prompt: 'Qual a vantagem da IATF em relaÃ§Ã£o Ã  IA convencional?',
    shortAnswer: 'A principal vantagem Ã© dispensar a detecÃ§Ã£o individual do estro e permitir inseminaÃ§Ã£o de todo o lote em data programada.',
    explanation: 'Em sistemas extensivos e em animais com cio discreto, a IATF aumenta a eficiÃªncia operacional do rebanho por permitir cobertura ampla do lote.',
    attention: 'Ela nÃ£o deve ser vista apenas como disputa de taxa de concepÃ§Ã£o pontual, mas como estratÃ©gia de manejo.',
    tags: ['Biotecnologias'],
  },
  {
    number: 25,
    prompt: 'Como o progestÃ¡geno exÃ³geno age na sincronizaÃ§Ã£o e o que ocorre ao ser retirado?',
    shortAnswer: 'O progestÃ¡geno exÃ³geno simula a fase lÃºtea, faz feedback negativo e impede cio/ovulaÃ§Ã£o. ApÃ³s sua retirada, hÃ¡ queda da progesterona, retomada do crescimento folicular e sincronizaÃ§Ã£o do estro/ovulaÃ§Ã£o.',
    explanation: 'Durante o uso, a progesterona exÃ³gena ajuda a manter o animal em estado semelhante ao diestro. ApÃ³s a retirada, o crescimento folicular final e a ovulaÃ§Ã£o acontecem em janela mais previsÃ­vel.',
    memorize: 'ProgestÃ¡geno = pausa forÃ§ada. Retirada = gatilho da janela ovulatÃ³ria.',
    tags: ['Biotecnologias'],
  },
  {
    number: 26,
    prompt: 'MÃ©todo para detectar cio em cadelas e principal achado no estro.',
    shortAnswer: 'O mÃ©todo clÃ¡ssico Ã© a citologia vaginal. No estro predominam cÃ©lulas superficiais cornificadas, tambÃ©m chamadas de queratinizadas, muitas vezes anucleares.',
    explanation: 'Na prÃ¡tica clÃ­nica, o esfregaÃ§o vaginal mostra o efeito estrogÃªnico sobre o epitÃ©lio. No estro, as cÃ©lulas ficam cornificadas e sem nÃºcleo visÃ­vel em grande proporÃ§Ã£o.',
    memorize: 'Estro da cadela = lÃ¢mina cheia de cÃ©lulas queratinizadas anucleares.',
    attention: 'Sangramento aparece no proestro e nÃ£o significa aceitaÃ§Ã£o de monta.',
    tags: ['Pequenos Animais'],
  },
]

export const q27Legend: AnatomyLegendRow[] = [
  {
    number: 1,
    structure: 'OvÃ¡rio',
    function: 'Produz oÃ³citos, folÃ­culos, estrogÃªnio e corpo lÃºteo com progesterona.',
    recognition: 'Estrutura pequena e oval na extremidade do trato reprodutor.',
  },
  {
    number: 2,
    structure: 'Oviduto / trompa uterina',
    function: 'Local da fecundaÃ§Ã£o e transporte do oÃ³cito ou embriÃ£o atÃ© o Ãºtero.',
    recognition: 'Tubo fino entre ovÃ¡rio e corno uterino.',
  },
  {
    number: 3,
    structure: 'CarÃºnculas',
    function: 'Participam da formaÃ§Ã£o dos placentomas em ruminantes.',
    recognition: 'ProjeÃ§Ãµes no interior uterino tÃ­picas do endomÃ©trio de ruminantes.',
  },
  {
    number: 4,
    structure: 'Cornos uterinos',
    function: 'RegiÃµes uterinas importantes para desenvolvimento embrionÃ¡rio e fetal conforme a espÃ©cie.',
    recognition: 'Dois prolongamentos uterinos que seguem a partir do corpo do Ãºtero.',
  },
  {
    number: 5,
    structure: 'CÃ©rvix',
    function: 'Barreira entre vagina e Ãºtero, com proteÃ§Ã£o e controle de passagem.',
    recognition: 'Segmento mais firme entre Ãºtero e vagina.',
  },
  {
    number: 6,
    structure: 'Vagina',
    function: 'Canal copulatÃ³rio e parte do canal do parto.',
    recognition: 'Canal caudal ao trato uterino, anterior Ã  vulva.',
  },
  {
    number: 7,
    structure: 'Bexiga',
    function: 'ReservatÃ³rio de urina e referÃªncia anatÃ´mica ventral.',
    recognition: 'Estrutura arredondada ventral ao trato genital.',
  },
  {
    number: 8,
    structure: 'GlÃ¢ndula mamÃ¡ria',
    function: 'ProduÃ§Ã£o de leite no pÃ³s-parto e lactaÃ§Ã£o.',
    recognition: 'Estrutura mamÃ¡ria ventral e externa ao trato pÃ©lvico.',
  },
  {
    number: 9,
    structure: 'Reto',
    function: 'ReferÃªncia dorsal e via importante para palpaÃ§Ã£o transretal em grandes animais.',
    recognition: 'Estrutura tubular dorsal ao trato reprodutor.',
  },
  {
    number: 10,
    structure: 'Saco retogenital',
    function: 'Recesso peritoneal entre reto e trato genital, Ãºtil como referÃªncia pÃ©lvica.',
    recognition: 'EspaÃ§o anatÃ´mico entre o reto e o trato genital interno.',
  },
]

export const q27Macete = '1 ovÃ¡rio, 2 oviduto, 3 carÃºncula, 4 corno, 5 cÃ©rvix, 6 vagina, 7 bexiga, 8 mama, 9 reto, 10 saco.'

export const q28Bovinos = {
  importance: [
    'Nos bovinos, a eficiÃªncia reprodutiva tem impacto direto sobre produtividade e rentabilidade.',
    'A vaca que demora a emprenhar amplia o intervalo entre partos e reduz o retorno econÃ´mico do sistema.',
    'Por isso, reproduÃ§Ã£o animal e biotecnologias sÃ£o centrais tanto na bovinocultura de corte quanto na de leite.',
  ],
  biotechnologies: [
    {
      title: 'IA',
      description: 'Usa sÃªmen de touros geneticamente superiores para ampliar ganho genÃ©tico em grande escala.',
    },
    {
      title: 'IATF',
      description: 'Permite inseminaÃ§Ã£o em horÃ¡rio programado, sem depender da observaÃ§Ã£o individual do cio.',
    },
    {
      title: 'TE',
      description: 'Coleta embriÃµes de doadoras superiores e transfere para receptoras.',
    },
    {
      title: 'PIVE',
      description: 'ProduÃ§Ã£o in vitro de embriÃµes em laboratÃ³rio, aumentando o aproveitamento genÃ©tico da doadora.',
    },
  ],
  estrusDetection: [
    'O estro da vaca Ã© curto, o que dificulta observaÃ§Ã£o de campo.',
    'Aceitar ser montada Ã© o sinal mais confiÃ¡vel.',
    'Muco claro e cristalino, inquietaÃ§Ã£o e monta em outras fÃªmeas ajudam na identificaÃ§Ã£o.',
    'Em zebuÃ­nos, o cio costuma ser ainda mais discreto, o que reforÃ§a a utilidade da IATF.',
  ],
  quickSummary: [
    'Bovinos dependem de alta eficiÃªncia reprodutiva para manter produtividade.',
    'IA e IATF sÃ£o ferramentas-chave no contexto brasileiro.',
    'TE e PIVE aceleram melhoramento genÃ©tico materno.',
    'Cio curto e nem sempre evidente tornam o manejo reprodutivo um ponto crÃ­tico.',
  ],
}

export const priorityReviewMeta = {
  triggerLabel: 'RevisÃ£o prioritÃ¡ria',
  title: 'RevisÃ£o PrioritÃ¡ria â€” ReproduÃ§Ã£o e Biotecnologias',
  subtitle: 'QuestÃµes com maior chance de cair, em versÃ£o mÃ­nima para prova',
  info: 'Use esta seÃ§Ã£o para decorar respostas curtas. Ela nÃ£o substitui a revisÃ£o completa.',
  finalReminder: 'Antes da prova, decore nesta ordem: Q5 â†’ Q3 â†’ Q4 â†’ Q11 â†’ Q9.',
}

export const priorityReviewCards: PriorityReviewCard[] = [
  {
    id: 'q3-espermatogenese',
    title: 'Q3 â€” EspermatogÃªnese',
    status: 'Curta',
    answer:
      'A espermatogÃªnese ocorre nos tÃºbulos seminÃ­feros dos testÃ­culos. A sequÃªncia germinativa Ã©: espermatogÃ´nias â†’ espermatÃ³citos I â†’ espermatÃ³citos II â†’ espermÃ¡tides â†’ espermatozoides. As cÃ©lulas de Sertoli nutrem e sustentam as cÃ©lulas germinativas, enquanto as cÃ©lulas de Leydig produzem testosterona. O processo envolve mitose, meiose e espermiogÃªnese.',
    mustRemember: [
      'TÃºbulos seminÃ­feros',
      'EspermatogÃ´nia â†’ espermatÃ³cito I â†’ espermatÃ³cito II â†’ espermÃ¡tide â†’ espermatozoide',
      'Sertoli = suporte/nutriÃ§Ã£o',
      'Leydig = testosterona',
    ],
    risk:
      'NÃ£o confundir espermatogÃªnese com espermiogÃªnese: espermiogÃªnese Ã© sÃ³ a transformaÃ§Ã£o da espermÃ¡tide em espermatozoide.',
  },
  {
    id: 'q4-oogenese',
    title: 'Q4 â€” OogÃªnese',
    status: 'Curta',
    answer:
      'A oogÃªnese ocorre nos ovÃ¡rios e comeÃ§a ainda na vida embrionÃ¡ria. O oÃ³cito primÃ¡rio fica bloqueado em prÃ³fase I atÃ© a puberdade. ApÃ³s a retomada da meiose, forma-se o oÃ³cito secundÃ¡rio, que fica bloqueado em metÃ¡fase II e sÃ³ completa a meiose se houver fecundaÃ§Ã£o.',
    mustRemember: [
      'OvÃ¡rio',
      'ComeÃ§a na vida embrionÃ¡ria',
      'Bloqueio em prÃ³fase I',
      'Bloqueio em metÃ¡fase II',
      'SÃ³ termina se fecundar',
    ],
    risk: 'Na espermatogÃªnese o processo Ã© contÃ­nuo; na oogÃªnese hÃ¡ bloqueios.',
  },
  {
    id: 'q5-hhg',
    title: 'Q5 â€” Eixo HipotÃ¡lamo-HipÃ³fise-GÃ´nadas',
    status: 'Parcialmente correta â€” reforÃ§ar',
    answer:
      'O hipotÃ¡lamo libera GnRH, que estimula a hipÃ³fise anterior a liberar FSH e LH. O FSH estimula crescimento folicular nas fÃªmeas e espermatogÃªnese nos machos. O LH induz ovulaÃ§Ã£o e formaÃ§Ã£o/manutenÃ§Ã£o do corpo lÃºteo nas fÃªmeas e estimula as cÃ©lulas de Leydig a produzirem testosterona nos machos. EstrogÃªnio, progesterona e testosterona fazem feedback negativo; no final do estro, o pico de estrogÃªnio faz feedback positivo, gerando pico de LH e ovulaÃ§Ã£o.',
    mustRemember: [
      'GnRH â†’ FSH e LH',
      'FSH = folÃ­culo / espermatogÃªnese',
      'LH = ovulaÃ§Ã£o / CL / Leydig',
      'Feedback negativo',
      'Feedback positivo: pico de estrÃ³geno â†’ pico de LH â†’ ovulaÃ§Ã£o',
    ],
    risk: 'NÃ£o esquecer o feedback positivo. Ã‰ o ponto mais cobrado.',
  },
  {
    id: 'q9-espermograma',
    title: 'Q9 â€” Espermograma e dose inseminante',
    status: 'Parcialmente correta â€” explicar',
    answer:
      'O nÃºmero de doses de sÃªmen pode ser calculado a partir de trÃªs parÃ¢metros do espermograma: volume do ejaculado, concentraÃ§Ã£o espermÃ¡tica e motilidade progressiva. A lÃ³gica Ã© multiplicar volume Ã— concentraÃ§Ã£o Ã— motilidade para estimar espermatozoides viÃ¡veis/mÃ³veis e dividir pelo mÃ­nimo necessÃ¡rio por dose.',
    mustRemember: [
      'Volume',
      'ConcentraÃ§Ã£o',
      'Motilidade',
      'Dose inseminante',
      'Espermatozoides viÃ¡veis/mÃ³veis',
    ],
    risk:
      'Dizer apenas os trÃªs nomes nÃ£o basta; explique que eles servem para calcular quantos espermatozoides Ãºteis existem para dividir em doses.',
  },
  {
    id: 'q11-crioprotetores',
    title: 'Q11 â€” Crioprotetores',
    status: 'Correta â€” leve ajuste',
    answer:
      'Crioprotetores protegem os espermatozoides durante congelamento e descongelamento, reduzindo danos por cristais de gelo, desidrataÃ§Ã£o e choque osmÃ³tico. Intracelulares, como glicerol, penetram na cÃ©lula e protegem o interior. Extracelulares, como gema de ovo, leite desnatado e aÃ§Ãºcares, nÃ£o penetram na cÃ©lula e protegem a membrana e o meio externo.',
    mustRemember: [
      'Crioprotetor',
      'Cristais de gelo',
      'Intracelular = entra na cÃ©lula',
      'Extracelular = nÃ£o entra',
      'Glicerol = intracelular',
      'Gema de ovo = extracelular',
    ],
    risk:
      'A diferenÃ§a que pontua Ã© a permeabilidade da membrana: glicerol entra; gema de ovo nÃ£o entra.',
  },
]

export const priorityStudyOrder = [
  '#1 Q5 â€” HHG: FSH/LH, feedback negativo e feedback positivo para pico de LH.',
  '#2 Q3 â€” EspermatogÃªnese: tÃºbulos seminÃ­feros, sequÃªncia celular, Sertoli e Leydig.',
  '#3 Q4 â€” OogÃªnese: dois bloqueios, prÃ³fase I e metÃ¡fase II.',
  '#4 Q11 â€” Crioprotetores: intracelular vs extracelular.',
  '#5 Q9 â€” Espermograma: volume Ã— concentraÃ§Ã£o Ã— motilidade.',
]

export const priorityUltraSummary = [
  'Q3: "EspermatogÃ´nia â†’ espermatÃ³cito I â†’ espermatÃ³cito II â†’ espermÃ¡tide â†’ espermatozoide nos tÃºbulos seminÃ­feros, com Sertoli e Leydig."',
  'Q4: "OÃ³cito primÃ¡rio trava em prÃ³fase I; oÃ³cito secundÃ¡rio trava em metÃ¡fase II e sÃ³ termina se fecundar."',
  'Q5: "GnRH estimula FSH/LH; FSH faz folÃ­culo/espermatogÃªnese; LH faz ovulaÃ§Ã£o/CL/testosterona; estrÃ³geno alto faz pico de LH."',
  'Q9: "Doses = volume Ã— concentraÃ§Ã£o Ã— motilidade, dividindo pelo mÃ­nimo necessÃ¡rio por dose."',
  'Q11: "Glicerol entra na cÃ©lula; gema/leite/aÃ§Ãºcares nÃ£o entram e protegem por fora."',
]

