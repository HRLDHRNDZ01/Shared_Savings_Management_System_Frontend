import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserProfile } from '@/types'
import { getInitials } from '@/utils/format'

const AUTH_KEY = 'ssms_authenticated'
const USER_KEY = 'ssms_user'

function readStoredUser(): UserProfile | null {
  const raw = sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(readStoredUser())
  const isAuthenticated = ref(sessionStorage.getItem(AUTH_KEY) === 'true' && Boolean(user.value))

  const displayName = computed(() => user.value?.fullName || 'User')
  const initials = computed(() => getInitials(displayName.value))

  function persist() {
    if (user.value) {
      sessionStorage.setItem(AUTH_KEY, 'true')
      sessionStorage.setItem(USER_KEY, JSON.stringify(user.value))
      isAuthenticated.value = true
    }
  }

  function login(payload: { email: string; fullName?: string; phone?: string }) {
    const emailName = payload.email.split('@')[0] || 'User'
    user.value = {
      fullName: payload.fullName?.trim() || emailName,
      email: payload.email.trim(),
      phone: payload.phone?.trim() || '',
      memberSince: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    }
    persist()
  }

  function register(payload: { fullName: string; email: string }) {
    user.value = {
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      phone: '',
      memberSince: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    }
    persist()
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
  }

  return {
    user,
    isAuthenticated,
    displayName,
    initials,
    login,
    register,
    updateProfile,
    logout,
  }
})
