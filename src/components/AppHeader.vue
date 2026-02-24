<template>
  <header class="app-header">
    <div class="header-left">
      <div class="preset-selector" ref="presetRef">
        <button class="preset-btn" @click="togglePresetMenu" :class="{ 'active': showPresetMenu }">
          <span class="preset-name">{{ currentPreset.name }}</span>
          <i class="fas fa-chevron-down preset-icon" :class="{ 'rotated': showPresetMenu }"></i>
        </button>
        
        <Teleport to="body">
          <Transition name="fade">
            <div v-if="showPresetMenu" class="preset-menu" :style="menuStyle" @click.stop>
              <div class="preset-list">
                <button 
                  v-for="preset in presets" 
                  :key="preset.id"
                  class="preset-item"
                  :class="{ 'active': preset.id === activePresetId }"
                  @click="selectPreset(preset.id)"
                >
                  <span class="preset-item-name">{{ preset.name }}</span>
                  <i v-if="preset.id === activePresetId" class="fas fa-check"></i>
                </button>
              </div>
              
              <div class="menu-divider"></div>
              
              <button class="menu-action" @click="openNewPreset">
                <i class="fas fa-plus"></i>
                <span>{{ t('newPreset') || 'NEW PRESET' }}</span>
              </button>
              <button class="menu-action" @click="openEditPreset">
                <i class="fas fa-edit"></i>
                <span>{{ t('editPreset') || 'EDIT CURRENT' }}</span>
              </button>
            </div>
          </Transition>
          
          <div v-if="showPresetMenu" class="menu-overlay" @click="closePresetMenu"></div>
        </Teleport>
      </div>
    </div>
    <div class="header-right">
      <div class="settings-container" ref="containerRef">
        <button 
          @click="toggleMenu" 
          class="settings-btn"
          :class="{ 'active': showMenu }"
        >
          <i class="fas fa-cog"></i>
        </button>
        
        <Teleport to="body">
          <Transition name="fade">
            <div v-if="showMenu" class="settings-menu" :style="settingsMenuStyle">
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

              <div class="menu-section">
                <div class="section-label">
                  <i class="fas fa-palette"></i>
                  {{ t('themes') }}
                </div>
                <div class="theme-dropdown" @click.stop="toggleThemeDropdown">
                  <button class="menu-item">
                    <span>{{ currentThemeName }}</span>
                    <i class="fas" :class="showThemeDropdown ? 'fa-chevron-up' : 'fa-chevron-right'"></i>
                  </button>
                  <div class="theme-dropdown-menu" v-if="showThemeDropdown">
                    <button 
                      v-for="theme in themes" 
                      :key="theme.id" 
                      class="theme-option"
                      :class="{ 'active': theme.id === currentThemeId }"
                      @click="selectTheme(theme.id)"
                    >
                      {{ theme.name }}
                      <i v-if="theme.id === currentThemeId" class="fas fa-check"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div class="menu-divider"></div>

              <template v-if="user">
                <div class="menu-section user-info">
                  <i class="fas fa-user-circle"></i>
                  <span>{{ user.email }}</span>
                </div>
                
                <button class="menu-item" @click="switchAccount">
                  <i class="fas fa-exchange-alt"></i>
                  <span>{{ t('switchAccount') }}</span>
                </button>

                <button class="menu-item logout" @click="logout">
                  <i class="fas fa-sign-out-alt"></i>
                  <span>{{ t('logout') }}</span>
                </button>
              </template>
              
              <template v-else>
                <button class="menu-item login" @click="login">
                  <i class="fas fa-sign-in-alt"></i>
                  <span>{{ t('login') }}</span>
                </button>
              </template>
            </div>
          </Transition>
          
          <div v-if="showMenu" class="menu-overlay" @click="closeMenu"></div>
        </Teleport>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
          <div class="edit-modal" @click.stop>
            <div class="modal-header">
              <h3>{{ isNewPreset ? (t('newPreset') || 'NEW PRESET') : (t('editPreset') || 'EDIT PRESET') }}</h3>
              <button class="modal-close" @click="closeEditModal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>PRESET NAME</label>
                <input 
                  type="text" 
                  v-model="editForm.name" 
                  class="form-input"
                  placeholder="Enter preset name"
                >
              </div>
              
              <div class="form-group">
                <label>VISIBLE MODULES & IDEAL ALLOCATION</label>
                <div class="module-list">
                  <div v-for="module in availableModules" :key="module.id" class="module-item">
                    <label class="module-checkbox">
                      <input 
                        type="checkbox" 
                        v-model="editForm.modules" 
                        :value="module.id"
                        @change="onModuleToggle(module.id)"
                      >
                      <span class="checkbox-custom"></span>
                      <span class="module-name">{{ module.name }}</span>
                    </label>
                    <div class="module-percentage" v-if="editForm.modules.includes(module.id)">
                      <input 
                        type="number" 
                        v-model.number="editForm.percentages[module.id]"
                        class="percentage-input font-numeric"
                        min="0"
                        max="100"
                        placeholder="0"
                      >
                      <span class="percentage-unit">%</span>
                    </div>
                  </div>
                </div>
                <div class="percentage-total" :class="{ 'over': totalPercentage > 100, 'under': totalPercentage < 100 && totalPercentage > 0 }">
                  <span class="total-label">TOTAL</span>
                  <span class="total-value font-numeric">{{ totalPercentage }}%</span>
                  <span class="total-hint" v-if="totalPercentage !== 100 && totalPercentage > 0">
                    ({{ totalPercentage > 100 ? '+' : '' }}{{ totalPercentage - 100 }}%)
                  </span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button 
                v-if="!isNewPreset && !currentPreset.isDefault" 
                class="delete-btn" 
                @click="deletePreset"
              >
                {{ t('delete') || 'DELETE' }}
              </button>
              <div class="footer-spacer"></div>
              <button class="cancel-btn" @click="closeEditModal">{{ t('cancel') }}</button>
              <button class="save-btn" @click="savePreset" :disabled="!canSave">{{ t('save') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLocale } from '../composables/useLocale'

const { currentLocale, setLocale, t } = useLocale()

const availableModules = [
  { id: 'cash', name: 'CASH' },
  { id: 'stock', name: 'STOCK' },
  { id: 'bond', name: 'BOND' },
  { id: 'gold', name: 'GOLD' },
  { id: 'emerging', name: 'EMERGING' }
]

const defaultPresets = [
  { 
    id: 'default', 
    name: 'MY PORTFOLIO', 
    modules: ['cash', 'stock', 'bond', 'gold', 'emerging'],
    percentages: {
      cash: 20,
      stock: 30,
      bond: 25,
      gold: 15,
      emerging: 10
    },
    isDefault: true 
  }
]

const presets = ref([...defaultPresets])
const activePresetId = ref('default')

const showPresetMenu = ref(false)
const showMenu = ref(false)
const showEditModal = ref(false)
const isNewPreset = ref(false)

const presetRef = ref(null)
const containerRef = ref(null)
const presetButtonRect = ref(null)
const settingsButtonRect = ref(null)

const editForm = ref({
  name: '',
  modules: [],
  percentages: {}
})

const props = defineProps({
  currentThemeName: {
    type: String,
    default: 'Default'
  },
  themes: {
    type: Array,
    default: () => []
  },
  currentThemeId: {
    type: String,
    default: 'default'
  },
  user: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['logout', 'switchAccount', 'openThemes', 'presetChange', 'themeChange', 'login'])

const showThemeDropdown = ref(false)

const toggleThemeDropdown = () => {
  showThemeDropdown.value = !showThemeDropdown.value
}

const selectTheme = (themeId) => {
  emit('themeChange', themeId)
  showThemeDropdown.value = false
}

const currentPreset = computed(() => {
  return presets.value.find(p => p.id === activePresetId.value) || presets.value[0]
})

const totalPercentage = computed(() => {
  return editForm.value.modules.reduce((sum, moduleId) => {
    return sum + (editForm.value.percentages[moduleId] || 0)
  }, 0)
})

const menuStyle = computed(() => {
  if (!presetButtonRect.value) return {}
  return {
    position: 'fixed',
    top: `${presetButtonRect.value.bottom + 8}px`,
    left: `${presetButtonRect.value.left}px`,
    minWidth: '180px'
  }
})

const settingsMenuStyle = computed(() => {
  if (!settingsButtonRect.value) return {}
  return {
    position: 'fixed',
    top: `${settingsButtonRect.value.bottom + 8}px`,
    right: `${window.innerWidth - settingsButtonRect.value.right}px`
  }
})

const canSave = computed(() => {
  return editForm.value.name.trim() && editForm.value.modules.length > 0
})

const updatePresetButtonRect = () => {
  if (presetRef.value) {
    presetButtonRect.value = presetRef.value.getBoundingClientRect()
  }
}

const updateSettingsButtonRect = () => {
  if (containerRef.value) {
    settingsButtonRect.value = containerRef.value.getBoundingClientRect()
  }
}

const togglePresetMenu = () => {
  updatePresetButtonRect()
  showPresetMenu.value = !showPresetMenu.value
  if (showPresetMenu.value) {
    showMenu.value = false
  }
}

const closePresetMenu = () => {
  showPresetMenu.value = false
}

const toggleMenu = () => {
  updateSettingsButtonRect()
  showMenu.value = !showMenu.value
  if (showMenu.value) {
    showPresetMenu.value = false
  }
}

const closeMenu = () => {
  showMenu.value = false
}

const selectPreset = (id) => {
  activePresetId.value = id
  savePresets()
  emitPresetChange()
  closePresetMenu()
}

const onModuleToggle = (moduleId) => {
  if (!editForm.value.modules.includes(moduleId)) {
    delete editForm.value.percentages[moduleId]
  } else if (editForm.value.percentages[moduleId] === undefined) {
    editForm.value.percentages[moduleId] = 0
  }
}

const openNewPreset = () => {
  isNewPreset.value = true
  editForm.value = {
    name: '',
    modules: ['cash', 'gold'],
    percentages: { cash: 0, gold: 0 }
  }
  showEditModal.value = true
  closePresetMenu()
}

const openEditPreset = () => {
  isNewPreset.value = false
  editForm.value = {
    name: currentPreset.value.name,
    modules: [...currentPreset.value.modules],
    percentages: { ...(currentPreset.value.percentages || {}) }
  }
  showEditModal.value = true
  closePresetMenu()
}

const closeEditModal = () => {
  showEditModal.value = false
}

const savePreset = () => {
  if (!canSave.value) return
  
  if (isNewPreset.value) {
    const newPreset = {
      id: 'preset_' + Date.now(),
      name: editForm.value.name.toUpperCase(),
      modules: [...editForm.value.modules],
      percentages: { ...editForm.value.percentages },
      isDefault: false
    }
    presets.value.push(newPreset)
    activePresetId.value = newPreset.id
  } else {
    const preset = presets.value.find(p => p.id === activePresetId.value)
    if (preset) {
      preset.name = editForm.value.name.toUpperCase()
      preset.modules = [...editForm.value.modules]
      preset.percentages = { ...editForm.value.percentages }
    }
  }
  
  savePresets()
  emitPresetChange()
  closeEditModal()
}

const deletePreset = () => {
  if (currentPreset.value.isDefault) return
  
  const index = presets.value.findIndex(p => p.id === activePresetId.value)
  if (index !== -1) {
    presets.value.splice(index, 1)
    activePresetId.value = presets.value[0].id
    savePresets()
    emitPresetChange()
  }
  closeEditModal()
}

const emitPresetChange = () => {
  emit('presetChange', {
    id: activePresetId.value,
    modules: currentPreset.value.modules,
    percentages: currentPreset.value.percentages || {}
  })
}

const savePresets = () => {
  try {
    localStorage.setItem('assetPresets', JSON.stringify({
      presets: presets.value,
      activePresetId: activePresetId.value
    }))
  } catch (error) {
    console.error('Save presets failed:', error)
  }
}

const loadPresets = () => {
  try {
    const saved = localStorage.getItem('assetPresets')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.presets && data.presets.length > 0) {
        presets.value = data.presets
        activePresetId.value = data.activePresetId || data.presets[0].id
      }
    }
  } catch (error) {
    console.error('Load presets failed:', error)
  }
  emitPresetChange()
}

const handleLocaleChange = (locale) => {
  setLocale(locale)
}

const openThemes = () => {
  emit('openThemes')
  closeMenu()
}

const switchAccount = () => {
  emit('switchAccount')
  closeMenu()
}

const logout = () => {
  emit('logout')
  closeMenu()
}

const login = () => {
  emit('login')
  closeMenu()
}

const handleResize = () => {
  if (showPresetMenu.value) {
    updatePresetButtonRect()
  }
  if (showMenu.value) {
    updateSettingsButtonRect()
  }
}

onMounted(() => {
  loadPresets()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-btn:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.preset-btn.active {
  border-color: #0891b2;
  color: #0891b2;
  background: rgba(8, 145, 178, 0.1);
}

.preset-name {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.preset-icon {
  font-size: 10px;
  transition: transform 0.15s ease;
}

.preset-icon.rotated {
  transform: rotate(180deg);
}

.preset-menu {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 9999;
  overflow: hidden;
}

.preset-list {
  padding: 8px 0;
}

.preset-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.preset-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.preset-item.active {
  background: rgba(8, 145, 178, 0.15);
  color: #0891b2;
}

.preset-item i {
  font-size: 10px;
}

.menu-divider {
  height: 1px;
  background: var(--border-light);
}

.menu-action {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.menu-action:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.menu-action i {
  font-size: 11px;
  width: 14px;
}

.header-right {
  display: flex;
  align-items: center;
}

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
  width: 200px;
  background: var(--bg-secondary);
  border-radius: 4px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--border-light);
  z-index: 9999;
  overflow: hidden;
}

.menu-header {
  padding: 12px 14px;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
  text-transform: uppercase;
}

.menu-section {
  padding: 12px 14px;
}

.section-label {
  font-size: 9px;
  color: var(--text-muted);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 600;
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

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.menu-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.menu-item i {
  font-size: 11px;
  width: 16px;
}

.menu-item.logout {
  color: var(--accent-red);
}

.menu-item.logout:hover {
  background: rgba(239, 83, 80, 0.1);
  color: var(--accent-red);
}

.menu-item.login {
  color: var(--accent-blue);
}

.menu-item.login:hover {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-blue);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 12px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 8px;
}

.user-info i {
  font-size: 16px;
  color: var(--text-muted);
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.edit-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  width: 90%;
  max-width: 420px;
  overflow: hidden;
}

.edit-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.edit-modal .modal-header h3 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 0.5px;
}

.modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.15s ease;
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 600;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #0891b2;
}

.module-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.module-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
}

.module-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  flex: 1;
}

.module-checkbox input {
  display: none;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.module-checkbox input:checked + .checkbox-custom {
  background: #0891b2;
  border-color: #0891b2;
}

.module-checkbox input:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 10px;
}

.module-name {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
}

.module-percentage {
  display: flex;
  align-items: center;
  gap: 4px;
}

.percentage-input {
  width: 50px;
  padding: 6px 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 3px;
  color: var(--text-primary);
  font-size: 12px;
  text-align: right;
  -moz-appearance: textfield;
}

.percentage-input::-webkit-outer-spin-button,
.percentage-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.percentage-input:focus {
  outline: none;
  border-color: #0891b2;
}

.percentage-unit {
  font-size: 11px;
  color: var(--text-muted);
}

.percentage-total {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: 4px;
  border: 1px solid var(--border-light);
}

.percentage-total.over {
  border-color: var(--accent-red);
  background: rgba(239, 83, 80, 0.1);
}

.percentage-total.under {
  border-color: #f5a623;
  background: rgba(245, 166, 35, 0.1);
}

.total-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.total-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.total-hint {
  font-size: 11px;
  color: var(--text-muted);
}

.percentage-total.over .total-value,
.percentage-total.over .total-hint {
  color: var(--accent-red);
}

.percentage-total.under .total-value,
.percentage-total.under .total-hint {
  color: #f5a623;
}

.modal-footer {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--border-light);
  gap: 8px;
}

.footer-spacer {
  flex: 1;
}

.delete-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--accent-red);
  border-radius: 4px;
  color: var(--accent-red);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.delete-btn:hover {
  background: rgba(239, 83, 80, 0.1);
}

.cancel-btn {
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cancel-btn:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.save-btn {
  padding: 8px 16px;
  background: #0891b2;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.save-btn:hover:not(:disabled) {
  background: #0e7490;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.theme-dropdown {
  position: relative;
}

.theme-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  margin-top: 4px;
  z-index: 100;
  overflow: hidden;
}

.theme-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.theme-option:hover {
  background: var(--bg-hover);
}

.theme-option.active {
  color: var(--accent-blue);
  background: rgba(41, 98, 255, 0.1);
}

.theme-option i {
  font-size: 11px;
}
</style>
