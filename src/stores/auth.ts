import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserProfile } from '@/types'
import { getInitials } from '@/utils/format'

const AUTH_KEY = 'ssms_authenticated'
const USER_KEY = 'ssms_user'

function normalizeRole(role: unknown): 'admin' | 'user' {
  return String(role ?? '').toLowerCase() === 'admin' ? 'admin' : 'user'
}

function readStoredUser(): UserProfile | null {
  const raw = sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<UserProfile>
    if (!parsed.email) return null
    return {
      id: String(parsed.id ?? ''),
      fullName: String(parsed.fullName ?? ''),
      email: String(parsed.email ?? ''),
      phone: String(parsed.phone ?? ''),
      memberSince: String(parsed.memberSince ?? ''),
      role: normalizeRole(parsed.role),
      groupId: String(parsed.groupId ?? ''),
      groupName: String(parsed.groupName ?? ''),
    }
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(readStoredUser())
  const isAuthenticated = ref(sessionStorage.getItem(AUTH_KEY) === 'true' && Boolean(user.value))

  const displayName = computed(() => user.value?.fullName || 'User')
  const initials = computed(() => getInitials(displayName.value))
  const isAdmin = computed(() => user.value?.role === 'admin')

  function persist() {
    if (user.value) {
      sessionStorage.setItem(AUTH_KEY, 'true')
      sessionStorage.setItem(USER_KEY, JSON.stringify(user.value))
      isAuthenticated.value = true
    }
  }

  function applyUser(payload: {
    id?: string | number
    email: string
    fullName?: string
    phone?: string
    role?: string
    groupId?: string | number
    groupName?: string
  }) {
    const emailName = payload.email.split('@')[0] || 'User'
    user.value = {
      id: String(payload.id ?? user.value?.id ?? ''),
      fullName: payload.fullName?.trim() || emailName,
      email: payload.email.trim(),
      phone: payload.phone?.trim() || '',
      memberSince:
        user.value?.memberSince ||
        new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      role: normalizeRole(payload.role ?? user.value?.role),
      groupId: String(payload.groupId ?? user.value?.groupId ?? ''),
      groupName: String(payload.groupName ?? user.value?.groupName ?? ''),
    }
    persist()
  }

  function login(payload: {
    id?: string | number
    email: string
    fullName?: string
    phone?: string
    role?: string
    groupId?: string | number
    groupName?: string
  }) {
    applyUser(payload)
  }

  function register(payload: {
    id?: string | number
    fullName: string
    email: string
    role?: string
    groupId?: string | number
    groupName?: string
  }) {
    applyUser({
      ...payload,
      phone: '',
    })
  }

  function updateProfile(payload: Partial<UserProfile>) {
    if (!user.value) return
    user.value = { ...user.value, ...payload }
    persist()
  }

  function logout() {
    user.value = null
    isAuthenticated.value = false
    sessionStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(USER_KEY)
    localStorage.removeItem('ssms_token')
    localStorage.removeItem('ssms_remember_email')
  }

  async function hydrateFromApi() {
    const token = localStorage.getItem('ssms_token')
    if (!token) return

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/me`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) return

      const payload = await response.json()
      const apiUser = payload?.data
      if (!apiUser) return

      applyUser({
        id: apiUser.user_id ?? apiUser.id,
        fullName: apiUser.name,
        email: apiUser.email,
        phone: apiUser.contact_number || '',
        role: apiUser.role,
        groupId: apiUser.user_group_id ?? apiUser.user_group?.user_group_id,
        groupName: apiUser.user_group?.name,
      })
    } catch {
      // ignore hydrate failures; login flow still works
    }
  }

  return {
    user,
    isAuthenticated,
    isAdmin,
    displayName,
    initials,
    login,
    register,
    updateProfile,
    logout,
    hydrateFromApi,
  }
})
