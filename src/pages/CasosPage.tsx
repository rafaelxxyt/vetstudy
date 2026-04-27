import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Filter, Stethoscope } from 'lucide-react'
import Gatekeeper from '../components/Gatekeeper'
import ProfileSelector from '../components/ProfileSelector'
import clinicalCases from '../data/clinical_cases.json'
import centralDb from '../data/central_db.json'
import { getActiveProfile, migrateLegacyProfileData, setActiveProfile, type LocalProfile } from '../utils/profiles'
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

type CaseFilter = 'todas' | 'cao' | 'bovino' | 'nao_iniciados' | 'concluidos'
type CaseStatus = 'nao_iniciado' | 'in_progress' | 'completed'

const CLINICAL_CASES = clinicalCases as unknown as ClinicalCase[]
const DISEASE_INDEX = (centralDb as { diseases: { id: string; name: string }[] }).diseases

function normalizeLookup(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
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

function difficultyLabel(value: ClinicalCase['difficulty']) {
  if (value === 'facil') return 'Iniciante'
  if (value === 'dificil') return 'Avançado'
  return 'Intermediário'
}

function scorePercent(score: number, total: number) {
  if (total <= 0) return 0
  return Math.round((score / total) * 100)
}

function getCaseStatus(clinicalCase: ClinicalCase, progress: CaseProgressState | null, reviewedCases: string[]): CaseStatus {
  if (progress?.status === 'completed') return 'completed'
  if (progress?.status === 'in_progress') return 'in_progress'
  if (reviewedCases.includes(clinicalCase.title)) return 'completed'
  return 'nao_iniciado'
}

function getCaseActionLabel(status: CaseStatus) {
  if (status === 'completed') return 'Revisar caso'
  if (status === 'in_progress') return 'Continuar caso'
  return 'Começar raciocínio'
}

function statusLabel(status: CaseStatus) {
  if (status === 'completed') return 'concluído'
  if (status === 'in_progress') return 'em andamento'
  return 'não iniciado'
}

function statusBadgeClass(status: CaseStatus) {
  if (status === 'completed') return 'border-teal-500/25 bg-teal-500/15 text-teal-300'
  if (status === 'in_progress') return 'border-amber-500/25 bg-amber-500/15 text-amber-300'
  return 'border-slate-700 bg-slate-800/80 text-slate-400'
}

function normalizeProgress(clinicalCase: ClinicalCase, progress: CaseProgressState | null) {
  if (!progress) return null
  const totalSteps = clinicalCase.steps?.length ?? 0
  if (totalSteps === 0) return progress

  const stepAnswers = Array.isArray(progress.stepAnswers)
    ? progress.stepAnswers.filter((answer): answer is number => typeof answer === 'number').slice(0, totalSteps)
    : []
  const score = stepAnswers.reduce((total, answer, index) => (
    total + (answer === clinicalCase.steps?.[index]?.correctIndex ? 1 : 0)
  ), 0)

  return {
    ...progress,
    currentStepIndex:
      typeof progress.currentStepIndex === 'number'
        ? Math.min(Math.max(progress.currentStepIndex, 0), totalSteps)
        : Math.min(stepAnswers.length, Math.max(totalSteps - 1, 0)),
    stepAnswers,
    score,
  }
}

function CaseListCard({
  clinicalCase,
  progress,
  reviewedCases,
  onOpen,
  onReset,
}: {
  clinicalCase: ClinicalCase
  progress: CaseProgressState | null
  reviewedCases: string[]
  onOpen: () => void
  onReset: () => void
}) {
  const status = getCaseStatus(clinicalCase, progress, reviewedCases)
  const totalSteps = clinicalCase.steps?.length ?? 0
  const completedSteps = progress?.stepAnswers?.length ?? 0
  const statusText = status === 'in_progress' && totalSteps > 0
    ? `⏳ ${completedSteps}/${totalSteps} etapas`
    : statusLabel(status)
  const scoreSummary =
    status === 'completed' && typeof progress?.score === 'number' && totalSteps > 0
      ? `✓ ${progress.score}/${totalSteps} etapas corretas`
      : status === 'completed'
        ? 'concluído'
        : null

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">{clinicalCase.title}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
              {clinicalCase.speciesEmoji} {clinicalCase.species}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
              {clinicalCase.category}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
              {difficultyLabel(clinicalCase.difficulty)}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
              {clinicalCase.estimatedTime}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusBadgeClass(status)}`}>
              {statusText}
            </span>
          </div>
          {scoreSummary && <p className="mt-2 text-[11px] font-semibold text-teal-300">{scoreSummary}</p>}
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:min-w-[180px]">
          <button
            type="button"
            onClick={onOpen}
            className="min-h-[44px] w-full rounded-xl bg-fuchsia-500/90 px-3 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-400"
          >
            {getCaseActionLabel(status)}
          </button>
          {status === 'completed' && (
            <button
              type="button"
              onClick={onReset}
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
  const [caseProgressMap, setCaseProgressMap] = useState<Record<string, CaseProgressState | null>>(() =>
    Object.fromEntries(CLINICAL_CASES.map(item => [item.id, loadCaseProgress(item.id, profile.id)])),
  )
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [caseFilter, setCaseFilter] = useState<CaseFilter>('todas')
  const [selectedOptionByCase, setSelectedOptionByCase] = useState<Record<string, number | null>>({})
  const [selfEvaluationByCase, setSelfEvaluationByCase] = useState<Record<string, 'acertei' | 'errei'>>({})
  const [showFallbackResolutionByCase, setShowFallbackResolutionByCase] = useState<Record<string, boolean>>({})
  const [expandedContextByCase, setExpandedContextByCase] = useState<Record<string, boolean>>({})

  const progressFor = (clinicalCase: ClinicalCase) => normalizeProgress(clinicalCase, caseProgressMap[clinicalCase.id])

  useEffect(() => {
    const refreshCases = () => {
      setReviewedCases(loadReviewedCases(profile.id))
      setCaseProgressMap(Object.fromEntries(CLINICAL_CASES.map(item => [item.id, loadCaseProgress(item.id, profile.id)])))
    }
    window.addEventListener(caseProgressEventName(), refreshCases)
    return () => window.removeEventListener(caseProgressEventName(), refreshCases)
  }, [profile.id])

  useEffect(() => {
    if (!selectionToken || CLINICAL_CASES.length === 0) return
    setSelectedCaseId(null)
  }, [selectionToken])

  const selectedCase = selectedCaseId ? CLINICAL_CASES.find(item => item.id === selectedCaseId) ?? null : null

  const filteredCases = useMemo(() => {
    return CLINICAL_CASES.filter(clinicalCase => {
      const status = getCaseStatus(clinicalCase, progressFor(clinicalCase), reviewedCases)
      if (caseFilter === 'cao') return normalizeLookup(clinicalCase.species) === 'cao'
      if (caseFilter === 'bovino') return normalizeLookup(clinicalCase.species) === 'bovino'
      if (caseFilter === 'nao_iniciados') return status === 'nao_iniciado'
      if (caseFilter === 'concluidos') return status === 'completed'
      return true
    })
  }, [caseFilter, caseProgressMap, reviewedCases])

  const nextCaseId = useMemo(() => {
    if (!selectedCase) return null
    return CLINICAL_CASES.find(item =>
      item.id !== selectedCase.id && getCaseStatus(item, progressFor(item), reviewedCases) !== 'completed',
    )?.id ?? null
  }, [selectedCase, caseProgressMap, reviewedCases])

  const persistProgress = (clinicalCase: ClinicalCase, nextProgress: CaseProgressState) => {
    saveCaseProgress(clinicalCase.id, nextProgress, profile.id)
    setCaseProgressMap(current => ({ ...current, [clinicalCase.id]: nextProgress }))
  }

  const resetCase = (clinicalCase: ClinicalCase) => {
    clearCaseProgress(clinicalCase.id, clinicalCase.title, profile.id)
    setCaseProgressMap(current => ({ ...current, [clinicalCase.id]: null }))
    setReviewedCases(current => current.filter(title => title !== clinicalCase.title))
    setSelectedOptionByCase(current => ({ ...current, [clinicalCase.id]: null }))
    setSelfEvaluationByCase(current => {
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
    const expanded = expandedContextByCase[clinicalCase.id] ?? false

    return (
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="flex items-center gap-2">
          <Stethoscope size={15} className="text-slate-300" />
          <p className="text-sm font-bold text-white">Resumo do paciente</p>
        </div>

        <div className="space-y-2 text-xs text-slate-300">
          <div><span className="font-bold text-slate-100">Queixa:</span> {clinicalCase.chiefComplaint}</div>
          <div><span className="font-bold text-slate-100">História:</span> {clinicalCase.history}</div>
          <div><span className="font-bold text-slate-100">Exame:</span> {clinicalCase.physicalExam.slice(0, 3).join(' · ')}</div>
          <div><span className="font-bold text-slate-100">Labs:</span> {clinicalCase.labFindings.slice(0, 3).join(' · ')}</div>
        </div>

        <button
          type="button"
          onClick={() => setExpandedContextByCase(current => ({ ...current, [clinicalCase.id]: !expanded }))}
          className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-fuchsia-500/30"
        >
          {expanded ? 'Ocultar detalhes' : 'Ver detalhes completos'}
        </button>

        {expanded && (
          <div className="grid grid-cols-1 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="font-bold text-slate-100">Exame físico completo</p>
              <ul className="mt-2 space-y-1 text-slate-300">
                {clinicalCase.physicalExam.map(item => <li key={item}>• {item}</li>)}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="font-bold text-slate-100">Achados laboratoriais completos</p>
              <ul className="mt-2 space-y-1 text-slate-300">
                {clinicalCase.labFindings.map(item => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderStepCase = (clinicalCase: ClinicalCase) => {
    const progress = progressFor(clinicalCase)
    const stepAnswers = progress?.stepAnswers ?? []
    const currentStepIndex = progress?.currentStepIndex ?? 0
    const currentStep = clinicalCase.steps?.[currentStepIndex]
    const selectedOption = selectedOptionByCase[clinicalCase.id] ?? null
    const confirmedAnswer = typeof stepAnswers[currentStepIndex] === 'number' ? stepAnswers[currentStepIndex] : null
    const totalSteps = clinicalCase.steps?.length ?? 0
    const score = progress?.score ?? stepAnswers.reduce((total, answer, index) => (
      total + (answer === clinicalCase.steps?.[index]?.correctIndex ? 1 : 0)
    ), 0)

    if (progress?.status === 'completed' && clinicalCase.steps && stepAnswers.length >= totalSteps) {
      const percent = scorePercent(score, totalSteps)
      const relatedDiseaseId = findDiseaseId(clinicalCase)

      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-teal-300" />
              <p className="text-lg font-bold text-white">Caso concluído</p>
            </div>
            <p className="mt-2 text-sm text-slate-300">Você acertou {score} de {totalSteps} etapas.</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-teal-400" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Diagnóstico: <span className="font-semibold text-white">{clinicalCase.diagnosis}</span>
            </p>
          </div>

          <div className="space-y-3">
            {clinicalCase.steps.map((step, index) => {
              const answerIndex = stepAnswers[index]
              const isCorrect = answerIndex === step.correctIndex
              const userAnswer = typeof answerIndex === 'number' ? step.options[answerIndex] : 'Sem resposta'
              const correctAnswer = step.options[step.correctIndex]

              return (
                <div key={step.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold ${isCorrect ? 'bg-teal-500/15 text-teal-300' : 'bg-amber-500/15 text-amber-300'}`}>
                      {index + 1}
                    </span>
                    <p className="text-sm font-bold text-white">{step.title}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Sua resposta: {userAnswer}</p>
                  <p className="mt-1 text-xs text-slate-400">Resposta correta: {correctAnswer}</p>
                  <p className={`mt-2 text-xs ${isCorrect ? 'text-teal-200' : 'text-amber-200'}`}>{step.explanation}</p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {nextCaseId && (
              <button
                type="button"
                onClick={() => setSelectedCaseId(nextCaseId)}
                className="min-h-[44px] w-full rounded-xl bg-fuchsia-500/90 px-3 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-400"
              >
                Próximo caso
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (relatedDiseaseId) onOpenDisease?.(relatedDiseaseId)
              }}
              disabled={!relatedDiseaseId}
              className={`min-h-[44px] w-full rounded-xl px-3 py-2 text-sm font-bold transition ${
                relatedDiseaseId
                  ? 'border border-slate-700 bg-slate-800 text-white hover:border-teal-500/40'
                  : 'cursor-not-allowed border border-slate-800 bg-slate-900 text-slate-600'
              }`}
            >
              Ver doença relacionada
            </button>
            <button
              type="button"
              onClick={() => resetCase(clinicalCase)}
              className="min-h-[44px] w-full rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 transition hover:text-slate-200"
            >
              Refazer caso
            </button>
          </div>
        </div>
      )
    }

    if (!currentStep || !clinicalCase.steps) return null

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-300">
            Caso {String(clinicalCase.number).padStart(2, '0')} · Etapa {currentStepIndex + 1} de {totalSteps}
          </p>
        </div>

        {renderPatientSummary(clinicalCase)}

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{currentStep.title}</p>
            <p className="mt-1 text-sm font-bold text-white">{currentStep.question}</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {currentStep.options.map((option, index) => {
              const isPicked = selectedOption === index
              const isAnswered = confirmedAnswer !== null
              let optionClass = 'border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-fuchsia-500/30'
              if (!isAnswered && isPicked) optionClass = 'border border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100'
              if (isAnswered && index === confirmedAnswer && index === currentStep.correctIndex) optionClass = 'border border-teal-400/40 bg-teal-500/15 text-teal-100'
              if (isAnswered && index === confirmedAnswer && index !== currentStep.correctIndex) optionClass = 'border border-amber-400/40 bg-amber-500/15 text-amber-100'
              if (isAnswered && index === currentStep.correctIndex) optionClass = 'border border-teal-400/25 bg-teal-500/8 text-teal-100'

              return (
                <button
                  key={`${clinicalCase.id}-${stepAnswers.length}-${option}`}
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
                persistProgress(clinicalCase, {
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
                  if (currentStepIndex >= totalSteps - 1) {
                    persistProgress(clinicalCase, {
                      status: 'completed',
                      currentStepIndex: totalSteps,
                      stepAnswers,
                      score,
                    })
                    markCaseReviewed(clinicalCase.title, profile.id)
                    return
                  }
                  persistProgress(clinicalCase, {
                    status: 'in_progress',
                    currentStepIndex: currentStepIndex + 1,
                    stepAnswers,
                    score,
                  })
                }}
                className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-bold text-white transition hover:border-teal-500/40"
              >
                {currentStepIndex >= totalSteps - 1 ? 'Ver resultado do caso' : 'Próxima etapa'}
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

    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Queixa + história</p>
          <p className="mt-1 text-sm text-slate-200">{clinicalCase.chiefComplaint}</p>
          <p className="mt-2 text-xs text-slate-400">{clinicalCase.history}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Exame físico</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            {clinicalCase.physicalExam.map(item => <li key={item}>• {item}</li>)}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Achados laboratoriais</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            {clinicalCase.labFindings.map(item => <li key={item}>• {item}</li>)}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pergunta clínica</p>
          <p className="mt-1 text-sm font-bold text-white">{clinicalCase.clinicalQuestion}</p>
        </div>

        {!selfEvaluation ? (
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-sm font-bold text-white">📋 Leia o caso acima, forme um diagnóstico e só então marque:</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSelfEvaluationByCase(current => ({ ...current, [clinicalCase.id]: 'acertei' }))}
                className="min-h-[44px] w-full rounded-xl border border-teal-500/25 bg-teal-500/10 px-3 py-2 text-sm font-bold text-teal-200"
              >
                Acertei
              </button>
              <button
                type="button"
                onClick={() => setSelfEvaluationByCase(current => ({ ...current, [clinicalCase.id]: 'errei' }))}
                className="min-h-[44px] w-full rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm font-bold text-amber-200"
              >
                Errei
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <button
              type="button"
              onClick={() => {
                setShowFallbackResolutionByCase(current => ({ ...current, [clinicalCase.id]: true }))
                markCaseReviewed(clinicalCase.title, profile.id)
                persistProgress(clinicalCase, {
                  status: 'completed',
                  revealed: true,
                  selfEvaluation,
                })
              }}
              className="min-h-[44px] w-full rounded-xl bg-fuchsia-500/90 px-3 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-400"
            >
              Mostrar resolução
            </button>

            {showResolution && (
              <div className="space-y-3 rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
                <p className="text-sm font-bold text-white">{selfEvaluation === 'errei' ? 'Boa — esse é o momento que mais gera aprendizado.' : 'Perfeito. Confirme seu raciocínio abaixo.'}</p>
                <p className="text-xs text-slate-300"><span className="font-bold text-teal-300">Diagnóstico:</span> {clinicalCase.diagnosis}</p>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-300">Conduta</p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-200">
                    {ensureList(clinicalCase.conduct).map(item => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-200">Por que isso importa?</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-200">{clinicalCase.reasoning}</p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {relatedDiseaseId && (
                    <button
                      type="button"
                      onClick={() => onOpenDisease?.(relatedDiseaseId)}
                      className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-bold text-white transition hover:border-teal-500/40"
                    >
                      Ver doença relacionada
                    </button>
                  )}
                  {nextCaseId && (
                    <button
                      type="button"
                      onClick={() => setSelectedCaseId(nextCaseId)}
                      className="min-h-[44px] w-full rounded-xl bg-fuchsia-500/90 px-3 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-400"
                    >
                      Próximo caso
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => resetCase(clinicalCase)}
                    className="min-h-[44px] w-full rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 transition hover:text-slate-200"
                  >
                    Refazer caso
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <Stethoscope size={22} className="text-fuchsia-400" />
          <h1 className="text-2xl font-bold text-white">🧠 Casos Clínicos</h1>
        </div>
        <p className="text-sm text-slate-400">Treino guiado de raciocínio clínico com foco em decisão prática.</p>
      </div>

      {selectedCase ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedCaseId(null)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-fuchsia-500/30"
          >
            <ArrowLeft size={15} /> Voltar aos casos
          </button>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold text-white">{selectedCase.title}</p>
              <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
                {selectedCase.speciesEmoji} {selectedCase.species}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
                {difficultyLabel(selectedCase.difficulty)}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
                {selectedCase.estimatedTime}
              </span>
            </div>
          </div>

          {selectedCase.steps?.length ? renderStepCase(selectedCase) : renderFallbackCase(selectedCase)}
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { id: 'todas' as const, label: 'Todas' },
              { id: 'cao' as const, label: 'Cão' },
              { id: 'bovino' as const, label: 'Bovino' },
              { id: 'nao_iniciados' as const, label: 'Não iniciados' },
              { id: 'concluidos' as const, label: 'Concluídos' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCaseFilter(item.id)}
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  caseFilter === item.id
                    ? 'border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-200'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            {filteredCases.map(clinicalCase => (
              <CaseListCard
                key={clinicalCase.id}
                clinicalCase={clinicalCase}
                progress={progressFor(clinicalCase)}
                reviewedCases={reviewedCases}
                onOpen={() => setSelectedCaseId(clinicalCase.id)}
                onReset={() => resetCase(clinicalCase)}
              />
            ))}
          </div>
        </>
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
    const active = getActiveProfile()
    setProfile(active)
    if (active) migrateLegacyProfileData(active.id)
  }, [])

  const handleProfileSelect = (nextProfile: LocalProfile) => {
    setActiveProfile(nextProfile.id)
    migrateLegacyProfileData(nextProfile.id)
    setProfile(nextProfile)
  }

  if (!profile) {
    return (
      <Gatekeeper pageTitle="Casos">
        <div className="mx-auto max-w-3xl p-4 sm:p-6 md:p-8">
          <p className="mb-4 text-sm text-slate-400">
            Seus estudos são salvos por perfil. Escolha ou crie um para continuar.
          </p>
          <ProfileSelector onSelect={handleProfileSelect} />
        </div>
      </Gatekeeper>
    )
  }

  return (
    <Gatekeeper pageTitle="Casos">
      <CasosContent profile={profile} selectionToken={selectionToken} onOpenDisease={onOpenDisease} />
    </Gatekeeper>
  )
}
