export type SpaceType = 'Personal' | 'Shared'

export interface UserProfile {
  id: string
  fullName: string
  email: string
  phone: string
  memberSince: string
  role: 'admin' | 'user'
  groupId: string
  groupName: string
}

export interface SidebarMenuItem {
  id: string
  key: string
  label: string
  icon: string
  routeName: string
  sortOrder: number
}

export interface UserGroup {
  id: string
  name: string
  description: string
  isActive: boolean
  userCount: number
  menuIds: string[]
}

export interface SavingsSpace {
  id: string
  name: string
  balance: number
  goal: number
  type: SpaceType
  members: SpaceMember[]
}

export type TransactionType = 'credit' | 'debit'

export interface Transaction {
  id: string
  spaceId: string
  spaceName: string
  amount: number
  type: TransactionType
  note: string
  date: string
}

export interface AppNotification {
  id: string
  title: string
  detail: string
  time: string
  unread: boolean
}

export type InviteStatus = 'pending' | 'accepted' | 'declined'

export interface SpaceInvite {
  id: string
  spaceId: string
  spaceName: string
  inviteeName: string
  inviteeEmail: string
  invitedBy: string
  status: InviteStatus
  createdAt: string
}

export interface SpaceMember {
  id: string
  userId: string
  name: string
  email: string
  role: 'owner' | 'member'
}

export interface UserSearchResult {
  id: string
  name: string
  email: string
}

export interface UserSettings {
  emailAlerts: boolean
  pushAlerts: boolean
  weeklySummary: boolean
  sharedSpaceInvites: boolean
  currency: 'PHP' | 'USD'
  language: 'English' | 'Filipino'
}
