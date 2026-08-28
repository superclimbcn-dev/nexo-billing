# Estado da implementação fiscal

Última atualização: 2026-08-28

Este documento é a fonte de continuidade para a evolução fiscal de Gastos e
Impuestos. Ele registra o estado validado do código, decisões que não devem ser
revertidas sem revisão e os passos seguros para retomar o trabalho.

## Estado atual

- Branch: `feat/expense-fiscal-details`
- Base inicial: `dcd2b042103fca817634accc2762c418c3f6198c`
- Publicação autorizada: não

## Fase 1 — Gastos

Status: **CONCLUÍDA / VALIDADA / COMMITADA**

```text
d86a2181b2531777b85d614a75a6fbeed96a79c2
feat(expenses): add fiscal breakdown for expenses
```

Entregas principais:

- decomposição consistente entre total, base tributável e IVA;
- suporte a IVA de 0%, 4%, 10% e 21%;
- cálculo monetário executado no servidor;
- persistência do detalhamento em `ExpenseLine`;
- identificação documental por `externalNumber`;
- tratamento explícito por `vatDeductiblePercent` e
  `irpfDeductiblePercent`;
- compatibilidade segura com gastos legados, sem inventar dedutibilidade;
- migration `20260827170000_add_expense_deductible_percentages` criada, mas
  **NÃO executada**.

## Fase 2 — Impuestos

Status: **CONCLUÍDA / VALIDADA / COMMITADA**

```text
e9ef6bf287ba64f7ca4aee3718d3770ae74abb48
feat(taxes): centralize quarterly fiscal calculations
```

Entregas principais:

- `calculateFiscalPeriod()` é a fonte única das fórmulas fiscais novas;
- o servidor permanece como autoridade dos cálculos e a UI apenas apresenta os
  resultados;
- Modelo 303 usa o IVA efetivamente dedutível;
- IVA suportado, dedutível e não dedutível são valores separados;
- percentuais de 0%, 50%, 100% e `null` possuem tratamento explícito;
- `null` significa tratamento fiscal desconhecido e nunca é convertido
  implicitamente em 100%;
- Modelo 130 é acumulado desde janeiro até o fim do trimestre selecionado;
- gastos do Modelo 130 respeitam `irpfDeductiblePercent`;
- IRPF teórico é limitado a zero quando o rendimento líquido acumulado é
  negativo;
- pagamentos anteriores desconhecidos permanecem `null`;
- retenções desconhecidas permanecem `null`;
- resultado periódico confiável do Modelo 130 permanece `null` enquanto esses
  dados forem desconhecidos;
- warnings estruturados identificam tratamentos ausentes ou inválidos;
- audit trail registra documentos incluídos e ignorados, com seus motivos;
- gastos cancelados não entram nos Modelos 303 ou 130;
- isolamento por tenant existe tanto nas queries quanto na calculadora;
- vencimento do Q4 corrigido para 30 de janeiro do ano seguinte;
- testes fiscais: **17/17 passando**;
- TypeScript: **passando**;
- Next build direto: **passando**.

## Decisões que NÃO devem ser revertidas sem revisão

1. Não assumir gasto legado como fiscalmente dedutível.
2. `null` significa tratamento fiscal desconhecido.
3. Nunca assumir `vatDeductiblePercent = 100` quando estiver `null`.
4. Nunca assumir `irpfDeductiblePercent = 100` quando estiver `null`.
5. Fórmulas fiscais devem permanecer centralizadas.
6. A UI não deve recalcular impostos independentemente.
7. O servidor é a autoridade dos cálculos.
8. Não inventar retenções.
9. Não inventar pagamentos anteriores do Modelo 130.
10. Não apresentar IRPF teórico acumulado como valor definitivo “a pagar”.
11. Preservar isolamento por tenant na query e na calculadora.
12. Não modificar gastos legados automaticamente.

## Limitações conhecidas

- pagamentos anteriores do Modelo 130 ainda não estão modelados;
- retenções ainda não estão modeladas;
- IVA não dedutível ainda não é incorporado automaticamente ao tratamento de
  IRPF;
- facturas rectificativas precisam de estudo posterior;
- testes fiscais ainda não estão integrados ao runner global;
- lint global possui configuração pré-existente pendente;
- testes Verifactu possuem falhas pré-existentes;
- o script oficial de build possui um problema Prisma já diagnosticado; o Next
  build direto está validado;
- `theoreticalAccruedTax` e `estimateBeforeAdjustments` mantêm hoje o mesmo
  valor. Essa duplicação é dívida técnica registrada e não deve ser removida sem
  revisão de compatibilidade e UI.

## Pendência de Tesorería

Tesorería permanece **runtime-safe**.

`getQuarterlyTaxEstimate()` utiliza somente o valor conhecido do Modelo 303,
porque o resultado periódico confiável do Modelo 130 ainda não pode ser
calculado. Não existe soma de Modelo 303 com `null`.

O KPI/label atual de Tesorería pode induzir o usuário a interpretar o valor como
o total de impostos, embora ele represente somente o Modelo 303.

Antes de qualquer deploy:

- revisar esse KPI;
- ajustar seu label ou explicação de forma mínima;
- não inventar um valor para o Modelo 130.

## Estado de produção

```text
PUSH: NÃO
DEPLOY: NÃO
MIGRATION PRODUÇÃO: NÃO
```

A migration da Fase 1 ainda deve ser aplicada no ambiente apropriado antes de
publicar código que dependa das novas colunas. Não publicar esta branch no estado
atual.

## Próximo passo autorizado

```text
MICROFASE DE INTEGRAÇÃO:
Revisar Tesorería e preparar uma publicação segura.
```

Não iniciar essa microfase automaticamente.

Depois:

```text
FASE 3:
Auditabilidade visual + relatório fiscal trimestral.
```

Posteriormente:

```text
FASE 4:
Exportação compatível com AEAT / estudo de integração de apresentação.
```

Nenhuma dessas fases foi iniciada durante os checkpoints descritos aqui.

## Se outro agente assumir este projeto

### Recovery Checklist

1. Ler este documento inteiro.
2. Executar `git status`.
3. Confirmar a branch atual.
4. Executar `git log --oneline -5`.
5. Confirmar o último checkpoint concluído.
6. Não executar migration automaticamente.
7. Não fazer push ou deploy automaticamente.
8. Continuar somente a partir de “Próximo passo autorizado”.
9. Preservar as decisões arquiteturais registradas acima.
10. Antes de modificar código fiscal, executar os testes de
    `fiscal-calculation`.
