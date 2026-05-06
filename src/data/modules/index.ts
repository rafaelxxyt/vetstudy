import aieModule from './aie_module.json'
import bruceloseModule from './brucelose_module.json'
import bovineReproductiveDiseasesModule from './clinica-ruminantes/bovine_reproductive_diseases_module.json'
import erliquioseAnaplasmoseModule from './erliquiose_anaplasmose_module.json'
import mormoModule from './mormo_module.json'
import sanidadeAnimalConceitualModule from './sanidade_animal_conceitual_module.json'
import estralCycleModule from './reproducao-animal/estral_cycle_module.json'
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
  estralCycleModule as StructuredStudyModule,
  erliquioseAnaplasmoseModule as StructuredStudyModule,
  mormoModule as StructuredStudyModule,
  sanidadeAnimalConceitualModule as StructuredStudyModule,
]

export {
  aieModule,
  bruceloseModule,
  bovineReproductiveDiseasesModule,
  erliquioseAnaplasmoseModule,
  mormoModule,
  sanidadeAnimalConceitualModule,
  estralCycleModule,
  tuberculoseModule,
}
