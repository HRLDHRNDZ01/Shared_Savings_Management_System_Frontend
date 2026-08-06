import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { InviteStatus, SpaceInvite, SpaceMember, UserSearchResult } from '@/types'
import { apiFetch } from '@/utils/api'
import { connectEcho } from '@/utils/echo'
import { useAuthStore } from '@/stores/auth'

function mapInvite(raw: Record<string, unknown>): SpaceInvite {
  const space =
    raw.space && typeof raw.space === 'object'
      ? (raw.space as Record<string, unknown>)
      : null
  const invitee =
    raw.invitee && typeof raw.invitee === 'object'
      ? (raw.invitee as Record<string, unknown>)
      : raw.invited_user && typeof raw.invited_user === 'object'
        ? (raw.invited_user as Record<string, unknown>)
        : raw.user && typeof raw.user === 'object'
          ? (raw.user as Record<string, unknown>)
          : null
  const inviter =
    raw.invited_by && typeof raw.invited_by === 'object'
      ? (raw.invited_by as Record<string, unknown>)
      : raw.inviter && typeof raw.inviter === 'object'
        ? (raw.inviter as Record<string, unknown>)
        : null

  const statusRaw = String(raw.status ?? 'pending').toLowerCase()
  const status: InviteStatus =
    statusRaw === 'accepted' || statusRaw === 'declined' ? statusRaw : 'pending'

  return {
    id: String(raw.space_invitation_id ?? raw.invite_id ?? raw.id ?? ''),
    spaceId: String(raw.space_id ?? space?.space_id ?? space?.id ?? ''),
    spaceName: String(raw.space_name ?? space?.name ?? 'Shared space'),
    inviteeName: String(raw.invitee_name ?? invitee?.name ?? raw.name ?? 'User'),
    inviteeEmail: String(raw.invitee_email ?? invitee?.email ?? raw.email ?? ''),
    invitedBy: String(
      raw.invited_by_name ?? inviter?.name ?? raw.inviter_name ?? 'Someone',
    ),
    status,
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
  }
}

function mapMember(raw: Record<string, unknown>): SpaceMember {
  const user =
    raw.user && typeof raw.user === 'object'
      ? (raw.user as Record<string, unknown>)
      : null
  const roleRaw = String(raw.role ?? 'member').toLowerCase()
  const role = roleRaw === 'owner' ? 'owner' : 'member'

  return {
    id: String(raw.space_member_id ?? raw.id ?? ''),
    userId: String(raw.user_id ?? user?.user_id ?? user?.id ?? ''),
    name: String(user?.name ?? raw.name ?? (role === 'owner' ? 'Owner' : 'Member')),
    email: String(user?.email ?? raw.email ?? ''),
    role,
  }
}

function mapUser(raw: Record<string, unknown>): UserSearchResult {
  return {
    id: String(raw.user_id ?? raw.id ?? ''),
    name: String(raw.name ?? raw.full_name ?? 'User'),
    email: String(raw.email ?? ''),
  }
}

export const useInvitesStore = defineStore('invites', () => {
  const invites = ref<SpaceInvite[]>([])
  const membersBySpace = ref<Record<string, SpaceMember[]>>({})
  const userResults = ref<UserSearchResult[]>([])
  const isLoading = ref(false)
  const isSearching = ref(false)
  const isSaving = ref(false)
  const error = ref('')

  const pendingInvites = computed(() =>
    invites.value.filter((invite) => invite.status === 'pending'),
  )

  async function fetchInvites() {
    isLoading.value = true
    error.value = ''
    try {
      const response = await apiFetch('/api/invitations')
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to load invitations.')
      }

      const data = payload?.data ?? payload
      const list = Array.isArray(data?.invitations)
        ? data.invitations
        : Array.isArray(data?.invites)
          ? data.invites
          : Array.isArray(data)
            ? data
            : []

      invites.value = list.map((item: Record<string, unknown>) => mapInvite(item))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to load invitations.'
      invites.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function searchUsers(query: string) {
    const q = query.trim()
    if (q.length < 2) {
      userResults.value = []
      return
    }

    isSearching.value = true
    error.value = ''
    try {
      const response = await apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`)
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to search users.')
      }

      const data = payload?.data ?? payload
      const list = Array.isArray(data?.users)
        ? data.users
        : Array.isArray(data)
          ? data
          : []

      userResults.value = list.map((item: Record<string, unknown>) => mapUser(item))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to search users.'
      userResults.value = []
      throw err
    } finally {
      isSearching.value = false
    }
  }

  async function fetchMembers(spaceId: string) {
    error.value = ''
    try {
      const response = await apiFetch(`/api/spaces/${spaceId}/members`)
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to load members.')
      }

      const data = payload?.data ?? payload
      const list = Array.isArray(data?.members)
        ? data.members
        : Array.isArray(data)
          ? data
          : []

      const mapped = list.map((item: Record<string, unknown>) => mapMember(item))
      membersBySpace.value = {
        ...membersBySpace.value,
        [spaceId]: mapped,
      }
      return mapped
    } catch (err) {
      // Keep any members already known (e.g. from create response).
      if (!membersBySpace.value[spaceId]) {
        membersBySpace.value = {
          ...membersBySpace.value,
          [spaceId]: [],
        }
      }
      // Don't surface as a page-blocking error if we still have local members.
      if (!(membersBySpace.value[spaceId] || []).length) {
        error.value = err instanceof Error ? err.message : 'Unable to load members.'
      }
      return membersBySpace.value[spaceId] || []
    }
  }

  function setMembers(spaceId: string, members: SpaceMember[]) {
    membersBySpace.value = {
      ...membersBySpace.value,
      [spaceId]: members,
    }
  }

  /** Invite an existing user by email (in-app only; no email is sent). */
  async function inviteMember(spaceId: string, email: string) {
    isSaving.value = true
    error.value = ''
    try {
      const response = await apiFetch(`/api/spaces/${spaceId}/invitations`, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to send invitation.')
      }

      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to send invitation.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function acceptInvite(invitationId: string) {
    isSaving.value = true
    error.value = ''
    try {
      const response = await apiFetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to accept invitation.')
      }

      invites.value = invites.value.filter((invite) => invite.id !== invitationId)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to accept invitation.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function declineInvite(invitationId: string) {
    isSaving.value = true
    error.value = ''
    try {
      const response = await apiFetch(`/api/invitations/${invitationId}/decline`, {
        method: 'POST',
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to decline invitation.')
      }

      invites.value = invites.value.filter((invite) => invite.id !== invitationId)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to decline invitation.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  function clearUserResults() {
    userResults.value = []
  }

  function upsertInvite(raw: Record<string, unknown>) {
    const mapped = mapInvite(raw)
    if (!mapped.id) return

    const index = invites.value.findIndex((invite) => invite.id === mapped.id)
    if (mapped.status !== 'pending') {
      if (index >= 0) {
        invites.value = invites.value.filter((invite) => invite.id !== mapped.id)
      }
      return
    }

    if (index >= 0) {
      const next = [...invites.value]
      next[index] = mapped
      invites.value = next
      return
    }

    invites.value = [mapped, ...invites.value]
  }

  function startRealtime() {
    const auth = useAuthStore()
    const userId = auth.user?.id
    if (!userId) return

    const echo = connectEcho()
    if (!echo) return

    echo
      .private(`users.${userId}`)
      .listen('.invitation.created', (payload: { invitation?: Record<string, unknown> }) => {
        if (payload?.invitation) {
          upsertInvite(payload.invitation)
        }
      })
      .listen('.invitation.updated', (payload: { invitation?: Record<string, unknown> }) => {
        if (payload?.invitation) {
          upsertInvite(payload.invitation)
        }
      })
  }

  function stopRealtime() {
    // Shared Echo connection is torn down by notifications.stopRealtime / disconnectEcho.
  }

  function clear() {
    invites.value = []
    membersBySpace.value = {}
    userResults.value = []
    error.value = ''
  }

  return {
    invites,
    membersBySpace,
    userResults,
    isLoading,
    isSearching,
    isSaving,
    error,
    pendingInvites,
    fetchInvites,
    searchUsers,
    fetchMembers,
    setMembers,
    inviteMember,
    acceptInvite,
    declineInvite,
    clearUserResults,
    startRealtime,
    stopRealtime,
    clear,
  }
})
