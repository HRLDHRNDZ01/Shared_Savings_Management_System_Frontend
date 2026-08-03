<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInvitesStore } from '@/stores/invites'
import { useNotificationsStore } from '@/stores/notifications'
import { useSpacesStore } from '@/stores/spaces'
import { useTransactionsStore } from '@/stores/transactions'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const notificationsStore = useNotificationsStore()
const spacesStore = useSpacesStore()
const transactionsStore = useTransactionsStore()
const settingsStore = useSettingsStore()
const invitesStore = useInvitesStore()

const isDesktop = ref(true)
const sidebarOpen = ref(true)
const menuOpen = ref(false)
const notificationsOpen = ref(false)

const navItems = [
  { name: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { name: 'spaces', label: 'Savings Spaces', icon: '💰' },
  { name: 'transactions', label: 'Transactions', icon: '📜' },
  { name: 'notifications', label: 'Notifications', icon: '🔔' },
  { name: 'reports', label: 'Reports', icon: '📊' },
  { name: 'profile', label: 'Profile', icon: '👤' },
  { name: 'settings', label: 'Settings', icon: '⚙' },
]

function syncViewport() {
  const desktop = window.innerWidth > 860
  if (desktop !== isDesktop.value) {
    isDesktop.value = desktop
    sidebarOpen.value = desktop
  }
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebarOnMobile() {
  if (!isDesktop.value) sidebarOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
  notificationsOpen.value = false
}

function toggleNotifications() {
  notificationsOpen.value = !notificationsOpen.value
  menuOpen.value = false
}

function closeOverlays() {
  menuOpen.value = false
  notificationsOpen.value = false
}

function signOut() {
  auth.logout()
  spacesStore.clear()
  transactionsStore.clear()
  notificationsStore.clear()
  invitesStore.clear()
  settingsStore.reset()
  router.push({ name: 'login' })
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.topbar__actions')) closeOverlays()
}

watch(
  () => route.name,
  () => closeSidebarOnMobile(),
)

onMounted(() => {
  syncViewport()
  void notificationsStore.fetchNotifications()
  window.addEventListener('resize', syncViewport)
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  window.removeEventListener('resize', syncViewport)
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <div
    class="shell"
    :class="{
      'shell--sidebar-open': sidebarOpen,
      'shell--sidebar-closed': !sidebarOpen,
    }"
  >
    <aside class="sidebar" aria-label="Main navigation">
      <div class="sidebar__brand">
        <span class="sidebar__mark">SaveSpace</span>
        <button
          type="button"
          class="sidebar__hide"
          aria-label="Hide sidebar"
          @click="sidebarOpen = false"
        >
          ⟨
        </button>
      </div>

      <nav class="sidebar__nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="sidebar__link"
          :class="{ 'sidebar__link--active': route.name === item.name }"
        >
          <span class="sidebar__icon" aria-hidden="true">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>

        <button type="button" class="sidebar__link sidebar__link--logout" @click="signOut">
          <span class="sidebar__icon" aria-hidden="true">🚪</span>
          <span>Logout</span>
        </button>
      </nav>
    </aside>

    <div
      v-if="sidebarOpen && !isDesktop"
      class="shell__backdrop"
      @click="sidebarOpen = false"
    />

    <div class="shell__main">
      <header class="topbar">
        <div class="topbar__left">
          <button
            type="button"
            class="topbar__toggle"
            :aria-expanded="sidebarOpen"
            :aria-label="sidebarOpen ? 'Hide sidebar' : 'Show sidebar'"
            @click="toggleSidebar"
          >
            <span aria-hidden="true">{{ sidebarOpen ? '☰' : '☰' }}</span>
          </button>
          <p class="topbar__brand">SaveSpace</p>
        </div>

        <div class="topbar__actions">
          <div class="topbar__dropdown">
            <button
              type="button"
              class="topbar__icon-btn"
              :aria-expanded="notificationsOpen"
              aria-label="Notifications"
              @click.stop="toggleNotifications"
            >
              <span class="topbar__bell" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path
                    d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5"
                  />
                  <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
                </svg>
              </span>
              <span v-if="notificationsStore.unreadCount" class="topbar__badge">
                {{ notificationsStore.unreadCount }}
              </span>
            </button>

            <div v-if="notificationsOpen" class="menu-panel menu-panel--notifications" role="menu">
              <p class="menu-panel__title">Notifications</p>
              <p
                v-if="!notificationsStore.recentNotifications.length"
                class="menu-panel__empty"
              >
                No notifications yet
              </p>
              <RouterLink
                v-for="item in notificationsStore.recentNotifications"
                :key="item.id"
                :to="{ name: 'notifications' }"
                class="menu-panel__item"
                role="menuitem"
                @click="notificationsOpen = false"
              >
                <span>{{ item.title }}</span>
                <small>{{ item.time }}</small>
              </RouterLink>
            </div>
          </div>

          <div class="topbar__dropdown">
            <button
              type="button"
              class="topbar__user"
              :aria-expanded="menuOpen"
              @click.stop="toggleMenu"
            >
              <span class="topbar__avatar">{{ auth.initials }}</span>
              <span>{{ auth.displayName }}</span>
              <span class="topbar__caret" aria-hidden="true">▾</span>
            </button>

            <div v-if="menuOpen" class="menu-panel" role="menu">
              <RouterLink
                :to="{ name: 'profile' }"
                class="menu-panel__item"
                role="menuitem"
                @click="menuOpen = false"
              >
                Profile
              </RouterLink>
              <RouterLink
                :to="{ name: 'settings' }"
                class="menu-panel__item"
                role="menuitem"
                @click="menuOpen = false"
              >
                Settings
              </RouterLink>
              <button
                type="button"
                class="menu-panel__item menu-panel__item--danger"
                role="menuitem"
                @click="signOut"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="shell__content">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style scoped>
.shell {
  --ss-ink: #10231c;
  --ss-muted: #4d6359;
  --ss-accent: #0f7a5a;
  --ss-accent-deep: #0a5c44;
  --ss-line: rgba(16, 35, 28, 0.1);
  --ss-surface: #fffdf9;
  --ss-bg: #eef5f1;
  --sidebar-width: 16.5rem;

  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  min-height: 100vh;
  min-height: 100dvh;
  color: var(--ss-ink);
  font-family: 'Manrope', sans-serif;
  background:
    radial-gradient(circle at top right, rgba(47, 168, 128, 0.12), transparent 34%),
    var(--ss-bg);
  transition: grid-template-columns 240ms ease;
}

.shell--sidebar-closed {
  grid-template-columns: 0 1fr;
}

.sidebar {
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.35rem 1rem;
  border-right: 1px solid var(--ss-line);
  background: rgba(255, 252, 248, 0.96);
  backdrop-filter: blur(8px);
  overflow: hidden;
  transition:
    transform 240ms ease,
    opacity 200ms ease;
  z-index: 40;
}

.shell--sidebar-closed .sidebar {
  transform: translateX(-105%);
  opacity: 0;
  pointer-events: none;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0 0.4rem;
}

.sidebar__mark {
  font-family: 'Fraunces', serif;
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--ss-accent-deep);
  white-space: nowrap;
}

.sidebar__hide {
  border: 1px solid var(--ss-line);
  border-radius: 0.55rem;
  width: 2rem;
  height: 2rem;
  background: var(--ss-surface);
  color: var(--ss-muted);
  font: inherit;
  font-size: 0.95rem;
  cursor: pointer;
  flex-shrink: 0;
}

.sidebar__nav {
  display: grid;
  gap: 0.35rem;
}

.sidebar__link {
  border: 0;
  border-radius: 0.75rem;
  padding: 0.75rem 0.85rem;
  background: transparent;
  color: var(--ss-muted);
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background 160ms ease,
    color 160ms ease;
}

.sidebar__icon {
  width: 1.35rem;
  text-align: center;
  font-size: 1rem;
  line-height: 1;
  flex-shrink: 0;
}

.sidebar__link:hover {
  background: rgba(15, 122, 90, 0.08);
  color: var(--ss-ink);
}

.sidebar__link--active {
  background: rgba(15, 122, 90, 0.12);
  color: var(--ss-accent-deep);
}

.sidebar__link--logout {
  margin-top: 0.65rem;
  border-top: 1px solid var(--ss-line);
  border-radius: 0 0 0.75rem 0.75rem;
  padding-top: 1rem;
  color: #9b2c2c;
}

.sidebar__link--logout:hover {
  background: rgba(180, 35, 24, 0.08);
  color: #b42318;
}

.shell__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.shell__content {
  min-width: 0;
  flex: 1;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1.25rem;
  border-bottom: 1px solid var(--ss-line);
  background: rgba(255, 252, 248, 0.88);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 20;
}

.topbar__left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.topbar__toggle {
  border: 1px solid var(--ss-line);
  border-radius: 0.65rem;
  width: 2.35rem;
  height: 2.35rem;
  background: var(--ss-surface);
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  font-size: 1.05rem;
  color: var(--ss-ink);
}

.topbar__brand {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ss-accent-deep);
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.topbar__dropdown {
  position: relative;
}

.topbar__icon-btn,
.topbar__user {
  border: 1px solid var(--ss-line);
  background: var(--ss-surface);
  color: var(--ss-ink);
  font: inherit;
  cursor: pointer;
}

.topbar__icon-btn {
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
}

.topbar__bell {
  width: 1.15rem;
  height: 1.15rem;
  display: block;
}

.topbar__bell svg {
  width: 100%;
  height: 100%;
}

.topbar__badge {
  position: absolute;
  top: -0.2rem;
  right: -0.15rem;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.28rem;
  border-radius: 999px;
  background: var(--ss-accent);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.topbar__user {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 999px;
  padding: 0.3rem 0.7rem 0.3rem 0.3rem;
  font-weight: 600;
  text-decoration: none;
}

.topbar__avatar {
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--ss-accent), var(--ss-accent-deep));
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
}

.topbar__caret {
  color: var(--ss-muted);
  font-size: 0.75rem;
}

.menu-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 0.45rem);
  width: 13rem;
  padding: 0.4rem;
  border: 1px solid var(--ss-line);
  border-radius: 0.85rem;
  background: #fff;
  box-shadow: 0 16px 40px rgba(16, 35, 28, 0.12);
  display: grid;
  gap: 0.15rem;
  z-index: 30;
}

.menu-panel--notifications {
  width: min(20rem, 78vw);
}

.menu-panel__title {
  margin: 0;
  padding: 0.45rem 0.55rem 0.25rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--ss-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.menu-panel__empty {
  margin: 0;
  padding: 0.65rem 0.55rem;
  color: var(--ss-muted);
  font-size: 0.88rem;
}

.menu-panel__item {
  border: 0;
  border-radius: 0.6rem;
  padding: 0.7rem 0.65rem;
  background: transparent;
  color: var(--ss-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  display: grid;
  gap: 0.15rem;
  text-decoration: none;
}

.menu-panel__item small {
  color: var(--ss-muted);
}

.menu-panel__item:hover {
  background: rgba(15, 122, 90, 0.08);
}

.menu-panel__item--danger {
  color: #b42318;
}

.shell__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(16, 35, 28, 0.28);
  z-index: 35;
}

@media (max-width: 860px) {
  .shell,
  .shell--sidebar-closed {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    height: 100%;
    transform: translateX(-105%);
    opacity: 1;
    pointer-events: auto;
    box-shadow: 12px 0 40px rgba(16, 35, 28, 0.12);
  }

  .shell--sidebar-open .sidebar {
    transform: translateX(0);
  }

  .shell--sidebar-closed .sidebar {
    transform: translateX(-105%);
    opacity: 1;
  }

  .topbar__brand {
    display: none;
  }
}

@media (max-width: 560px) {
  .topbar__user span:nth-child(2),
  .topbar__caret {
    display: none;
  }
}
</style>
