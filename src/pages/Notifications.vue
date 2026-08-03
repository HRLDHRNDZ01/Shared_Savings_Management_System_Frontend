<script setup lang="ts">
import { onMounted, ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import { useInvitesStore } from '@/stores/invites'
import { useNotificationsStore } from '@/stores/notifications'
import { useSpacesStore } from '@/stores/spaces'

const notificationsStore = useNotificationsStore()
const invitesStore = useInvitesStore()
const spacesStore = useSpacesStore()

const inviteActionError = ref('')
const inviteActionSuccess = ref('')
const actingInviteId = ref('')

async function acceptInvite(inviteId: string) {
  inviteActionError.value = ''
  inviteActionSuccess.value = ''
  actingInviteId.value = inviteId
  try {
    await invitesStore.acceptInvite(inviteId)
    await spacesStore.fetchSpaces()
    const shared = spacesStore.spaces.filter((space) => space.type === 'Shared')
    await Promise.all(shared.map((space) => invitesStore.fetchMembers(space.id)))
    inviteActionSuccess.value = 'Invite accepted. Shared space is now available.'
  } catch (error) {
    inviteActionError.value =
      error instanceof Error ? error.message : 'Unable to accept invite.'
  } finally {
    actingInviteId.value = ''
  }
}

async function declineInvite(inviteId: string) {
  inviteActionError.value = ''
  inviteActionSuccess.value = ''
  actingInviteId.value = inviteId
  try {
    await invitesStore.declineInvite(inviteId)
    inviteActionSuccess.value = 'Invite declined.'
  } catch (error) {
    inviteActionError.value =
      error instanceof Error ? error.message : 'Unable to decline invite.'
  } finally {
    actingInviteId.value = ''
  }
}

onMounted(() => {
  void notificationsStore.fetchNotifications()
  void invitesStore.fetchInvites()
})
</script>

<template>
  <main class="page">
    <header class="page__header">
      <div>
        <h1>Notifications</h1>
        <p>Stay updated on deposits, goals, and shared activity.</p>
      </div>
      <button
        type="button"
        class="btn btn--ghost"
        :disabled="!notificationsStore.notifications.length"
        @click="notificationsStore.markAllAsRead()"
      >
        Mark all as read
      </button>
    </header>

    <p v-if="inviteActionError" class="alert alert--error" role="alert">{{ inviteActionError }}</p>
    <p v-if="inviteActionSuccess" class="alert alert--success" role="status">
      {{ inviteActionSuccess }}
    </p>

    <section class="panel">
      <header class="panel__header">
        <h2>Pending invites</h2>
        <span>{{ invitesStore.pendingInvites.length }}</span>
      </header>

      <EmptyState
        v-if="!invitesStore.pendingInvites.length"
        title="No pending invites"
        message="When someone invites you to a shared space, it will show up here."
      />

      <ul v-else class="invite-list">
        <li v-for="invite in invitesStore.pendingInvites" :key="invite.id" class="invite-item">
          <div>
            <h3>{{ invite.spaceName }}</h3>
            <p>Invited by {{ invite.invitedBy }}</p>
            <small v-if="invite.createdAt">{{ invite.createdAt }}</small>
          </div>
          <div class="invite-item__actions">
            <button
              type="button"
              class="btn btn--ghost"
              :disabled="invitesStore.isSaving && actingInviteId === invite.id"
              @click="declineInvite(invite.id)"
            >
              Decline
            </button>
            <button
              type="button"
              class="btn"
              :disabled="invitesStore.isSaving && actingInviteId === invite.id"
              @click="acceptInvite(invite.id)"
            >
              {{
                invitesStore.isSaving && actingInviteId === invite.id ? 'Please wait…' : 'Accept'
              }}
            </button>
          </div>
        </li>
      </ul>
    </section>

    <section class="panel">
      <header class="panel__header">
        <h2>Activity</h2>
      </header>

      <EmptyState
        v-if="!notificationsStore.notifications.length"
        title="No notifications"
        message="You're all caught up. New activity will appear here."
      />

      <div v-else class="list">
        <article
          v-for="note in notificationsStore.notifications"
          :key="note.id"
          class="item"
          :class="{ 'item--unread': note.unread }"
        >
          <span class="dot" :class="{ 'dot--unread': note.unread }" />
          <div>
            <h2>{{ note.title }}</h2>
            <p>{{ note.detail }}</p>
            <small>{{ note.time }}</small>
          </div>
        </article>
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
  padding: 0.65rem 0.95rem;
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
  border: 1px solid var(--ss-line);
  border-radius: 0.75rem;
  padding: 0.65rem 0.95rem;
  background: #fff;
  color: var(--ss-ink);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.btn--ghost:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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
  padding: 1rem;
  display: grid;
  gap: 0.85rem;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.panel__header h2 {
  margin: 0;
  font-size: 1.05rem;
}

.panel__header span {
  color: var(--ss-muted);
  font-size: 0.85rem;
  font-weight: 700;
}

.invite-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.7rem;
}

.invite-item {
  display: flex;
  justify-content: space-between;
  gap: 0.9rem;
  flex-wrap: wrap;
  align-items: center;
  border: 1px solid var(--ss-line);
  border-radius: 0.9rem;
  padding: 0.9rem;
}

.invite-item h3 {
  margin: 0 0 0.2rem;
  font-size: 1rem;
}

.invite-item p,
.invite-item small {
  margin: 0;
  color: var(--ss-muted);
}

.invite-item__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.list {
  display: grid;
  gap: 0.7rem;
}

.item {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  border: 1px solid var(--ss-line);
  border-radius: 1rem;
  background: #fff;
  padding: 1rem;
}

.item--unread {
  background: rgba(15, 122, 90, 0.06);
}

.dot {
  width: 0.55rem;
  height: 0.55rem;
  margin-top: 0.45rem;
  border-radius: 999px;
  background: #c5d2cb;
  flex-shrink: 0;
}

.dot--unread {
  background: var(--ss-accent);
}

.item h2 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.item p {
  margin: 0 0 0.35rem;
  color: var(--ss-muted);
}

.item small {
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
</style>
