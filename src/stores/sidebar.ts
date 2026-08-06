import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { SidebarMenuItem, UserGroup } from '@/types'
import { apiFetch } from '@/utils/api'

function mapMenu(raw: Record<string, unknown>): SidebarMenuItem {
  return {
    id: String(raw.sidebar_menu_id ?? raw.id ?? ''),
    key: String(raw.key ?? ''),
    label: String(raw.label ?? ''),
    icon: String(raw.icon ?? '•'),
    routeName: String(raw.route_name ?? raw.key ?? ''),
    sortOrder: Number(raw.sort_order ?? 0),
  }
}

function mapGroup(raw: Record<string, unknown>): UserGroup {
  const menus = Array.isArray(raw.sidebar_menus) ? raw.sidebar_menus : []
  return {
    id: String(raw.user_group_id ?? raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    isActive: raw.is_active !== false,
    userCount: Number(raw.users_count ?? 0),
    menuIds: menus.map((menu) =>
      String((menu as Record<string, unknown>).sidebar_menu_id ?? (menu as Record<string, unknown>).id ?? ''),
    ),
  }
}

export const useSidebarStore = defineStore('sidebar', () => {
  const menus = ref<SidebarMenuItem[]>([])
  const availableMenus = ref<SidebarMenuItem[]>([])
  const groups = ref<UserGroup[]>([])
  const users = ref<
    Array<{ id: string; name: string; email: string; role: string; groupId: string; groupName: string }>
  >([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')

  const navItems = computed(() =>
    menus.value.map((menu) => ({
      name: menu.routeName,
      label: menu.label,
      icon: menu.icon,
      key: menu.key,
    })),
  )

  async function fetchMySidebar() {
    isLoading.value = true
    error.value = ''
    try {
      const response = await apiFetch('/api/me/sidebar')
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to load sidebar.')
      }
      const list = Array.isArray(payload?.data?.menus) ? payload.data.menus : []
      menus.value = list.map((item: Record<string, unknown>) => mapMenu(item))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to load sidebar.'
      menus.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMaintenanceData() {
    isLoading.value = true
    error.value = ''
    try {
      const [menusRes, groupsRes, usersRes] = await Promise.all([
        apiFetch('/api/admin/sidebar-menus'),
        apiFetch('/api/admin/user-groups'),
        apiFetch('/api/admin/users'),
      ])

      const menusPayload = await menusRes.json().catch(() => null)
      const groupsPayload = await groupsRes.json().catch(() => null)
      const usersPayload = await usersRes.json().catch(() => null)

      if (!menusRes.ok || !groupsRes.ok || !usersRes.ok) {
        throw new Error('Unable to load maintenance data.')
      }

      availableMenus.value = (Array.isArray(menusPayload?.data) ? menusPayload.data : []).map(
        (item: Record<string, unknown>) => mapMenu(item),
      )
      groups.value = (Array.isArray(groupsPayload?.data) ? groupsPayload.data : []).map(
        (item: Record<string, unknown>) => mapGroup(item),
      )
      users.value = (Array.isArray(usersPayload?.data) ? usersPayload.data : []).map(
        (item: Record<string, unknown>) => {
          const group =
            item.user_group && typeof item.user_group === 'object'
              ? (item.user_group as Record<string, unknown>)
              : null
          return {
            id: String(item.user_id ?? item.id ?? ''),
            name: String(item.name ?? ''),
            email: String(item.email ?? ''),
            role: String(item.role ?? 'user'),
            groupId: String(item.user_group_id ?? group?.user_group_id ?? ''),
            groupName: String(group?.name ?? ''),
          }
        },
      )
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to load maintenance data.'
    } finally {
      isLoading.value = false
    }
  }

  async function createGroup(payload: { name: string; description?: string; menuIds: string[] }) {
    isSaving.value = true
    error.value = ''
    try {
      const response = await apiFetch('/api/admin/user-groups', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          description: payload.description || null,
          menu_ids: payload.menuIds.map((id) => Number(id)),
          is_active: true,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to create group.')
      }
      await fetchMaintenanceData()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to create group.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function syncGroupMenus(groupId: string, menuIds: string[]) {
    isSaving.value = true
    error.value = ''
    try {
      const response = await apiFetch(`/api/admin/user-groups/${groupId}/menus`, {
        method: 'PUT',
        body: JSON.stringify({
          menu_ids: menuIds.map((id) => Number(id)),
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to update group menus.')
      }
      await fetchMaintenanceData()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to update group menus.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function assignUserGroup(userId: string, groupId: string | null) {
    isSaving.value = true
    error.value = ''
    try {
      const response = await apiFetch(`/api/admin/users/${userId}/group`, {
        method: 'PUT',
        body: JSON.stringify({
          user_group_id: groupId ? Number(groupId) : null,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to assign user group.')
      }
      await fetchMaintenanceData()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to assign user group.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  function clear() {
    menus.value = []
    availableMenus.value = []
    groups.value = []
    users.value = []
    error.value = ''
  }

  return {
    menus,
    availableMenus,
    groups,
    users,
    isLoading,
    isSaving,
    error,
    navItems,
    fetchMySidebar,
    fetchMaintenanceData,
    createGroup,
    syncGroupMenus,
    assignUserGroup,
    clear,
  }
})
