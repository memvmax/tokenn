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
          
          <div class="menu-section exchange-rate-section">
            <div class="section-label">
              <i class="fas fa-exchange-alt"></i>
              EXCHANGE RATE
            </div>
            <div class="exchange-rate-content">
              <div class="exchange-row">
                <span class="exchange-label">CNY : USD</span>
                <span class="exchange-value">{{ usdRate.toFixed(4) }}</span>
              </div>
              <div class="exchange-row">
                <span class="exchange-label">CNY : HKD</span>
                <span class="exchange-value">{{ hkdRate.toFixed(4) }}</span>
              </div>
            </div>
          </div>
          
          <div class="menu-section">
            <div class="section-label">
              <i class="fas fa-palette"></i>
              {{ t('themes') }}
            </div>
            <div class="theme-dropdown">
              <button class="menu-item" @click="toggleThemeMenu">
                <span>{{ currentThemeName }}</span>
                <i class="fas fa-chevron-right"></i>
              </button>
              <div v-if="showThemeMenu" class="theme-submenu">
                <button 
                  v-for="theme in themes" 
                  :key="theme.id"
                  class="theme-option"
                  :class="{ 'active': currentTheme === theme.id }"
                  @click="selectTheme(theme.id)"
                >
                  <span class="theme-preview" :style="{ background: theme.preview }"></span>
                  <span>{{ theme.name }}</span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="menu-divider"></div>
          
          <button class="menu-item login" @click="handleLogin">
            <i class="fas fa-sign-in-alt"></i>
            <span>{{ t('login') }}</span>
          </button>
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
const showThemeMenu = ref(false)

const usdRate = ref(7.25)
const hkdRate = ref(0.91)

const currentTheme = ref('default')
const themes = [
  { id: 'default', name: 'Default', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'dark', name: 'Dark', preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
  { id: 'light', name: 'Light', preview: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }
]

const currentThemeName = computed(() => {
  const theme = themes.find(t => t.id === currentTheme.value)
  return theme ? theme.name : 'Default'
})

const toggleThemeMenu = () => {
  showThemeMenu.value = !showThemeMenu.value
}

const selectTheme = (themeId) => {
  currentTheme.value = themeId
  showThemeMenu.value = false
}

const handleLogin = () => {
  closeMenu()
}

const fetchExchangeRates = async () => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const data = await response.json()
    if (data.rates) {
      const cny = data.rates.CNY || 7.25
      const hkd = data.rates.HKD || 7.78
      usdRate.value = cny
      hkdRate.value = cny / hkd
    }
  } catch (e) {
    console.log('Failed to fetch exchange rates')
  }
}

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
  fetchExchangeRates()
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

.exchange-rate-section {
  background: rgba(102, 126, 234, 0.1);
}

.exchange-rate-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--bg-tertiary);
  padding: 8px;
  border-radius: 4px;
}

.exchange-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.exchange-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.exchange-value {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

.theme-dropdown {
  position: relative;
}

.theme-submenu {
  position: absolute;
  top: 0;
  left: 100%;
  margin-left: 4px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 6px;
  padding: 4px;
  min-width: 120px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s ease;
}

.theme-option:hover {
  background: var(--bg-tertiary);
}

.theme-option.active {
  background: var(--bg-tertiary);
  color: var(--accent-blue);
}

.theme-preview {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.menu-divider {
  height: 1px;
  background: var(--border-light);
  margin: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s ease;
  text-align: left;
}

.menu-item:hover {
  background: var(--bg-tertiary);
}

.menu-item.login {
  color: var(--accent-blue);
}

.menu-item i {
  font-size: 12px;
  width: 16px;
  text-align: center;
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
