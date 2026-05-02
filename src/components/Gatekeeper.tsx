import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ShieldAlert, Eye, EyeOff, ShieldCheck } from 'lucide-react'

const SECRET    = 'XTRZ'
const LS_KEY    = 'vetstudy_hub_unlocked'

export function isHubUnlocked(): boolean {
  try { return localStorage.getItem(LS_KEY) === '1' } catch { return false }
}

export function unlockHub(): void {
  try { localStorage.setItem(LS_KEY, '1') } catch {}
}

export function lockHub(): void {
  try { localStorage.removeItem(LS_KEY) } catch {}
}

interface GatekeeperProps {
  children: React.ReactNode
  pageTitle?: string
}

export default function Gatekeeper({ children, pageTitle = 'Início' }: GatekeeperProps) {
  const [unlocked, setUnlocked] = useState(() => isHubUnlocked())
  const [input,    setInput]    = useState('')
  const [error,    setError]    = useState(false)
  const [show,     setShow]     = useState(false)

  const attempt = () => {
    if (input.trim().toUpperCase() === SECRET) {
      unlockHub()
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
      setInput('')
      setTimeout(() => setError(false), 2500)
    }
  }

  if (unlocked) return <>{children}</>

  return (
    <div className="flex items-center justify-center min-h-full p-6">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="app-panel w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl shadow-black/20"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-900/50">
            <Lock size={24} className="text-white" />
          </div>

          <h2 className="mb-1 text-lg font-bold text-neutral-100">{pageTitle}</h2>
          <div className="mb-6 space-y-1">
            <p className="text-xs text-neutral-400">
              Área exclusiva · <span className="text-primary-400 font-semibold">VetFoco</span>
            </p>
            <p className="text-xs text-neutral-500">
              Estude com foco. Erre menos. Passe mais.
            </p>
          </div>

          <div className="relative mb-3">
            <input
              type={show ? 'text' : 'password'}
              placeholder="Senha de acesso"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && attempt()}
              className={`app-input w-full rounded-xl px-4 py-3 pr-11 text-center text-sm tracking-widest font-mono outline-none transition ${
                error
                  ? 'border-danger-500/50 focus:ring-2 focus:ring-danger-500/30'
                  : 'border-neutral-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30'
              }`}
            />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-1.5 text-danger-400 text-xs mb-3">
                <ShieldAlert size={12} />
                <span>Senha incorreta.</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={attempt}
            className="w-full py-3 bg-accent-500 text-white rounded-xl text-sm font-bold hover:bg-accent-600 transition-colors shadow-lg shadow-primary-950/50 active:scale-95 flex items-center justify-center gap-2">
            <ShieldCheck size={15} /> Acessar
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}


