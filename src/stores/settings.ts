import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserSettings } from '@/types'

const defaultSettings: UserSettings = {
  emailAlerts: true,
  pushAlerts: true,
  weeklySummary: true,
  sharedSpaceInvites: true,
  currency: 'PHP',
  language: 'English',
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>({ ...defaultSettings })
  const isLoading = ref(false)
  const error = ref('')

  async function fetchSettings() {
    isLoading.value = true
    error.value = ''
    try {
      // Replace with API call when backend is ready
      settings.value = { ...defaultSettings }
    } catch {
      error.value = 'Unable to load settings.'
    } finally {
      isLoading.value = false
    }
  }

  function updateSettings(payload: Partial<UserSettings>) {
    settings.value = { ...settings.value, ...payload }
  }

  function reset() {
    settings.value = { ...defaultSettings }
    error.value = ''
  }

  return {
    settings,
    isLoading,
    error,
    fetchSettings,
    updateSettings,
    reset,
  }
})
