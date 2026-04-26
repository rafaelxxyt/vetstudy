import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu } from 'lucide-react'
import Sidebar, { type Page } from './components/Sidebar'

import MedicamentosPage from './pages/MedicamentosPage'
import DoencasPage      from './pages/DoencasPage'
import ToolboxPage      from './pages/ToolboxPage'
import VetNewsPage      from './pages/VetNewsPage'
import HubPage          from './pages/HubPage'

const PAGE_LABELS: Record<Page, string> = {
  hub:          'Hub Acadêmico',
  medicamentos: 'Medicamentos',
  doencas:      'Doenças',
  ferramentas:  'Ferramentas',
  vetnews:      'VetNews',
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>('hub')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectionToken, setSelectionToken] = useState(0)
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | undefined>(undefined)
  const [selectedDrugId, setSelectedDrugId] = useState<string | undefined>(undefined)
  const [selectedDrugQuery, setSelectedDrugQuery] = useState<string | undefined>(undefined)

  // ── Body scroll lock ──────────────────────────────────
  // Prevents the background page from scrolling while the
  // drawer is open — critical for the "native app" feel.
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    // Always restore on unmount
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleNavigate = (p: Page) => {
    setActivePage(p)
    setMobileOpen(false)
  }

  const handleGlobalNavigate = (page: 'doencas' | 'medicamentos', id: string) => {
    if (page === 'doencas') setSelectedDiseaseId(id)
    if (page === 'medicamentos') {
      setSelectedDrugId(id)
      setSelectedDrugQuery(undefined)
    }
    setSelectionToken(Date.now())
    setActivePage(page)
    setMobileOpen(false)
  }

  const handleOpenDrugSearch = (query?: string, preferredDrugId?: string) => {
    setSelectedDrugId(preferredDrugId)
    setSelectedDrugQuery(query)
    setSelectionToken(Date.now())
    setActivePage('medicamentos')
    setMobileOpen(false)
  }

  const pageNode = activePage === 'hub'
    ? <HubPage onGlobalNavigate={handleGlobalNavigate} />
    : activePage === 'medicamentos'
      ? <MedicamentosPage
          initialSelectedId={selectedDrugId}
          initialQuery={selectedDrugQuery}
          selectionToken={selectionToken}
        />
      : activePage === 'doencas'
        ? <DoencasPage
            initialSelectedId={selectedDiseaseId}
            selectionToken={selectionToken}
            onOpenDrug={(drugId) => handleGlobalNavigate('medicamentos', drugId)}
            onOpenRelatedDrugs={handleOpenDrugSearch}
          />
        : activePage === 'ferramentas'
          ? <ToolboxPage />
          : <VetNewsPage />

  return (
    <div className="flex h-dvh md:h-screen bg-slate-950 overflow-hidden font-sans">

      {/* ── Mobile top bar ──────────────────────────────────
          Fixed, always visible on mobile.
          h-14 = 56 px → main content offset by pt-14.
          shadow-[0_1px_0] instead of border-b keeps it
          visually lighter while still providing separation.
      ──────────────────────────────────────────────────── */}
      <header className="md:hidden fixed inset-x-0 top-0 z-30 h-14
                         flex items-center gap-3 px-4
                         bg-slate-900/98 backdrop-blur-md
                         shadow-[0_1px_0_0_rgba(51,65,85,0.6)]">

        {/* Hamburger — 44×44 tap target (Apple HIG minimum) */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="w-11 h-11 flex items-center justify-center rounded-xl
                     bg-slate-800 text-slate-400
                     active:bg-slate-700 active:scale-95
                     transition-all duration-150"
        >
          <Menu size={19} />
        </button>

        {/* Logo + active page name */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600
                          flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-900/50">
            <span className="text-white font-black text-[10px] tracking-tight">V5</span>
          </div>
          <span className="text-[15px] font-semibold text-white truncate leading-tight">
            {PAGE_LABELS[activePage]}
          </span>
        </div>
      </header>

      {/* ── Backdrop ────────────────────────────────────────
          Sits between the drawer (z-50) and the content (z-0).
          bg-black/70 + backdrop-blur-md creates a strong visual
          separation so the user focuses entirely on the drawer.
          Tapping backdrop closes the drawer.
      ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Main content ────────────────────────────────────
          pt-14 clears the fixed top bar on mobile.
          overflow-x-hidden prevents any runaway child widths
          from causing horizontal scroll.
      ──────────────────────────────────────────────────── */}
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-950 pt-14 md:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="min-h-full"
          >
            {pageNode}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  )
}
