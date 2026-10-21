<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

const email = ref('')
const isSubmitting = ref(false)
const formError = ref('')
const successMessage = ref('')
const touched = ref({ email: false })

const emailError = computed(() => {
  if (!touched.value.email) return ''
  if (!email.value.trim()) return 'Email address is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    return 'Enter a valid email address.'
  }
  return ''
})

const isFormValid = computed(
  () =>
    Boolean(email.value.trim()) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()),
)

async function handleSubmit() {
  touched.value = { email: true }
  formError.value = ''
  successMessage.value = ''

  if (!isFormValid.value) return

  isSubmitting.value = true

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: email.value.trim(),
      }),
    })

    const rawBody = await response.text()
    let body: Record<string, unknown> | null = null
    if (rawBody) {
      try {
        body = JSON.parse(rawBody) as Record<string, unknown>
      } catch {
        body = null
      }
    }

    if (!response.ok) {
      const errors = body?.errors as Record<string, string[] | undefined> | undefined
      const apiMessage =
        errors?.email?.[0] ||
        (typeof body?.message === 'string' ? body.message : '') ||
        (response.status === 502 || response.status === 504
          ? 'Cannot reach the API. Start the backend with `php artisan serve` or check the Vite proxy target in vite.config.ts.'
          : 'Unable to send a reset link. Please try again.')
      throw new Error(apiMessage)
    }

    successMessage.value =
      (typeof body?.message === 'string' ? body.message : '') ||
      'If that email is registered, a password reset link has been sent.'
  } catch (error) {
    if (error instanceof TypeError) {
      formError.value =
        'Cannot reach the API. Start the backend (`php artisan serve`) and restart `npm run dev`.'
    } else {
      formError.value =
        error instanceof Error && error.message
          ? error.message
          : 'Unable to send a reset link. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-page__glow login-page__glow--one" aria-hidden="true" />
    <div class="login-page__glow login-page__glow--two" aria-hidden="true" />

    <main class="login-shell">
      <section class="login-brand" aria-label="SaveSpace">
        <p class="login-brand__mark">SaveSpace</p>
        <h1 class="login-brand__headline">Forgot your password?</h1>
        <p class="login-brand__copy">
          Enter the email on your account and we will send you a link to choose a new password.
        </p>
      </section>

      <section class="login-panel" aria-labelledby="forgot-heading">
        <header class="login-panel__header">
          <h2 id="forgot-heading">Reset password</h2>
          <p>We will email you a secure link to reset your password.</p>
        </header>

        <form
          v-if="!successMessage"
          class="login-form"
          novalidate
          @submit.prevent="handleSubmit"
        >
          <p v-if="formError" class="login-form__alert" role="alert">{{ formError }}</p>

          <div class="field">
            <label for="forgot-email">Email address</label>
            <input
              id="forgot-email"
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

          <button class="login-form__submit" type="submit" :disabled="isSubmitting">
            <span v-if="isSubmitting">Sending link…</span>
            <span v-else>Send reset link</span>
          </button>
        </form>

        <div v-else class="login-form">
          <p class="login-form__success" role="status">{{ successMessage }}</p>
          <RouterLink class="login-form__submit login-form__submit--link" :to="{ name: 'login' }">
            Back to sign in
          </RouterLink>
        </div>

        <p class="login-panel__footer">
          Remember your password?
          <RouterLink :to="{ name: 'login' }">Sign in</RouterLink>
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.login-page {
  --ss-ink: #10231c;
  --ss-muted: #4d6359;
  --ss-accent: #0f7a5a;
  --ss-accent-deep: #0a5c44;
  --ss-panel: rgba(255, 252, 248, 0.92);
  --ss-line: rgba(16, 35, 28, 0.12);
  --ss-danger: #b42318;
  --ss-success: #0a5c44;

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

.login-page__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.55;
  pointer-events: none;
  z-index: -1;
}

.login-page__glow--one {
  width: min(42vw, 28rem);
  height: min(42vw, 28rem);
  top: -8%;
  left: -6%;
  background: #7fd0b0;
  animation: drift 10s ease-in-out infinite alternate;
}

.login-page__glow--two {
  width: min(36vw, 22rem);
  height: min(36vw, 22rem);
  right: -4%;
  bottom: 8%;
  background: #e2c57a;
  animation: drift 12s ease-in-out infinite alternate-reverse;
}

.login-shell {
  width: min(100%, 64rem);
  display: grid;
  gap: 2rem;
  align-items: stretch;
}

.login-brand {
  display: grid;
  gap: 0.85rem;
  align-content: center;
  animation: rise 700ms ease-out;
}

.login-brand__mark {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-size: clamp(2.4rem, 6vw, 3.6rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--ss-accent-deep);
}

.login-brand__headline {
  margin: 0;
  max-width: 18ch;
  font-family: 'Fraunces', serif;
  font-size: clamp(1.45rem, 3.2vw, 2rem);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.login-brand__copy {
  margin: 0;
  max-width: 34ch;
  color: var(--ss-muted);
  font-size: 1rem;
  line-height: 1.55;
}

.login-panel {
  background: var(--ss-panel);
  border: 1px solid var(--ss-line);
  border-radius: 1.25rem;
  padding: clamp(1.35rem, 3vw, 2rem);
  box-shadow: 0 18px 50px rgba(16, 35, 28, 0.08);
  backdrop-filter: blur(10px);
  animation: rise 780ms ease-out;
}

.login-panel__header {
  margin-bottom: 1.5rem;
}

.login-panel__header h2 {
  margin: 0 0 0.4rem;
  font-family: 'Fraunces', serif;
  font-size: 1.55rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.login-panel__header p {
  margin: 0;
  color: var(--ss-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.login-form {
  display: grid;
  gap: 1rem;
}

.login-form__alert {
  margin: 0;
  padding: 0.75rem 0.9rem;
  border-radius: 0.7rem;
  background: rgba(180, 35, 24, 0.08);
  color: var(--ss-danger);
  font-size: 0.9rem;
}

.login-form__success {
  margin: 0;
  padding: 0.75rem 0.9rem;
  border-radius: 0.7rem;
  background: rgba(15, 122, 90, 0.1);
  color: var(--ss-success);
  font-size: 0.9rem;
  line-height: 1.5;
}

.field {
  display: grid;
  gap: 0.4rem;
}

.field label {
  font-size: 0.88rem;
  font-weight: 600;
}

.field input[type='email'] {
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

.field input[type='email']:focus {
  border-color: var(--ss-accent);
  box-shadow: 0 0 0 3px rgba(15, 122, 90, 0.16);
}

.field input[aria-invalid='true'] {
  border-color: var(--ss-danger);
}

.field__error {
  margin: 0;
  color: var(--ss-danger);
  font-size: 0.82rem;
}

.login-form__submit {
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
  text-align: center;
  text-decoration: none;
}

.login-form__submit--link {
  display: inline-block;
}

.login-form__submit:hover:not(:disabled) {
  transform: translateY(-1px);
}

.login-form__submit:active:not(:disabled) {
  transform: translateY(0);
}

.login-form__submit:disabled {
  opacity: 0.72;
  cursor: wait;
}

.login-panel__footer {
  margin: 1.25rem 0 0;
  text-align: center;
  color: var(--ss-muted);
  font-size: 0.92rem;
}

.login-panel__footer a {
  color: var(--ss-accent-deep);
  font-weight: 700;
  text-decoration: none;
}

.login-panel__footer a:hover {
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
  .login-shell {
    grid-template-columns: 1.05fr 0.95fr;
    gap: 3rem;
  }
}
</style>
