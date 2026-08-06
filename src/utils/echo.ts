import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { getAuthToken } from '@/utils/api'

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

let echoInstance: Echo<'reverb'> | null = null

export function getEcho(): Echo<'reverb'> | null {
  return echoInstance
}

export function connectEcho(): Echo<'reverb'> | null {
  const token = getAuthToken()
  if (!token) return null

  if (echoInstance) {
    return echoInstance
  }

  window.Pusher = Pusher

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_API_BASE_URL}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  })

  return echoInstance
}

export function disconnectEcho(userId?: string | number | null) {
  if (!echoInstance) return

  if (userId != null && String(userId) !== '') {
    echoInstance.leave(`users.${userId}`)
  }

  echoInstance.disconnect()
  echoInstance = null
}
