<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSidebarStore } from '@/stores/sidebar'

const router = useRouter()
const auth = useAuthStore()
const sidebarStore = useSidebarStore()

const selectedGroupId = ref('')
const newGroupName = ref('')
const newGroupDescription = ref('')
const draftMenuIds = ref<string[]>([])
const message = ref('')

const selectedGroup = computed(() =>
  sidebarStore.groups.find((group) => group.id === selectedGroupId.value) || null,
)

const assignableUsers = computed(() =>
  sidebarStore.users.filter((user) => user.role !== 'admin'),
)

onMounted(async () => {
  if (!auth.isAdmin) {
    await router.replace({ name: 'dashboard' })
    return
  }
  await sidebarStore.fetchMaintenanceData()
  if (sidebarStore.groups.length) {
    selectGroup(sidebarStore.groups[0].id)
  }
})

function selectGroup(groupId: string) {
  selectedGroupId.value = groupId
  const group = sidebarStore.groups.find((item) => item.id === groupId)
  draftMenuIds.value = [...(group?.menuIds || [])]
  message.value = ''
}

function toggleMenu(menuId: string) {
  if (draftMenuIds.value.includes(menuId)) {
    draftMenuIds.value = draftMenuIds.value.filter((id) => id !== menuId)
  } else {
    draftMenuIds.value = [...draftMenuIds.value, menuId]
  }
}

async function saveMenus() {
  if (!selectedGroupId.value) return
  message.value = ''
  try {
    await sidebarStore.syncGroupMenus(selectedGroupId.value, draftMenuIds.value)
    message.value = 'Sidebar access saved for this group.'
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Unable to save menus.'
  }
}

async function createGroup() {
  if (!newGroupName.value.trim()) {
    message.value = 'Group name is required.'
    return
  }
  try {
    await sidebarStore.createGroup({
      name: newGroupName.value.trim(),
      description: newGroupDescription.value.trim(),
      menuIds: draftMenuIds.value,
    })
    newGroupName.value = ''
    newGroupDescription.value = ''
    message.value = 'User group created.'
    if (sidebarStore.groups.length) {
      selectGroup(sidebarStore.groups[sidebarStore.groups.length - 1].id)
    }
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Unable to create group.'
  }
}

async function assignUser(userId: string, groupId: string) {
  try {
    await sidebarStore.assignUserGroup(userId, groupId || null)
    message.value = 'User group assignment updated.'
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Unable to assign user.'
  }
}
</script>

<template>
  <main class="page">
    <header class="page__header">
      <div>
        <h1>Maintenance</h1>
        <p>Set up user groups and tick which sidebar pages each group can see.</p>
      </div>
    </header>

    <p v-if="message" class="banner" role="status">{{ message }}</p>
    <p v-if="sidebarStore.error" class="banner banner--error">{{ sidebarStore.error }}</p>

    <section class="grid">
      <aside class="panel">
        <h2>User groups</h2>
        <ul class="group-list">
          <li v-for="group in sidebarStore.groups" :key="group.id">
            <button
              type="button"
              class="group-item"
              :class="{ 'group-item--active': group.id === selectedGroupId }"
              @click="selectGroup(group.id)"
            >
              <strong>{{ group.name }}</strong>
              <span>{{ group.userCount }} users</span>
            </button>
          </li>
        </ul>

        <div class="create">
          <h3>Create group</h3>
          <input v-model="newGroupName" type="text" placeholder="Group name" />
          <input v-model="newGroupDescription" type="text" placeholder="Description (optional)" />
          <button type="button" class="btn" :disabled="sidebarStore.isSaving" @click="createGroup">
            Create group
          </button>
        </div>
      </aside>

      <section class="panel">
        <h2>Sidebar access</h2>
        <p v-if="!selectedGroup" class="muted">Select a group to tick sidebar pages.</p>
        <template v-else>
          <p class="muted">
            Tick menus for <strong>{{ selectedGroup.name }}</strong>. Users in this group only see
            checked pages.
          </p>
          <div class="checks">
            <label v-for="menu in sidebarStore.availableMenus" :key="menu.id" class="check">
              <input
                type="checkbox"
                :checked="draftMenuIds.includes(menu.id)"
                @change="toggleMenu(menu.id)"
              />
              <span>{{ menu.icon }} {{ menu.label }}</span>
            </label>
          </div>
          <button type="button" class="btn" :disabled="sidebarStore.isSaving" @click="saveMenus">
            Save sidebar access
          </button>
        </template>
      </section>

      <section class="panel panel--wide">
        <h2>Assign users to groups</h2>
        <p class="muted">Admins are excluded — they always see the full sidebar.</p>
        <div class="table">
          <div class="table__head">
            <span>User</span>
            <span>Group</span>
          </div>
          <div v-for="user in assignableUsers" :key="user.id" class="table__row">
            <div>
              <strong>{{ user.name }}</strong>
              <small>{{ user.email }}</small>
            </div>
            <select
              :value="user.groupId"
              :disabled="sidebarStore.isSaving"
              @change="
                assignUser(user.id, ($event.target as HTMLSelectElement).value)
              "
            >
              <option value="">No group</option>
              <option v-for="group in sidebarStore.groups" :key="group.id" :value="group.id">
                {{ group.name }}
              </option>
            </select>
          </div>
        </div>
      </section>
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
  gap: 1rem;
  color: var(--ss-ink);
  font-family: 'Manrope', sans-serif;
}

.page__header h1 {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-size: 1.8rem;
}

.page__header p,
.muted {
  color: var(--ss-muted);
}

.banner {
  margin: 0;
  padding: 0.75rem 0.9rem;
  border-radius: 0.7rem;
  background: rgba(15, 122, 90, 0.1);
}

.banner--error {
  background: rgba(180, 35, 24, 0.08);
  color: #b42318;
}

.grid {
  display: grid;
  gap: 1rem;
}

.panel {
  background: var(--ss-surface);
  border: 1px solid var(--ss-line);
  border-radius: 1rem;
  padding: 1rem;
  display: grid;
  gap: 0.85rem;
}

.group-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.45rem;
}

.group-item {
  width: 100%;
  border: 1px solid var(--ss-line);
  border-radius: 0.7rem;
  background: #fff;
  padding: 0.7rem 0.8rem;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  cursor: pointer;
  font: inherit;
}

.group-item--active {
  border-color: var(--ss-accent);
  box-shadow: 0 0 0 2px rgba(15, 122, 90, 0.12);
}

.create {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.create input,
.table select {
  border: 1px solid var(--ss-line);
  border-radius: 0.65rem;
  padding: 0.65rem 0.75rem;
  font: inherit;
}

.checks {
  display: grid;
  gap: 0.45rem;
}

.check {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  cursor: pointer;
}

.btn {
  border: 0;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, var(--ss-accent), var(--ss-accent-deep));
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  justify-self: start;
}

.table {
  display: grid;
  gap: 0.55rem;
}

.table__head,
.table__row {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 0.75rem;
  align-items: center;
}

.table__head {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--ss-muted);
}

.table__row {
  border: 1px solid var(--ss-line);
  border-radius: 0.75rem;
  padding: 0.7rem 0.8rem;
}

.table__row small {
  display: block;
  color: var(--ss-muted);
}

@media (min-width: 960px) {
  .grid {
    grid-template-columns: 0.9fr 1.1fr;
  }

  .panel--wide {
    grid-column: 1 / -1;
  }
}
</style>
