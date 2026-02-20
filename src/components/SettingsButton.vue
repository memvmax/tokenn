<template>
  <div class="settings-container inline-block" ref="containerRef">
    <button 
      @click="toggleMenu" 
      class="settings-btn"
      :class="{ 'active': showMenu }"
    >
      <i class="fas fa-cog"></i>
    </button>
    
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showMenu" class="settings-menu" :style="menuStyle">
          <div class="menu-header">
            <span>{{ t('settings') }}</span>
          </div>
          
          <div class="menu-section">
            <div class="section-label">
              <i class="fas fa-globe"></i>
              {{ t('language') }}
            </div>
            <div class="lang-buttons">
              <button 
                @click="handleLocaleChange('zh-CN')"
                class="lang-btn"
                :class="{ 'active': currentLocale === 'zh-CN' }"
              >
                中文
              </button>
              <button 
                @click="handleLocaleChange('en-US')"
                class="lang-btn"
                :class="{ 'active': currentLocale === 'en-US' }"
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </Transition>
      
      <div v-if="showMenu" class="menu-overlay" @click="closeMenu"></div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLocale } from '../composables/useLocale'

const { currentLocale, setLocale, t } = useLocale()

const showMenu = ref(false)
const containerRef = ref(null)
const buttonRect = ref(null)

const menuStyle = computed(() => {
  if (!buttonRect.value) return {}
  return {
    position: 'fixed',
    top: `${buttonRect.value.bottom + 8}px`,
    right: `${window.innerWidth - buttonRect.value.right}px`
  }
})

const updateButtonRect = () => {
  if (containerRef.value) {
    buttonRect.value = containerRef.value.getBoundingClientRect()
  }
}

const toggleMenu = () => {
  updateButtonRect()
  showMenu.value = !showMenu.value
}

const closeMenu = () => {
  showMenu.value = false
}

const handleLocaleChange = (locale) => {
  setLocale(locale)
}

const handleResize = () => {
  if (showMenu.value) {
    updateButtonRect()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.settings-container {
  position: relative;
}

.settings-btn {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 13px;
}

.settings-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.settings-btn.active {
  background: var(--accent-blue);
  color: white;
  border-color: var(--accent-blue);
}

.settings-menu {
  width: 180px;
  background: var(--bg-secondary);
  border-radius: 4px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--border-light);
  z-index: 9999;
  overflow: hidden;
}

.menu-header {
  padding: 10px 12px;
  font-weight: 500;
  font-size: 13px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
}

.menu-section {
  padding: 10px 12px;
}

.section-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-label i {
  font-size: 10px;
}

.lang-buttons {
  display: flex;
  gap: 6px;
}

.lang-btn {
  flex: 1;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--border-light);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.lang-btn:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.lang-btn.active {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: white;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
