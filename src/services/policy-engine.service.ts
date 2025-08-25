// src/services/policy-engine.service.ts

import { Expense, LocalType, MealType } from '@prisma/client'

// Usamos um tipo mais específico para garantir que os campos que precisamos existam
type ExpenseInput = {
  tipo?: Expense['tipo'] | null
  valorGasto?: Expense['valorGasto'] | null
  contemItensProibidos?: Expense['contemItensProibidos'] | null
  mealType?: MealType | null
  foraDoMunicipio?: Expense['foraDoMunicipio'] | null
  local?: LocalType | null
  diarias?: Expense['diarias'] | null
}

export class PolicyEngineService {
  public calculateConsideredValue(
    expense: ExpenseInput,
  ): { valorConsiderado: number; policyNotes: string | null } {
    const valorGasto = expense.valorGasto ?? 0

    switch (expense.tipo) {
      case 'ALIMENTACAO':
        return this._calculateAlimentacao(expense)
      case 'HOSPEDAGEM':
        return this._calculateHospedagem(expense)
      default:
        return { valorConsiderado: valorGasto, policyNotes: 'Reembolso integral.' }
    }
  }

  private _calculateAlimentacao(
    expense: ExpenseInput,
  ): { valorConsiderado: number; policyNotes: string | null } {
    if (expense.contemItensProibidos) {
      return { valorConsiderado: 0, policyNotes: 'Contém itens não reembolsáveis.' }
    }
    if (expense.mealType === 'CAFE' && !expense.foraDoMunicipio) {
      return { valorConsiderado: 0, policyNotes: 'Café da manhã só é reembolsável fora do município de origem.' }
    }

    const limitePorRefeicao = expense.local === 'CAPITAL' ? 60.00 : 40.00
    const valorGasto = expense.valorGasto ?? 0
    const valorConsiderado = Math.min(valorGasto, limitePorRefeicao)

    let policyNotes = `Limite de R$ ${limitePorRefeicao.toFixed(2)} aplicado.`
    if (valorConsiderado === valorGasto) {
      policyNotes = 'Reembolso integral dentro do limite da política.'
    }

    return { valorConsiderado, policyNotes }
  }

  private _calculateHospedagem(
    expense: ExpenseInput,
  ): { valorConsiderado: number; policyNotes: string | null } {
    const tetoDiaria = 200.00
    const diarias = expense.diarias || 1
    const limiteTotal = tetoDiaria * diarias
    const valorGasto = expense.valorGasto ?? 0
    const valorConsiderado = Math.min(valorGasto, limiteTotal)

    let policyNotes = `Limite de R$ ${limiteTotal.toFixed(2)} (${diarias} diária(s)) aplicado.`
    if (valorConsiderado === valorGasto) {
      policyNotes = 'Reembolso integral dentro do limite da política.'
    }

    return { valorConsiderado, policyNotes }
  }
}