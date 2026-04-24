import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical, BookOpen, Wrench,
  Newspaper, GraduationCap, Menu, X, Shield,
} from 'lucide-react'
import { isHubUnlocked } from './Gatekeeper'

/* ─── Tipo de página ─────────────────────────────────── */
export type Page =
  | 'hub'           // Hub Acadêmico — home padrão
  | 'medicamentos'
  | 'doencas'
  | 'ferramentas'
  | 'vetnews'

interface NavItem { id: Page; label: string; icon: React.ElementType }

/* ─── Itens da Central Clínica (sem Dashboard) ───────── */
const CLINICA: NavItem[] = [
  { id: 'medicamentos', label: 'Medicamentos',         icon: FlaskConical },
  { id: 'doencas',      label: 'Doenças e Patologias', icon: BookOpen     },
  { id: 'ferramentas',  label: 'Ferramentas Clínicas', icon: Wrench       },
  { id: 'vetnews',      label: 'VetNews',              icon: Newspaper    },
]

interface SidebarProps {
  activePage: Page
  onNavigate: (p: Page) => void
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const hubUnlocked = isHubUnlocked()

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col bg-slate-900 border-r border-slate-800 overflow-hidden flex-shrink-0 z-20 relative"
    >
      {/* ── Cabeçalho / Toggle ─────────────────────────── */}
      <div className={`flex items-center border-b border-slate-800 h-16 ${collapsed ? 'justify-center px-2' : 'px-3 gap-3'}`}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-900/50">
              <span className="text-white font-black text-xs tracking-tight">V5</span>
            </div>
            <div className="leading-tight min-w-0">
              <p className="font-bold text-white text-sm">VetStudy 5.0</p>
              <p className="text-[10px] text-teal-400 font-semibold">RBC Edition</p>
            </div>
          </motion.div>
        )}

        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Abrir menu' : 'Fechar menu'}
          className={`flex-shrink-0 rounded-xl transition-all ${
            collapsed
              ? 'w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-teal-500/20 text-slate-400 hover:text-teal-400'
              : 'ml-auto p-2 text-slate-500 hover:text-teal-400 hover:bg-slate-800'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {collapsed
              ? <motion.div key="o" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.16 }}><Menu size={17} /></motion.div>
              : <motion.div key="c" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.16 }}><X size={15} /></motion.div>
            }
          </AnimatePresence>
        </button>
      </div>

      {/* ── Navegação ──────────────────────────────────── */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">

        {/* Hub Acadêmico — PRIMEIRO (é a home) */}
        <section>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div key="la" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 px-3 mb-1.5">
                <Shield size={9} className="text-teal-500 flex-shrink-0" />
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest select-none">
                  Hub Acadêmico
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => onNavigate('hub')}
            title={collapsed ? 'Hub Acadêmico' : undefined}
            className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 ${
              collapsed ? 'justify-center p-2.5' : 'px-3 py-3'
            } ${
              activePage === 'hub'
                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/25 shadow-sm shadow-teal-950'
                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
            }`}
          >
            <GraduationCap size={16} className="flex-shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  key="hub-lbl"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex-1 text-left"
                >
                  <p className="text-sm font-semibold leading-tight">Hub Acadêmico</p>
                  <p className="text-[10px] font-medium mt-0.5 leading-none">
                    {hubUnlocked
                      ? <span className="text-teal-500">Início · Revisão · Simulador · Mapas</span>
                      : <span className="text-slate-600">Painel · Revisão · Simulador</span>
                    }
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              hubUnlocked
                ? <span className="text-teal-500 text-xs">✓</span>
                : <span className="text-[11px] bg-slate-800/80 text-slate-500 px-1.5 py-0.5 rounded-md border border-slate-700">🔒</span>
            )}
          </button>
        </section>

        <div className={`border-t border-slate-800 ${collapsed ? 'mx-2' : 'mx-1'}`} />

        {/* Central Clínica */}
        <section>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.p key="lc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-3 mb-1.5 select-none">
                Central Clínica
              </motion.p>
            )}
          </AnimatePresence>
          <div className="space-y-0.5">
            {CLINICA.map(item => (
              <NavBtn
                key={item.id}
                item={item}
                active={activePage === item.id}
                collapsed={collapsed}
                onClick={() => onNavigate(item.id)}
              />
            ))}
          </div>
        </section>
      </nav>

      {/* ── Rodapé ─────────────────────────────────────── */}
      <div className="px-3 py-3 border-t border-slate-800">
        {collapsed
          ? <p className="text-[11px] font-black text-teal-400 text-center">R</p>
          : <p className="text-[10px] text-slate-600 text-center">
              Criado por <span className="font-bold text-teal-400">RBC</span>
              <span className="mx-1.5">·</span>
              <span className="text-slate-700">v5.2</span>
            </p>
        }
      </div>
    </motion.aside>
  )
}

/* ─── Botão de navegação reutilizável ─────────────────── */
function NavBtn({ item, active, collapsed, onClick }: {
  item: NavItem; active: boolean; collapsed: boolean; onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 ${
        collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
      } ${
        active
          ? 'bg-teal-500/15 text-teal-300 border border-teal-500/25'
          : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
      }`}
    >
      <Icon size={16} className="flex-shrink-0" />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            key="lbl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="text-sm font-medium whitespace-nowrap flex-1 text-left"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
