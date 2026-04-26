import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import Gatekeeper from '../components/Gatekeeper'
import ProfileSelector from '../components/ProfileSelector'
import centralDb from '../data/central_db.json'
import clinicalCases from '../data/clinical_cases.json'
import {
  getActiveProfile,
  migrateLegacyProfileData,
  setActiveProfile,
  type LocalProfile,
} from '../utils/profiles'
import {
  caseProgressEventName,
  loadReviewedCases,
  markCaseReviewed,
} from '../utils/reviewHabit'

interface ClinicalCase {
  title: string
  species: string
  estimatedTime: string
  difficulty: 'facil' | 'media' | 'dificil'
  chiefComplaint: string
  history: string
  physicalExam: string[]
  labFindings: string[]
  clinicalQuestion: string
  diagnosis: string
  conduct: string[] | string
  drugs: string[]
  decisionSteps?: {
    title: string
    question: string
    options: string[]
    correctOption: string
    explanation: string
  }[]
  reasoning: string
  relatedDiseaseName: string
}

const CLINICAL_CASES = clinicalCases as ClinicalCase[]
const DISEASE_INDEX = (centralDb as { diseases: { id: string; name: string }[] }).diseases

function normalizeLookup(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function findDiseaseIdByName(name: string) {
  const target = normalizeLookup(name)
  return DISEASE_INDEX.find(disease => {
    const current = normalizeLookup(disease.name)
    return current === target || current.includes(target) || target.includes(current)
  })?.id
}

function ensureList(value: string[] | string) {
  return Array.isArray(value) ? value : [value]
}

function CasosContent({
  profile,
  selectionToken,
  onOpenDisease,
}: {
  profile: LocalProfile
  selectionToken?: number
  onOpenDisease?: (diseaseId: string) => void
}) {
  const [reviewedCases, setReviewedCases] = useState<string[]>(() => loadReviewedCases(profile.id))
  const [openCaseTitle, setOpenCaseTitle] = useState<string | null>(null)
  const [revealedCaseTitle, setRevealedCaseTitle] = useState<string | null>(null)
  const [selfEvaluationByCase, setSelfEvaluationByCase] = useState<Record<string, 'acertei' | 'errei'>>({})
  const [decisionAnswersByCase, setDecisionAnswersByCase] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const refreshCases = () => setReviewedCases(loadReviewedCases(profile.id))
    window.addEventListener(caseProgressEventName(), refreshCases)
    return () => window.removeEventListener(caseProgressEventName(), refreshCases)
  }, [profile.id])

  useEffect(() => {
    if (!selectionToken || CLINICAL_CASES.length === 0) return
    const firstCase = CLINICAL_CASES.find(item => !reviewedCases.includes(item.title)) ?? CLINICAL_CASES[0]
    setOpenCaseTitle(firstCase.title)
    setRevealedCaseTitle(null)
  }, [reviewedCases, selectionToken])

  const nextSuggestedCase = useMemo(
    () => (currentTitle: string) => CLINICAL_CASES.find(item => !reviewedCases.includes(item.title) && item.title !== currentTitle),
    [reviewedCases],
  )

  const toggleCase = (title: string) => {
    setOpenCaseTitle(current => current === title ? null : title)
    setRevealedCaseTitle(current => current === title ? null : current)
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={22} className="text-fuchsia-400" />
          <h1 className="text-2xl font-bold text-white">🧠 Casos Clínicos</h1>
        </div>
        <p className="text-sm text-slate-400">
          {CLINICAL_CASES.length} casos para treinar raciocínio clínico e tomada de decisão.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {CLINICAL_CASES.map(clinicalCase => {
          const isOpen = openCaseTitle === clinicalCase.title
          const isRevealed = revealedCaseTitle === clinicalCase.title
          const selfEvaluation = selfEvaluationByCase[clinicalCase.title]
          const decisionSteps = clinicalCase.decisionSteps ?? []
          const decisionAnswers = decisionAnswersByCase[clinicalCase.title] ?? []
          const currentDecisionIndex = decisionAnswers.length
          const allDecisionStepsAnswered = decisionSteps.length > 0 && decisionAnswers.length >= decisionSteps.length
          const currentDecisionStep = !allDecisionStepsAnswered ? decisionSteps[currentDecisionIndex] : null
          const caseCompleted = reviewedCases.includes(clinicalCase.title)
          const nextCase = nextSuggestedCase(clinicalCase.title)
          const relatedDiseaseId = findDiseaseIdByName(clinicalCase.relatedDiseaseName)

          return (
            <div key={clinicalCase.title} className="bg-slate-900/55 border border-slate-800 rounded-2xl p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{clinicalCase.title}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                      {clinicalCase.species}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                      {clinicalCase.estimatedTime}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 capitalize">
                      {clinicalCase.difficulty}
                    </span>
                    {caseCompleted && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/25 text-teal-300">
                        concluído
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleCase(clinicalCase.title)}
                  className="min-h-[44px] w-full sm:w-auto px-3 py-2 rounded-xl bg-fuchsia-600/80 text-white text-xs font-bold hover:bg-fuchsia-600 transition active:scale-95 self-start"
                >
                  {isOpen ? 'Fechar caso' : 'Resolver caso'}
                </button>
              </div>

              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-3"
                >
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">1. Queixa + história</p>
                    <p className="text-sm text-slate-200 mt-1">{clinicalCase.chiefComplaint}</p>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{clinicalCase.history}</p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">2. Exame físico</p>
                    <ul className="mt-2 space-y-1.5">
                      {clinicalCase.physicalExam.map(item => (
                        <li key={item} className="text-xs text-slate-300">• {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">3. Achados laboratoriais</p>
                    <ul className="mt-2 space-y-1.5">
                      {clinicalCase.labFindings.map(item => (
                        <li key={item} className="text-xs text-slate-300">• {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">4. Pergunta clínica</p>
                    <p className="text-sm text-slate-200 mt-1">{clinicalCase.clinicalQuestion}</p>
                  </div>

                  {!isRevealed ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-3">
                      {decisionSteps.length > 0 ? (
                        <>
                          {currentDecisionStep && (
                            <div className="space-y-3">
                              <div>
                                <p className="text-[10px] font-bold text-fuchsia-300 uppercase tracking-wider">{currentDecisionStep.title}</p>
                                <p className="text-sm font-bold text-white mt-1">{currentDecisionStep.question}</p>
                              </div>

                              <div className="grid grid-cols-1 gap-2">
                                {currentDecisionStep.options.map(option => {
                                  const selectedOption = decisionAnswers[currentDecisionIndex]
                                  const hasAnsweredCurrentStep = selectedOption !== undefined
                                  const isSelected = selectedOption === option
                                  const isCorrect = currentDecisionStep.correctOption === option

                                  let optionClass = 'border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-fuchsia-500/30'
                                  if (hasAnsweredCurrentStep && isSelected && isCorrect) {
                                    optionClass = 'border border-teal-400/40 bg-teal-500/15 text-teal-200'
                                  } else if (hasAnsweredCurrentStep && isSelected && !isCorrect) {
                                    optionClass = 'border border-amber-400/40 bg-amber-500/15 text-amber-200'
                                  } else if (hasAnsweredCurrentStep && isCorrect) {
                                    optionClass = 'border border-teal-400/25 bg-teal-500/8 text-teal-200'
                                  }

                                  return (
                                    <button
                                      key={option}
                                      type="button"
                                      disabled={hasAnsweredCurrentStep}
                                      onClick={() => {
                                        setDecisionAnswersByCase(current => ({
                                          ...current,
                                          [clinicalCase.title]: [...decisionAnswers, option],
                                        }))
                                      }}
                                      className={`min-h-[44px] w-full rounded-xl px-3 py-2 text-sm font-bold transition text-left disabled:cursor-default ${optionClass}`}
                                    >
                                      {option}
                                    </button>
                                  )
                                })}
                              </div>

                              {decisionAnswers[currentDecisionIndex] && (
                                <div className={`rounded-xl px-3 py-2 text-xs space-y-1 ${
                                  decisionAnswers[currentDecisionIndex] === currentDecisionStep.correctOption
                                    ? 'border border-teal-500/25 bg-teal-500/10 text-teal-100'
                                    : 'border border-amber-500/25 bg-amber-500/10 text-amber-100'
                                }`}>
                                  <p className="font-bold">
                                    {decisionAnswers[currentDecisionIndex] === currentDecisionStep.correctOption ? 'Correto' : 'Cuidado'}
                                  </p>
                                  <p>{currentDecisionStep.explanation}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {allDecisionStepsAnswered && (
                            <button
                              onClick={() => {
                                markCaseReviewed(clinicalCase.title, profile.id)
                                setRevealedCaseTitle(clinicalCase.title)
                              }}
                              className="min-h-[44px] w-full px-3 py-2 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-bold hover:bg-teal-500/15 transition"
                            >
                              Mostrar resolução
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm font-bold text-white">Você já tem um diagnóstico em mente?</p>
                            <p className="text-xs text-slate-400 mt-1">Marque sua percepção antes de ver a resolução.</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setSelfEvaluationByCase(current => ({ ...current, [clinicalCase.title]: 'acertei' }))}
                              className={`min-h-[44px] w-full rounded-xl px-3 py-2 text-sm font-bold transition ${
                                selfEvaluation === 'acertei'
                                  ? 'border border-teal-400/40 bg-teal-500/15 text-teal-300'
                                  : 'border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-teal-500/30'
                              }`}
                            >
                              Acertei
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelfEvaluationByCase(current => ({ ...current, [clinicalCase.title]: 'errei' }))}
                              className={`min-h-[44px] w-full rounded-xl px-3 py-2 text-sm font-bold transition ${
                                selfEvaluation === 'errei'
                                  ? 'border border-amber-400/40 bg-amber-500/15 text-amber-300'
                                  : 'border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-amber-500/30'
                              }`}
                            >
                              Errei
                            </button>
                          </div>

                          {selfEvaluation && (
                            <button
                              onClick={() => {
                                markCaseReviewed(clinicalCase.title, profile.id)
                                setRevealedCaseTitle(clinicalCase.title)
                              }}
                              className="min-h-[44px] w-full px-3 py-2 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-bold hover:bg-teal-500/15 transition"
                            >
                              Mostrar resolução
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 space-y-3">
                      <div className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                        selfEvaluation === 'errei'
                          ? 'border border-amber-500/25 bg-amber-500/10 text-amber-200'
                          : 'border border-teal-500/25 bg-teal-500/10 text-teal-100'
                      }`}>
                        {selfEvaluation === 'errei'
                          ? 'Boa - esse é o momento que mais gera aprendizado.'
                          : 'Perfeito. Confirme seu raciocínio abaixo.'}
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">5. Diagnóstico</p>
                        <p className="text-sm text-white mt-1">{clinicalCase.diagnosis}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">Conduta</p>
                        <ul className="mt-2 space-y-1.5">
                          {ensureList(clinicalCase.conduct).map(item => (
                            <li key={item} className="text-xs text-slate-200">• {item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">Fármacos-chave</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {clinicalCase.drugs.map(drug => (
                            <span
                              key={drug}
                              className="px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-200"
                            >
                              {drug}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Por que isso importa?</p>
                        <div className="mt-1 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                          <p className="text-xs text-amber-100 leading-relaxed">{clinicalCase.reasoning}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => relatedDiseaseId && onOpenDisease?.(relatedDiseaseId)}
                        disabled={!relatedDiseaseId}
                        className={`min-h-[44px] w-full px-3 py-2 rounded-xl text-xs font-bold transition ${
                          relatedDiseaseId
                            ? 'bg-slate-800 text-white border border-slate-700 hover:border-teal-500/40'
                            : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        Ver doença relacionada
                      </button>

                      {nextCase ? (
                        <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/8 p-3">
                          <p className="text-sm font-bold text-white">Quer tentar o próximo caso?</p>
                          <p className="text-xs text-slate-400 mt-1">{nextCase.title}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenCaseTitle(nextCase.title)
                              setRevealedCaseTitle(null)
                            }}
                            className="mt-3 min-h-[44px] w-full rounded-xl bg-fuchsia-500/90 px-3 py-2 text-xs font-bold text-white transition hover:bg-fuchsia-400"
                          >
                            Abrir próximo caso
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">
                          <p className="text-sm font-bold text-white">Bom trabalho.</p>
                          <p className="text-xs text-slate-400 mt-1">Você concluiu os casos disponíveis por enquanto.</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CasosPage({
  selectionToken,
  onOpenDisease,
}: {
  selectionToken?: number
  onOpenDisease?: (diseaseId: string) => void
} = {}) {
  const [profile, setProfile] = useState<LocalProfile | null>(() => getActiveProfile())

  useEffect(() => {
    if (profile) migrateLegacyProfileData(profile.id)
  }, [profile])

  const handleProfileSelected = (nextProfile: LocalProfile) => {
    setActiveProfile(nextProfile.id)
    migrateLegacyProfileData(nextProfile.id)
    setProfile(nextProfile)
  }

  if (!profile) {
    return (
      <Gatekeeper pageTitle="Casos Clínicos - RBC">
        <ProfileSelector onSelect={handleProfileSelected} />
      </Gatekeeper>
    )
  }

  return (
    <Gatekeeper pageTitle="Casos Clínicos - RBC">
      <CasosContent
        key={profile.id}
        profile={profile}
        selectionToken={selectionToken}
        onOpenDisease={onOpenDisease}
      />
    </Gatekeeper>
  )
}
