# Static Study Module Template

Use [static_study_module.template.json](</C:/Users/rafaeu/Documents/Claudinho/vetstudy/src/data/modules/_template/static_study_module.template.json>) as the base for any new VetStudy module.

## Como escolher `disciplina`

Use o nome canônico já aceito pelo app para evitar fragmentação nos filtros:

- `Reprodução Animal`
- `Clínica de Ruminantes`
- `Clínica de Pequenos`
- `Farmacologia Veterinária`
- `Anatomia Reprodutiva`

## Como escolher `tema` e `subtema`

- `tema`: deve seguir o nome canônico da disciplina ou do agrupamento já usado no banco.
- `subtema`: é a menor unidade de estudo que aparece no breadcrumb da questão.
- Regra prática: se duas questões cairiam sob o mesmo cartão mental do aluno, provavelmente pertencem ao mesmo `subtema`.

## Como evitar IDs duplicados

- Flashcards: use prefixos exclusivos por módulo, por exemplo `fc_iatf_0001`.
- Questões: use uma faixa numérica nova que ainda não exista no projeto.
- Antes de criar um módulo novo, confira os IDs já usados nos arquivos de `src/data/modules/` e no banco base.

## Como manter qualidade consistente

- Evite mais de 3 questões por conceito nuclear.
- Use alternativas plausíveis, sem distratores óbvios.
- Faça flashcards com função, mecanismo ou consequência, e não cópia literal de slide.
- Toda questão deve ter `explicacao` instrutiva.
- Tente calibrar dificuldade em torno de 30% fácil, 50% média e 20% difícil.
