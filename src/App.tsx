import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar, { type Page } from './components/Sidebar'

import MedicamentosPage from './pages/MedicamentosPage'
import DoencasPage      from './pages/DoencasPage'
import ToolboxPage      from './pages/ToolboxPage'
import VetNewsPage      from './pages/VetNewsPage'
import HubPage          from './pages/HubPage'

const PAGE_MAP: Record<Page, React.ElementType> = {
  hub:          HubPage,          // ← página inicial / home
  medicamentos: MedicamentosPage,
  doencas:      DoencasPage,
  ferramentas:  ToolboxPage,
  vetnews:      VetNewsPage,
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>('hub')   // ← default = Hub
  const PageComponent = PAGE_MAP[activePage]

  return (
    <div className="flex h-dvh flex-col md:h-screen md:flex-row bg-slate-950 overflow-hidden font-sans">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="min-w-0 flex-1 overflow-y-auto bg-slate-950 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="min-h-full"
          >
            <PageComponent />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
