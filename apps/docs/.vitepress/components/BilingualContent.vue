<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref<'ko' | 'en'>('en')
</script>

<template>
  <div class="bilingual-content">
    <div class="language-tabs">
      <button
        :class="{ active: activeTab === 'en' }"
        @click="activeTab = 'en'"
      >
        🇺🇸
      </button>
      <button
        :class="{ active: activeTab === 'ko' }"
        @click="activeTab = 'ko'"
      >
       🇰🇷
      </button>
    </div>

    <div class="content-panel">
      <div v-if="activeTab === 'en'">
        <slot name="en" />
      </div>
      <div v-if="activeTab === 'ko'">
        <slot name="ko" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.bilingual-content {
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
}

.language-tabs {
  display: flex;
  gap: 0;
  background: var(--vp-c-bg-soft);
  position: relative;
  margin: 0 !important;
  padding: 0 !important;
}

.language-tabs::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--vp-c-border);
}

.language-tabs button {
  flex: 1;
  padding: 0.75rem 1rem;
  margin: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
}

.language-tabs button::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: transparent;
  transition: background 0.2s ease;
}

.language-tabs button:hover {
  color: var(--vp-c-text-1);
}

.language-tabs button.active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.language-tabs button.active::after {
  background: var(--vp-c-brand-1);
}

.content-panel {
  padding: 1.5rem
}

/* 다크모드 */
.dark .language-tabs button.active {
  color: var(--vp-c-brand-2);
}

.dark .language-tabs button.active::after {
  background: var(--vp-c-brand-2);
}
</style>
