export type ReviewTag =
  | 'Anatomia'
  | 'Ciclo Estral'
  | 'Biotecnologias'
  | 'Caso Clínico'
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
  sidebarLabel: 'Revisão Dirigida',
  title: 'Reprodução Animal - Revisão Dirigida',
  subtitle: 'Resumo visual para revisão rápida da prova',
}

export const quickReviewMustKnow = [
  'Fases do ciclo: Proestro -> Estro -> Metaestro -> Diestro.',
  'Cio = estrogênio. Gestação = progesterona.',
  'Muco claro = cio. Muco espesso = diestro.',
  'Vaca: ciclo em torno de 21 dias e cio curto.',
  'Corpo lúteo produz progesterona e PGF2α uterina causa luteólise.',
  'Ovelha e cabra ciclam em dias curtos. Égua cicla em dias longos.',
  'Cadela é monoéstrica e aceita monta no estro, não no proestro.',
  'Trompa uterina = fecundação. Útero = implantação e gestação.',
  'IA multiplica genética do macho. TE multiplica genética da fêmea.',
  'ECC baixo e balanço energético negativo prolongam o anestro pós-parto.',
]

export const top25Points = [
  'Ciclo estral = receptividade sexual em intervalos típicos da espécie.',
  'Ordem das fases: Proestro -> Estro -> Metaestro -> Diestro.',
  'Proestro e Estro são fases mais estrogênicas.',
  'Metaestro e Diestro são fases mais progesterônicas.',
  'Vaca e porca são poliéstricas anuais com ciclo em torno de 21 dias.',
  'O cio da vaca é curto e exige atenção ao manejo.',
  'O cio da porca é mais longo que o da vaca.',
  'Ovelha e cabra respondem a dias curtos.',
  'Égua e gata respondem a dias longos.',
  'Cadela é monoéstrica.',
  'Fotoperíodo age via melatonina no eixo hipotálamo-hipófise-gônadas.',
  'Folículo dominante produz estrogênio e antecede a ovulação.',
  'Corpo lúteo produz progesterona e mantém a fase lútea.',
  'PGF2α é o principal hormônio luteolítico.',
  'Luteólise reduz progesterona e permite reinício do ciclo.',
  'Muco claro e cristalino sugere estro.',
  'Muco espesso e opaco sugere diestro.',
  'A fecundação ocorre na trompa uterina, não no útero.',
  'Endométrio = implantação e PGF2α. Miométrio = contração. Perimétrio = proteção.',
  'Cérvix da vaca tem anéis. Cérvix da porca é espiral. Cérvix da égua é mais simples.',
  'IA multiplica genética de machos. TE multiplica genética de fêmeas.',
  'IATF permite inseminação em lote sem depender da observação do cio.',
  'Balanço energético negativo prolonga o anestro pós-parto.',
  'Na cadela, o estro mostra células queratinizadas anucleares na citologia.',
  'Sangramento da cadela aparece no proestro e não significa aceitação de monta.',
]

export const oralQuestions: OverviewQuestion[] = [
  { id: 'p1', prompt: 'Qual hormônio o folículo dominante produz?', answer: 'Estrogênio.' },
  { id: 'p2', prompt: 'Qual hormônio o corpo lúteo produz?', answer: 'Progesterona.' },
  { id: 'p3', prompt: 'Qual hormônio causa a luteólise?', answer: 'PGF2α produzida pelo útero.' },
  { id: 'p4', prompt: 'Onde ocorre a fecundação?', answer: 'Na trompa uterina, também chamada de oviduto.' },
  { id: 'p5', prompt: 'Quanto dura o cio da vaca?', answer: 'Em geral, 12 a 18 horas.' },
  { id: 'p6', prompt: 'A cadela é poliéstrica ou monoéstrica?', answer: 'Monoéstrica.' },
  { id: 'p7', prompt: 'A égua cicla em dias longos ou curtos?', answer: 'Dias longos.' },
  { id: 'p8', prompt: 'A ovelha cicla em dias longos ou curtos?', answer: 'Dias curtos.' },
  { id: 'p9', prompt: 'Qual célula predomina na citologia vaginal da cadela no estro?', answer: 'Célula queratinizada anuclear.' },
  { id: 'p10', prompt: 'Qual a diferença entre IA e TE em termos de benefício genético?', answer: 'IA multiplica genética do macho. TE multiplica genética da fêmea.' },
  { id: 'p11', prompt: 'O que é IATF?', answer: 'Inseminação Artificial em Tempo Fixo após sincronização, sem detecção de cio.' },
  { id: 'p12', prompt: 'Por que ECC baixo prolonga anestro pós-parto?', answer: 'Porque o balanço energético negativo inibe pulsos de GnRH e LH.' },
  { id: 'p13', prompt: 'O que acontece após PGF2α em vaca com CL funcional?', answer: 'Luteólise, queda de progesterona e retorno ao cio em poucos dias.' },
  { id: 'p14', prompt: 'Quais são as três camadas do útero?', answer: 'Endométrio, miométrio e perimétrio.' },
  { id: 'p15', prompt: 'No cio, o muco cervical é claro ou espesso?', answer: 'Claro, elástico e cristalino.' },
]

export const pitfalls = [
  'A fecundação ocorre no útero. Errado: ocorre na trompa uterina.',
  'A cadela é poliéstrica. Errado: ela é monoéstrica.',
  'O sangramento da cadela indica aceitação de monta. Errado: isso acontece no proestro, antes da receptividade.',
  'A ovelha se reproduz no verão. Errado: ela responde a dias curtos, em geral no outono e inverno.',
  'A luteólise é causada pela queda de LH. Errado: a PGF2α uterina é o fator luteolítico principal.',
  'O corpo lúteo produz estrogênio. Errado: o folículo produz estrogênio; o CL produz progesterona.',
  'TE serve para multiplicar genética de touros. Errado: isso é mais associado à IA.',
  'Qualquer fase do ciclo responde à PGF2α. Errado: ela depende de CL funcional.',
  'IATF sempre tem taxa de concepção maior que a IA convencional. Errado: a principal vantagem é operacional.',
  'Amamentação não afeta o ciclo. Errado: pode prolongar o anestro pós-parto.',
]

export const reviewPlan = [
  '0-8 min: fechar o texto e recitar a sequência hormonal até a luteólise.',
  '8-16 min: falar em voz alta as fases do ciclo e o padrão sazonal das espécies.',
  '16-24 min: revisar IA, IATF e TE, além do efeito do progestágeno exógeno.',
  '24-32 min: reler os casos 8, 13, 20 e 22 e responder de memória.',
  '32-38 min: revisar as pegadinhas e dizer por que cada uma está errada.',
  '38-40 min: reler o bloco de alta prioridade e encerrar a revisão.',
]

export const hormoneTable = {
  title: 'Tabela dos Hormônios',
  headers: ['Hormônio', 'Quem produz', 'Função', 'Quando predomina'],
  rows: [
    { cells: ['GnRH', 'Hipotálamo', 'Estimula a hipófise a liberar FSH e LH.', 'Pulsos contínuos; pico ligado à ovulação.'] },
    { cells: ['FSH', 'Hipófise anterior', 'Estimula crescimento folicular.', 'Proestro.'] },
    { cells: ['LH', 'Hipófise anterior', 'Pico pré-ovulatório e suporte à função lútea.', 'Final do estro.'] },
    { cells: ['Prolactina', 'Hipófise anterior', 'Produção de leite e participação no pós-parto.', 'Lactação e pós-parto.'] },
    { cells: ['Ocitocina', 'Neuro-hipófise', 'Contração uterina no parto e ejeção do leite.', 'Parto e amamentação.'] },
    { cells: ['Estrogênio', 'Ovário (folículo)', 'Induz cio, prolifera endométrio e gera muco claro.', 'Proestro e estro.'] },
    { cells: ['Progesterona', 'Ovário (CL) e placenta', 'Mantém gestação, fecha cérvix e inibe cio.', 'Metaestro, diestro e gestação.'] },
    { cells: ['Inibina', 'Ovário (granulosa)', 'Inibe FSH e regula recrutamento folicular.', 'Fase folicular.'] },
    { cells: ['PGF2α', 'Útero (endométrio)', 'Promove luteólise e reinício do ciclo.', 'Final do diestro sem prenhez.'] },
    { cells: ['Relaxina', 'CL ou placenta', 'Favorece relaxamento do canal do parto.', 'Final da gestação.'] },
  ] satisfies SummaryTableRow[],
}

export const cycleTable = {
  title: 'Tabela das Fases do Ciclo Estral',
  headers: ['Fase', 'O que acontece', 'Hormônio predominante', 'Sinais observados'],
  rows: [
    { cells: ['Proestro', 'Regressão do CL anterior e rápido desenvolvimento folicular.', 'Estrogênio em ascensão.', 'Fêmea ainda não aceita monta; vulva começa a inchar.'] },
    { cells: ['Estro', 'Pico de estrogênio, receptividade plena e ovulação ao final.', 'Estrogênio no pico.', 'Aceita monta, muco claro, inquietação e vulva hiperemiada.'] },
    { cells: ['Metaestro', 'Pós-ovulação imediata com formação do CL.', 'Transição para progesterona.', 'Pode ocorrer sangramento leve em bovinos.'] },
    { cells: ['Diestro', 'CL maduro e funcional; fase mais longa.', 'Progesterona dominante.', 'Sem cio, muco espesso e ambiente uterino estável.'] },
    { cells: ['Anestro', 'Inatividade reprodutiva, sazonal ou por outras causas.', 'Progesterona baixa ou nula.', 'Sem cio e ovários inativos.'] },
  ] satisfies SummaryTableRow[],
}

export const reviewQuestions: ReviewQuestion[] = [
  {
    number: 1,
    prompt: 'Partes externas do trato reprodutor feminino e função principal de cada uma.',
    shortAnswer: 'Vulva protege a entrada externa; vestíbulo é a zona de junção e passagem; vagina atua como órgão copulador e canal de parto; cérvix protege o útero.',
    explanation: 'Pensando de fora para dentro, a vulva é a primeira barreira visível. O vestíbulo fica logo após a vulva e recebe a abertura uretral. A vagina é o canal de cópula e também participa do parto. A cérvix funciona como um portão protetor entre a vagina e o útero.',
    memorize: 'V-V-V-C: Vulva, Vestíbulo, Vagina e Cérvix.',
    attention: 'Alguns professores colocam a vagina como estrutura interna. A cérvix costuma ser cobrada como barreira de proteção, não como canal de parto.',
    tags: ['Anatomia'],
  },
  {
    number: 2,
    prompt: 'Diferença entre vagina e cérvix quanto à função no acasalamento e na proteção uterina.',
    shortAnswer: 'A vagina recebe o pênis e o sêmen. A cérvix protege o útero e só relaxa adequadamente no estro para favorecer a passagem espermática.',
    explanation: 'A vagina é um canal de trânsito. Já a cérvix é uma barreira fisiológica: no cio ela permite passagem com muco mais favorável; fora dele, mantém proteção com muco espesso.',
    memorize: 'Vagina = via de entrada. Cérvix = guarda do útero.',
    attention: 'A dificuldade técnica da IA depende muito do formato da cérvix de cada espécie.',
    tags: ['Anatomia'],
  },
  {
    number: 3,
    prompt: 'Como é a cérvix de vacas, porcas e éguas, e por que isso muda a técnica de inseminação?',
    shortAnswer: 'Na vaca há anéis cervicais; na porca, formato espiralado; na égua, canal mais simples e relaxável. Isso muda a forma de passagem do cateter.',
    explanation: 'A vaca tem cérvix mais tortuosa e exige maior habilidade de manipulação. A porca usa cateter compatível com a configuração espiral. A égua tem passagem mais direta, o que facilita a técnica transcervical.',
    memorize: 'Vaca = anéis. Porca = espiral. Égua = simples.',
    attention: 'A égua tem cérvix mais simples, mas a ovulação exige acompanhamento reprodutivo cuidadoso.',
    tags: ['Anatomia', 'Biotecnologias'],
  },
  {
    number: 4,
    prompt: 'Três camadas do útero e função simples de cada uma.',
    shortAnswer: 'Endométrio é a camada interna ligada à implantação; miométrio é a camada muscular; perimétrio é a camada externa protetora.',
    explanation: 'O endométrio participa da nutrição embrionária e de sinais uterinos como a PGF2α. O miométrio responde pelas contrações. O perimétrio recobre e protege externamente o órgão.',
    memorize: 'Endo = dentro. Mio = músculo. Peri = por fora.',
    attention: 'O endométrio é frequentemente associado à produção de PGF2α e à luteólise.',
    tags: ['Anatomia', 'Ciclo Estral'],
  },
  {
    number: 5,
    prompt: 'Função principal das trompas uterinas (ovidutos).',
    shortAnswer: 'São o local da fecundação e a via de transporte do oócito ou embrião inicial em direção ao útero.',
    explanation: 'A trompa conecta ovário e útero. É nela que ocorre o encontro entre espermatozoide e oócito, seguido do deslocamento do embrião precoce até o útero.',
    memorize: 'Trompa = fecundação + estrada do embrião.',
    attention: 'Fecundação ocorre na trompa, não no útero.',
    tags: ['Anatomia'],
  },
  {
    number: 6,
    prompt: 'O que é um folículo dominante e o que é um corpo lúteo?',
    shortAnswer: 'Folículo dominante é o principal folículo do ciclo e produz estrogênio. Corpo lúteo é a estrutura formada após a ovulação e produz progesterona.',
    explanation: 'O folículo dominante cresce, amadurece o oócito e conduz ao cio e à ovulação. Depois que ele rompe, o local se transforma em corpo lúteo, mudando o padrão hormonal do ciclo.',
    memorize: 'Folículo -> estrogênio -> cio -> ovulação -> CL -> progesterona.',
    attention: 'Se não houver gestação, o CL regride pela ação luteolítica da PGF2α.',
    tags: ['Anatomia', 'Ciclo Estral'],
  },
  {
    number: 7,
    prompt: 'Diferença entre estrogênio e progesterona quanto ao comportamento de cio e ao útero.',
    shortAnswer: 'Estrogênio favorece cio, receptividade e muco claro. Progesterona suprime cio, mantém o útero em ambiente secretor e fecha a cérvix com muco espesso.',
    explanation: 'Estrogênio é o hormônio mais ligado à fase folicular, ao comportamento sexual e ao preparo para ovulação. Progesterona domina a fase lútea e a gestação, estabilizando o útero.',
    memorize: 'Estro = estrogênio. Gestação = progesterona.',
    attention: 'Não confundir a origem hormonal: folículo produz estrogênio; CL produz progesterona.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 8,
    prompt: 'Caso clínico: vaca com muco claro e cristalino mais inquietação. Qual a fase e a conduta?',
    shortAnswer: 'A fase mais provável é o estro. A conduta é confirmar o cio e programar a IA na janela adequada.',
    explanation: 'Muco claro e comportamento inquieto são sinais clássicos de ação estrogênica elevada. Essa combinação aponta para receptividade sexual ativa, compatível com o cio.',
    attention: 'Não confundir com proestro, em que a receptividade ainda não está plena, nem com diestro, em que o muco tende a ser espesso.',
    tags: ['Ciclo Estral', 'Caso Clínico', 'Biotecnologias'],
    isCase: true,
  },
  {
    number: 9,
    prompt: 'Fases do ciclo estral em ordem cronológica e hormônios predominantes.',
    shortAnswer: 'Proestro, estro, metaestro e diestro. Proestro e estro são mais estrogênicos; metaestro e diestro caminham para predominância de progesterona.',
    explanation: 'No proestro ocorre crescimento folicular e aumento de estrogênio. No estro há receptividade sexual e ovulação ao final. Metaestro marca a transição com formação do CL, e diestro representa a fase lútea funcional.',
    memorize: 'P-E-M-D.',
    attention: 'A ovulação ocorre no final do estro, não no início.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 10,
    prompt: 'Duração média do ciclo estral em vacas e porcas.',
    shortAnswer: 'Vaca e porca apresentam ciclo em torno de 21 dias.',
    explanation: 'As duas espécies têm duração cíclica parecida, o que ajuda bastante na memorização. O que muda mais entre elas é a duração do estro.',
    memorize: 'Vaca = 21 e porca = 21.',
    attention: 'O cio da vaca é curto, enquanto o da porca é mais prolongado.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 11,
    prompt: 'Diferença entre poliestral anual e poliestral estacional.',
    shortAnswer: 'Poliestral anual significa ciclar ao longo do ano todo. Poliestral estacional significa ciclar apenas em determinada época do ano.',
    explanation: 'Espécies anuais mantêm ciclos relativamente regulares sem pausa sazonal importante. Espécies estacionais alternam uma época de atividade reprodutiva com outra de anestro.',
    memorize: 'Anual = o ano todo. Estacional = só em parte do ano.',
    attention: 'Cadela é monoéstrica e não entra nesse grupo poliéstrico clássico.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 12,
    prompt: 'Por que o fotoperíodo influencia a reprodução de ovelhas e éguas?',
    shortAnswer: 'Porque a duração da luz modula melatonina, que interfere na secreção de GnRH e, por consequência, na atividade ovariana.',
    explanation: 'A retina capta luz e escuridão, e a pineal ajusta a melatonina. Em ovelhas, dias curtos favorecem ciclicidade. Em éguas, dias longos favorecem ciclicidade.',
    memorize: 'Ovelha: inverno. Égua: verão.',
    attention: 'Trocar a direção do fotoperíodo entre espécies é uma pegadinha muito comum.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 13,
    prompt: 'Caso clínico: cabras com baixa manifestação de cio no verão. Causa provável e manejo.',
    shortAnswer: 'A principal hipótese é anestro estacional. Um manejo simples é explorar o efeito macho ou manejar fotoperíodo.',
    explanation: 'Cabras costumam responder melhor a dias curtos. No verão, com noites mais curtas, a atividade reprodutiva pode cair e o cio se expressa menos.',
    attention: 'Quando o problema aparece de forma ampla no lote e coincide com a estação, pense primeiro em fisiologia sazonal antes de doença.',
    tags: ['Ciclo Estral', 'Caso Clínico'],
    isCase: true,
  },
  {
    number: 14,
    prompt: 'Dois sinais práticos de cio observáveis em bovinos.',
    shortAnswer: 'Aceitar ser montada e apresentar muco claro e cristalino são dois sinais clássicos.',
    explanation: 'O reflexo de imobilidade é o sinal comportamental mais confiável. O muco claro e filante é um bom apoio semiológico para reconhecer o estro.',
    memorize: 'Muco claro + deixa montar = cio bovino.',
    attention: 'Como o cio bovino pode ser curto, a observação inadequada reduz muito a detecção.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 15,
    prompt: 'Por que a condição corporal influencia o retorno ao ciclo após o parto?',
    shortAnswer: 'Porque baixo ECC e balanço energético negativo reduzem suporte metabólico ao eixo reprodutivo e prolongam o anestro pós-parto.',
    explanation: 'Quando a fêmea precisa priorizar manutenção e lactação, a reprodução perde prioridade biológica. Isso reduz pulsos hormonais importantes para crescimento folicular e ovulação.',
    memorize: 'ECC baixo = eixo bloqueado = anestro mais longo.',
    attention: 'Esse raciocínio é muito cobrado em vacas leiteiras e porcas em lactação.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 16,
    prompt: 'Função do muco cervical no estro e no diestro.',
    shortAnswer: 'No estro, o muco facilita passagem e sobrevivência dos espermatozoides. No diestro, o muco protege o útero como tampão cervical.',
    explanation: 'Sob estrogênio, o muco fica claro, elástico e favorável ao trânsito espermático. Sob progesterona, torna-se viscoso e protetor.',
    memorize: 'Estro abre a porta. Diestro fecha a porta.',
    attention: 'Tipo de muco ajuda muito a reconhecer a fase do ciclo.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 17,
    prompt: 'Dois cuidados básicos com sêmen e material na IA.',
    shortAnswer: 'Descongelar corretamente e evitar contaminação ou choque térmico do material são cuidados essenciais.',
    explanation: 'O sêmen é sensível a erros de manejo. Uma boa técnica de descongelação e um material limpo e termicamente protegido ajudam a preservar viabilidade espermática.',
    memorize: 'Descongelar certo, não contaminar e não esfriar.',
    attention: 'O fator humano do inseminador pesa muito na taxa de concepção.',
    tags: ['Biotecnologias'],
  },
  {
    number: 18,
    prompt: 'O que é IATF e qual sua principal vantagem?',
    shortAnswer: 'É a inseminação realizada em momento fixo após sincronização do ciclo. Sua maior vantagem é inseminar o lote sem depender da observação individual do cio.',
    explanation: 'A IATF transforma um processo muito observacional em um manejo planejado. Isso facilita aplicação em rebanhos grandes e reduz perdas por falha de detecção.',
    memorize: 'IATF = todo mundo no mesmo dia, sem detectar cio.',
    attention: 'A principal vantagem é operacional, não uma promessa automática de maior concepção por fêmea.',
    tags: ['Biotecnologias'],
  },
  {
    number: 19,
    prompt: 'Na transferência de embriões, cite uma vantagem e uma desvantagem.',
    shortAnswer: 'A vantagem é multiplicar rapidamente a genética de fêmeas superiores. A desvantagem é o custo e a necessidade de manejo mais complexo.',
    explanation: 'Com a TE, uma doadora pode gerar vários embriões para receptoras. Em compensação, o processo exige sincronização, estrutura e equipe treinada.',
    memorize: 'TE multiplica fêmea boa, mas custa mais e dá mais trabalho.',
    attention: 'IA e TE não são a mesma lógica de melhoramento genético.',
    tags: ['Biotecnologias'],
  },
  {
    number: 20,
    prompt: 'Caso clínico: várias matrizes suínas retornando ao cio cerca de 21 dias após IA. Hipótese e checagem prática.',
    shortAnswer: 'A hipótese principal é falha de concepção em lote. Vale revisar momento da IA, qualidade do sêmen e técnica de deposição.',
    explanation: 'Quando várias porcas retornam ao cio no intervalo típico do ciclo, o padrão sugere falha reprodutiva coletiva e não um evento individual isolado.',
    attention: 'Retorno regular ao redor de 21 dias sugere não concepção. Retornos mais irregulares levantam outras hipóteses.',
    tags: ['Biotecnologias', 'Caso Clínico'],
    isCase: true,
  },
  {
    number: 21,
    prompt: 'O que é anestro pós-parto e qual fator nutricional o agrava?',
    shortAnswer: 'É o período pós-parto sem ciclos estrais funcionais. O balanço energético negativo é um dos principais fatores que o prolongam.',
    explanation: 'Algum grau de anestro pós-parto é esperado, mas ele se torna mais longo quando a condição metabólica da fêmea está comprometida, especialmente em alta produção.',
    memorize: 'Anestro pós-parto + vaca magra = recuperação reprodutiva mais lenta.',
    attention: 'Amamentação também pode participar do prolongamento do anestro.',
    tags: ['Ciclo Estral'],
  },
  {
    number: 22,
    prompt: 'Caso clínico: vaca com CL funcional recebe PGF2α. O que acontece com o CL e com o cio?',
    shortAnswer: 'O corpo lúteo regride, a progesterona cai e a vaca tende a retornar ao cio em poucos dias.',
    explanation: 'A PGF2α promove luteólise quando há CL funcional. Com isso, o bloqueio progesterônico é removido e o eixo reprodutivo volta a avançar rumo a um novo estro.',
    attention: 'PGF2α não tem efeito luteolítico útil se não houver CL funcional presente.',
    tags: ['Ciclo Estral', 'Caso Clínico', 'Biotecnologias'],
    isCase: true,
  },
  {
    number: 23,
    prompt: 'Por que é importante realizar sincronização de cio?',
    shortAnswer: 'Porque organiza o manejo reprodutivo em lote, reduz observação individual e favorece concentração de inseminações e partos.',
    explanation: 'A sincronização ajuda a padronizar o grupo, melhora o planejamento e viabiliza biotecnologias em escala produtiva.',
    memorize: 'Sincronização = todo mundo no mesmo ritmo.',
    tags: ['Biotecnologias'],
  },
  {
    number: 24,
    prompt: 'Qual a vantagem da IATF em relação à IA convencional?',
    shortAnswer: 'A principal vantagem é dispensar a detecção individual do estro e permitir inseminação de todo o lote em data programada.',
    explanation: 'Em sistemas extensivos e em animais com cio discreto, a IATF aumenta a eficiência operacional do rebanho por permitir cobertura ampla do lote.',
    attention: 'Ela não deve ser vista apenas como disputa de taxa de concepção pontual, mas como estratégia de manejo.',
    tags: ['Biotecnologias'],
  },
  {
    number: 25,
    prompt: 'Como o progestágeno exógeno age na sincronização e o que ocorre ao ser retirado?',
    shortAnswer: 'Ele imita a fase lútea e segura o ciclo sob feedback negativo. Quando é retirado, o eixo é liberado e a ovulação pode ser sincronizada.',
    explanation: 'Durante o uso, a progesterona exógena ajuda a manter o animal em estado semelhante ao diestro. Após a retirada, o crescimento folicular final e a ovulação acontecem em janela mais previsível.',
    memorize: 'Progestágeno = pausa forçada. Retirada = gatilho da janela ovulatória.',
    tags: ['Biotecnologias'],
  },
  {
    number: 26,
    prompt: 'Método para detectar cio em cadelas e principal achado no estro.',
    shortAnswer: 'O método clássico é a citologia vaginal. No estro, predominam células queratinizadas anucleares.',
    explanation: 'Na prática clínica, o esfregaço vaginal mostra o efeito estrogênico sobre o epitélio. No estro, as células ficam cornificadas e sem núcleo visível em grande proporção.',
    memorize: 'Estro da cadela = lâmina cheia de células queratinizadas anucleares.',
    attention: 'Sangramento aparece no proestro e não significa aceitação de monta.',
    tags: ['Pequenos Animais'],
  },
]

export const q27Legend: AnatomyLegendRow[] = [
  {
    number: 1,
    structure: 'Ovário',
    function: 'Produz oócitos, folículos, estrogênio e corpo lúteo com progesterona.',
    recognition: 'Estrutura pequena e oval na extremidade do trato reprodutor.',
  },
  {
    number: 2,
    structure: 'Oviduto / trompa uterina',
    function: 'Local da fecundação e transporte do oócito ou embrião até o útero.',
    recognition: 'Tubo fino entre ovário e corno uterino.',
  },
  {
    number: 3,
    structure: 'Carúnculas',
    function: 'Participam da formação dos placentomas em ruminantes.',
    recognition: 'Projeções no interior uterino típicas do endométrio de ruminantes.',
  },
  {
    number: 4,
    structure: 'Cornos uterinos',
    function: 'Regiões uterinas importantes para desenvolvimento embrionário e fetal conforme a espécie.',
    recognition: 'Dois prolongamentos uterinos que seguem a partir do corpo do útero.',
  },
  {
    number: 5,
    structure: 'Cérvix',
    function: 'Barreira entre vagina e útero, com proteção e controle de passagem.',
    recognition: 'Segmento mais firme entre útero e vagina.',
  },
  {
    number: 6,
    structure: 'Vagina',
    function: 'Canal copulatório e parte do canal do parto.',
    recognition: 'Canal caudal ao trato uterino, anterior à vulva.',
  },
  {
    number: 7,
    structure: 'Bexiga',
    function: 'Reservatório de urina e referência anatômica ventral.',
    recognition: 'Estrutura arredondada ventral ao trato genital.',
  },
  {
    number: 8,
    structure: 'Glândula mamária',
    function: 'Produção de leite no pós-parto e lactação.',
    recognition: 'Estrutura mamária ventral e externa ao trato pélvico.',
  },
  {
    number: 9,
    structure: 'Reto',
    function: 'Referência dorsal e via importante para palpação transretal em grandes animais.',
    recognition: 'Estrutura tubular dorsal ao trato reprodutor.',
  },
  {
    number: 10,
    structure: 'Saco retogenital',
    function: 'Recesso peritoneal entre reto e trato genital, útil como referência pélvica.',
    recognition: 'Espaço anatômico entre o reto e o trato genital interno.',
  },
]

export const q27Macete = '1 ovário, 2 oviduto, 3 carúncula, 4 corno, 5 cérvix, 6 vagina, 7 bexiga, 8 mama, 9 reto, 10 saco.'

export const q28Bovinos = {
  importance: [
    'Nos bovinos, a eficiência reprodutiva tem impacto direto sobre produtividade e rentabilidade.',
    'A vaca que demora a emprenhar amplia o intervalo entre partos e reduz o retorno econômico do sistema.',
    'Por isso, reprodução animal e biotecnologias são centrais tanto na bovinocultura de corte quanto na de leite.',
  ],
  biotechnologies: [
    {
      title: 'IA',
      description: 'Usa sêmen de touros geneticamente superiores para ampliar ganho genético em grande escala.',
    },
    {
      title: 'IATF',
      description: 'Permite inseminação em horário programado, sem depender da observação individual do cio.',
    },
    {
      title: 'TE',
      description: 'Coleta embriões de doadoras superiores e transfere para receptoras.',
    },
    {
      title: 'PIVE',
      description: 'Produção in vitro de embriões em laboratório, aumentando o aproveitamento genético da doadora.',
    },
  ],
  estrusDetection: [
    'O estro da vaca é curto, o que dificulta observação de campo.',
    'Aceitar ser montada é o sinal mais confiável.',
    'Muco claro e cristalino, inquietação e monta em outras fêmeas ajudam na identificação.',
    'Em zebuínos, o cio costuma ser ainda mais discreto, o que reforça a utilidade da IATF.',
  ],
  quickSummary: [
    'Bovinos dependem de alta eficiência reprodutiva para manter produtividade.',
    'IA e IATF são ferramentas-chave no contexto brasileiro.',
    'TE e PIVE aceleram melhoramento genético materno.',
    'Cio curto e nem sempre evidente tornam o manejo reprodutivo um ponto crítico.',
  ],
}

export const priorityReviewMeta = {
  triggerLabel: 'Revisão prioritária',
  title: 'Revisão Prioritária — Reprodução e Biotecnologias',
  subtitle: 'Questões com maior chance de cair, em versão mínima para prova',
  info: 'Use esta seção para decorar respostas curtas. Ela não substitui a revisão completa.',
  finalReminder: 'Antes da prova, decore nesta ordem: Q5 → Q3 → Q4 → Q11 → Q9.',
}

export const priorityReviewCards: PriorityReviewCard[] = [
  {
    id: 'q3-espermatogenese',
    title: 'Q3 — Espermatogênese',
    status: 'Curta',
    answer:
      'A espermatogênese ocorre nos túbulos seminíferos dos testículos. A sequência germinativa é: espermatogônias → espermatócitos I → espermatócitos II → espermátides → espermatozoides. As células de Sertoli nutrem e sustentam as células germinativas, enquanto as células de Leydig produzem testosterona. O processo envolve mitose, meiose e espermiogênese.',
    mustRemember: [
      'Túbulos seminíferos',
      'Espermatogônia → espermatócito I → espermatócito II → espermátide → espermatozoide',
      'Sertoli = suporte/nutrição',
      'Leydig = testosterona',
    ],
    risk:
      'Não confundir espermatogênese com espermiogênese: espermiogênese é só a transformação da espermátide em espermatozoide.',
  },
  {
    id: 'q4-oogenese',
    title: 'Q4 — Oogênese',
    status: 'Curta',
    answer:
      'A oogênese ocorre nos ovários e começa ainda na vida embrionária. O oócito primário fica bloqueado em prófase I até a puberdade. Após a retomada da meiose, forma-se o oócito secundário, que fica bloqueado em metáfase II e só completa a meiose se houver fecundação.',
    mustRemember: [
      'Ovário',
      'Começa na vida embrionária',
      'Bloqueio em prófase I',
      'Bloqueio em metáfase II',
      'Só termina se fecundar',
    ],
    risk: 'Na espermatogênese o processo é contínuo; na oogênese há bloqueios.',
  },
  {
    id: 'q5-hhg',
    title: 'Q5 — Eixo Hipotálamo-Hipófise-Gônadas',
    status: 'Parcialmente correta — reforçar',
    answer:
      'O hipotálamo libera GnRH, que estimula a hipófise anterior a liberar FSH e LH. O FSH estimula crescimento folicular nas fêmeas e espermatogênese nos machos. O LH induz ovulação e formação/manutenção do corpo lúteo nas fêmeas e estimula as células de Leydig a produzirem testosterona nos machos. Estrogênio, progesterona e testosterona fazem feedback negativo; no final do estro, o pico de estrogênio faz feedback positivo, gerando pico de LH e ovulação.',
    mustRemember: [
      'GnRH → FSH e LH',
      'FSH = folículo / espermatogênese',
      'LH = ovulação / CL / Leydig',
      'Feedback negativo',
      'Feedback positivo: pico de estrógeno → pico de LH → ovulação',
    ],
    risk: 'Não esquecer o feedback positivo. É o ponto mais cobrado.',
  },
  {
    id: 'q9-espermograma',
    title: 'Q9 — Espermograma e dose inseminante',
    status: 'Parcialmente correta — explicar',
    answer:
      'O número de doses de sêmen pode ser calculado a partir de três parâmetros do espermograma: volume do ejaculado, concentração espermática e motilidade progressiva. A lógica é multiplicar volume × concentração × motilidade para estimar espermatozoides viáveis/móveis e dividir pelo mínimo necessário por dose.',
    mustRemember: [
      'Volume',
      'Concentração',
      'Motilidade',
      'Dose inseminante',
      'Espermatozoides viáveis/móveis',
    ],
    risk:
      'Dizer apenas os três nomes não basta; explique que eles servem para calcular quantos espermatozoides úteis existem para dividir em doses.',
  },
  {
    id: 'q11-crioprotetores',
    title: 'Q11 — Crioprotetores',
    status: 'Correta — leve ajuste',
    answer:
      'Crioprotetores protegem os espermatozoides durante congelamento e descongelamento, reduzindo danos por cristais de gelo, desidratação e choque osmótico. Intracelulares, como glicerol, penetram na célula e protegem o interior. Extracelulares, como gema de ovo, leite desnatado e açúcares, não penetram na célula e protegem a membrana e o meio externo.',
    mustRemember: [
      'Crioprotetor',
      'Cristais de gelo',
      'Intracelular = entra na célula',
      'Extracelular = não entra',
      'Glicerol = intracelular',
      'Gema de ovo = extracelular',
    ],
    risk:
      'A diferença que pontua é a permeabilidade da membrana: glicerol entra; gema de ovo não entra.',
  },
]

export const priorityStudyOrder = [
  '#1 Q5 — HHG: FSH/LH, feedback negativo e feedback positivo para pico de LH.',
  '#2 Q3 — Espermatogênese: túbulos seminíferos, sequência celular, Sertoli e Leydig.',
  '#3 Q4 — Oogênese: dois bloqueios, prófase I e metáfase II.',
  '#4 Q11 — Crioprotetores: intracelular vs extracelular.',
  '#5 Q9 — Espermograma: volume × concentração × motilidade.',
]

export const priorityUltraSummary = [
  'Q3: "Espermatogônia → espermatócito I → espermatócito II → espermátide → espermatozoide nos túbulos seminíferos, com Sertoli e Leydig."',
  'Q4: "Oócito primário trava em prófase I; oócito secundário trava em metáfase II e só termina se fecundar."',
  'Q5: "GnRH estimula FSH/LH; FSH faz folículo/espermatogênese; LH faz ovulação/CL/testosterona; estrógeno alto faz pico de LH."',
  'Q9: "Doses = volume × concentração × motilidade, dividindo pelo mínimo necessário por dose."',
  'Q11: "Glicerol entra na célula; gema/leite/açúcares não entram e protegem por fora."',
]
