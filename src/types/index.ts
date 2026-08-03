export type SpaceType = 'Personal' | 'Shared'

export interface UserProfile {
  fullName: string
  email: string
  phone: string
  memberSince: string
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
