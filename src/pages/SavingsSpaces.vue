<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import { useInvitesStore } from '@/stores/invites'
import { useSpacesStore } from '@/stores/spaces'
import type { SpaceType, UserSearchResult } from '@/types'
import { formatCurrency } from '@/utils/format'

const spacesStore = useSpacesStore()
const invitesStore = useInvitesStore()

const showForm = ref(false)
const formError = ref('')
const formSuccess = ref('')
const form = reactive({
  name: '',
  type: 'Personal' as SpaceType,
  targetAmount: '',
})

const inviteSpaceId = ref('')
const searchQuery = ref('')
const selectedUser = ref<UserSearchResult | null>(null)
const inviteError = ref('')
const inviteSuccess = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

const spacesWithProgress = computed(() =>
  spacesStore.spaces.map((space) => ({
    ...space,
    progress: space.goal > 0 ? Math.min(100, Math.round((space.balance / space.goal) * 100)) : 0,
  })),
)

const inviteSpace = computed(() =>
  spacesStore.spaces.find((space) => space.id === inviteSpaceId.value) || null,
)

const activeMembers = computed(() => membersFor(inviteSpaceId.value))

function membersFor(spaceId: string) {
  if (!spaceId) return []
  const fromStore = invitesStore.membersBySpace[spaceId]
  if (fromStore?.length) return fromStore
  const space = spacesStore.spaces.find((item) => item.id === spaceId)
  return space?.members || []
}

async function syncSharedMembers() {
  const shared = spacesStore.spaces.filter((space) => space.type === 'Shared' && space.id)
  await Promise.all(
    shared.map(async (space) => {
      const loaded = await invitesStore.fetchMembers(space.id)
      if (loaded.length) {
        spacesStore.setSpaceMembers(space.id, loaded)
      } else if (space.members.length) {
        invitesStore.setMembers(space.id, space.members)
      }
    }),
  )
}

function openForm() {
  showForm.value = true
  formError.value = ''
  formSuccess.value = ''
  closeInvite()
}

function closeForm() {
  showForm.value = false
  form.name = ''
  form.type = 'Personal'
  form.targetAmount = ''
  formError.value = ''
}

async function submitSpace() {
  formError.value = ''
  formSuccess.value = ''

  const name = form.name.trim()
  const targetAmount = Number(form.targetAmount)

  if (!name) {
    formError.value = 'Space name is required.'
    return
  }
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    formError.value = 'Enter a valid goal amount.'
    return
  }

  try {
    const data = await spacesStore.createSpace({
      name,
      type: form.type,
      targetAmount,
    })
    formSuccess.value = 'Space created successfully.'
    closeForm()
    const created = data?.data
    const spaceId = String(created?.space_id ?? created?.id ?? '')
    if (spaceId && Array.isArray(created?.members)) {
      invitesStore.setMembers(
        spaceId,
        created.members.map((item: Record<string, unknown>) => ({
          id: String(item.space_member_id ?? item.id ?? item.user_id ?? ''),
          userId: String(item.user_id ?? ''),
          name: String(item.name ?? (item.role === 'owner' ? 'Owner' : 'Member')),
          email: String(item.email ?? ''),
          role: String(item.role ?? 'member').toLowerCase() === 'owner' ? 'owner' : 'member',
        })),
      )
    }
    await syncSharedMembers()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Unable to create space.'
  }
}

async function openInvite(spaceId: string) {
  showForm.value = false
  inviteSpaceId.value = spaceId
  searchQuery.value = ''
  selectedUser.value = null
  inviteError.value = ''
  inviteSuccess.value = ''
  invitesStore.clearUserResults()
  await invitesStore.fetchMembers(spaceId)
  const loaded = invitesStore.membersBySpace[spaceId] || []
  if (loaded.length) spacesStore.setSpaceMembers(spaceId, loaded)
}

function closeInvite() {
  inviteSpaceId.value = ''
  searchQuery.value = ''
  selectedUser.value = null
  inviteError.value = ''
  invitesStore.clearUserResults()
}

function selectUser(user: UserSearchResult) {
  selectedUser.value = user
  searchQuery.value = `${user.name} (${user.email})`
  invitesStore.clearUserResults()
  inviteError.value = ''
}

async function submitInvite() {
  inviteError.value = ''
  inviteSuccess.value = ''

  const email = selectedUser.value?.email.trim() || searchQuery.value.trim()

  if (!email) {
    inviteError.value = 'Search and select an existing user, or enter their email.'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    inviteError.value = 'Enter a valid email of an existing user.'
    return
  }
  if (!inviteSpaceId.value) return

  try {
    await invitesStore.inviteMember(inviteSpaceId.value, email)
    inviteSuccess.value = `Invitation sent to ${selectedUser.value?.name || email}.`
    selectedUser.value = null
    searchQuery.value = ''
    await invitesStore.fetchMembers(inviteSpaceId.value)
    const loaded = invitesStore.membersBySpace[inviteSpaceId.value] || []
    if (loaded.length) spacesStore.setSpaceMembers(inviteSpaceId.value, loaded)
  } catch (error) {
    inviteError.value = error instanceof Error ? error.message : 'Unable to send invitation.'
  }
}

watch(searchQuery, (value) => {
  if (searchTimer) clearTimeout(searchTimer)

  // Don't search while a selected user label is shown.
  if (selectedUser.value && value.includes(selectedUser.value.email)) {
    return
  }

  selectedUser.value = null
  searchTimer = setTimeout(async () => {
    try {
      await invitesStore.searchUsers(value)
      inviteError.value = ''
    } catch (error) {
      inviteError.value = error instanceof Error ? error.message : 'Unable to search users.'
    }
  }, 350)
})

onMounted(async () => {
  await spacesStore.fetchSpaces()
  await syncSharedMembers()
})
</script>

<template>
  <main class="page">
    <header class="page__header">
      <div>
        <h1>Savings Spaces</h1>
        <p>Manage your personal and shared savings spaces.</p>
      </div>
      <button type="button" class="btn" @click="openForm">Create Space</button>
    </header>

    <section v-if="showForm" class="form-panel">
      <h2>New savings space</h2>
      <p v-if="formError" class="alert alert--error" role="alert">{{ formError }}</p>
      <form class="form" @submit.prevent="submitSpace">
        <label>
          Space name
          <input v-model="form.name" type="text" placeholder="Emergency Fund" required />
        </label>
        <label>
          Type
          <select v-model="form.type">
            <option value="Personal">Personal</option>
            <option value="Shared">Shared</option>
          </select>
        </label>
        <label>
          Goal amount
          <input
            v-model="form.targetAmount"
            type="number"
            min="1"
            step="0.01"
            placeholder="10000"
            required
          />
        </label>
        <div class="form__actions">
          <button type="button" class="btn btn--ghost" @click="closeForm">Cancel</button>
          <button type="submit" class="btn" :disabled="spacesStore.isSaving">
            {{ spacesStore.isSaving ? 'Creating…' : 'Create Space' }}
          </button>
        </div>
      </form>
    </section>

    <section v-if="inviteSpace" class="form-panel">
      <h2>Invite to {{ inviteSpace.name }}</h2>
      <p class="form-panel__hint">
        Search an existing user, or type their registered email. Invitation stays in-app (no email
        sending).
      </p>
      <p v-if="inviteError" class="alert alert--error" role="alert">{{ inviteError }}</p>
      <p v-if="inviteSuccess" class="alert alert--success" role="status">{{ inviteSuccess }}</p>
      <form class="form" @submit.prevent="submitInvite">
        <label>
          Search user
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Type name or email…"
            autocomplete="off"
          />
        </label>

        <p v-if="invitesStore.isSearching" class="search-status">Searching…</p>

        <ul v-else-if="invitesStore.userResults.length" class="search-results">
          <li v-for="user in invitesStore.userResults" :key="user.id">
            <button type="button" class="search-results__btn" @click="selectUser(user)">
              <strong>{{ user.name }}</strong>
              <span>{{ user.email }}</span>
            </button>
          </li>
        </ul>

        <p
          v-else-if="searchQuery.trim().length >= 2 && !selectedUser"
          class="search-status"
        >
          No matching users found.
        </p>

        <p v-if="selectedUser" class="selected-user">
          Selected: <strong>{{ selectedUser.name }}</strong> ({{ selectedUser.email }})
        </p>

        <div class="form__actions">
          <button type="button" class="btn btn--ghost" @click="closeInvite">Cancel</button>
          <button
            type="submit"
            class="btn"
            :disabled="invitesStore.isSaving"
          >
            {{ invitesStore.isSaving ? 'Sending…' : 'Send Invite' }}
          </button>
        </div>
      </form>

      <div class="members">
        <h3>Members</h3>
        <p v-if="!activeMembers.length" class="members__empty">No members loaded yet.</p>
        <ul v-else class="members__list">
          <li v-for="member in activeMembers" :key="member.id">
            <span>{{ member.name || member.email }}</span>
            <span class="tag tag--role">{{ member.role }}</span>
          </li>
        </ul>
      </div>
    </section>

    <p v-if="formSuccess" class="alert alert--success" role="status">{{ formSuccess }}</p>
    <p v-if="spacesStore.error && !showForm" class="alert alert--error" role="alert">
      {{ spacesStore.error }}
    </p>

    <EmptyState
      v-if="!spacesWithProgress.length"
      title="No savings spaces yet"
      message="Create a personal or shared space to begin saving."
    />

    <section v-else class="cards">
      <article v-for="space in spacesWithProgress" :key="space.id" class="card">
        <div class="card__top">
          <h2>{{ space.name }}</h2>
          <span class="tag">{{ space.type }}</span>
        </div>
        <p class="card__balance">{{ formatCurrency(space.balance) }}</p>
        <p class="card__goal">Goal: {{ formatCurrency(space.goal) }}</p>
        <div class="progress" :aria-label="`${space.progress}% complete`">
          <span :style="{ width: `${space.progress}%` }" />
        </div>
        <p class="card__progress">{{ space.progress }}% complete</p>

        <div v-if="space.type === 'Shared'" class="card__actions">
          <button type="button" class="btn btn--ghost btn--small" @click="openInvite(space.id)">
            Invite
          </button>
          <span v-if="membersFor(space.id).length" class="members-count">
            {{ membersFor(space.id).length }}
            {{ membersFor(space.id).length === 1 ? 'member' : 'members' }}
          </span>
        </div>

        <div
          v-if="space.type === 'Shared' && membersFor(space.id).length"
          class="members members--card"
        >
          <h3>Members</h3>
          <ul class="members__list members__list--card">
            <li v-for="member in membersFor(space.id)" :key="member.id">
              <span>{{ member.name || member.email || `User #${member.userId}` }}</span>
              <span class="tag tag--role">{{ member.role }}</span>
            </li>
          </ul>
        </div>
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
  opacity: 0.7;
  cursor: not-allowed;
}

.btn--ghost {
  background: transparent;
  color: var(--ss-ink);
  border: 1px solid var(--ss-line);
}

.btn--small {
  padding: 0.45rem 0.7rem;
  font-size: 0.82rem;
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

.search-status {
  margin: 0;
  color: var(--ss-muted);
  font-size: 0.85rem;
}

.search-results {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.35rem;
  max-height: 12rem;
  overflow: auto;
}

.search-results__btn {
  width: 100%;
  border: 1px solid var(--ss-line);
  border-radius: 0.65rem;
  background: #fff;
  padding: 0.65rem 0.75rem;
  display: grid;
  gap: 0.15rem;
  text-align: left;
  cursor: pointer;
  font: inherit;
}

.search-results__btn:hover {
  border-color: var(--ss-accent);
}

.search-results__btn strong {
  font-size: 0.9rem;
}

.search-results__btn span {
  color: var(--ss-muted);
  font-size: 0.8rem;
}

.selected-user {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border-radius: 0.65rem;
  background: rgba(15, 122, 90, 0.1);
  color: var(--ss-accent-deep);
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

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 0.9rem;
}

.card {
  border: 1px solid var(--ss-line);
  border-radius: 1rem;
  background: var(--ss-surface);
  padding: 1rem;
}

.card__top {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: start;
}

.card h2 {
  margin: 0;
  font-size: 1.05rem;
}

.tag {
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  background: rgba(15, 122, 90, 0.12);
  color: var(--ss-accent-deep);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: capitalize;
}

.tag--role {
  background: rgba(16, 35, 28, 0.08);
  color: var(--ss-muted);
}

.card__balance {
  margin: 0.85rem 0 0.2rem;
  font-family: 'Fraunces', serif;
  font-size: 1.55rem;
  font-weight: 700;
}

.card__goal,
.card__progress {
  margin: 0;
  color: var(--ss-muted);
  font-size: 0.88rem;
}

.card__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.9rem;
}

.progress {
  margin: 0.75rem 0 0.35rem;
  height: 0.45rem;
  border-radius: 999px;
  background: rgba(16, 35, 28, 0.08);
  overflow: hidden;
}

.progress span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--ss-accent), var(--ss-accent-deep));
}

.members {
  margin-top: 1.1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--ss-line);
}

.members--card {
  margin-top: 0.9rem;
  padding-top: 0.85rem;
}

.members h3 {
  margin: 0 0 0.6rem;
  font-size: 0.95rem;
}

.members-count {
  align-self: center;
  color: var(--ss-muted);
  font-size: 0.8rem;
  font-weight: 600;
}

.members__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.45rem;
}

.members__list--card {
  margin-top: 0;
}

.members__list li {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.88rem;
}

.members__empty {
  margin: 0;
  color: var(--ss-muted);
  font-size: 0.85rem;
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
