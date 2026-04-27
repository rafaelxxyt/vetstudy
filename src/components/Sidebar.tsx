import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical,
  BookOpen,
  Wrench,
  Brain,
  Newspaper,
  GraduationCap,
  Menu,
  X,
  Shield,
} from 'lucide-react'
import { isHubUnlocked } from './Gatekeeper'

export type Page =
  | 'hub'
  | 'revisao'
  | 'casos'
  | 'mapas'
  | 'medicamentos'
  | 'doencas'
  | 'ferramentas'
  | 'vetnews'

interface NavItem {
  id: Page
  label: string
  icon: React.ElementType
}

const ESTUDO: NavItem[] = [
  { id: 'revisao', label: 'Flashcards', icon: GraduationCap },
  { id: 'casos', label: 'Casos', icon: Brain },
  { id: 'mapas', label: 'Resumos', icon: BookOpen },
]

const CLINICA: NavItem[] = [
  { id: 'doencas', label: 'Doenças e Patologias', icon: BookOpen },
  { id: 'ferramentas', label: 'Consulta Rápida', icon: Wrench },
  { id: 'medicamentos', label: 'Medicamentos', icon: FlaskConical },
]

const GERAL: NavItem[] = [
  { id: 'vetnews', label: 'Atualidades', icon: Newspaper },
]

interface SidebarProps {
  activePage: Page
  onNavigate: (page: Page) => void
  mobileOpen: boolean
  onMobileClose: () => void
}

function CollapseBtn({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      title={collapsed ? 'Abrir menu' : 'Fechar menu'}
      className={`flex-shrink-0 rounded-xl transition-all ${
        collapsed
          ? 'flex h-10 w-10 items-center justify-center bg-slate-800 text-slate-400 hover:bg-teal-500/20 hover:text-teal-400'
          : 'ml-auto p-2 text-slate-500 hover:bg-slate-800 hover:text-teal-400'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          <motion.div
            key="open-icon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <Menu size={17} />
          </motion.div>
        ) : (
          <motion.div
            key="close-icon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <X size={15} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

function SectionLabel({
  label,
  icon: Icon,
}: {
  label: string
  icon?: React.ElementType
}) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5 px-3">
      {Icon && <Icon size={9} className="flex-shrink-0 text-teal-500" />}
      <p className="select-none text-[9px] font-black uppercase tracking-widest text-slate-600">{label}</p>
    </div>
  )
}

function NavBtn({
  item,
  active,
  collapsed,
  drawerMode,
  onClick,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  drawerMode: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  const vertPad = drawerMode ? 'py-3' : 'py-2.5'

  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`w-full rounded-xl transition-all duration-150 ${
        collapsed ? 'flex justify-center p-2.5' : `flex items-center gap-3 px-3 ${vertPad}`
      } ${
        active
          ? 'border border-teal-500/25 bg-teal-500/15 text-teal-300'
          : 'border border-transparent text-slate-500 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon size={16} className="flex-shrink-0" />
      {!collapsed && <span className="flex-1 text-left text-sm font-medium">{item.label}</span>}
    </button>
  )
}

function HubBtn({
  active,
  collapsed,
  drawerMode,
  hubUnlocked,
  onClick,
}: {
  active: boolean
  collapsed: boolean
  drawerMode: boolean
  hubUnlocked: boolean
  onClick: () => void
}) {
  const showLabel = drawerMode || !collapsed

  return (
    <button
      onClick={onClick}
      title={!drawerMode && collapsed ? 'Início' : undefined}
      className={`w-full rounded-xl transition-all duration-150 ${
        !drawerMode && collapsed ? 'flex justify-center p-2.5' : 'flex items-center gap-3 px-3 py-3'
      } ${
        active
          ? 'border border-teal-500/25 bg-teal-500/15 text-teal-300 shadow-sm shadow-teal-950'
          : 'border border-transparent text-slate-500 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <GraduationCap size={16} className="flex-shrink-0" />

      {showLabel && (
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold leading-tight">Início</p>
          <p className="mt-0.5 text-[10px] font-medium leading-none">
            {hubUnlocked ? (
              <span className="text-teal-500">Início · Flashcards · Simulador · Resumos</span>
            ) : (
              <span className="text-slate-600">Início · Flashcards · Simulador</span>
            )}
          </p>
        </div>
      )}

      {showLabel &&
        (hubUnlocked ? (
          <span className="flex-shrink-0 text-xs text-teal-500">✓</span>
        ) : (
          <span className="flex-shrink-0 rounded-md border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[11px] text-slate-500">
            🔒
          </span>
        ))}
    </button>
  )
}

function renderNav({
  isDrawer,
  collapsed,
  activePage,
  hubUnlocked,
  onNavigate,
  onMobileClose,
  onToggleCollapse,
}: {
  isDrawer: boolean
  collapsed: boolean
  activePage: Page
  hubUnlocked: boolean
  onNavigate: (page: Page) => void
  onMobileClose: () => void
  onToggleCollapse: () => void
}) {
  const showLabels = isDrawer || !collapsed
  const navigate = (page: Page) => {
    onNavigate(page)
    if (isDrawer) onMobileClose()
  }

  return (
    <>
      <div className={`flex h-16 flex-shrink-0 items-center border-b border-slate-800 ${!isDrawer && collapsed ? 'justify-center px-2' : 'gap-3 px-3'}`}>
        {showLabels && (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-900/50">
              <span className="text-xs font-black tracking-tight text-white">V5</span>
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-bold text-white">VetStudy 5.0</p>
              <p className="text-[10px] font-semibold text-teal-400">RBC Edition</p>
            </div>
          </div>
        )}

        {!isDrawer && <CollapseBtn collapsed={collapsed} onToggle={onToggleCollapse} />}

        {isDrawer && (
          <button
            onClick={onMobileClose}
            aria-label="Fechar menu"
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-800 hover:text-teal-400"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
        <section>
          {showLabels && <SectionLabel label="Início" icon={Shield} />}
          <HubBtn
            active={activePage === 'hub'}
            collapsed={!isDrawer && collapsed}
            drawerMode={isDrawer}
            hubUnlocked={hubUnlocked}
            onClick={() => navigate('hub')}
          />
        </section>

        <section>
          {showLabels && <SectionLabel label="Estudo" />}
          <div className="space-y-1.5">
            {ESTUDO.map(item => (
              <NavBtn
                key={item.id}
                item={item}
                active={activePage === item.id}
                collapsed={!isDrawer && collapsed}
                drawerMode={isDrawer}
                onClick={() => navigate(item.id)}
              />
            ))}
          </div>
        </section>

        <section>
          {showLabels && <SectionLabel label="Clínica" />}
          <div className="space-y-1.5">
            {CLINICA.map(item => (
              <NavBtn
                key={item.id}
                item={item}
                active={activePage === item.id}
                collapsed={!isDrawer && collapsed}
                drawerMode={isDrawer}
                onClick={() => navigate(item.id)}
              />
            ))}
          </div>
        </section>

        <section>
          {showLabels && <SectionLabel label="Geral" />}
          <div className="space-y-1.5">
            {GERAL.map(item => (
              <NavBtn
                key={item.id}
                item={item}
                active={activePage === item.id}
                collapsed={!isDrawer && collapsed}
                drawerMode={isDrawer}
                onClick={() => navigate(item.id)}
              />
            ))}
          </div>
        </section>
      </nav>
    </>
  )
}

export default function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const hubUnlocked = isHubUnlocked()

  return (
    <>
      <aside className="hidden h-screen border-r border-slate-800 bg-slate-900 md:flex md:w-72 md:flex-col">
        {renderNav({
          isDrawer: false,
          collapsed,
          activePage,
          hubUnlocked,
          onNavigate,
          onMobileClose,
          onToggleCollapse: () => setCollapsed(value => !value),
        })}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Fechar menu"
              className="fixed inset-0 z-40 bg-slate-950/70 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-80 max-w-[88vw] flex-col border-r border-slate-800 bg-slate-900 md:hidden"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderNav({
                isDrawer: true,
                collapsed: false,
                activePage,
                hubUnlocked,
                onNavigate,
                onMobileClose,
                onToggleCollapse: () => {},
              })}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
