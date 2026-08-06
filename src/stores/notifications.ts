import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AppNotification } from '@/types'
import { apiFetch } from '@/utils/api'
import { connectEcho, disconnectEcho } from '@/utils/echo'
import { useAuthStore } from '@/stores/auth'

function mapNotification(raw: Record<string, unknown>): AppNotification {
  const unread =
    typeof raw.unread === 'boolean'
      ? raw.unread
      : raw.read_at == null && raw.is_read !== true && raw.read !== true

  return {
    id: String(raw.notification_id ?? raw.id ?? ''),
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
  const isRealtimeConnected = ref(false)

  const unreadCount = computed(() =>
    notifications.value.length
      ? notifications.value.filter((n) => n.unread).length
      : apiUnreadCount.value,
  )
  const recentNotifications = computed(() => notifications.value.slice(0, 5))

  function prependNotification(raw: Record<string, unknown>) {
    const mapped = mapNotification(raw)
    if (!mapped.id) return

    const exists = notifications.value.some((n) => n.id === mapped.id)
    if (exists) return

    notifications.value = [mapped, ...notifications.value]
    if (mapped.unread) {
      apiUnreadCount.value += 1
    }
  }

  async function fetchNotifications(options: { silent?: boolean } = {}) {
    if (!options.silent) {
      isLoading.value = true
    }
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
      if (!options.silent) {
        error.value = 'Unable to load notifications.'
        notifications.value = []
        apiUnreadCount.value = 0
      }
    } finally {
      isLoading.value = false
    }
  }

  function startRealtime() {
    const auth = useAuthStore()
    const userId = auth.user?.id
    if (!userId) return

    const echo = connectEcho()
    if (!echo) return

    echo
      .private(`users.${userId}`)
      .listen('.notification.created', (payload: { notification?: Record<string, unknown> }) => {
        if (payload?.notification) {
          prependNotification(payload.notification)
        }
      })

    isRealtimeConnected.value = true
  }

  function stopRealtime() {
    const auth = useAuthStore()
    disconnectEcho(auth.user?.id)
    isRealtimeConnected.value = false
  }

  function markAllAsRead() {
    notifications.value = notifications.value.map((note) => ({ ...note, unread: false }))
    apiUnreadCount.value = 0
  }

  function clear() {
    stopRealtime()
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
    isRealtimeConnected,
    fetchNotifications,
    startRealtime,
    stopRealtime,
    markAllAsRead,
    clear,
    prependNotification,
  }
})
