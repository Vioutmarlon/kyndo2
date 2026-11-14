# Contribuindo — Kyndo Order

Este documento define o fluxo obrigatório de trabalho para **todos os agentes e modelos** que atuam neste projeto. Siga estas regras sem exceção.

## Fluxo Obrigatório: Issue → Branch → PR

Toda tarefa (correção, melhoria ou nova funcionalidade) **deve** seguir este fluxo:

### 1. Criar uma Issue antes de codar
- Toda tarefa começa com uma **Issue no GitHub**.
- Use labels adequadas: `bug`, `enhancement`, `feature`, `security`, `design`, `docs`.
- A Issue deve conter: descrição clara do problema/tarefa, critérios de aceitação e contexto relevante.
- **Nunca comece a codar sem uma Issue associada.**

### 2. Criar uma branch a partir da Issue
- Nome da branch: `<tipo>/<numero-issue>-descricao-curta`
  - Exemplos: `fix/42-corrigir-contraste-dashboard`, `feat/15-adicionar-relatorios`, `chore/8-atualizar-dependencias`
- Sempre crie a branch a partir da `main` (ou `master`) atualizada.

### 3. Desenvolver e commitar
- Commits devem ser atômicos e descritivos.
- Use o padrão Conventional Commits:
  - `feat: adiciona dashboard de métricas (#42)`
  - `fix: corrige contraste dos cards no admin (#42)`
  - `docs: atualiza CONTRIBUTING.md com fluxo de PRs`
- **Sempre referencie o número da Issue no commit.**

### 4. Abrir um Pull Request (PR)
- Todo deploy passa por um **PR revisável**.
- A descrição do PR **deve** conter:
  - `Closes #<numero>` ou `Fixes #<numero>` (para fechar a Issue automaticamente ao mergear)
  - Resumo das alterações
  - Como testar / validar
  - Screenshots quando houver mudança visual
- **Nunca faça push direto na main/master.**

### 5. Revisão e Merge
- O PR deve ser revisado antes do merge.
- Após aprovação, use **Squash and Merge** para manter o histórico limpo.
- A Issue é fechada automaticamente pelo GitHub via keyword no PR.

## Regras para Agentes de IA

- **Antes de implementar qualquer coisa:** verifique se existe uma Issue aberta. Se não existir, crie uma primeiro.
- **Mencione a Issue** em todos os commits e na descrição do PR.
- **Não modifique** este arquivo (`CONTRIBUTING.md`) sem abrir uma Issue e PR específicos para isso.
- **Não altere** regras de negócio, autenticação, banco de dados ou rotas sem autorização explícita na Issue.
- **Preserve** as marcas dos restaurantes clientes — a identidade Kyndo Order aplica-se apenas à plataforma administrativa e institucional.
- **Teste** suas alterações antes de abrir o PR. Inclua evidências (screenshots, logs, resultados de testes) na descrição.

## Estrutura de Labels

| Label | Uso |
|-------|-----|
| `bug` | Correção de comportamento incorreto |
| `enhancement` | Melhoria em funcionalidade existente |
| `feature` | Nova funcionalidade |
| `security` | Correção ou melhoria de segurança |
| `design` | Alterações visuais / identidade Kyndo Order |
| `docs` | Documentação |
| `refactor` | Refatoração sem mudança de comportamento |
| `deps` | Atualização de dependências |
| `ci` | CI/CD, deploy, automação |

## Identidade Visual

Todas as mudanças de UI devem seguir o [KYNDO_DESIGN_SYSTEM.md](./KYNDO_DESIGN_SYSTEM.md). Consulte-o antes de alterar cores, tipografia, componentes ou layout.

---

*Este fluxo é obrigatório para todos os contribuidores humanos e agentes de IA.*