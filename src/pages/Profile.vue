<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const form = reactive({
  fullName: auth.user?.fullName || '',
  email: auth.user?.email || '',
  phone: auth.user?.phone || '',
})
const isSaving = ref(false)
const formError = ref('')
const formSuccess = ref('')

watch(
  () => auth.user,
  (user) => {
    form.fullName = user?.fullName || ''
    form.email = user?.email || ''
    form.phone = user?.phone || ''
  },
)

async function loadProfile() {
  const token = localStorage.getItem('ssms_token')
  if (!token) return

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) return

    const data = await response.json()
    const user = data?.data
    if (!user) return

    auth.updateProfile({
      fullName: user.name || '',
      email: user.email || '',
      phone: user.contact_number || '',
    })
    form.fullName = user.name || ''
    form.email = user.email || ''
    form.phone = user.contact_number || ''
  } catch {
    // Keep local profile values if fetch fails.
  }
}

async function saveProfile() {
  formError.value = ''
  formSuccess.value = ''

  const token = localStorage.getItem('ssms_token')
  if (!token) {
    formError.value = 'You are not logged in. Please sign in again.'
    return
  }

  isSaving.value = true

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: form.fullName.trim(),
        email: form.email.trim(),
        contact_number: form.phone.trim(),
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(data?.message || 'Failed to save profile')
    }

    const user = data?.data
    auth.updateProfile({
      fullName: user?.name || form.fullName.trim(),
      email: user?.email || form.email.trim(),
      phone: user?.contact_number || form.phone.trim(),
    })
    form.phone = user?.contact_number || form.phone.trim()
    formSuccess.value = data?.message || 'Profile updated successfully.'
  } catch (error) {
    formError.value =
      error instanceof Error && error.message
        ? error.message
        : 'Unable to save profile. Please try again.'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  void loadProfile()
})
</script>

<template>
  <main class="page">
    <header class="page__header">
      <div>
        <h1>Profile</h1>
        <p>View and update your SaveSpace account details.</p>
      </div>
      <button type="button" class="btn" :disabled="isSaving" @click="saveProfile">
        {{ isSaving ? 'Saving…' : 'Save Changes' }}
      </button>
    </header>

    <section class="panel">
      <div class="avatar-row">
        <div class="avatar">{{ auth.initials }}</div>
        <div>
          <h2>{{ auth.displayName }}</h2>
          <p v-if="auth.user?.memberSince">Member since {{ auth.user.memberSince }}</p>
          <p v-else>Sign in to manage your profile.</p>
        </div>
      </div>

      <p v-if="formError" class="form-alert form-alert--error" role="alert">{{ formError }}</p>
      <p v-if="formSuccess" class="form-alert form-alert--success" role="status">{{ formSuccess }}</p>

      <form class="form" @submit.prevent="saveProfile">
        <label>
          Full name
          <input v-model="form.fullName" type="text" autocomplete="name" />
        </label>
        <label>
          Email
          <input v-model="form.email" type="email" autocomplete="email" />
        </label>
        <label>
          Phone
          <input v-model="form.phone" type="tel" autocomplete="tel" />
        </label>
      </form>
    </section>
  </main>
</template>

<style scoped>
.page {
  --ss-ink: #10231c;
  --ss-muted: #4d6359;
  --ss-accent: #0f7a5a;
  --ss-accent-deep: #0a5c44;
  --ss-line: rgba(16, 35, 28, 0.1);
  --ss-surface: #fffdf9;

  padding: 1.25rem;
  display: grid;
  gap: 1.15rem;
  color: var(--ss-ink);
  font-family: 'Manrope', sans-serif;
  animation: rise 420ms ease-out;
}

.page__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: end;
}

.page__header h1 {
  margin: 0 0 0.3rem;
  font-family: 'Fraunces', serif;
  font-size: clamp(1.45rem, 3vw, 1.85rem);
}

.page__header p {
  margin: 0;
  color: var(--ss-muted);
}

.btn {
  border: 0;
  border-radius: 0.75rem;
  padding: 0.7rem 1rem;
  background: linear-gradient(135deg, var(--ss-accent), var(--ss-accent-deep));
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.form-alert {
  margin: 0 0 1rem;
  border-radius: 0.7rem;
  padding: 0.75rem 0.9rem;
  font-size: 0.9rem;
}

.form-alert--error {
  background: rgba(176, 42, 55, 0.1);
  color: #8f1f2b;
}

.form-alert--success {
  background: rgba(15, 122, 90, 0.12);
  color: var(--ss-accent-deep);
}

.panel {
  border: 1px solid var(--ss-line);
  border-radius: 1rem;
  background: var(--ss-surface);
  padding: 1.15rem;
  max-width: 40rem;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 1.25rem;
}

.avatar {
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--ss-accent), var(--ss-accent-deep));
  color: #fff;
  font-weight: 700;
  font-size: 1.05rem;
}

.avatar-row h2 {
  margin: 0 0 0.2rem;
  font-size: 1.1rem;
}

.avatar-row p {
  margin: 0;
  color: var(--ss-muted);
  font-size: 0.9rem;
}

.form {
  display: grid;
  gap: 0.9rem;
}

.form label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.88rem;
  font-weight: 600;
}

.form input {
  border: 1px solid var(--ss-line);
  border-radius: 0.7rem;
  padding: 0.8rem 0.9rem;
  font: inherit;
  background: #fff;
}

.form input:focus {
  outline: none;
  border-color: var(--ss-accent);
  box-shadow: 0 0 0 3px rgba(15, 122, 90, 0.14);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
