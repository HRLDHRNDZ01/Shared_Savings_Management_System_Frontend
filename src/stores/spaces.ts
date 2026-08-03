import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { SavingsSpace, SpaceMember, SpaceType } from '@/types'
import { apiFetch } from '@/utils/api'

function mapMember(raw: Record<string, unknown>): SpaceMember {
  const user =
    raw.user && typeof raw.user === 'object'
      ? (raw.user as Record<string, unknown>)
      : null
  const roleRaw = String(raw.role ?? 'member').toLowerCase()
  const role = roleRaw === 'owner' ? 'owner' : 'member'

  return {
    id: String(raw.space_member_id ?? raw.id ?? `${raw.user_id ?? user?.user_id ?? ''}-${role}`),
    userId: String(raw.user_id ?? user?.user_id ?? user?.id ?? ''),
    name: String(user?.name ?? raw.name ?? (role === 'owner' ? 'Owner' : 'Member')),
    email: String(user?.email ?? raw.email ?? ''),
    role,
  }
}

function mapSpace(raw: Record<string, unknown>): SavingsSpace {
  const typeRaw = String(raw.type ?? raw.space_type ?? 'Personal')
  const type: SpaceType = /shared/i.test(typeRaw) ? 'Shared' : 'Personal'
  const membersRaw = Array.isArray(raw.members) ? raw.members : []

  return {
    id: String(raw.space_id ?? raw.id ?? ''),
    name: String(raw.name ?? raw.title ?? 'Untitled'),
    balance: Number(raw.balance ?? raw.current_balance ?? 0),
    goal: Number(raw.target_amount ?? raw.goal ?? 0),
    type,
    members: membersRaw.map((item) => mapMember(item as Record<string, unknown>)),
  }
}

export const useSpacesStore = defineStore('spaces', () => {
  const spaces = ref<SavingsSpace[]>([])
  const apiTotalBalance = ref(0)
  const apiSpaceCount = ref(0)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')

  const personalSpaces = computed(() => spaces.value.filter((space) => space.type === 'Personal'))
  const sharedSpaces = computed(() => spaces.value.filter((space) => space.type === 'Shared'))
  const totalBalance = computed(() => apiTotalBalance.value)
  const recentSpaces = computed(() => spaces.value.slice(0, 3))

  function setSpaceMembers(spaceId: string, members: SpaceMember[]) {
    spaces.value = spaces.value.map((space) =>
      space.id === spaceId ? { ...space, members } : space,
    )
  }

  async function fetchSpaces() {
    isLoading.value = true
    error.value = ''
    try {
      const response = await apiFetch('/api/spaces')
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to load savings spaces.')
      }

      const data = payload?.data ?? {}
      const list = Array.isArray(data.spaces) ? data.spaces : []

      spaces.value = list.map((item: Record<string, unknown>) => mapSpace(item))
      apiTotalBalance.value = Number(data.total_balance ?? 0)
      apiSpaceCount.value = Number(data.space_count ?? spaces.value.length)
    } catch {
      error.value = 'Unable to load savings spaces.'
      spaces.value = []
      apiTotalBalance.value = 0
      apiSpaceCount.value = 0
    } finally {
      isLoading.value = false
    }
  }

  async function createSpace(payload: {
    name: string
    type: SpaceType
    targetAmount: number
  }) {
    isSaving.value = true
    error.value = ''
    try {
      const response = await apiFetch('/api/spaces', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name.trim(),
          type: payload.type.toLowerCase(),
          target_amount: payload.targetAmount,
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to create space.')
      }

      await fetchSpaces()

      const created = data?.data
      const spaceId = String(created?.space_id ?? created?.id ?? '')
      if (spaceId && Array.isArray(created?.members)) {
        setSpaceMembers(
          spaceId,
          created.members.map((item: Record<string, unknown>) => mapMember(item)),
        )
      }

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to create space.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  function clear() {
    spaces.value = []
    apiTotalBalance.value = 0
    apiSpaceCount.value = 0
    error.value = ''
  }

  return {
    spaces,
    apiSpaceCount,
    isLoading,
    isSaving,
    error,
    personalSpaces,
    sharedSpaces,
    totalBalance,
    recentSpaces,
    fetchSpaces,
    createSpace,
    setSpaceMembers,
    clear,
  }
})
