# Software Agent Orchestrator

CLI e núcleo determinístico para coordenar agentes de desenvolvimento de software. O runtime de IA é substituível: o projeto persiste estado, artefatos, evidências e gates, sem acoplamento a uma linguagem de produto, IDE ou fornecedor de LLM.

## Workflow obrigatório

`Product Owner Agent → Analista → Arquiteto → Red Team → Conselho → Engenheiro → QA → Aceite do Product Owner Agent → Revisor final`

O Product Owner Agent é obrigatório na entrada e no aceite pós-QA. Se as fontes forem insuficientes ou conflitantes, a tarefa é bloqueada em vez de prosseguir por inferência.

## MVP entregue

- Máquina de estados com transições explícitas e gates por fase.
- Persistência por tarefa em `docs/agent-workflow/tasks/<id>/`.
- Artefatos Markdown versionáveis e `state.json` como fonte de verdade.
- Validação de artefatos obrigatórios antes de avançar.
- Limite de dois ciclos de correção antes de `blocked`.
- Perfis de papel e permissões declarativas para futuros adaptadores.
- CLI sem dependência de runtime de agentes.

## Uso

```bash
npm install
npm run build

# Inicializa a estrutura no repositório de destino
node dist/cli.js init /caminho/do-repositorio

# Cria uma tarefa em product_discovery
node dist/cli.js new-task ORQ-001 "Persistir workflow de agentes" /caminho/do-repositorio

# Acompanha e valida gates
node dist/cli.js status ORQ-001 /caminho/do-repositorio
node dist/cli.js validate ORQ-001 /caminho/do-repositorio

# Avança somente quando os artefatos requeridos existirem
node dist/cli.js transition ORQ-001 analysing /caminho/do-repositorio
```

Para uma transição de qualidade reprovada use `transition <id> correcting`; depois use `transition <id> implementing`. Ao exceder dois ciclos, o núcleo move a tarefa para `blocked`.

## Próximos passos

1. Adaptador do primeiro runtime de agentes, com saída estruturada.
2. Integração de Git/CI e evidências de testes reais.
3. Políticas de risco para segurança, UX, dados, plataforma e SRE.
4. Retomada durável, filas e worktrees controlados.

Consulte `docs/architecture.md` para decisões e limites do MVP.
