<script setup lang="ts">
defineProps<{
  title: string
  message: string
}>()
</script>

<template>
  <div class="empty">
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty {
  border: 1px dashed rgba(16, 35, 28, 0.18);
  border-radius: 1rem;
  padding: 1.5rem 1.1rem;
  text-align: center;
  background: rgba(255, 253, 249, 0.7);
}

.empty h3 {
  margin: 0 0 0.35rem;
  font-family: 'Fraunces', serif;
  font-size: 1.1rem;
  color: #10231c;
}

.empty p {
  margin: 0;
  color: #4d6359;
  font-size: 0.92rem;
}
</style>
