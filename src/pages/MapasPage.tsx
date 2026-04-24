import { useState } from 'react'
import { motion } from 'framer-motion'
import { Network, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import Gatekeeper from '../components/Gatekeeper'

/* ─── Tipos ─── */
interface Node { id: string; label: string; explanation: string; x: number; y: number; color: string; main?: boolean }
interface MapData { id: string; title: string; emoji: string; desc: string; nodes: Node[]; edges: string[][] }
type RawNode = Omit<Node, 'explanation'>
type RawMapData = Omit<MapData, 'nodes'> & { nodes: RawNode[] }

const NODE_EXPLANATIONS: Record<string, Record<string, string>> = {
  hhg: {
    hip: 'Comanda o início dos sinais hormonais. Ele ajuda o corpo a organizar o ciclo reprodutivo.',
    gnrh: 'Avisa a hipófise para liberar LH e FSH. Sem esse sinal, o ovário não entra no ritmo certo.',
    hof: 'Recebe o sinal do cérebro e libera LH e FSH. Ela conecta o comando nervoso ao ovário.',
    lh: 'Dispara a ovulação e ajuda a formar o corpo lúteo. É essencial para o ciclo avançar.',
    fsh: 'Faz os folículos crescerem e seleciona os mais importantes. Assim o ovário prepara a ovulação.',
    fol: 'Protege o oócito e produz estrogênio. Ele prepara o cio e pode virar o folículo ovulatório.',
    ovul: 'Libera o oócito para possível fecundação. É o ponto em que a fêmea pode emprenhar.',
    cl: 'Produz progesterona depois da ovulação. Ele mantém o útero preparado para a gestação.',
    e2: 'Provoca sinais de cio e prepara o trato reprodutivo. Ele mostra que a fêmea está próxima de ovular.',
    p4: 'Mantém o útero preparado e bloqueia novo cio. Ela sustenta a fase lútea e a gestação inicial.',
    neg: 'Freia a liberação de novos hormônios. Isso evita estímulos exagerados e mantém o ciclo equilibrado.',
  },
  ciclo: {
    c: 'Organiza as fases entre um cio e outro. Entender essa sequência ajuda a prever ovulação e manejo.',
    pro: 'Prepara a fêmea para entrar em cio. Os folículos crescem e o estrogênio começa a subir.',
    est: 'É o período em que a fêmea aceita monta. Ele indica que a ovulação está próxima.',
    met: 'Marca a transição depois do cio. O corpo lúteo começa a se formar e muda o perfil hormonal.',
    die: 'Mantém progesterona alta por mais tempo. Essa fase prepara o útero e impede novo cio.',
    e2b: 'Aumenta os sinais de cio. Isso facilita identificar o melhor momento reprodutivo.',
    lhb: 'Dispara a ovulação do folículo dominante. É o sinal que transforma preparo em liberação do oócito.',
    p4b: 'Sobe quando o corpo lúteo está funcionando. Ela mostra que o ciclo entrou na fase lútea.',
    pgf: 'Desfaz o corpo lúteo e reduz progesterona. Isso permite o início de um novo ciclo.',
  },
  iatf: {
    d0: 'Inicia a sincronização com GnRH. Isso coloca os animais em um ponto mais parecido do ciclo.',
    a1: 'O GnRH aumenta LH e pode causar ovulação. Assim uma nova onda folicular começa de forma mais controlada.',
    a2: 'Organiza o crescimento de novos folículos. Isso deixa o lote mais uniforme para a inseminação.',
    d7: 'A PGF2α derruba o corpo lúteo ativo. Com menos progesterona, o ciclo pode avançar para ovulação.',
    b1: 'Representa a luteólise do corpo lúteo. Ela reduz progesterona e libera o caminho para novo cio.',
    d9: 'Aplica GnRH novamente para ajustar a ovulação final. Isso melhora a precisão do momento da IATF.',
    c1: 'Concentra a ovulação em uma janela previsível. Assim a inseminação tem maior chance de coincidir com o oócito.',
    d10: 'É o momento planejado da inseminação. Ele permite inseminar sem depender da observação de cio.',
  },
  farma: {
    c: 'Mostra como os medicamentos agem no animal. Isso ajuda a escolher dose, efeito e segurança.',
    aine: 'Reduzem dor, febre e inflamação. São úteis quando o problema envolve resposta inflamatória.',
    opi: 'Diminuem a dor agindo no sistema nervoso. São importantes quando a dor é moderada ou intensa.',
    atb: 'Combatem bactérias sensíveis. Usar bem evita falha terapêutica e resistência.',
    anest: 'Controlam consciência, dor e movimento. Eles tornam procedimentos mais seguros e menos dolorosos.',
    horm: 'Ajustam sinais hormonais do corpo. Na reprodução, ajudam a sincronizar cio e ovulação.',
    mel: 'Controla dor e inflamação com ação preferencial em COX-2. É escolhido quando se busca conforto com segurança.',
    tram: 'Ajuda no controle da dor pelo sistema nervoso. Seu efeito pode variar bastante entre espécies.',
    ket: 'Produz anestesia dissociativa e ajuda na analgesia. É útil quando se quer imobilização com reflexos preservados.',
    pgfn: 'Causa luteólise e reinicia o ciclo. Por isso é chave em protocolos de sincronização.',
    gnr: 'Estimula a liberação de LH e FSH. Isso ajuda a controlar ovulação e ondas foliculares.',
  },
}

/* ─── Mapas ─── */
const RAW_MAPS: RawMapData[] = [
  {
    id: 'hhg',
    title: 'Eixo Hipotálamo–Hipófise–Gônada',
    emoji: '🧠',
    desc: 'Regulação hormonal do ciclo reprodutivo',
    nodes: [
      { id: 'hip',  label: 'Hipotálamo',    x: 50,  y: 8,   color: '#8b5cf6', main: true },
      { id: 'gnrh', label: 'GnRH',          x: 50,  y: 22,  color: '#a78bfa' },
      { id: 'hof',  label: 'Hipófise',      x: 50,  y: 36,  color: '#6366f1', main: true },
      { id: 'lh',   label: 'LH',            x: 30,  y: 50,  color: '#f59e0b' },
      { id: 'fsh',  label: 'FSH',           x: 70,  y: 50,  color: '#f59e0b' },
      { id: 'fol',  label: 'Folículo',      x: 22,  y: 67,  color: '#0D9488' },
      { id: 'ovul', label: 'Ovulação',      x: 50,  y: 67,  color: '#ec4899' },
      { id: 'cl',   label: 'Corpo Lúteo',   x: 78,  y: 67,  color: '#f59e0b' },
      { id: 'e2',   label: 'Estrogênio',    x: 12,  y: 82,  color: '#ec4899' },
      { id: 'p4',   label: 'Progesterona',  x: 88,  y: 82,  color: '#f59e0b' },
      { id: 'neg',  label: 'Feedback (−)',  x: 50,  y: 92,  color: '#ef4444' },
    ],
    edges: [
      ['hip','gnrh'],['gnrh','hof'],
      ['hof','lh'],['hof','fsh'],
      ['lh','ovul'],['fsh','fol'],
      ['fol','e2'],['ovul','cl'],['cl','p4'],
      ['e2','neg'],['p4','neg'],['neg','hip'],
    ],
  },
  {
    id: 'ciclo',
    title: 'Ciclo Estral Bovino',
    emoji: '🐄',
    desc: 'Fases, hormônios e duração (≈21 dias)',
    nodes: [
      { id: 'c',    label: 'Ciclo Estral\n≈21 dias', x: 50, y: 45, color: '#0D9488', main: true },
      { id: 'pro',  label: 'Proestro\n(3–5d)',        x: 20, y: 15, color: '#6366f1' },
      { id: 'est',  label: 'Estro\n(12–18h)',         x: 80, y: 15, color: '#ec4899' },
      { id: 'met',  label: 'Metaestro\n(3–5d)',       x: 80, y: 75, color: '#f59e0b' },
      { id: 'die',  label: 'Diestro\n(12–14d)',       x: 20, y: 75, color: '#f59e0b' },
      { id: 'e2b',  label: '↑Estrogênio',             x: 7,  y: 42, color: '#ec4899' },
      { id: 'lhb',  label: 'Pico LH',                 x: 50, y: 5,  color: '#a78bfa' },
      { id: 'p4b',  label: '↑Progesterona',           x: 93, y: 42, color: '#f59e0b' },
      { id: 'pgf',  label: 'PGF2α\n(luteólise)',      x: 50, y: 88, color: '#ef4444' },
    ],
    edges: [
      ['c','pro'],['c','est'],['c','met'],['c','die'],
      ['pro','e2b'],['est','lhb'],['met','p4b'],['die','pgf'],
      ['pgf','pro'],
    ],
  },
  {
    id: 'iatf',
    title: 'Protocolo IATF — Ovsynch',
    emoji: '💉',
    desc: 'Passo a passo da sincronização',
    nodes: [
      { id: 'd0',   label: 'D0\nGnRH',      x: 10, y: 50, color: '#8b5cf6', main: true },
      { id: 'a1',   label: '↑LH\nOvulação', x: 25, y: 25, color: '#a78bfa' },
      { id: 'a2',   label: 'Nova onda\nfolicular', x: 25, y: 75, color: '#0D9488' },
      { id: 'd7',   label: 'D7\nPGF2α',     x: 45, y: 50, color: '#ef4444', main: true },
      { id: 'b1',   label: 'Luteólise\ndo CL',    x: 60, y: 25, color: '#f87171' },
      { id: 'd9',   label: 'D9\nGnRH',      x: 72, y: 50, color: '#8b5cf6', main: true },
      { id: 'c1',   label: 'Sincroniza\novulação', x: 85, y: 25, color: '#a78bfa' },
      { id: 'd10',  label: 'D10\nIATF',     x: 90, y: 60, color: '#ec4899', main: true },
    ],
    edges: [
      ['d0','a1'],['d0','a2'],
      ['d7','b1'],['a2','d7'],
      ['d9','c1'],['b1','d9'],
      ['c1','d10'],
    ],
  },
  {
    id: 'farma',
    title: 'Farmacologia Veterinária',
    emoji: '💊',
    desc: 'Classes e exemplos de fármacos',
    nodes: [
      { id: 'c',    label: 'Farmacologia', x: 50, y: 45, color: '#0D9488', main: true },
      { id: 'aine', label: 'AINEs',        x: 18, y: 15, color: '#0D9488' },
      { id: 'opi',  label: 'Opioides',     x: 82, y: 15, color: '#8b5cf6' },
      { id: 'atb',  label: 'Antibióticos', x: 10, y: 75, color: '#f59e0b' },
      { id: 'anest',label: 'Anestésicos',  x: 90, y: 75, color: '#ef4444' },
      { id: 'horm', label: 'Hormônios\nReprod.', x: 50, y: 8,  color: '#ec4899' },
      { id: 'mel',  label: 'Meloxicam',    x: 5,  y: 35, color: '#5eead4' },
      { id: 'tram', label: 'Tramadol',     x: 95, y: 35, color: '#c4b5fd' },
      { id: 'ket',  label: 'Ketamina',     x: 95, y: 58, color: '#fca5a5' },
      { id: 'pgfn', label: 'PGF2α',        x: 35, y: 8,  color: '#f9a8d4' },
      { id: 'gnr',  label: 'GnRH',         x: 65, y: 8,  color: '#f9a8d4' },
    ],
    edges: [
      ['c','aine'],['c','opi'],['c','atb'],['c','anest'],['c','horm'],
      ['aine','mel'],['opi','tram'],['anest','ket'],['horm','pgfn'],['horm','gnr'],
    ],
  },
]

const MAPS: MapData[] = RAW_MAPS.map(map => ({
  ...map,
  nodes: map.nodes.map(node => ({
    ...node,
    explanation: NODE_EXPLANATIONS[map.id]?.[node.id] ?? node.label.replace('\n', ' '),
  })),
}))

/* ─── Render de mapa SVG ─── */
function MindMap({ map }: { map: MapData }) {
  const [zoom, setZoom] = useState(1)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const W = 560; const H = 360
  const nodeIndex = Object.fromEntries(map.nodes.map(n => [n.id, n]))

  return (
    <div className="bg-slate-800/60 rounded-2xl border border-slate-700/80 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50">
        <div>
          <p className="text-sm font-semibold text-slate-200">{map.emoji} {map.title}</p>
          <p className="text-xs text-slate-500">{map.desc}</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setZoom(z => Math.min(2, +(z + 0.2).toFixed(1)))}
            className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-slate-700 rounded-lg transition-colors"><ZoomIn size={14} /></button>
          <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.2).toFixed(1)))}
            className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-slate-700 rounded-lg transition-colors"><ZoomOut size={14} /></button>
          <button onClick={() => setZoom(1)}
            className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-slate-700 rounded-lg transition-colors"><RotateCcw size={14} /></button>
        </div>
      </div>

      {/* SVG */}
      <div className="overflow-auto p-4 bg-slate-900/30">
        <svg width={W * zoom} height={H * zoom} viewBox={`0 0 ${W} ${H}`} className="mx-auto" style={{ transition: 'width .2s, height .2s' }}>
          {/* Arestas */}
          {map.edges.map(([a, b], i) => {
            const na = nodeIndex[a]; const nb = nodeIndex[b]
            if (!na || !nb) return null
            const x1 = na.x / 100 * W; const y1 = na.y / 100 * H
            const x2 = nb.x / 100 * W; const y2 = nb.y / 100 * H
            const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2
            return (
              <path key={i}
                d={`M ${x1} ${y1} Q ${mx} ${my - 15} ${x2} ${y2}`}
                fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="5 3"
              />
            )
          })}
          {/* Nós */}
          {map.nodes.map(node => {
            const cx = node.x / 100 * W
            const cy = node.y / 100 * H
            const isMain = !!node.main
            const isSelected = selectedNode?.id === node.id
            const rx = isMain ? 38 : 28
            const ry = isMain ? 16 : 12
            const lines = node.label.split('\n')
            return (
              <g key={node.id} role="button" tabIndex={0}
                onClick={() => setSelectedNode(node)}
                onKeyDown={event => (event.key === 'Enter' || event.key === ' ') && setSelectedNode(node)}
                style={{ cursor: 'pointer', outline: 'none' }}>
                <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
                  fill={node.color + (isSelected ? '33' : '1a')} stroke={isSelected ? '#ffffff' : node.color} strokeWidth={isSelected ? 2.5 : isMain ? 2 : 1.5}
                />
                {lines.map((line, li) => (
                  <text key={li} x={cx} y={cy + (li - (lines.length - 1) / 2) * 9}
                    textAnchor="middle" dominantBaseline="central"
                    fill={isMain ? '#e2e8f0' : '#94a3b8'}
                    fontSize={isMain ? 8.5 : 7.5}
                    fontWeight={isMain ? 'bold' : 'normal'}
                    style={{ userSelect: 'none' }}
                  >
                    {line}
                  </text>
                ))}
              </g>
            )
          })}
        </svg>
      </div>
      {selectedNode && (
        <div className="mx-4 mb-4 rounded-2xl border border-slate-700/70 bg-slate-900/80 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-3 w-3 rounded-full flex-shrink-0" style={{ background: selectedNode.color }} />
            <div>
              <p className="text-sm font-bold text-slate-100">{selectedNode.label.replace('\n', ' ')}</p>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">{selectedNode.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Legenda ─── */
function Legenda({ map }: { map: MapData }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {map.nodes.filter(n => !n.main).slice(0, 9).map(n => (
        <div key={n.id} className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-700/50">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: n.color }} />
          <span className="text-xs text-slate-400 truncate">{n.label.replace('\n', ' ')}</span>
        </div>
      ))}
    </div>
  )
}

function MapasContent() {
  const [active, setActive] = useState(MAPS[0].id)
  const currentMap = MAPS.find(m => m.id === active) ?? MAPS[0]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Network size={22} className="text-teal-400" />
          <h1 className="text-2xl font-bold text-white">Mapas Mentais</h1>
        </div>
        <p className="text-slate-400 text-sm">Diagramas visuais dos eixos e conceitos-chave</p>
      </div>

      {/* Seletor */}
      <div className="flex flex-wrap gap-2 mb-6">
        {MAPS.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              active === m.id
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700/60 hover:text-slate-300'
            }`}
          >
            {m.emoji} {m.title}
          </button>
        ))}
      </div>

      <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <MindMap map={currentMap} />
        <Legenda map={currentMap} />
      </motion.div>

      <p className="text-center text-xs text-slate-600 mt-6">
        Use +/− para zoom · Arraste a tela para navegar nos mapas grandes
      </p>
    </div>
  )
}

export default function MapasPage() {
  return (
    <Gatekeeper pageTitle="Mapas Mentais">
      <MapasContent />
    </Gatekeeper>
  )
}
