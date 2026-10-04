# Arquitetura do MVP

O núcleo controla o workflow; agentes apenas produzem artefatos estruturados. Essa separação evita que uma resposta de modelo pule permissões ou marque uma tarefa como concluída sem evidência.

## Componentes

- `workflow.ts`: estados, transições, gates e políticas de correção.
- `store.ts`: persistência local, eventos e estruturas de tarefa.
- `templates.ts`: artefatos rastreáveis por papel.
- `roles.ts`: catálogo de papéis e ferramentas permitidas.
- `cli.ts`: interface operacional.

Os futuros adaptadores devem implementar contratos equivalentes a `AgentRuntime`, `RepositoryAdapter` e `CommandRunner`; eles não devem alterar o estado diretamente.

## Segurança

O MVP não executa comandos arbitrários, não chama modelos e não integra GitHub/CI. O runtime que vier depois deverá aplicar menor privilégio: escrita de produção para o Engenheiro, escrita de testes para QA, e leitura para os demais papéis.
