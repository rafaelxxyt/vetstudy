import aieModule from './aie_module.json'
import bruceloseModule from './brucelose_module.json'
import bovineReproductiveDiseasesModule from './clinica-ruminantes/bovine_reproductive_diseases_module.json'
import tuberculoseModule from './tuberculose_module.json'
import type { StructuredStudyModule } from './types'

export * from './types'
export * from './validation'
export * from './pipeline'

export const staticStudyModules: StructuredStudyModule[] = [
  bruceloseModule as StructuredStudyModule,
  tuberculoseModule as StructuredStudyModule,
  bovineReproductiveDiseasesModule as StructuredStudyModule,
  aieModule as StructuredStudyModule,
]

export { aieModule, bruceloseModule, bovineReproductiveDiseasesModule, tuberculoseModule }
