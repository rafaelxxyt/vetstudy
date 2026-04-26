import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, CheckCircle2, Filter, Stethoscope } from 'lucide-react'
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
  clearCaseProgress,
  loadCaseProgress,
  loadReviewedCases,
  markCaseReviewed,
  saveCaseProgress,
  type CaseProgressState,
} from '../utils/reviewHabit'

interface CaseStep {
  id: string
  type: string
  title: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

interface ClinicalCase {
  id: string
  number: number
  title: string
  species: string
  speciesEmoji: string
  category: string
  difficulty: 'facil' | 'media' | 'dificil'
  estimatedTime: string
  relatedDiseaseId?: string
  relatedDiseaseName?: string
  steps?: CaseStep[]
  chiefComplaint: string
  history: string
  physicalExam: string[]
  labFindings: string[]
  clinicalQuestion: string
  diagnosis: string
  conduct: string[] | string
  drugs: string[]
  reasoning: string
}

interface RawCaseStep {
  id?: string
  type?: string
  title?: string
  question?: string
  options?: unknown
  correctIndex?: number | string
  correctOption?: number | string
  explanation?: string
}

interface RawClinicalCase extends Omit<ClinicalCase, 'steps'> {
  steps?: RawCaseStep[]
  decisionSteps?: RawCaseStep[]
}

type CaseFilter = 'todas' | 'cao' | 'bovino' | 'nao_iniciados' | 'concluidos'

function normalizeStep(rawStep: RawCaseStep, index: number): CaseStep | null {
  const options = Array.isArray(rawStep.options)
    ? rawStep.options.filter((option): option is string => typeof option === 'string' && option.trim().length > 0)
    : []
  const question = typeof rawStep.question === 'string' ? rawStep.question.trim() : ''
  const explanation = typeof rawStep.explanation === 'string' ? rawStep.explanation.trim() : ''
  if (!question || !explanation || options.length < 2) return null

  let correctIndex = typeof rawStep.correctIndex === 'number' ? rawStep.correctIndex : Number(rawStep.correctIndex)
  if (!Number.isInteger(correctIndex)) {
    const correctOption = rawStep.correctOption
    if (typeof correctOption === 'number' && Number.isInteger(correctOption)) {
      correctIndex = correctOption
    } else if (typeof correctOption === 'string') {
      const numericOption = Number(correctOption)
      correctIndex = Number.isInteger(numericOption)
        ? numericOption
        : options.findIndex(option => normalizeLookup(option) === normalizeLookup(correctOption))
    } else {
      correctIndex = -1
    }
  }

  if (correctIndex < 0 || correctIndex >= options.length) return null

  return {
    id: typeof rawStep.id === 'string' && rawStep.id.trim().length > 0 ? rawStep.id : `step-${index + 1}`,
    type: typeof rawStep.type === 'string' && rawStep.type.trim().length > 0 ? rawStep.type : 'single_choice',
    title: typeof rawStep.title === 'string' && rawStep.title.trim().length > 0 ? rawStep.title : `Etapa ${index + 1}`,
    question,
    options,
    correctIndex,
    explanation,
  }
}

function normalizeClinicalCase(rawCase: RawClinicalCase): ClinicalCase {
  const stepSource = Array.isArray(rawCase.steps)
    ? rawCase.steps
    : Array.isArray(rawCase.decisionSteps)
      ? rawCase.decisionSteps
      : []

  return {
    ...rawCase,
    steps: stepSource
      .map((step, index) => normalizeStep(step, index))
      .filter((step): step is CaseStep => step !== null),
  }
}

const CLINICAL_CASES = (clinicalCases as RawClinicalCase[]).map(normalizeClinicalCase)
const DISEASE_INDEX = (centralDb as { diseases: { id: string; name: string }[] }).diseases

function normalizeLookup(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function findDiseaseId(clinicalCase: ClinicalCase) {
  if (clinicalCase.relatedDiseaseId) return clinicalCase.relatedDiseaseId
  const target = normalizeLookup(clinicalCase.relatedDiseaseName ?? '')
  return DISEASE_INDEX.find(disease => {
    const current = normalizeLookup(disease.name)
    return current === target || current.includes(target) || target.includes(current)
  })?.id
}

function ensureList(value: string[] | string) {
  return Array.isArray(value) ? value : [value]
}

function statusLabel(status: 'nao_iniciado' | 'in_progress' | 'completed') {
  if (status === 'completed') return 'concluído'
  if (status === 'in_progress') return 'em andamento'
  return 'não iniciado'
}

function statusBadgeClass(status: 'nao_iniciado' | 'in_progress' | 'completed') {
  if (status === 'completed') return 'bg-teal-500/15 border-teal-500/25 text-teal-300'
  if (status === 'in_progress') return 'bg-amber-500/15 border-amber-500/25 text-amber-300'
  return 'bg-slate-800/80 border-slate-700 text-slate-400'
}

function difficultyLabel(value: ClinicalCase['difficulty']) {
  if (value === 'facil') return 'fácil'
  if (value === 'dificil') return 'difícil'
  return 'média'
}

function getCaseStatus(clinicalCase: ClinicalCase, progress: CaseProgressState | null, reviewedCases: string[]) {
  if (progress?.status === 'completed') return 'completed' as const
  if (progress?.status === 'in_progress') return 'in_progress' as const
  if (reviewedCases.includes(clinicalCase.title)) return 'completed' as const
  return 'nao_iniciado' as const
}

function getCaseActionLabel(status: 'nao_iniciado' | 'in_progress' | 'completed') {
  if (status === 'completed') return 'Revisar caso'
  if (status === 'in_progress') return 'Continuar caso'
  return 'Iniciar caso'
}

function scorePercent(score: number, total: number) {
  if (total <= 0) return 0
  return Math.round((score / total) * 100)
}

function normalizeCaseProgress(clinicalCase: ClinicalCase, progress: CaseProgressState | null): CaseProgressState | null {
  if (!progress) return null
  const totalSteps = clinicalCase.steps?.length ?? 0
  if (totalSteps === 0) return progress

  const stepAnswers = Array.isArray(progress.stepAnswers)
    ? progress.stepAnswers.filter((answer): answer is number => typeof answer === 'number').slice(0, totalSteps)
    : []
  const score = stepAnswers.reduce((total, answer, index) => (
    total + (answer === clinicalCase.steps?.[index]?.correctIndex ? 1 : 0)
  ), 0)

  if (progress.status === 'completed' && stepAnswers.length < totalSteps) {
    return {
      status: 'in_progress',
      currentStepIndex: Math.min(stepAnswers.length, Math.max(totalSteps - 1, 0)),
      stepAnswers,
      score,
    }
  }

  return {
    ...progress,
    currentStepIndex: typeof progress.currentStepIndex === 'number'
      ? Math.min(Math.max(progress.currentStepIndex, 0), totalSteps)
      : Math.min(stepAnswers.length, Math.max(totalSteps - 1, 0)),
    stepAnswers,
    score,
  }
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
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [caseProgressMap, setCaseProgressMap] = useState<Record<string, CaseProgressState | null>>(() =>
    Object.fromEntries(CLINICAL_CASES.map(clinicalCase => [clinicalCase.id, loadCaseProgress(clinicalCase.id, profile.id)])),
  )
  const [caseFilter, setCaseFilter] = useState<CaseFilter>('todas')
  const [selfEvaluationByCase, setSelfEvaluationByCase] = useState<Record<string, 'acertei' | 'errei'>>({})
  const [selectedOptionByCase, setSelectedOptionByCase] = useState<Record<string, number | null>>({})
  const [showFallbackResolutionByCase, setShowFallbackResolutionByCase] = useState<Record<string, boolean>>({})
  const [expandedContextByCase, setExpandedContextByCase] = useState<Record<string, boolean>>({})

  const getProgressForCase = (clinicalCase: ClinicalCase) =>
    normalizeCaseProgress(clinicalCase, caseProgressMap[clinicalCase.id] ?? null)

  useEffect(() => {
    const refreshCases = () => {
      setReviewedCases(loadReviewedCases(profile.id))
      setCaseProgressMap(Object.fromEntries(
        CLINICAL_CASES.map(clinicalCase => [clinicalCase.id, loadCaseProgress(clinicalCase.id, profile.id)]),
      ))
    }
    window.addEventListener(caseProgressEventName(), refreshCases)
    return () => window.removeEventListener(caseProgressEventName(), refreshCases)
  }, [profile.id])

  useEffect(() => {
    if (!selectionToken || CLINICAL_CASES.length === 0) return
    const firstCase = CLINICAL_CASES.find(item => getCaseStatus(item, getProgressForCase(item), reviewedCases) !== 'completed') ?? CLINICAL_CASES[0]
    setSelectedCaseId(firstCase.id)
  }, [caseProgressMap, reviewedCases, selectionToken])

  const selectedCase = selectedCaseId ? CLINICAL_CASES.find(item => item.id === selectedCaseId) ?? null : null

  const filteredCases = useMemo(() => {
    return CLINICAL_CASES.filter(clinicalCase => {
      const status = getCaseStatus(clinicalCase, getProgressForCase(clinicalCase), reviewedCases)
      if (caseFilter === 'cao') return normalizeLookup(clinicalCase.species) === 'cao'
      if (caseFilter === 'bovino') return normalizeLookup(clinicalCase.species) === 'bovino'
      if (caseFilter === 'nao_iniciados') return status === 'nao_iniciado'
      if (caseFilter === 'concluidos') return status === 'completed'
      return true
    })
  }, [caseFilter, caseProgressMap, reviewedCases])

  const nextCaseId = useMemo(() => {
    if (!selectedCase) return null
    const currentIndex = CLINICAL_CASES.findIndex(item => item.id === selectedCase.id)
    const nextUnfinished = CLINICAL_CASES.find(item =>
      item.id !== selectedCase.id && getCaseStatus(item, getProgressForCase(item), reviewedCases) !== 'completed',
    )
    if (nextUnfinished) return nextUnfinished.id
    return currentIndex >= 0 && CLINICAL_CASES[currentIndex + 1] ? CLINICAL_CASES[currentIndex + 1].id : null
  }, [caseProgressMap, reviewedCases, selectedCase])

  const openCase = (caseId: string) => {
    setSelectedCaseId(caseId)
  }

  const persistProgress = (caseId: string, nextProgress: CaseProgressState) => {
    saveCaseProgress(caseId, nextProgress, profile.id)
    setCaseProgressMap(current => ({ ...current, [caseId]: nextProgress }))
  }

  const resetCase = (clinicalCase: ClinicalCase) => {
    clearCaseProgress(clinicalCase.id, clinicalCase.title, profile.id)
    setCaseProgressMap(current => ({ ...current, [clinicalCase.id]: null }))
    setReviewedCases(current => current.filter(title => title !== clinicalCase.title))
    setSelfEvaluationByCase(current => {
      const next = { ...current }
      delete next[clinicalCase.id]
      return next
    })
    setSelectedOptionByCase(current => {
      const next = { ...current }
      delete next[clinicalCase.id]
      return next
    })
    setShowFallbackResolutionByCase(current => {
      const next = { ...current }
      delete next[clinicalCase.id]
      return next
    })
    setExpandedContextByCase(current => {
      const next = { ...current }
      delete next[clinicalCase.id]
      return next
    })
    setSelectedCaseId(clinicalCase.id)
  }

  const renderPatientSummary = (clinicalCase: ClinicalCase) => {
    const showFullContext = expandedContextByCase[clinicalCase.id] ?? false

    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Stethoscope size={15} className="text-slate-300" />
          <p className="text-sm font-bold text-white">Resumo do paciente</p>
        </div>

        <div className="space-y-2 text-xs text-slate-300">
          <div>
            <span className="font-bold text-slate-100">Queixa:</span> {clinicalCase.chiefComplaint}
          </div>
          <div>
            <span className="font-bold text-slate-100">História:</span> {clinicalCase.history}
          </div>
          <div>
            <span className="font-bold text-slate-100">Exame:</span> {clinicalCase.physicalExam.slice(0, 3).join(' · ')}
          </div>
          <div>
            <span className="font-bold text-slate-100">Labs:</span> {clinicalCase.labFindings.slice(0, 3).join(' · ')}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpandedContextByCase(current => ({ ...current, [clinicalCase.id]: !showFullContext }))}
          className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-fuchsia-500/30"
        >
          {showFullContext ? 'Ocultar detalhes' : 'Ver detalhes completos'}
        </button>

        {showFullContext && (
          <div className="grid grid-cols-1 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="font-bold text-slate-100">Exame físico completo</p>
              <ul className="mt-2 space-y-1 text-slate-300">
                {clinicalCase.physicalExam.map(item => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="font-bold text-slate-100">Achados laboratoriais completos</p>
              <ul className="mt-2 space-y-1 text-slate-300">
                {clinicalCase.labFindings.map(item => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderCaseCard = (clinicalCase: ClinicalCase) => {
    const progress = getProgressForCase(clinicalCase)
    const status = getCaseStatus(clinicalCase, progress, reviewedCases)
    const actionLabel = getCaseActionLabel(status)

    return (
      <div key={clinicalCase.id} className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">{clinicalCase.title}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                {clinicalCase.speciesEmoji} {clinicalCase.species}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                {clinicalCase.category}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                {difficultyLabel(clinicalCase.difficulty)}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                {clinicalCase.estimatedTime}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusBadgeClass(status)}`}>
                {statusLabel(status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 w-full sm:w-auto sm:min-w-[160px]">
            <button
              type="button"
              onClick={() => openCase(clinicalCase.id)}
              className="min-h-[44px] w-full rounded-xl bg-fuchsia-500/90 px-3 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-400"
            >
              {actionLabel}
            </button>

            {status === 'completed' && (
              <button
                type="button"
                onClick={() => resetCase(clinicalCase)}
                className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-fuchsia-500/30"
              >
                Refazer caso
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderStepCase = (clinicalCase: ClinicalCase) => {
    const progress = getProgressForCase(clinicalCase)
    const stepAnswers = progress?.stepAnswers ?? []
    const currentStepIndex = progress?.currentStepIndex ?? 0
    const currentStep = clinicalCase.steps?.[currentStepIndex] ?? null
    const selectedOption = selectedOptionByCase[clinicalCase.id] ?? null
    const confirmedAnswer = typeof stepAnswers[currentStepIndex] === 'number' ? stepAnswers[currentStepIndex] : null
    const allStepsCompleted = Boolean(clinicalCase.steps && stepAnswers.length >= clinicalCase.steps.length)
    const score = progress?.score ?? stepAnswers.reduce((total, answer, index) => (
      total + (answer === clinicalCase.steps?.[index]?.correctIndex ? 1 : 0)
    ), 0)

    if (progress?.status === 'completed' && allStepsCompleted) {
      const totalSteps = clinicalCase.steps?.length ?? 0
      const percent = scorePercent(score, totalSteps)
      const relatedDiseaseId = findDiseaseId(clinicalCase)

      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-teal-300" />
              <p className="text-lg font-bold text-white">Caso concluído</p>
            </div>
            <p className="text-sm text-slate-300 mt-2">Você acertou {score} de {totalSteps} etapas.</p>
            <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${percent}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-3">Diagnóstico: <span className="text-white font-semibold">{clinicalCase.diagnosis}</span></p>
          </div>

          <div className="space-y-3">
            {clinicalCase.steps?.map((step, index) => {
              const answerIndex = stepAnswers[index]
              const isCorrect = answerIndex === step.correctIndex
              const userAnswer = typeof answerIndex === 'number' ? step.options[answerIndex] : 'Sem resposta'
              const correctAnswer = step.options[step.correctIndex]

              return (
                <div key={step.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      isCorrect ? 'bg-teal-500/15 text-teal-300' : 'bg-amber-500/15 text-amber-300'
                    }`}>
                      {index + 1}
                    </span>
                    <p className="text-sm font-bold text-white">{step.title}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Sua resposta: {userAnswer}</p>
                  <p className="text-xs text-slate-400 mt-1">Resposta correta: {correctAnswer}</p>
                  {!isCorrect && <p className="text-xs text-amber-200 mt-2">{step.explanation}</p>}
                  {isCorrect && <p className="text-xs text-teal-200 mt-2">{step.explanation}</p>}
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => resetCase(clinicalCase)}
              className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-fuchsia-500/30"
            >
              Refazer caso
            </button>

            <button
              type="button"
              onClick={() => relatedDiseaseId && onOpenDisease?.(relatedDiseaseId)}
              disabled={!relatedDiseaseId}
              className={`min-h-[44px] w-full rounded-xl px-3 py-2 text-sm font-bold transition ${
                relatedDiseaseId
                  ? 'border border-slate-700 bg-slate-800 text-white hover:border-teal-500/40'
                  : 'border border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              Ver doença relacionada
            </button>

            {nextCaseId && (
              <button
                type="button"
                onClick={() => setSelectedCaseId(nextCaseId)}
                className="min-h-[44px] w-full rounded-xl bg-fuchsia-500/90 px-3 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-400"
              >
                Próximo caso
              </button>
            )}
          </div>
        </div>
      )
    }

    if (!currentStep || !clinicalCase.steps) return null

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[11px] font-bold text-fuchsia-300 uppercase tracking-wider">
            Caso {String(clinicalCase.number).padStart(2, '0')} · Etapa {currentStepIndex + 1} de {clinicalCase.steps.length}
          </p>
        </div>

        {renderPatientSummary(clinicalCase)}

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{currentStep.title}</p>
            <p className="text-sm font-bold text-white mt-1">{currentStep.question}</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {currentStep.options.map((option, index) => {
              const isPicked = selectedOption === index
              const isAnswered = confirmedAnswer !== null
              let optionClass = 'border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-fuchsia-500/30'
              if (!isAnswered && isPicked) {
                optionClass = 'border border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100'
              } else if (isAnswered && index === confirmedAnswer && index === currentStep.correctIndex) {
                optionClass = 'border border-teal-400/40 bg-teal-500/15 text-teal-100'
              } else if (isAnswered && index === confirmedAnswer && index !== currentStep.correctIndex) {
                optionClass = 'border border-amber-400/40 bg-amber-500/15 text-amber-100'
              } else if (isAnswered && index === currentStep.correctIndex) {
                optionClass = 'border border-teal-400/25 bg-teal-500/8 text-teal-100'
              }

              return (
                <button
                  key={option}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => setSelectedOptionByCase(current => ({ ...current, [clinicalCase.id]: index }))}
                  className={`min-h-[44px] w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition ${optionClass}`}
                >
                  {option}
                </button>
              )
            })}
          </div>

          {confirmedAnswer === null ? (
            <button
              type="button"
              disabled={selectedOption === null}
              onClick={() => {
                if (selectedOption === null) return
                const nextAnswers = [...stepAnswers]
                nextAnswers[currentStepIndex] = selectedOption
                const nextScore = nextAnswers.reduce((total, answer, index) => (
                  total + (answer === clinicalCase.steps?.[index]?.correctIndex ? 1 : 0)
                ), 0)
                persistProgress(clinicalCase.id, {
                  status: 'in_progress',
                  currentStepIndex,
                  stepAnswers: nextAnswers,
                  score: nextScore,
                })
              }}
              className="min-h-[44px] w-full rounded-xl bg-fuchsia-500/90 px-3 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-400 disabled:opacity-40"
            >
              Confirmar resposta
            </button>
          ) : (
            <div className="space-y-3">
              <div className={`rounded-xl px-3 py-2 text-xs ${
                confirmedAnswer === currentStep.correctIndex
                  ? 'border border-teal-500/25 bg-teal-500/10 text-teal-100'
                  : 'border border-amber-500/25 bg-amber-500/10 text-amber-100'
              }`}>
                <p className="font-bold">{confirmedAnswer === currentStep.correctIndex ? 'Correto' : 'Cuidado'}</p>
                <p className="mt-1">{currentStep.explanation}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedOptionByCase(current => ({ ...current, [clinicalCase.id]: null }))
                  if (currentStepIndex >= clinicalCase.steps!.length - 1) {
                    persistProgress(clinicalCase.id, {
                      status: 'completed',
                      currentStepIndex: clinicalCase.steps!.length,
                      stepAnswers,
                      score,
                    })
                    markCaseReviewed(clinicalCase.title, profile.id)
                    return
                  }

                  persistProgress(clinicalCase.id, {
                    status: 'in_progress',
                    currentStepIndex: currentStepIndex + 1,
                    stepAnswers,
                    score,
                  })
                }}
                className="min-h-[44px] w-full rounded-xl bg-slate-800 px-3 py-2 text-sm font-bold text-white transition hover:border-teal-500/40 border border-slate-700"
              >
                {currentStepIndex >= clinicalCase.steps.length - 1 ? 'Ver resultado do caso' : 'Próxima etapa'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderFallbackCase = (clinicalCase: ClinicalCase) => {
    const relatedDiseaseId = findDiseaseId(clinicalCase)
    const selfEvaluation = selfEvaluationByCase[clinicalCase.id]
    const showResolution = showFallbackResolutionByCase[clinicalCase.id] ?? false
    const nextCaseLabel = nextCaseId ? (CLINICAL_CASES.find(item => item.id === nextCaseId)?.title ?? '') : ''

    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Queixa + história</p>
          <p className="text-sm text-slate-200 mt-1">{clinicalCase.chiefComplaint}</p>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{clinicalCase.history}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exame físico</p>
          <ul className="mt-2 space-y-1.5">
            {clinicalCase.physicalExam.map(item => (
              <li key={item} className="text-xs text-slate-300">• {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Achados laboratoriais</p>
          <ul className="mt-2 space-y-1.5">
            {clinicalCase.labFindings.map(item => (
              <li key={item} className="text-xs text-slate-300">• {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pergunta clínica</p>
          <p className="text-sm text-slate-200 mt-1">{clinicalCase.clinicalQuestion}</p>
        </div>

        {!showResolution ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-3">
            <div>
              <p className="text-sm font-bold text-white">Você já tem um diagnóstico em mente?</p>
              <p className="text-xs text-slate-400 mt-1">Marque sua percepção antes de ver a resolução.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelfEvaluationByCase(current => ({ ...current, [clinicalCase.id]: 'acertei' }))
                  persistProgress(clinicalCase.id, { status: 'in_progress', selfEvaluation: 'acertei' })
                }}
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
                onClick={() => {
                  setSelfEvaluationByCase(current => ({ ...current, [clinicalCase.id]: 'errei' }))
                  persistProgress(clinicalCase.id, { status: 'in_progress', selfEvaluation: 'errei' })
                }}
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
                type="button"
                onClick={() => {
                  setShowFallbackResolutionByCase(current => ({ ...current, [clinicalCase.id]: true }))
                  persistProgress(clinicalCase.id, {
                    status: 'completed',
                    selfEvaluation,
                    revealed: true,
                  })
                  markCaseReviewed(clinicalCase.title, profile.id)
                }}
                className="min-h-[44px] w-full rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-sm font-bold text-teal-300 transition hover:bg-teal-500/15"
              >
                Mostrar resolução
              </button>
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
              <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">Diagnóstico</p>
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
                  <span key={drug} className="px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-200">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => resetCase(clinicalCase)}
                className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-fuchsia-500/30"
              >
                Refazer caso
              </button>

              <button
                type="button"
                onClick={() => relatedDiseaseId && onOpenDisease?.(relatedDiseaseId)}
                disabled={!relatedDiseaseId}
                className={`min-h-[44px] w-full rounded-xl px-3 py-2 text-sm font-bold transition ${
                  relatedDiseaseId
                    ? 'border border-slate-700 bg-slate-800 text-white hover:border-teal-500/40'
                    : 'border border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed'
                }`}
              >
                Ver doença relacionada
              </button>

              {nextCaseId && (
                <button
                  type="button"
                  onClick={() => setSelectedCaseId(nextCaseId)}
                  className="min-h-[44px] w-full rounded-xl bg-fuchsia-500/90 px-3 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-400"
                >
                  {nextCaseLabel ? 'Próximo caso' : 'Voltar aos casos'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderImmersiveCase = () => {
    if (!selectedCase) return null
    const status = getCaseStatus(selectedCase, getProgressForCase(selectedCase), reviewedCases)

    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-5">
        <button
          type="button"
          onClick={() => setSelectedCaseId(null)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-fuchsia-500/30"
        >
          <ArrowLeft size={15} />
          Voltar aos casos
        </button>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">{selectedCase.title}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                  {selectedCase.speciesEmoji} {selectedCase.species}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                  {selectedCase.category}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                  {difficultyLabel(selectedCase.difficulty)}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                  {selectedCase.estimatedTime}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusBadgeClass(status)}`}>
                  {statusLabel(status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {selectedCase.steps && selectedCase.steps.length > 0
          ? renderStepCase(selectedCase)
          : renderFallbackCase(selectedCase)}
      </div>
    )
  }

  if (selectedCase) {
    return renderImmersiveCase()
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={22} className="text-fuchsia-400" />
          <h1 className="text-2xl font-bold text-white">Casos Clínicos</h1>
        </div>
        <p className="text-sm text-slate-400">Treino guiado de raciocínio clínico, um paciente por vez.</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-3">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-slate-400" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtros</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'cao', label: 'Cão' },
            { id: 'bovino', label: 'Bovino' },
            { id: 'nao_iniciados', label: 'Não iniciados' },
            { id: 'concluidos', label: 'Concluídos' },
          ].map(filter => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setCaseFilter(filter.id as CaseFilter)}
              className={`min-h-[44px] rounded-xl px-3 py-2 text-sm font-bold transition ${
                caseFilter === filter.id
                  ? 'border border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100'
                  : 'border border-slate-700 bg-slate-900/70 text-slate-300 hover:border-fuchsia-500/30'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredCases.map(renderCaseCard)}
      </div>

      {filteredCases.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5 text-center">
          <p className="text-sm font-bold text-white">Nenhum caso encontrado</p>
          <p className="text-xs text-slate-400 mt-1">Ajuste o filtro para ver outros casos disponíveis.</p>
        </div>
      )}
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
