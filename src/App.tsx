import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu } from 'lucide-react'
import Sidebar, { type Page, type ThemeMode } from './components/Sidebar'

import MedicamentosPage from './pages/MedicamentosPage'
import DoencasPage from './pages/DoencasPage'
import ToolboxPage from './pages/ToolboxPage'
import VetNewsPage from './pages/VetNewsPage'
import HubPage from './pages/HubPage'
import CasosPage from './pages/CasosPage'
import RevisaoPage from './pages/RevisaoPage'
import MapasPage from './pages/MapasPage'

const THEME_STORAGE_KEY = 'vetstudy_theme'

const PAGE_LABELS: Record<Page, string> = {
  hub: 'Início',
  revisao: 'Flashcards',
  casos: 'Casos',
  mapas: 'Resumos',
  medicamentos: 'Medicamentos',
  doencas: 'Doenças',
  ferramentas: 'Consulta Rápida',
  vetnews: 'Atualidades',
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>('hub')
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark'
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    return saved === 'dark' || saved === 'light' ? saved : 'dark'
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectionToken, setSelectionToken] = useState(0)
  const [caseSelectionToken, setCaseSelectionToken] = useState(0)
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | undefined>(undefined)
  const [selectedDrugId, setSelectedDrugId] = useState<string | undefined>(undefined)
  const [selectedDrugQuery, setSelectedDrugQuery] = useState<string | undefined>(undefined)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('theme-dark', 'theme-light')
    root.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark')
    root.style.colorScheme = theme === 'light' ? 'light' : 'dark'
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const handleNavigate = (page: Page) => {
    setActivePage(page)
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

  const handleOpenCases = () => {
    setCaseSelectionToken(Date.now())
    setActivePage('casos')
    setMobileOpen(false)
  }

  const handleOpenCasesList = () => {
    setActivePage('casos')
    setMobileOpen(false)
  }

  const handleOpenReview = () => {
    setActivePage('revisao')
    setMobileOpen(false)
  }

  const pageNode =
    activePage === 'hub' ? (
      <HubPage onOpenCases={handleOpenCases} onOpenReview={handleOpenReview} />
    ) : activePage === 'revisao' ? (
      <RevisaoPage onRequestCase={handleOpenCasesList} />
    ) : activePage === 'casos' ? (
      <CasosPage
        selectionToken={caseSelectionToken}
        onOpenDisease={(diseaseId) => handleGlobalNavigate('doencas', diseaseId)}
      />
    ) : activePage === 'mapas' ? (
      <MapasPage />
    ) : activePage === 'medicamentos' ? (
      <MedicamentosPage
        initialSelectedId={selectedDrugId}
        initialQuery={selectedDrugQuery}
        selectionToken={selectionToken}
      />
    ) : activePage === 'doencas' ? (
      <DoencasPage
        initialSelectedId={selectedDiseaseId}
        selectionToken={selectionToken}
        onOpenDrug={(drugId) => handleGlobalNavigate('medicamentos', drugId)}
        onOpenRelatedDrugs={handleOpenDrugSearch}
      />
    ) : activePage === 'ferramentas' ? (
      <ToolboxPage onNavigate={handleGlobalNavigate} />
    ) : (
      <VetNewsPage />
    )

  return (
    <div className="app-shell flex h-dvh overflow-hidden font-sans md:h-screen">
      <header
        className="app-header-surface fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 px-4 md:hidden"
      >
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="app-surface-button flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 active:scale-95 active:bg-neutral-700"
        >
          <Menu size={19} />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 shadow-md shadow-primary-900/50">
            <span className="text-[10px] font-black tracking-tight text-white">V5</span>
          </div>
          <span className="app-text-primary truncate text-[15px] font-semibold leading-tight">
            {PAGE_LABELS[activePage]}
          </span>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="app-overlay fixed inset-0 z-40 backdrop-blur-md md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="app-shell min-w-0 flex-1 overflow-x-hidden overflow-y-auto pt-14 md:pt-0">
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


