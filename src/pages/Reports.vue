<script setup lang="ts">
import { computed, onMounted } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import { useSpacesStore } from '@/stores/spaces'
import { useTransactionsStore } from '@/stores/transactions'
import { formatCurrency } from '@/utils/format'

const spacesStore = useSpacesStore()
const transactionsStore = useTransactionsStore()

const summary = computed(() => [
  { label: 'This Month Saved', value: formatCurrency(transactionsStore.totalDeposits) },
  {
    label: 'Average Weekly Deposit',
    value: formatCurrency(
      transactionsStore.transactions.length
        ? Math.round(transactionsStore.totalDeposits / Math.max(transactionsStore.transactions.length, 1))
        : 0,
    ),
  },
  { label: 'Active Goals', value: String(spacesStore.spaces.length) },
  {
    label: 'Shared Contributions',
    value: formatCurrency(
      spacesStore.sharedSpaces.reduce((sum, space) => sum + space.balance, 0),
    ),
  },
])

const breakdown = computed(() => {
  const total = spacesStore.totalBalance || 1
  return spacesStore.spaces.map((space) => ({
    name: space.name,
    amount: formatCurrency(space.balance),
    share: Math.round((space.balance / total) * 100),
  }))
})

onMounted(async () => {
  await Promise.all([spacesStore.fetchSpaces(), transactionsStore.fetchTransactions()])
})
</script>

<template>
  <main class="page">
    <header class="page__header">
      <div>
        <h1>Reports</h1>
        <p>Review savings performance and contribution trends.</p>
      </div>
      <button type="button" class="btn" :disabled="!spacesStore.spaces.length">Export Report</button>
    </header>

    <section class="stats">
      <article v-for="item in summary" :key="item.label" class="stat">
        <p>{{ item.label }}</p>
        <h2>{{ item.value }}</h2>
      </article>
    </section>

    <EmptyState
      v-if="!breakdown.length"
      title="No report data yet"
      message="Reports will populate once you have savings spaces and transactions."
    />

    <section v-else class="panel">
      <h2>Savings Breakdown</h2>
      <ul>
        <li v-for="row in breakdown" :key="row.name">
          <div class="row">
            <span>{{ row.name }}</span>
            <strong>{{ row.amount }}</strong>
          </div>
          <div class="bar"><span :style="{ width: `${row.share}%` }" /></div>
        </li>
      </ul>
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
  opacity: 0.55;
  cursor: not-allowed;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}

.stat {
  border: 1px solid var(--ss-line);
  border-radius: 1rem;
  background: var(--ss-surface);
  padding: 1rem;
}

.stat p {
  margin: 0 0 0.4rem;
  color: var(--ss-muted);
  font-size: 0.86rem;
  font-weight: 600;
}

.stat h2 {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-size: 1.45rem;
}

.panel {
  border: 1px solid var(--ss-line);
  border-radius: 1rem;
  background: var(--ss-surface);
  padding: 1rem 1.1rem;
}

.panel h2 {
  margin: 0 0 0.85rem;
  font-family: 'Fraunces', serif;
  font-size: 1.15rem;
}

.panel ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.85rem;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
  font-weight: 600;
}

.bar {
  height: 0.45rem;
  border-radius: 999px;
  background: rgba(16, 35, 28, 0.08);
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--ss-accent), var(--ss-accent-deep));
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

@media (max-width: 900px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .stats {
    grid-template-columns: 1fr;
  }
}
</style>
