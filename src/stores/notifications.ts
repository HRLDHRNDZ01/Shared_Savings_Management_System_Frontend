import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AppNotification } from '@/types'
import { apiFetch } from '@/utils/api'

function mapNotification(raw: Record<string, unknown>): AppNotification {
  const unread =
    typeof raw.unread === 'boolean'
      ? raw.unread
      : raw.read_at == null && raw.is_read !== true && raw.read !== true

  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? raw.subject ?? 'Notification'),
    detail: String(raw.detail ?? raw.message ?? raw.body ?? ''),
    time: String(raw.time ?? raw.created_at ?? ''),
    unread,
  }
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<AppNotification[]>([])
  const apiUnreadCount = ref(0)
  const isLoading = ref(false)
  const error = ref('')

  const unreadCount = computed(() =>
    notifications.value.length
      ? notifications.value.filter((n) => n.unread).length
      : apiUnreadCount.value,
  )
  const recentNotifications = computed(() => notifications.value.slice(0, 5))

  async function fetchNotifications() {
    isLoading.value = true
    error.value = ''
    try {
      const response = await apiFetch('/api/notifications')
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to load notifications.')
      }

      const data = payload?.data ?? {}
      const list = Array.isArray(data.recent_notifications)
        ? data.recent_notifications
        : Array.isArray(data.notifications)
          ? data.notifications
          : []

      notifications.value = list.map((item: Record<string, unknown>) => mapNotification(item))
      apiUnreadCount.value = Number(data.unread_count ?? 0)
    } catch {
      error.value = 'Unable to load notifications.'
      notifications.value = []
      apiUnreadCount.value = 0
    } finally {
      isLoading.value = false
    }
  }

  function markAllAsRead() {
    notifications.value = notifications.value.map((note) => ({ ...note, unread: false }))
    apiUnreadCount.value = 0
  }

  function clear() {
    notifications.value = []
    apiUnreadCount.value = 0
    error.value = ''
  }

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    recentNotifications,
    fetchNotifications,
    markAllAsRead,
    clear,
  }
})
