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

export default function Gatekeeper({ children, pageTitle = 'InÃ­cio' }: GatekeeperProps) {
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
          className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-700/60 shadow-2xl shadow-black/40 p-8 max-w-sm w-full text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-900/50">
            <Lock size={24} className="text-white" />
          </div>

          <h2 className="text-lg font-bold text-white mb-1">{pageTitle}</h2>
          <p className="text-xs text-slate-400 mb-6">
            Ãrea exclusiva Â· <span className="text-teal-400 font-semibold">RBC Academic</span>
          </p>

          <div className="relative mb-3">
            <input
              type={show ? 'text' : 'password'}
              placeholder="Senha de acesso"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && attempt()}
              className={`w-full px-4 py-3 pr-11 rounded-xl border bg-slate-800 text-sm text-slate-200 text-center tracking-widest font-mono outline-none transition ${
                error
                  ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/30'
                  : 'border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30'
              }`}
            />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-1.5 text-red-400 text-xs mb-3">
                <ShieldAlert size={12} />
                <span>Senha incorreta.</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={attempt}
            className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-950/50 active:scale-95 flex items-center justify-center gap-2">
            <ShieldCheck size={15} /> Acessar
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}


