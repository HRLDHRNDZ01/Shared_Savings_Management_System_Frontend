<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const acceptTerms = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const touched = ref({
  username: false,
  firstName: false,
  lastName: false,
  email: false,
  password: false,
  confirmPassword: false,
  acceptTerms: false,
})

const usernameError = computed(() => {
  if (!touched.value.username) return ''
  if (!username.value.trim()) return 'Username is required.'
  if (username.value.trim().length < 3) return 'Username must be at least 3 characters.'
  if (!/^[a-zA-Z0-9_-]+$/.test(username.value.trim())) {
    return 'Username may only contain letters, numbers, dashes, and underscores.'
  }
  return ''
})

const firstNameError = computed(() => {
  if (!touched.value.firstName) return ''
  if (!firstName.value.trim()) return 'First name is required.'
  return ''
})

const lastNameError = computed(() => {
  if (!touched.value.lastName) return ''
  if (!lastName.value.trim()) return 'Last name is required.'
  return ''
})

const emailError = computed(() => {
  if (!touched.value.email) return ''
  if (!email.value.trim()) return 'Email address is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    return 'Enter a valid email address.'
  }
  return ''
})

const passwordError = computed(() => {
  if (!touched.value.password) return ''
  if (!password.value) return 'Password is required.'
  if (password.value.length < 8) return 'Password must be at least 8 characters.'
  return ''
})

const confirmPasswordError = computed(() => {
  if (!touched.value.confirmPassword) return ''
  if (!confirmPassword.value) return 'Please confirm your password.'
  if (confirmPassword.value !== password.value) return 'Passwords do not match.'
  return ''
})

const termsError = computed(() => {
  if (!touched.value.acceptTerms) return ''
  if (!acceptTerms.value) return 'You must accept the terms to continue.'
  return ''
})

const isFormValid = computed(
  () =>
    username.value.trim().length >= 3 &&
    /^[a-zA-Z0-9_-]+$/.test(username.value.trim()) &&
    Boolean(firstName.value.trim()) &&
    Boolean(lastName.value.trim()) &&
    Boolean(email.value.trim()) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) &&
    password.value.length >= 8 &&
    confirmPassword.value === password.value &&
    acceptTerms.value,
)

async function handleSubmit() {
  touched.value = {
    username: true,
    firstName: true,
    lastName: true,
    email: true,
    password: true,
    confirmPassword: true,
    acceptTerms: true,
  }
  formError.value = ''

  if (!isFormValid.value) return

  isSubmitting.value = true

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        username: username.value.trim(),
        first_name: firstName.value.trim(),
        last_name: lastName.value.trim(),
        email: email.value.trim(),
        password: password.value,
        password_confirmation: confirmPassword.value,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      const apiMessage =
        errorBody?.message ||
        errorBody?.errors?.username?.[0] ||
        errorBody?.errors?.first_name?.[0] ||
        errorBody?.errors?.last_name?.[0] ||
        errorBody?.errors?.email?.[0] ||
        'Registration failed'
      throw new Error(apiMessage)
    }

    const data = await response.json()
    const user = data?.data?.user
    const token = data?.data?.token

    if (token) {
      localStorage.setItem('ssms_token', token)
    }

    auth.register(user ?? {})
    await router.push({ name: 'dashboard' })
  } catch (error) {
    formError.value =
      error instanceof Error && error.message
        ? error.message
        : 'Unable to create your account. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <div class="register-page__glow register-page__glow--one" aria-hidden="true" />
    <div class="register-page__glow register-page__glow--two" aria-hidden="true" />

    <main class="register-shell">
      <section class="register-brand" aria-label="SaveSpace">
        <p class="register-brand__mark">SaveSpace</p>
        <h1 class="register-brand__headline">Start saving with purpose.</h1>
        <p class="register-brand__copy">
          Create your account to set up personal and shared savings spaces, track transactions, and
          receive notifications.
        </p>
      </section>

      <section class="register-panel" aria-labelledby="register-heading">
        <header class="register-panel__header">
          <h2 id="register-heading">Create your account</h2>
          <p>Fill in your details to join SaveSpace.</p>
        </header>

        <form class="register-form" novalidate @submit.prevent="handleSubmit">
          <p v-if="formError" class="register-form__alert" role="alert">{{ formError }}</p>

          <div class="field">
            <label for="register-username">Username</label>
            <input
              id="register-username"
              v-model="username"
              type="text"
              name="username"
              autocomplete="username"
              placeholder="your_username"
              :aria-invalid="Boolean(usernameError)"
              :aria-describedby="usernameError ? 'username-error' : undefined"
              @blur="touched.username = true"
            />
            <p v-if="usernameError" id="username-error" class="field__error">{{ usernameError }}</p>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="register-first-name">First name</label>
              <input
                id="register-first-name"
                v-model="firstName"
                type="text"
                name="firstName"
                autocomplete="given-name"
                placeholder="Jane"
                :aria-invalid="Boolean(firstNameError)"
                :aria-describedby="firstNameError ? 'first-name-error' : undefined"
                @blur="touched.firstName = true"
              />
              <p v-if="firstNameError" id="first-name-error" class="field__error">
                {{ firstNameError }}
              </p>
            </div>

            <div class="field">
              <label for="register-last-name">Last name</label>
              <input
                id="register-last-name"
                v-model="lastName"
                type="text"
                name="lastName"
                autocomplete="family-name"
                placeholder="Doe"
                :aria-invalid="Boolean(lastNameError)"
                :aria-describedby="lastNameError ? 'last-name-error' : undefined"
                @blur="touched.lastName = true"
              />
              <p v-if="lastNameError" id="last-name-error" class="field__error">
                {{ lastNameError }}
              </p>
            </div>
          </div>

          <div class="field">
            <label for="register-email">Email address</label>
            <input
              id="register-email"
              v-model="email"
              type="email"
              name="email"
              autocomplete="email"
              placeholder="you@example.com"
              :aria-invalid="Boolean(emailError)"
              :aria-describedby="emailError ? 'email-error' : undefined"
              @blur="touched.email = true"
            />
            <p v-if="emailError" id="email-error" class="field__error">{{ emailError }}</p>
          </div>

          <div class="field">
            <label for="register-password">Password</label>
            <div class="field__password">
              <input
                id="register-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                name="password"
                autocomplete="new-password"
                placeholder="At least 8 characters"
                :aria-invalid="Boolean(passwordError)"
                :aria-describedby="passwordError ? 'password-error' : undefined"
                @blur="touched.password = true"
              />
              <button
                type="button"
                class="field__toggle"
                :aria-pressed="showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
            <p v-if="passwordError" id="password-error" class="field__error">{{ passwordError }}</p>
          </div>

          <div class="field">
            <label for="register-confirm-password">Confirm password</label>
            <div class="field__password">
              <input
                id="register-confirm-password"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                name="confirmPassword"
                autocomplete="new-password"
                placeholder="Re-enter your password"
                :aria-invalid="Boolean(confirmPasswordError)"
                :aria-describedby="confirmPasswordError ? 'confirm-password-error' : undefined"
                @blur="touched.confirmPassword = true"
              />
              <button
                type="button"
                class="field__toggle"
                :aria-pressed="showConfirmPassword"
                :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                {{ showConfirmPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
            <p v-if="confirmPasswordError" id="confirm-password-error" class="field__error">
              {{ confirmPasswordError }}
            </p>
          </div>

          <div class="field">
            <label class="terms">
              <input
                v-model="acceptTerms"
                type="checkbox"
                name="terms"
                @change="touched.acceptTerms = true"
              />
              <span>I agree to the Terms of Service and Privacy Policy.</span>
            </label>
            <p v-if="termsError" class="field__error">{{ termsError }}</p>
          </div>

          <button class="register-form__submit" type="submit" :disabled="isSubmitting">
            <span v-if="isSubmitting">Creating account…</span>
            <span v-else>Create account</span>
          </button>
        </form>

        <p class="register-panel__footer">
          Already have an account?
          <RouterLink :to="{ name: 'login' }">Sign in</RouterLink>
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.register-page {
  --ss-ink: #10231c;
  --ss-muted: #4d6359;
  --ss-accent: #0f7a5a;
  --ss-accent-deep: #0a5c44;
  --ss-panel: rgba(255, 252, 248, 0.92);
  --ss-line: rgba(16, 35, 28, 0.12);
  --ss-danger: #b42318;

  position: relative;
  isolation: isolate;
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  overflow: hidden;
  color: var(--ss-ink);
  font-family: 'Manrope', sans-serif;
  background:
    radial-gradient(circle at 12% 18%, rgba(47, 168, 128, 0.28), transparent 42%),
    radial-gradient(circle at 88% 12%, rgba(214, 176, 92, 0.22), transparent 36%),
    linear-gradient(160deg, #e8f4ee 0%, #f3efe6 48%, #dceee6 100%);
  animation: page-in 560ms ease-out;
}

.register-page__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.55;
  pointer-events: none;
  z-index: -1;
}

.register-page__glow--one {
  width: min(42vw, 28rem);
  height: min(42vw, 28rem);
  top: -8%;
  left: -6%;
  background: #7fd0b0;
  animation: drift 10s ease-in-out infinite alternate;
}

.register-page__glow--two {
  width: min(36vw, 22rem);
  height: min(36vw, 22rem);
  right: -4%;
  bottom: 8%;
  background: #e2c57a;
  animation: drift 12s ease-in-out infinite alternate-reverse;
}

.register-shell {
  width: min(100%, 64rem);
  display: grid;
  gap: 2rem;
  align-items: stretch;
}

.register-brand {
  display: grid;
  gap: 0.85rem;
  align-content: center;
  animation: rise 700ms ease-out;
}

.register-brand__mark {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-size: clamp(2.4rem, 6vw, 3.6rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--ss-accent-deep);
}

.register-brand__headline {
  margin: 0;
  max-width: 16ch;
  font-family: 'Fraunces', serif;
  font-size: clamp(1.45rem, 3.2vw, 2rem);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.register-brand__copy {
  margin: 0;
  max-width: 34ch;
  color: var(--ss-muted);
  font-size: 1rem;
  line-height: 1.55;
}

.register-panel {
  background: var(--ss-panel);
  border: 1px solid var(--ss-line);
  border-radius: 1.25rem;
  padding: clamp(1.35rem, 3vw, 2rem);
  box-shadow: 0 18px 50px rgba(16, 35, 28, 0.08);
  backdrop-filter: blur(10px);
  animation: rise 780ms ease-out;
}

.register-panel__header {
  margin-bottom: 1.5rem;
}

.register-panel__header h2 {
  margin: 0 0 0.4rem;
  font-family: 'Fraunces', serif;
  font-size: 1.55rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.register-panel__header p {
  margin: 0;
  color: var(--ss-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.register-form {
  display: grid;
  gap: 1rem;
}

.register-form__alert {
  margin: 0;
  padding: 0.75rem 0.9rem;
  border-radius: 0.7rem;
  background: rgba(180, 35, 24, 0.08);
  color: var(--ss-danger);
  font-size: 0.9rem;
}

.field-row {
  display: grid;
  gap: 1rem;
}

@media (min-width: 560px) {
  .field-row {
    grid-template-columns: 1fr 1fr;
  }
}

.field {
  display: grid;
  gap: 0.4rem;
}

.field label {
  font-size: 0.88rem;
  font-weight: 600;
}

.field input[type='text'],
.field input[type='email'],
.field__password input {
  width: 100%;
  border: 1px solid var(--ss-line);
  border-radius: 0.75rem;
  padding: 0.85rem 0.95rem;
  background: #fff;
  color: var(--ss-ink);
  font: inherit;
  font-size: 0.98rem;
  outline: none;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.field input[type='text']:focus,
.field input[type='email']:focus,
.field__password input:focus {
  border-color: var(--ss-accent);
  box-shadow: 0 0 0 3px rgba(15, 122, 90, 0.16);
}

.field input[aria-invalid='true'] {
  border-color: var(--ss-danger);
}

.field__password {
  position: relative;
}

.field__password input {
  padding-right: 4.25rem;
}

.field__toggle {
  position: absolute;
  top: 50%;
  right: 0.55rem;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: var(--ss-accent-deep);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.35rem 0.45rem;
}

.field__error {
  margin: 0;
  color: var(--ss-danger);
  font-size: 0.82rem;
}

.terms {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.55rem;
  color: var(--ss-muted);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  line-height: 1.4;
}

.terms input {
  width: 1rem;
  height: 1rem;
  margin-top: 0.15rem;
  flex-shrink: 0;
  accent-color: var(--ss-accent);
}

.register-form__submit {
  margin-top: 0.35rem;
  border: 0;
  border-radius: 0.85rem;
  padding: 0.95rem 1rem;
  background: linear-gradient(135deg, var(--ss-accent) 0%, var(--ss-accent-deep) 100%);
  color: #fff;
  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    opacity 160ms ease;
  box-shadow: 0 10px 24px rgba(15, 122, 90, 0.28);
}

.register-form__submit:hover:not(:disabled) {
  transform: translateY(-1px);
}

.register-form__submit:active:not(:disabled) {
  transform: translateY(0);
}

.register-form__submit:disabled {
  opacity: 0.72;
  cursor: wait;
}

.register-panel__footer {
  margin: 1.25rem 0 0;
  text-align: center;
  color: var(--ss-muted);
  font-size: 0.92rem;
}

.register-panel__footer a {
  color: var(--ss-accent-deep);
  font-weight: 700;
  text-decoration: none;
}

.register-panel__footer a:hover {
  text-decoration: underline;
}

@keyframes page-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes drift {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    transform: translate3d(18px, 14px, 0);
  }
}

@media (min-width: 900px) {
  .register-shell {
    grid-template-columns: 1.05fr 0.95fr;
    gap: 3rem;
  }
}
</style>
