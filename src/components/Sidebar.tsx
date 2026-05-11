import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardCheck,
  FlaskConical,
  BookOpen,
  Wrench,
  Brain,
  Newspaper,
  GraduationCap,
  Search,
  Menu,
  X,
  Shield,
  Moon,
  Sun,
} from 'lucide-react'
import { isHubUnlocked } from './Gatekeeper'

export type Page =
  | 'hub'
  | 'revisao'
  | 'casos'
  | 'mapas'
  | 'dirigida'
  | 'dicionario'
  | 'medicamentos'
  | 'doencas'
  | 'ferramentas'
  | 'vetnews'

export type ThemeMode = 'dark' | 'light'

interface NavItem {
  id: Page
  label: string
  icon: React.ElementType
}

const ESTUDO: NavItem[] = [
  { id: 'revisao', label: 'Flashcards', icon: GraduationCap },
  { id: 'casos', label: 'Casos', icon: Brain },
  { id: 'mapas', label: 'Resumos', icon: BookOpen },
  { id: 'dirigida', label: 'Revisão Dirigida', icon: ClipboardCheck },
  { id: 'dicionario', label: 'Dicionário Vet', icon: Search },
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
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
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
          ? 'app-surface-button flex h-10 w-10 items-center justify-center hover:bg-primary-500/20 hover:text-primary-400'
          : 'ml-auto p-2 app-text-secondary hover:bg-neutral-700/70 hover:text-primary-400'
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
      {Icon && <Icon size={9} className="flex-shrink-0 text-primary-500" />}
      <p className="app-text-muted select-none text-[9px] font-black uppercase tracking-widest">{label}</p>
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
          ? 'border border-primary-500/25 bg-primary-500/15 text-primary-300'
          : 'border border-transparent app-text-secondary hover:bg-neutral-700/70 hover:text-neutral-100'
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
          ? 'border border-primary-500/25 bg-primary-500/15 text-primary-300 shadow-sm shadow-primary-950'
          : 'border border-transparent app-text-secondary hover:bg-neutral-700/70 hover:text-neutral-100'
      }`}
    >
      <GraduationCap size={16} className="flex-shrink-0" />

      {showLabel && (
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold leading-tight">Início</p>
          <p className="mt-0.5 text-[10px] font-medium leading-none">
            {hubUnlocked ? (
              <span className="text-primary-500">Início · Flashcards · Simulados · Resumos</span>
            ) : (
              <span className="text-neutral-600">Início · Flashcards · Simulados</span>
            )}
          </p>
        </div>
      )}

      {showLabel &&
        (hubUnlocked ? (
          <span className="flex-shrink-0 text-xs text-primary-500">✓</span>
        ) : (
          <span className="app-surface-tag flex-shrink-0 rounded-md px-1.5 py-0.5 text-[11px]">
            🔒
          </span>
        ))}
    </button>
  )
}

function ThemeSwitcher({
  theme,
  onThemeChange,
  compact,
}: {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  compact: boolean
}) {
  const options: Array<{ id: ThemeMode; label: string; icon: React.ElementType; short: string }> = [
    { id: 'dark', label: 'Escuro', icon: Moon, short: 'E' },
    { id: 'light', label: 'Claro', icon: Sun, short: 'C' },
  ]

  return (
    <section className="border-t border-neutral-700/60 px-2 py-3">
      {!compact && <SectionLabel label="Tema" />}
      <div className={`grid gap-1.5 ${compact ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {options.map(option => {
          const Icon = option.icon
          const active = theme === option.id
          return (
            <button
              key={option.id}
              onClick={() => onThemeChange(option.id)}
              title={compact ? option.label : undefined}
              className={`min-h-[40px] rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                active
                  ? 'border-primary-500/35 bg-primary-500/15 text-primary-300'
                  : 'app-surface-button hover:text-neutral-100'
              } ${compact ? 'flex items-center justify-center' : 'flex items-center justify-center gap-1.5'}`}
            >
              <Icon size={14} />
              <span>{compact ? option.short : option.label}</span>
            </button>
          )
        })}
      </div>
    </section>
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
  theme,
  onThemeChange,
}: {
  isDrawer: boolean
  collapsed: boolean
  activePage: Page
  hubUnlocked: boolean
  onNavigate: (page: Page) => void
  onMobileClose: () => void
  onToggleCollapse: () => void
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
}) {
  const showLabels = isDrawer || !collapsed
  const navigate = (page: Page) => {
    onNavigate(page)
    if (isDrawer) onMobileClose()
  }

  return (
    <>
      <div className={`flex h-16 flex-shrink-0 items-center border-b border-neutral-700/60 ${!isDrawer && collapsed ? 'justify-center px-2' : 'gap-3 px-3'}`}>
        {showLabels && (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-900/50">
              <span className="text-xs font-black tracking-tight text-white">VF</span>
            </div>
            <div className="min-w-0 leading-tight">
              <p className="app-text-primary text-sm font-bold">VetFoco</p>
              <p className="text-[10px] font-semibold text-primary-400">Estudo Vet</p>
            </div>
          </div>
        )}

        {!isDrawer && <CollapseBtn collapsed={collapsed} onToggle={onToggleCollapse} />}

        {isDrawer && (
          <button
            onClick={onMobileClose}
            aria-label="Fechar menu"
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl app-text-secondary transition-colors hover:bg-neutral-700/70 hover:text-primary-400"
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

      <ThemeSwitcher
        theme={theme}
        onThemeChange={onThemeChange}
        compact={!isDrawer && collapsed}
      />
    </>
  )
}

export default function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onMobileClose,
  theme,
  onThemeChange,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const hubUnlocked = isHubUnlocked()

  return (
    <>
      <aside className="app-panel hidden h-screen border-r md:flex md:w-72 md:flex-col">
        {renderNav({
          isDrawer: false,
          collapsed,
          activePage,
          hubUnlocked,
          onNavigate,
          onMobileClose,
          onToggleCollapse: () => setCollapsed(value => !value),
          theme,
          onThemeChange,
        })}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Fechar menu"
              className="app-overlay fixed inset-0 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />
            <motion.aside
              className="app-panel fixed inset-y-0 left-0 z-50 flex w-80 max-w-[88vw] flex-col border-r md:hidden"
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
                theme,
                onThemeChange,
              })}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}


