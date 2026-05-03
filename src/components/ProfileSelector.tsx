import { useState } from 'react'
import { PlayCircle, Plus, UserCircle } from 'lucide-react'
import {
  createProfile,
  hasProfileData,
  loadProfiles,
  PROFILE_DATA_KEYS,
  type LocalProfile,
} from '../utils/profiles'

interface ProfileSelectorProps {
  onSelect: (profile: LocalProfile, continueSession?: boolean) => void
}

export default function ProfileSelector({ onSelect }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<LocalProfile[]>(() => loadProfiles())
  const [name, setName] = useState('')

  const addProfile = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const profile = createProfile(trimmed)
    setProfiles(loadProfiles())
    setName('')
    onSelect(profile)
  }

  return (
    <div className="min-h-full flex items-center justify-center p-5">
      <div className="app-panel w-full max-w-md rounded-2xl p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/15 border border-primary-500/20 flex items-center justify-center">
            <UserCircle size={20} className="text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-100">Perfil local</h2>
            <p className="text-xs text-neutral-500">Escolha quem vai estudar neste dispositivo.</p>
          </div>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          Seus estudos são salvos por perfil. Escolha ou crie um para continuar.
        </p>

        <div className="space-y-2">
          {profiles.map(profile => {
            const hasSession = hasProfileData(profile.id, PROFILE_DATA_KEYS.quizSession)
            return (
              <div key={profile.id} className="app-card rounded-xl p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-200 truncate">{profile.name}</p>
                    {hasSession && <p className="text-[10px] text-warning-400 mt-0.5">Sessão em andamento</p>}
                  </div>
                  <button onClick={() => onSelect(profile)}
                    className="px-3 py-1.5 rounded-lg bg-neutral-700 text-xs font-bold text-neutral-200 hover:bg-neutral-600 transition-colors">
                    Entrar
                  </button>
                </div>
                {hasSession && (
                  <button onClick={() => onSelect(profile, true)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600 text-xs font-bold text-white hover:bg-accent-600 transition-colors">
                    <PlayCircle size={13} /> Continuar de onde parei
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex gap-2 border-t border-neutral-800 pt-4">
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && addProfile()}
            placeholder="Nome do perfil"
            className="app-input flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          />
          <button onClick={addProfile} disabled={!name.trim()}
            className="px-3 py-2.5 rounded-xl bg-accent-500 text-white disabled:opacity-40 hover:bg-accent-600 transition-colors">
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
