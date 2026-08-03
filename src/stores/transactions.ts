import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Transaction, TransactionType } from '@/types'
import { apiFetch } from '@/utils/api'

function mapTransaction(raw: Record<string, unknown>): Transaction {
  const typeRaw = String(raw.type ?? raw.transaction_type ?? 'credit').toLowerCase()
  const type: TransactionType = ['debit', 'withdrawal', 'withdraw'].includes(typeRaw)
    ? 'debit'
    : 'credit'

  const space =
    raw.space && typeof raw.space === 'object'
      ? (raw.space as Record<string, unknown>)
      : null

  return {
    id: String(raw.id ?? raw.transaction_id ?? ''),
    spaceId: String(raw.space_id ?? raw.spaceId ?? space?.space_id ?? space?.id ?? ''),
    spaceName: String(raw.space_name ?? raw.spaceName ?? space?.name ?? 'Space'),
    amount: Number(raw.amount ?? 0),
    type,
    note: String(raw.note ?? raw.description ?? ''),
    date: String(raw.occurred_at ?? raw.date ?? raw.created_at ?? ''),
  }
}

export const useTransactionsStore = defineStore('transactions', () => {
  const transactions = ref<Transaction[]>([])
  const apiTotalDeposits = ref(0)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')

  const recentTransactions = computed(() => transactions.value.slice(0, 5))
  const totalDeposits = computed(() => apiTotalDeposits.value)

  async function fetchTransactions() {
    isLoading.value = true
    error.value = ''
    try {
      const response = await apiFetch('/api/transactions')
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to load transactions.')
      }

      const data = payload?.data ?? {}
      const list = Array.isArray(data.recent_transactions)
        ? data.recent_transactions
        : Array.isArray(data.transactions)
          ? data.transactions
          : []

      transactions.value = list.map((item: Record<string, unknown>) => mapTransaction(item))
      apiTotalDeposits.value = Number(data.total_deposits ?? 0)
    } catch {
      error.value = 'Unable to load transactions.'
      transactions.value = []
      apiTotalDeposits.value = 0
    } finally {
      isLoading.value = false
    }
  }

  async function addDeposit(payload: { spaceId: string; amount: number; note?: string }) {
    isSaving.value = true
    error.value = ''
    try {
      const response = await apiFetch('/api/transactions/deposit', {
        method: 'POST',
        body: JSON.stringify({
          space_id: Number(payload.spaceId),
          amount: payload.amount,
          note: payload.note?.trim() || undefined,
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to add deposit.')
      }

      await fetchTransactions()
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to add deposit.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function addWithdraw(payload: { spaceId: string; amount: number; note?: string }) {
    isSaving.value = true
    error.value = ''
    try {
      const response = await apiFetch('/api/transactions/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          space_id: Number(payload.spaceId),
          amount: payload.amount,
          note: payload.note?.trim() || undefined,
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to withdraw funds.')
      }

      await fetchTransactions()
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to withdraw funds.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  function clear() {
    transactions.value = []
    apiTotalDeposits.value = 0
    error.value = ''
  }

  return {
    transactions,
    isLoading,
    isSaving,
    error,
    recentTransactions,
    totalDeposits,
    fetchTransactions,
    addDeposit,
    addWithdraw,
    clear,
  }
})
