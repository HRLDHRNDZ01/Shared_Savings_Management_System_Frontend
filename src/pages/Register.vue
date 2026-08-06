<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const acceptTerms = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const touched = ref({
  fullName: false,
  email: false,
  password: false,
  confirmPassword: false,
  acceptTerms: false,
})

const fullNameError = computed(() => {
  if (!touched.value.fullName) return ''
  if (!fullName.value.trim()) return 'Full name is required.'
  if (fullName.value.trim().length < 2) return 'Enter your full name.'
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
    fullName.value.trim().length >= 2 &&
    Boolean(email.value.trim()) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) &&
    password.value.length >= 8 &&
    confirmPassword.value === password.value &&
    acceptTerms.value,
)

async function handleSubmit() {
  touched.value = {
    fullName: true,
    email: true,
    password: true,
    confirmPassword: true,
    acceptTerms: true,
  }
  formError.value = ''

  if (!isFormValid.value) return

  isSubmitting.value = true

  try {
    // Placeholder until the SaveSpace auth API is connected
    //await new Promise((resolve) => setTimeout(resolve, 700))
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: fullName.value.trim(),
        email: email.value.trim(),
        password: password.value,
        password_confirmation: confirmPassword.value,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      const apiMessage =
        errorBody?.message ||
        errorBody?.errors?.email?.[0] ||
        errorBody?.errors?.name?.[0] ||
        'Registration failed'
      throw new Error(apiMessage)
    }

    const data = await response.json()
    const user = data?.data?.user
    const token = data?.data?.token

    if (token) {
      localStorage.setItem('ssms_token', token)
    }

    auth.register({
      id: user?.user_id ?? user?.id,
      fullName: user?.name || fullName.value.trim(),
      email: user?.email || email.value.trim(),
      role: user?.role,
      groupId: user?.user_group_id ?? user?.user_group?.user_group_id,
      groupName: user?.user_group?.name,
    })
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
            <label for="register-name">Full name</label>
            <input
              id="register-name"
              v-model="fullName"
              type="text"
              name="fullName"
              autocomplete="name"
              placeholder="Jane Doe"
              :aria-invalid="Boolean(fullNameError)"
              :aria-describedby="fullNameError ? 'name-error' : undefined"
              @blur="touched.fullName = true"
            />
            <p v-if="fullNameError" id="name-error" class="field__error">{{ fullNameError }}</p>
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
