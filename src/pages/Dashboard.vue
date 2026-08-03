<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { useSpacesStore } from '@/stores/spaces'
import { useTransactionsStore } from '@/stores/transactions'
import { firstName, formatCurrency, formatSignedCurrency } from '@/utils/format'

const auth = useAuthStore()
const spacesStore = useSpacesStore()
const transactionsStore = useTransactionsStore()
const notificationsStore = useNotificationsStore()

const stats = computed(() => [
  { label: 'Total Balance', value: formatCurrency(spacesStore.totalBalance) },
  { label: 'Total Deposits', value: formatCurrency(transactionsStore.totalDeposits) },
  {
    label: 'Savings Spaces',
    value: String(spacesStore.apiSpaceCount || spacesStore.spaces.length),
  },
  { label: 'Shared Spaces', value: String(spacesStore.sharedSpaces.length) },
])

onMounted(async () => {
  await Promise.all([
    spacesStore.fetchSpaces(),
    transactionsStore.fetchTransactions(),
    notificationsStore.fetchNotifications(),
  ])
})
</script>

<template>
  <main class="page">
    <section class="welcome">
      <div>
        <h1>Welcome Back, {{ firstName(auth.displayName) }}!</h1>
        <p>Here's a summary of your savings.</p>
      </div>
      <div class="welcome__actions">
        <RouterLink :to="{ name: 'spaces' }" class="btn btn--primary">New Space</RouterLink>
        <RouterLink :to="{ name: 'transactions' }" class="btn btn--ghost">Add Deposit</RouterLink>
        <RouterLink :to="{ name: 'transactions' }" class="btn btn--ghost">Withdraw</RouterLink>
      </div>
    </section>

    <section class="stats" aria-label="Account summary">
      <article v-for="stat in stats" :key="stat.label" class="stat-card">
        <p class="stat-card__label">{{ stat.label }}</p>
        <p class="stat-card__value">{{ stat.value }}</p>
      </article>
    </section>

    <section class="grid">
      <article class="panel">
        <header class="panel__header">
          <h2>My Savings Spaces</h2>
          <RouterLink :to="{ name: 'spaces' }" class="panel__link">View all</RouterLink>
        </header>

        <EmptyState
          v-if="!spacesStore.recentSpaces.length"
          title="No savings spaces yet"
          message="Create your first space to start tracking savings."
        />

        <ul v-else class="space-list">
          <li v-for="space in spacesStore.recentSpaces" :key="space.id" class="space-list__item">
            <span
              class="space-list__icon"
              :class="space.type === 'Shared' ? 'space-list__icon--sand' : 'space-list__icon--emerald'"
            />
            <span class="space-list__name">{{ space.name }}</span>
            <span class="space-list__balance">{{ formatCurrency(space.balance) }}</span>
          </li>
        </ul>
      </article>

      <article class="panel">
        <header class="panel__header">
          <h2>Recent Transactions</h2>
          <RouterLink :to="{ name: 'transactions' }" class="panel__link">View all</RouterLink>
        </header>

        <EmptyState
          v-if="!transactionsStore.recentTransactions.length"
          title="No transactions yet"
          message="Deposits and withdrawals will show up here."
        />

        <ul v-else class="tx-list">
          <li
            v-for="tx in transactionsStore.recentTransactions"
            :key="tx.id"
            class="tx-list__item"
          >
            <span class="tx-list__amount" :class="`tx-list__amount--${tx.type}`">
              {{ formatSignedCurrency(tx.amount, tx.type) }}
            </span>
            <span class="tx-list__space">{{ tx.spaceName }}</span>
          </li>
        </ul>
      </article>

      <article class="panel panel--wide">
        <header class="panel__header">
          <h2>Recent Notifications</h2>
          <RouterLink :to="{ name: 'notifications' }" class="panel__link">View all</RouterLink>
        </header>

        <EmptyState
          v-if="!notificationsStore.recentNotifications.length"
          title="No notifications"
          message="You'll see updates about deposits and shared spaces here."
        />

        <ul v-else class="note-list">
          <li
            v-for="note in notificationsStore.recentNotifications"
            :key="note.id"
            class="note-list__item"
          >
            <span class="note-list__dot" :class="{ 'note-list__dot--unread': note.unread }" />
            <div>
              <p>{{ note.title }}</p>
              <small>{{ note.time }}</small>
            </div>
          </li>
        </ul>
      </article>
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
  animation: rise 480ms ease-out;
  color: var(--ss-ink);
  font-family: 'Manrope', sans-serif;
}

.welcome {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--ss-line);
  border-radius: 1.1rem;
  background: linear-gradient(135deg, rgba(15, 122, 90, 0.12), rgba(255, 252, 248, 0.95));
}

.welcome h1 {
  margin: 0 0 0.3rem;
  font-family: 'Fraunces', serif;
  font-size: clamp(1.45rem, 3vw, 1.9rem);
  font-weight: 700;
  letter-spacing: -0.03em;
}

.welcome p {
  margin: 0;
  color: var(--ss-muted);
}

.welcome__actions {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.btn {
  border-radius: 0.75rem;
  padding: 0.7rem 1rem;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.btn--primary {
  background: linear-gradient(135deg, var(--ss-accent), var(--ss-accent-deep));
  color: #fff;
}

.btn--ghost {
  background: #fff;
  border-color: var(--ss-line);
  color: var(--ss-ink);
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}

.stat-card {
  padding: 1rem 1.05rem;
  border: 1px solid var(--ss-line);
  border-radius: 1rem;
  background: var(--ss-surface);
}

.stat-card__label {
  margin: 0 0 0.45rem;
  color: var(--ss-muted);
  font-size: 0.86rem;
  font-weight: 600;
}

.stat-card__value {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-size: clamp(1.35rem, 2.4vw, 1.7rem);
  font-weight: 700;
}

.grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 0.85rem;
}

.panel {
  border: 1px solid var(--ss-line);
  border-radius: 1.1rem;
  background: var(--ss-surface);
  padding: 1rem 1.05rem 0.85rem;
}

.panel--wide {
  grid-column: 1 / -1;
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.panel__header h2 {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-size: 1.15rem;
  font-weight: 650;
}

.panel__link {
  color: var(--ss-accent-deep);
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;
}

.space-list,
.tx-list,
.note-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.space-list__item,
.tx-list__item,
.note-list__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 0.2rem;
  border-top: 1px solid var(--ss-line);
}

.space-list__icon {
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 0.7rem;
  flex-shrink: 0;
}

.space-list__icon--emerald {
  background: rgba(15, 122, 90, 0.12);
}

.space-list__icon--sand {
  background: rgba(196, 149, 52, 0.16);
}

.space-list__name {
  flex: 1;
  font-weight: 600;
}

.space-list__balance {
  font-weight: 700;
}

.tx-list__amount {
  min-width: 5.5rem;
  font-weight: 700;
}

.tx-list__amount--credit {
  color: var(--ss-accent-deep);
}

.tx-list__amount--debit {
  color: #b42318;
}

.tx-list__space {
  color: var(--ss-muted);
}

.note-list__item {
  align-items: flex-start;
}

.note-list__dot {
  width: 0.55rem;
  height: 0.55rem;
  margin-top: 0.45rem;
  border-radius: 999px;
  background: #c5d2cb;
  flex-shrink: 0;
}

.note-list__dot--unread {
  background: var(--ss-accent);
}

.note-list__item p {
  margin: 0;
  font-weight: 600;
}

.note-list__item small {
  color: var(--ss-muted);
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

@media (max-width: 1100px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .page {
    padding: 0.9rem;
  }

  .stats {
    grid-template-columns: 1fr;
  }
}
</style>
