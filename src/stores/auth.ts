import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserProfile } from '@/types'
import { fullNameFromParts, getInitials } from '@/utils/format'

const AUTH_KEY = 'ssms_authenticated'
const USER_KEY = 'ssms_user'

function normalizeRole(role: unknown): 'admin' | 'user' {
  return String(role ?? '').toLowerCase() === 'admin' ? 'admin' : 'user'
}

function splitLegacyFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0] ?? '', lastName: '' }
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  }
}

function mapApiUser(raw: Record<string, unknown>, fallback?: Partial<UserProfile>): UserProfile {
  const email = String(raw.email ?? fallback?.email ?? '').trim()
  const emailName = email.split('@')[0] || 'User'
  const firstName = String(raw.first_name ?? fallback?.firstName ?? '').trim()
  const lastName = String(raw.last_name ?? fallback?.lastName ?? '').trim()
  const legacyFullName = String(raw.name ?? fallback?.fullName ?? '').trim()
  const resolvedFirstName = firstName || splitLegacyFullName(legacyFullName).firstName
  const resolvedLastName = lastName || splitLegacyFullName(legacyFullName).lastName
  const fullName =
    legacyFullName ||
    fullNameFromParts(resolvedFirstName, resolvedLastName) ||
    String(raw.username ?? fallback?.username ?? emailName)

  return {
    id: String(raw.user_id ?? raw.id ?? fallback?.id ?? ''),
    username: String(raw.username ?? fallback?.username ?? emailName),
    firstName: resolvedFirstName,
    lastName: resolvedLastName,
    fullName,
    email,
    phone: String(raw.contact_number ?? fallback?.phone ?? '').trim(),
    memberSince:
      fallback?.memberSince ||
      new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    role: normalizeRole(raw.role ?? fallback?.role),
    groupId: String(
      raw.user_group_id ??
        (raw.user_group as Record<string, unknown> | undefined)?.user_group_id ??
        fallback?.groupId ??
        '',
    ),
    groupName: String(
      (raw.user_group as Record<string, unknown> | undefined)?.name ?? fallback?.groupName ?? '',
    ),
  }
}

function readStoredUser(): UserProfile | null {
  const raw = sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<UserProfile>
    if (!parsed.email) return null
    return mapApiUser({}, parsed)
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(readStoredUser())
  const isAuthenticated = ref(sessionStorage.getItem(AUTH_KEY) === 'true' && Boolean(user.value))

  const displayName = computed(
    () =>
      fullNameFromParts(user.value?.firstName ?? '', user.value?.lastName ?? '') ||
      user.value?.fullName ||
      user.value?.username ||
      'User',
  )
  const initials = computed(() => getInitials(displayName.value))
  const isAdmin = computed(() => user.value?.role === 'admin')

  function persist() {
    if (user.value) {
      sessionStorage.setItem(AUTH_KEY, 'true')
      sessionStorage.setItem(USER_KEY, JSON.stringify(user.value))
      isAuthenticated.value = true
    }
  }

  function applyUser(payload: Record<string, unknown>) {
    user.value = mapApiUser(payload, user.value ?? undefined)
    persist()
  }

  function login(payload: Record<string, unknown>) {
    applyUser(payload)
  }

  function register(payload: Record<string, unknown>) {
    applyUser({ ...payload, contact_number: payload.contact_number ?? '' })
  }

  function updateProfile(payload: Partial<UserProfile>) {
    if (!user.value) return
    user.value = {
      ...user.value,
      ...payload,
      fullName:
        payload.fullName ??
        (fullNameFromParts(
          payload.firstName ?? user.value.firstName,
          payload.lastName ?? user.value.lastName,
        ) || user.value.fullName),
    }
    persist()
  }

  function logout() {
    user.value = null
    isAuthenticated.value = false
    sessionStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(USER_KEY)
    localStorage.removeItem('ssms_token')
    localStorage.removeItem('ssms_remember_username')
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

      applyUser(apiUser)
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
