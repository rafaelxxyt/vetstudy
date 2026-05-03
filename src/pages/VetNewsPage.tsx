import { motion } from 'framer-motion'
import { Newspaper, ExternalLink, Clock, Tag } from 'lucide-react'

const NEWS = [
  {
    id: 1, tag: 'Infectologia', tagColor: 'text-danger-400 bg-danger-500/10 border-danger-500/20',
    title: 'Nova variante de CPV-2 detectada em filhotes vacinados no Sul do Brasil',
    summary: 'Pesquisadores da UFRGS identificaram divergência antigênica em cepa de Parvovírus circulante na região, com implicações para o protocolo vacinal.',
    source: 'Vet. Microbiology Br.', time: '2h atrás',
    url: 'https://www.ufrgs.br/labvir/',
  },
  {
    id: 2, tag: 'Reprodução', tagColor: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
    title: 'Protocolo Ovsynch modificado aumenta taxa de prenhez em rebanho Nelore',
    summary: 'Estudo multicêntrico com 1.200 matrizes zebuínas demonstra melhoria de 12% na taxa de concepção com ajuste do timing do segundo GnRH.',
    source: 'Theriogenology BR', time: '5h atrás',
    url: 'https://www.sciencedirect.com/journal/theriogenology',
  },
  {
    id: 3, tag: 'Farmacologia', tagColor: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
    title: 'MAPA atualiza lista de antimicrobianos de uso exclusivo veterinário',
    summary: 'Resolução publicada no Diário Oficial inclui duas novas fluoroquinolonas de 4ª geração com restrição de uso em animais de produção.',
    source: 'Diário Oficial / MAPA', time: '1d atrás',
    url: 'https://www.gov.br/agricultura/pt-br',
  },
  {
    id: 4, tag: 'Cirurgia', tagColor: 'text-warning-400 bg-warning-500/10 border-warning-500/20',
    title: 'Laparoscopia em bovinos: revisão sobre técnica de rumenopexia',
    summary: 'Artigo de revisão aborda as principais indicações e complicações da correção laparoscópica de deslocamento de abomaso à esquerda em vacas leiteiras.',
    source: 'Acta Vet. Bras.', time: '2d atrás',
    url: 'https://periodicos.ufersa.edu.br/acta',
  },
  {
    id: 5, tag: 'Diagnóstico', tagColor: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
    title: 'IA supera diagnóstico convencional na detecção de mastite subclínica',
    summary: 'Modelo de machine learning treinado com dados de CCS e produção leiteira alcança 94,3% de sensibilidade na identificação precoce de quartos infectados.',
    source: 'J. Dairy Science', time: '3d atrás',
    url: 'https://www.journalofdairyscience.org/',
  },
  {
    id: 6, tag: 'Bem-estar', tagColor: 'text-success-400 bg-success-500/10 border-success-500/20',
    title: 'CFMV publica nova resolução sobre bem-estar em abatedouros frigoríficos',
    summary: 'Norma estabelece requisitos obrigatórios de treinamento para médicos veterinários responsáveis pelo abate humanitário.',
    source: 'CFMV', time: '4d atrás',
    url: 'https://www.cfmv.gov.br',
  },
]

export default function VetNewsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Newspaper size={22} className="text-primary-400" />
          <h1 className="text-2xl font-bold text-white">VetNews</h1>
        </div>
        <p className="text-neutral-400 text-sm">Últimas notícias da medicina veterinária nacional e internacional</p>
      </div>

      {/* Destaque */}
      <motion.a
        href={NEWS[0].url}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.18 }}
        className="block bg-gradient-to-br from-primary-600/20 to-neutral-800 rounded-2xl p-6 border border-primary-500/20 mb-6 cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-danger-500/15 text-danger-400 border border-danger-500/20 flex items-center gap-1.5">
            🔴 Destaque
          </span>
          <span className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Clock size={11} /> {NEWS[0].time}
          </span>
        </div>
        <h2 className="text-lg font-bold text-white mb-2 group-hover:text-primary-300 transition-colors">
          {NEWS[0].title}
        </h2>
        <p className="text-sm text-neutral-400 leading-relaxed mb-4">{NEWS[0].summary}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">{NEWS[0].source}</span>
          <span className="flex items-center gap-1.5 text-xs text-primary-400 group-hover:text-primary-300 transition-colors font-medium">
            Ler artigo <ExternalLink size={11} />
          </span>
        </div>
      </motion.a>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {NEWS.slice(1).map((item, i) => (
          <motion.a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.18 }}
            whileHover={{ y: -2 }}
            className="block bg-neutral-800 rounded-2xl p-5 border border-neutral-700/80 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${item.tagColor}`}>
                <Tag size={8} /> {item.tag}
              </span>
              <span className="text-[10px] text-neutral-600 flex items-center gap-1">
                <Clock size={9} /> {item.time}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-neutral-200 mb-1.5 leading-snug group-hover:text-primary-300 transition-colors line-clamp-2">
              {item.title}
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2 mb-3">{item.summary}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-600">{item.source}</span>
              <ExternalLink size={11} className="text-neutral-600 group-hover:text-primary-400 transition-colors" />
            </div>
          </motion.a>
        ))}
      </div>

      <p className="text-center text-xs text-neutral-600 mt-8">
        Conteúdo ilustrativo · todos os links abrem em nova aba
      </p>
    </div>
  )
}
