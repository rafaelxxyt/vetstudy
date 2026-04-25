import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical, BookOpen, Wrench,
  Newspaper, GraduationCap, Menu, X, Shield,
} from 'lucide-react'
import { isHubUnlocked } from './Gatekeeper'

/* ─── Types ──────────────────────────────────────────── */
export type Page =
  | 'hub'
  | 'medicamentos'
  | 'doencas'
  | 'ferramentas'
  | 'vetnews'

interface NavItem { id: Page; label: string; icon: React.ElementType }

const CLINICA: NavItem[] = [
  { id: 'medicamentos', label: 'Medicamentos',         icon: FlaskConical },
  { id: 'doencas',      label: 'Doenças e Patologias', icon: BookOpen     },
  { id: 'ferramentas',  label: 'Ferramentas Clínicas', icon: Wrench       },
  { id: 'vetnews',      label: 'VetNews',              icon: Newspaper    },
]

interface SidebarProps {
  activePage:    Page
  onNavigate:    (p: Page) => void
  mobileOpen:    boolean
  onMobileClose: () => void
}

/* ─── Desktop collapse/expand button ────────────────── */
function CollapseBtn({
  collapsed, onToggle,
}: { collapsed: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={collapsed ? 'Abrir menu' : 'Fechar menu'}
      className={`flex-shrink-0 rounded-xl transition-all ${
        collapsed
          ? 'w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-teal-500/20 text-slate-400 hover:text-teal-400'
          : 'ml-auto p-2 text-slate-500 hover:text-teal-400 hover:bg-slate-800'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {collapsed
          ? (
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
          )
        }
      </AnimatePresence>
    </button>
  )
}

/* ─── Shared section header ──────────────────────────── */
function SectionLabel({ label, icon: Icon }: { label: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-center gap-1.5 px-3 mb-1.5">
      {Icon && <Icon size={9} className="text-teal-500 flex-shrink-0" />}
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest select-none">
        {label}
      </p>
    </div>
  )
}

/* ─── Nav button ─────────────────────────────────────── */
function NavBtn({
  item, active, collapsed, drawerMode, onClick,
}: {
  item:       NavItem
  active:     boolean
  collapsed:  boolean   // desktop collapsed icon-only mode
  drawerMode: boolean   // mobile drawer — larger touch targets
  onClick:    () => void
}) {
  const Icon = item.icon

  // Vertical padding:
  //   drawerMode  → py-3   = 24px padding → ~44-48px total (meets Apple HIG)
  //   desktop     → py-2.5 = 20px padding → ~40px total (fine on desktop)
  const vertPad = drawerMode ? 'py-3' : 'py-2.5'

  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 ${
        collapsed ? `justify-center p-2.5` : `px-3 ${vertPad}`
      } ${
        active
          ? 'bg-teal-500/15 text-teal-300 border border-teal-500/25'
          : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
      }`}
    >
      <Icon size={16} className="flex-shrink-0" />
      {!collapsed && (
        <span className="text-sm font-medium whitespace-nowrap flex-1 text-left">
          {item.label}
        </span>
      )}
    </button>
  )
}

/* ─── Hub button (has subtitle line) ────────────────── */
function HubBtn({
  active, collapsed, drawerMode, hubUnlocked, onClick,
}: {
  active:       boolean
  collapsed:    boolean
  drawerMode:   boolean
  hubUnlocked:  boolean
  onClick:      () => void
}) {
  const showLabel = drawerMode || !collapsed
  const vertPad   = drawerMode ? 'py-3' : 'py-3'   // always py-3 — Hub is the primary CTA

  return (
    <button
      onClick={onClick}
      title={!drawerMode && collapsed ? 'Hub Acadêmico' : undefined}
      className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 ${
        !drawerMode && collapsed ? 'justify-center p-2.5' : `px-3 ${vertPad}`
      } ${
        active
          ? 'bg-teal-500/15 text-teal-300 border border-teal-500/25 shadow-sm shadow-teal-950'
          : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
      }`}
    >
      <GraduationCap size={16} className="flex-shrink-0" />

      {showLabel && (
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold leading-tight">Hub Acadêmico</p>
          <p className="text-[10px] font-medium mt-0.5 leading-none">
            {hubUnlocked
              ? <span className="text-teal-500">Início · Revisão · Simulador · Mapas</span>
              : <span className="text-slate-600">Painel · Revisão · Simulador</span>
            }
          </p>
        </div>
      )}

      {showLabel && (
        hubUnlocked
          ? <span className="text-teal-500 text-xs flex-shrink-0">✓</span>
          : <span className="text-[11px] bg-slate-800/80 text-slate-500 px-1.5 py-0.5 rounded-md border border-slate-700 flex-shrink-0">🔒</span>
      )}
    </button>
  )
}

/* ─── Shared nav structure ───────────────────────────────
   Called as a plain function (not rendered as <NavContent />)
   to avoid React treating it as a new component type on each
   render of Sidebar, which would cause unnecessary remounts.
──────────────────────────────────────────────────────── */
function renderNav({
  isDrawer,
  collapsed,
  activePage,
  hubUnlocked,
  onNavigate,
  onMobileClose,
  onToggleCollapse,
}: {
  isDrawer:         boolean
  collapsed:        boolean
  activePage:       Page
  hubUnlocked:      boolean
  onNavigate:       (p: Page) => void
  onMobileClose:    () => void
  onToggleCollapse: () => void
}) {
  const showLabels = isDrawer || !collapsed

  return (
    <>
      {/* ── Drawer / sidebar header ─────────────────────── */}
      <div className={`flex items-center border-b border-slate-800 h-16 flex-shrink-0 ${
        !isDrawer && collapsed ? 'justify-center px-2' : 'px-3 gap-3'
      }`}>

        {showLabels && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600
                            flex items-center justify-center flex-shrink-0
                            shadow-lg shadow-teal-900/50">
              <span className="text-white font-black text-xs tracking-tight">V5</span>
            </div>
            <div className="leading-tight min-w-0">
              <p className="font-bold text-white text-sm">VetStudy 5.0</p>
              <p className="text-[10px] text-teal-400 font-semibold">RBC Edition</p>
            </div>
          </div>
        )}

        {/* Desktop: collapse/expand toggle */}
        {!isDrawer && (
          <CollapseBtn collapsed={collapsed} onToggle={onToggleCollapse} />
        )}

        {/* Mobile drawer: close button — 44×44 tap target */}
        {isDrawer && (
          <button
            onClick={onMobileClose}
            aria-label="Fechar menu"
            className="ml-auto w-11 h-11 flex items-center justify-center
                       text-slate-500 hover:text-teal-400
                       hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Nav links ───────────────────────────────────── */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">

        {/* Hub Acadêmico */}
        <section>
          {showLabels && <SectionLabel label="Hub Acadêmico" icon={Shield} />}
          <HubBtn
            active={activePage === 'hub'}
            collapsed={!isDrawer && collapsed}
            drawerMode={isDrawer}
            hubUnlocked={hubUnlocked}
            onClick={() => onNavigate('hub')}
          />
        </section>

        <div className={`border-t border-slate-800 ${!isDrawer && collapsed ? 'mx-2' : 'mx-1'}`} />

        {/* Central Clínica */}
        <section>
          {showLabels && <SectionLabel label="Central Clínica" />}
          <div className="space-y-0.5">
            {CLINICA.map(item => (
              <NavBtn
                key={item.id}
                item={item}
                active={activePage === item.id}
                collapsed={!isDrawer && collapsed}
                drawerMode={isDrawer}
                onClick={() => onNavigate(item.id)}
              />
            ))}
          </div>
        </section>
      </nav>

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="px-3 py-3 border-t border-slate-800 flex-shrink-0">
        {!isDrawer && collapsed
          ? <p className="text-[11px] font-black text-teal-400 text-center">R</p>
          : (
            <p className="text-[10px] text-slate-600 text-center">
              Criado por <span className="font-bold text-teal-400">RBC</span>
              <span className="mx-1.5">·</span>
              <span className="text-slate-700">v5.2</span>
            </p>
          )
        }
      </div>
    </>
  )
}

/* ─── Sidebar root ───────────────────────────────────── */
export default function Sidebar({
  activePage, onNavigate, mobileOpen, onMobileClose,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const hubUnlocked = isHubUnlocked()

  const sharedProps = {
    activePage,
    hubUnlocked,
    onNavigate,
    onMobileClose,
    onToggleCollapse: () => setCollapsed(c => !c),
  }

  return (
    <>
      {/* ════════════════════════════════════════════════
          DESKTOP SIDEBAR  (md+)
          Static flex column, animated width on collapse.
          Completely unchanged from original behavior.
      ════════════════════════════════════════════════ */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex md:flex-col
                   bg-slate-900 border-r border-slate-800
                   overflow-hidden flex-shrink-0
                   z-20 relative"
      >
        {renderNav({ ...sharedProps, isDrawer: false, collapsed })}
      </motion.aside>

      {/* ════════════════════════════════════════════════
          MOBILE DRAWER  (< md only)

          ┌─ Positioning ──────────────────────────────┐
          │  fixed inset-y-0 left-0  full-height, left │
          │  z-50  above backdrop (z-40) & topbar (z-30)│
          │  w-72  288 px — leaves ~30% visible on 375px│
          └────────────────────────────────────────────┘

          ┌─ Animation ────────────────────────────────┐
          │  transition-transform duration-300          │
          │  ease-in-out                                │
          │  translate-x-0      → visible (open)        │
          │  -translate-x-full  → off-screen (closed)   │
          └────────────────────────────────────────────┘

          ┌─ Why CSS transition, not framer-motion ────┐
          │  Framer's layout animations conflict with   │
          │  the desktop motion.aside width animation   │
          │  when both are mounted. Pure CSS transition  │
          │  on the mobile element avoids that conflict. │
          └────────────────────────────────────────────┘
      ════════════════════════════════════════════════ */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className={[
          'md:hidden',
          'fixed inset-y-0 left-0 z-50',
          'w-72 flex flex-col',
          'bg-slate-900 border-r border-slate-800',
          // Smooth slide — 280 ms matches backdrop fade
          'transition-transform duration-[280ms] ease-in-out',
          // Will-change hints to GPU for jank-free compositing
          'will-change-transform',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Deep shadow separates drawer from dimmed content
          'shadow-[4px_0_32px_0_rgba(0,0,0,0.7)]',
        ].join(' ')}
      >
        {renderNav({ ...sharedProps, isDrawer: true, collapsed: false })}
      </aside>
    </>
  )
}
