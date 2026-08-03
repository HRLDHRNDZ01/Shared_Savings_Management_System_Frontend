<script setup lang="ts">
import { onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

onMounted(() => {
  void settingsStore.fetchSettings()
})

function saveSettings() {
  settingsStore.updateSettings({ ...settingsStore.settings })
}
</script>

<template>
  <main class="page">
    <header class="page__header">
      <div>
        <h1>Settings</h1>
        <p>Control notifications, preferences, and account options.</p>
      </div>
      <button type="button" class="btn" @click="saveSettings">Save Settings</button>
    </header>

    <section class="panel">
      <h2>Notifications</h2>
      <label class="toggle">
        <span>Email alerts</span>
        <input v-model="settingsStore.settings.emailAlerts" type="checkbox" />
      </label>
      <label class="toggle">
        <span>Push notifications</span>
        <input v-model="settingsStore.settings.pushAlerts" type="checkbox" />
      </label>
      <label class="toggle">
        <span>Weekly summary</span>
        <input v-model="settingsStore.settings.weeklySummary" type="checkbox" />
      </label>
      <label class="toggle">
        <span>Shared space invites</span>
        <input v-model="settingsStore.settings.sharedSpaceInvites" type="checkbox" />
      </label>
    </section>

    <section class="panel">
      <h2>Preferences</h2>
      <label class="field">
        Currency
        <select v-model="settingsStore.settings.currency">
          <option value="PHP">PHP (₱)</option>
          <option value="USD">USD ($)</option>
        </select>
      </label>
      <label class="field">
        Language
        <select v-model="settingsStore.settings.language">
          <option value="English">English</option>
          <option value="Filipino">Filipino</option>
        </select>
      </label>
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

.panel {
  border: 1px solid var(--ss-line);
  border-radius: 1rem;
  background: var(--ss-surface);
  padding: 1.1rem;
  max-width: 40rem;
  display: grid;
  gap: 0.85rem;
}

.panel h2 {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-size: 1.15rem;
}

.toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  font-weight: 600;
}

.toggle input {
  width: 1.1rem;
  height: 1.1rem;
  accent-color: var(--ss-accent);
}

.field {
  display: grid;
  gap: 0.35rem;
  font-size: 0.88rem;
  font-weight: 600;
}

.field select {
  border: 1px solid var(--ss-line);
  border-radius: 0.7rem;
  padding: 0.8rem 0.9rem;
  font: inherit;
  background: #fff;
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
