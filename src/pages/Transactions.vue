<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import { useSpacesStore } from '@/stores/spaces'
import { useTransactionsStore } from '@/stores/transactions'
import { formatCurrency, formatSignedCurrency } from '@/utils/format'

type FormMode = 'deposit' | 'withdraw'

const spacesStore = useSpacesStore()
const transactionsStore = useTransactionsStore()

const showForm = ref(false)
const formMode = ref<FormMode>('deposit')
const formError = ref('')
const formSuccess = ref('')
const form = reactive({
  spaceId: '',
  amount: '',
  note: '',
})

const selectableSpaces = computed(() =>
  spacesStore.spaces.filter((space) => Boolean(space.id)),
)

const selectedSpace = computed(() =>
  selectableSpaces.value.find((space) => space.id === form.spaceId) || null,
)

const formTitle = computed(() =>
  formMode.value === 'deposit' ? 'Add deposit' : 'Withdraw funds',
)

const submitLabel = computed(() =>
  formMode.value === 'deposit' ? 'Add Deposit' : 'Withdraw',
)

async function openForm(mode: FormMode) {
  formMode.value = mode
  formError.value = ''
  formSuccess.value = ''
  form.amount = ''
  form.note = ''
  await spacesStore.fetchSpaces()

  if (!selectableSpaces.value.length) {
    formError.value = 'No savings spaces yet. Create a space first.'
    showForm.value = true
    form.spaceId = ''
    return
  }

  showForm.value = true
  form.spaceId = String(selectableSpaces.value[0]?.id || '')
}

function closeForm() {
  showForm.value = false
  form.amount = ''
  form.note = ''
  formError.value = ''
}

async function submitTransaction() {
  formError.value = ''
  formSuccess.value = ''

  const spaceId = String(form.spaceId || '')
  const amount = Number(form.amount)

  if (!spaceId) {
    formError.value = 'Select a savings space.'
    return
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    formError.value = 'Enter a valid amount.'
    return
  }

  if (formMode.value === 'withdraw') {
    const balance = selectedSpace.value?.balance ?? 0
    if (amount > balance) {
      formError.value = `Insufficient balance. Available: ${formatCurrency(balance)}.`
      return
    }
  }

  try {
    if (formMode.value === 'deposit') {
      await transactionsStore.addDeposit({
        spaceId,
        amount,
        note: form.note,
      })
      formSuccess.value = 'Deposit added successfully.'
    } else {
      await transactionsStore.addWithdraw({
        spaceId,
        amount,
        note: form.note,
      })
      formSuccess.value = 'Withdrawal completed successfully.'
    }
    await spacesStore.fetchSpaces()
    closeForm()
  } catch (error) {
    formError.value =
      error instanceof Error
        ? error.message
        : formMode.value === 'deposit'
          ? 'Unable to add deposit.'
          : 'Unable to withdraw funds.'
  }
}

onMounted(async () => {
  await Promise.all([spacesStore.fetchSpaces(), transactionsStore.fetchTransactions()])
  if (selectableSpaces.value.length) {
    form.spaceId = String(selectableSpaces.value[0]?.id || '')
  }
})
</script>

<template>
  <main class="page">
    <header class="page__header">
      <div>
        <h1>Transactions</h1>
        <p>Track deposits and withdrawals across your savings spaces.</p>
      </div>
      <div class="page__actions">
        <button type="button" class="btn btn--ghost" @click="openForm('withdraw')">
          Withdraw
        </button>
        <button type="button" class="btn" @click="openForm('deposit')">Add Deposit</button>
      </div>
    </header>

    <section v-if="showForm" class="form-panel">
      <h2>{{ formTitle }}</h2>
      <p v-if="selectedSpace" class="form-panel__hint">
        Available balance: {{ formatCurrency(selectedSpace.balance) }}
      </p>
      <p v-if="formError" class="alert alert--error" role="alert">{{ formError }}</p>
      <form class="form" @submit.prevent="submitTransaction">
        <label>
          Savings space
          <select v-model="form.spaceId" :disabled="!selectableSpaces.length">
            <option
              v-for="space in selectableSpaces"
              :key="space.id"
              :value="String(space.id)"
            >
              {{ space.name }}
            </option>
          </select>
        </label>
        <label>
          Amount
          <input
            v-model="form.amount"
            type="number"
            min="1"
            step="0.01"
            :placeholder="formMode === 'deposit' ? '500' : '100'"
          />
        </label>
        <label>
          Note (optional)
          <input
            v-model="form.note"
            type="text"
            :placeholder="formMode === 'deposit' ? 'First deposit' : 'Emergency use'"
          />
        </label>
        <div class="form__actions">
          <button type="button" class="btn btn--ghost" @click="closeForm">Cancel</button>
          <button
            type="submit"
            class="btn"
            :class="{ 'btn--danger': formMode === 'withdraw' }"
            :disabled="transactionsStore.isSaving"
          >
            {{ transactionsStore.isSaving ? 'Saving…' : submitLabel }}
          </button>
        </div>
      </form>
    </section>

    <p v-if="formSuccess" class="alert alert--success" role="status">{{ formSuccess }}</p>
    <p v-if="transactionsStore.error && !showForm" class="alert alert--error" role="alert">
      {{ transactionsStore.error }}
    </p>

    <EmptyState
      v-if="!transactionsStore.transactions.length"
      title="No transactions yet"
      message="When you add deposits or withdrawals, they will appear in this list."
    />

    <section v-else class="panel">
      <div class="table">
        <div class="table__head">
          <span>Date</span>
          <span>Space</span>
          <span>Type</span>
          <span>Note</span>
          <span>Amount</span>
        </div>
        <div v-for="tx in transactionsStore.transactions" :key="tx.id" class="table__row">
          <span>{{ tx.date }}</span>
          <span>{{ tx.spaceName }}</span>
          <span>{{ tx.type === 'credit' ? 'Deposit' : 'Withdraw' }}</span>
          <span>{{ tx.note || '—' }}</span>
          <span :class="tx.type === 'credit' ? 'credit' : 'debit'">
            {{ formatSignedCurrency(tx.amount, tx.type) }}
          </span>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  --ss-ink: #10231c;
  --ss-muted: #4d6359;
  --ss-accent: #0f7a5a;
  --ss-accent-deep: #0a5c44;
  --ss-line: rgba(16, 35, 28, 0.1);
  --ss-surface: #fffdf9;

  padding: 1.25rem;
  display: grid;
  gap: 1.15rem;
  color: var(--ss-ink);
  font-family: 'Manrope', sans-serif;
  animation: rise 420ms ease-out;
}

.page__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: end;
}

.page__actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.page__header h1 {
  margin: 0 0 0.3rem;
  font-family: 'Fraunces', serif;
  font-size: clamp(1.45rem, 3vw, 1.85rem);
}

.page__header p {
  margin: 0;
  color: var(--ss-muted);
}

.btn {
  border: 0;
  border-radius: 0.75rem;
  padding: 0.7rem 1rem;
  background: linear-gradient(135deg, var(--ss-accent), var(--ss-accent-deep));
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn--ghost {
  background: transparent;
  color: var(--ss-ink);
  border: 1px solid var(--ss-line);
}

.btn--danger {
  background: linear-gradient(135deg, #c2410c, #9a3412);
}

.form-panel {
  border: 1px solid var(--ss-line);
  border-radius: 1rem;
  background: var(--ss-surface);
  padding: 1.15rem;
  max-width: 28rem;
}

.form-panel h2 {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
}

.form-panel__hint {
  margin: 0 0 0.9rem;
  color: var(--ss-muted);
  font-size: 0.88rem;
}

.form {
  display: grid;
  gap: 0.85rem;
}

.form label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.88rem;
  font-weight: 600;
}

.form input,
.form select {
  border: 1px solid var(--ss-line);
  border-radius: 0.7rem;
  padding: 0.75rem 0.85rem;
  font: inherit;
  background: #fff;
}

.form__actions {
  display: flex;
  gap: 0.6rem;
  justify-content: end;
  flex-wrap: wrap;
}

.alert {
  margin: 0;
  border-radius: 0.7rem;
  padding: 0.75rem 0.9rem;
  font-size: 0.9rem;
}

.alert--error {
  background: rgba(176, 42, 55, 0.1);
  color: #8f1f2b;
}

.alert--success {
  background: rgba(15, 122, 90, 0.12);
  color: var(--ss-accent-deep);
}

.panel {
  border: 1px solid var(--ss-line);
  border-radius: 1rem;
  background: var(--ss-surface);
  overflow: auto;
}

.table {
  min-width: 42rem;
}

.table__head,
.table__row {
  display: grid;
  grid-template-columns: 1.1fr 1.3fr 0.9fr 1fr 1fr;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
}

.table__head {
  border-bottom: 1px solid var(--ss-line);
  color: var(--ss-muted);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.table__row {
  border-bottom: 1px solid var(--ss-line);
  font-weight: 500;
}

.table__row:last-child {
  border-bottom: 0;
}

.credit {
  color: var(--ss-accent-deep);
  font-weight: 700;
}

.debit {
  color: #b42318;
  font-weight: 700;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
