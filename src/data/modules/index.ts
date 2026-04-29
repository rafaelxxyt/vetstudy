import bruceloseModule from './brucelose_module.json'
import type { StructuredStudyModule } from './types'

export * from './types'
export * from './validation'
export * from './pipeline'

export const staticStudyModules: StructuredStudyModule[] = [
  bruceloseModule as StructuredStudyModule,
]

export { bruceloseModule }
