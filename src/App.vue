<template>
  <div class="app-container">
    <div class="main-content">
      <main>
        <AppHeader 
          @logout="handleLogout"
          @switchAccount="handleSwitchAccount"
          @openThemes="handleOpenThemes"
          @presetChange="handlePresetChange"
          @themeChange="handleThemeChange"
          :currentThemeName="t(currentThemeInfo.nameKey)"
          :themes="themes"
          :currentThemeId="currentTheme"
          :user="user"
          @login="showAuthModal = true"
        />

        <TotalAsset 
          :assets="visibleAssets" 
          :t="t" 
          :format-currency="formatCurrency"
        />

        <template v-if="currentView === 'wallet'">
          <WarningAlert :total-ideal-percentage="totalIdealPercentage" :t="t" />

          <!-- Desktop: Cards grid + Detail below all cards -->
          <div class="assets-grid desktop-view">
            <AssetCard 
              v-for="asset in visibleAssets" 
              :key="asset.id" 
              :asset="asset" 
              :total-asset="totalAsset" 
              :t="t"
              :format-amount="formatAmount"
              :selected="selectedAssetId === asset.id"
              @select="handleAssetSelect" 
            />
          </div>

          <div class="detail-section desktop-view" v-if="selectedAssetId">
            <CashDetail 
              v-if="selectedAssetId === 'cash'"
              :t="t"
              :format-amount="formatAmount"
              @update:total="updateCashTotal"
              @transfer="handleTransfer"
            />
            <StockDetail 
              v-else-if="selectedAssetId === 'stock'"
              :t="t"
              :format-amount="formatAmount"
              @update:total="updateStockTotal"
            />
            <GoldDetail 
              v-else-if="selectedAssetId === 'gold'"
              :t="t"
              :format-currency="formatCurrency"
              @update:total="updateGoldTotal"
            />
            <BondDetail 
              v-else-if="selectedAssetId === 'bond'"
              :t="t"
              :format-amount="formatAmount"
              @update:total="updateBondTotal"
              @transfer="handleTransfer"
            />
            <EmergingDetail 
              v-else-if="selectedAssetId === 'emerging'"
              :t="t"
              :format-amount="formatAmount"
              @update:total="updateEmergingTotal"
              @transfer="handleTransfer"
            />
            <div v-else class="detail-placeholder">
              <i class="fas fa-tools"></i>
              <p>{{ t('detailComingSoon') }}</p>
            </div>
          </div>

          <!-- Mobile: Cards with inline detail -->
          <div class="assets-grid mobile-view">
            <template v-for="asset in visibleAssets" :key="asset.id">
              <AssetCard 
                :asset="asset" 
                :total-asset="totalAsset" 
                :t="t"
                :format-amount="formatAmount"
                :selected="selectedAssetId === asset.id"
                @select="handleAssetSelect" 
              />
              <div class="detail-inline" v-if="selectedAssetId === asset.id">
                <CashDetail 
                  v-if="asset.id === 'cash'"
                  :t="t"
                  :format-amount="formatAmount"
                  @update:total="updateCashTotal"
                  @transfer="handleTransfer"
                />
                <StockDetail 
                  v-else-if="asset.id === 'stock'"
                :t="t"
                :format-amount="formatAmount"
                @update:total="updateStockTotal"
              />
              <GoldDetail 
                v-else-if="asset.id === 'gold'"
                :t="t"
                :format-currency="formatCurrency"
                @update:total="updateGoldTotal"
              />
              <BondDetail 
                v-else-if="asset.id === 'bond'"
                :t="t"
                :format-amount="formatAmount"
                @update:total="updateBondTotal"
                @transfer="handleTransfer"
              />
              <EmergingDetail 
                v-else-if="asset.id === 'emerging'"
                :t="t"
                :format-amount="formatAmount"
                @update:total="updateEmergingTotal"
                @transfer="handleTransfer"
              />
              <div v-else class="detail-placeholder">
                <i class="fas fa-tools"></i>
                <p>{{ t('detailComingSoon') }}</p>
              </div>
            </div>
          </template>
        </div>
        </template>

        <template v-else-if="currentView === 'invest'">
          <InvestView :t="t" :format-amount="formatAmount" />
        </template>

        <template v-else-if="currentView === 'notes'">
          <NotesView :t="t" />
        </template>

        <NewsFeed :t="t" v-show="false" />
      </main>

      <footer class="app-footer">
        <p>{{ t('copyright') }}</p>
      </footer>
    </div>

    <AuthModal 
      :isVisible="showAuthModal"
      :t="t"
      @close="showAuthModal = false"
      @success="handleAuthSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import AppHeader from './components/AppHeader.vue';
import TotalAsset from './components/TotalAsset.vue';
import AssetCard from './components/AssetCard.vue';
import WarningAlert from './components/WarningAlert.vue';
import CashDetail from './components/CashDetail.vue';
import StockDetail from './components/StockDetail.vue';
import GoldDetail from './components/GoldDetail.vue';
import BondDetail from './components/BondDetail.vue';
import EmergingDetail from './components/EmergingDetail.vue';
import NewsFeed from './components/NewsFeed.vue';
import AuthModal from './components/AuthModal.vue';
import InvestView from './components/InvestView.vue';
import NotesView from './components/NotesView.vue';
import { useLocale } from './composables/useLocale';
import { useSupabase } from './lib/supabase';
import { useDataStorage } from './composables/useDataStorage';
import { useViewState } from './composables/useViewState';

const { t, initLocale, formatAmount, formatCurrency } = useLocale();
const { getUser, signOut, onAuthStateChange, isConfigured } = useSupabase();
const { setUserId, saveData, loadData, saveAllData, loadAllData } = useDataStorage();
const { currentView, getView } = useViewState();

getView();

const user = ref(null);
const showAuthModal = ref(false);
const selectedAssetId = ref(null);
const visibleModules = ref(['cash', 'stock', 'bond', 'gold', 'emerging']);
const idealPercentages = ref({
  cash: 20,
  stock: 30,
  bond: 25,
  gold: 15,
  emerging: 10
});

const assets = ref([
  {
    id: 'cash',
    nameKey: 'cash',
    amount: 10000,
    icon: 'fa-wallet',
    color: '#67e8f9'
  },
  {
    id: 'stock',
    nameKey: 'stock',
    amount: 20000,
    icon: 'fa-chart-line',
    color: '#22d3ee'
  },
  {
    id: 'bond',
    nameKey: 'bond',
    amount: 15000,
    icon: 'fa-file-invoice-dollar',
    color: '#06b6d4'
  },
  {
    id: 'gold',
    nameKey: 'gold',
    amount: 8000,
    icon: 'fa-coins',
    color: '#0891b2'
  },
  {
    id: 'emerging',
    nameKey: 'emerging',
    amount: 7000,
    icon: 'fa-rocket',
    color: '#0e7490'
  }
]);

const visibleAssets = computed(() => {
  return assets.value
    .filter(asset => visibleModules.value.includes(asset.id))
    .map(asset => ({
      ...asset,
      idealPercentage: idealPercentages.value[asset.id] || 0
    }));
});

const totalAsset = computed(() => {
  return visibleAssets.value.reduce((sum, asset) => {
    return sum + (Number(asset.amount) || 0);
  }, 0);
});

const totalIdealPercentage = computed(() => {
  return visibleAssets.value.reduce((sum, asset) => {
    return sum + (Number(asset.idealPercentage) || 0);
  }, 0);
});

const defaultColors = {
  cash: '#67e8f9',
  stock: '#22d3ee',
  bond: '#06b6d4',
  gold: '#0891b2',
  emerging: '#0e7490'
};

const loadFromStorage = async () => {
  try {
    const savedAssets = await loadData('wealthAssets');
    if (savedAssets) {
      if (Array.isArray(savedAssets) && savedAssets.length === 5) {
        savedAssets.forEach((saved, index) => {
          if (assets.value[index]) {
            assets.value[index].amount = saved.amount || 0;
            assets.value[index].color = defaultColors[saved.id] || assets.value[index].color;
          }
        });
      }
    }
    
    const savedModules = await loadData('visibleModules');
    if (savedModules) {
      visibleModules.value = savedModules;
    }
    
    const savedPercentages = await loadData('idealPercentages');
    if (savedPercentages) {
      idealPercentages.value = savedPercentages;
    }
  } catch (error) {
    console.error('Load failed:', error);
  }
};

const saveToStorage = async () => {
  try {
    await saveAllData({
      wealthAssets: assets.value,
      visibleModules: visibleModules.value,
      idealPercentages: idealPercentages.value
    });
    localStorage.setItem('theme', currentTheme.value);
  } catch (error) {
    console.error('Save failed:', error);
  }
};

const handleAuthSuccess = async (session) => {
  if (session?.user) {
    user.value = session.user;
    setUserId(session.user.id);
    await loadFromStorage();
  }
  showAuthModal.value = false;
};

const handlePresetChange = (preset) => {
  visibleModules.value = preset.modules;
  idealPercentages.value = preset.percentages || {};
  if (!visibleModules.value.includes(selectedAssetId.value)) {
    selectedAssetId.value = null;
  }
};

const handleAssetSelect = (id) => {
  selectedAssetId.value = selectedAssetId.value === id ? null : id;
};

const updateCashTotal = (total) => {
  const cashIndex = assets.value.findIndex(asset => asset.id === 'cash');
  if (cashIndex !== -1) {
    assets.value[cashIndex].amount = total;
    saveToStorage();
  }
};

const updateGoldTotal = (total) => {
  const goldIndex = assets.value.findIndex(asset => asset.id === 'gold');
  if (goldIndex !== -1) {
    assets.value[goldIndex].amount = total;
    saveToStorage();
  }
};

const updateStockTotal = (total) => {
  const stockIndex = assets.value.findIndex(asset => asset.id === 'stock');
  if (stockIndex !== -1) {
    assets.value[stockIndex].amount = total;
    saveToStorage();
  }
};

const updateBondTotal = (total) => {
  const bondIndex = assets.value.findIndex(asset => asset.id === 'bond');
  if (bondIndex !== -1) {
    assets.value[bondIndex].amount = total;
    saveToStorage();
  }
};

const updateEmergingTotal = (total) => {
  const emergingIndex = assets.value.findIndex(asset => asset.id === 'emerging');
  if (emergingIndex !== -1) {
    assets.value[emergingIndex].amount = total;
    saveToStorage();
  }
};

const handleTransfer = ({ amount, currency, toAsset }) => {
  const targetIndex = assets.value.findIndex(asset => asset.id === toAsset);
  if (targetIndex !== -1) {
    const rate = currency === 'CNY' ? 1 : currency === 'USD' ? 7.24 : 0.93;
    assets.value[targetIndex].amount += amount * rate;
    saveToStorage();
  }
};

const handleLogout = async () => {
  await signOut();
  user.value = null;
  setUserId(null);
};

const handleSwitchAccount = () => {
  showAuthModal.value = true;
};

const currentTheme = ref('default');

const themes = [
  { id: 'default', name: 'Default', nameKey: 'themeDefault' },
  { id: 'ai-wallpaper', name: 'AI Wallpaper', nameKey: 'themeAI' }
];

const currentThemeInfo = computed(() => themes.find(t => t.id === currentTheme.value) || themes[0]);

const switchTheme = () => {
  const currentIndex = themes.findIndex(t => t.id === currentTheme.value);
  const nextIndex = (currentIndex + 1) % themes.length;
  currentTheme.value = themes[nextIndex].id;
  document.documentElement.setAttribute('data-theme', currentTheme.value);
  saveToLocalStorage();
};

const handleOpenThemes = () => {
  switchTheme();
};

const handleThemeChange = (themeId) => {
  currentTheme.value = themeId;
  document.documentElement.setAttribute('data-theme', themeId);
  saveToStorage();
};

let authSubscription = null;

onMounted(async () => {
  initLocale();
  
  const savedTheme = localStorage.getItem('theme') || 'default';
  currentTheme.value = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  if (isConfigured) {
    const { user: authUser } = await getUser();
    if (authUser) {
      user.value = authUser;
      setUserId(authUser.id);
    }
    
    authSubscription = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        user.value = session.user;
        setUserId(session.user.id);
        loadFromStorage();
      } else if (event === 'SIGNED_OUT') {
        user.value = null;
        setUserId(null);
      }
    });
  }
  
  await loadFromStorage();
});

onUnmounted(() => {
  if (authSubscription) {
    authSubscription.data.subscription.unsubscribe();
  }
});
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: var(--bg-primary);
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
}

.assets-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.assets-grid.mobile-view {
  display: none;
}

@media (max-width: 1280px) {
  .assets-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .assets-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .assets-grid.desktop-view {
    display: none;
  }
  
  .assets-grid.mobile-view {
    display: grid;
  }
}

@media (max-width: 480px) {
  .assets-grid {
    grid-template-columns: 1fr;
  }
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section.mobile-view {
  display: none;
}

@media (max-width: 768px) {
  .detail-section.desktop-view {
    display: none;
  }
}

.detail-inline {
  display: none;
  margin-bottom: 12px;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .detail-inline {
    display: block;
    grid-column: 1 / -1;
  }
}

.detail-inline :deep(.detail-section) {
  max-width: 100%;
  overflow-x: hidden;
}

.detail-inline :deep(.accounts-list),
.detail-inline :deep(.holdings-list) {
  max-width: 100%;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-placeholder {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.detail-placeholder i {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.detail-placeholder p {
  font-size: 13px;
}

.app-footer {
  margin-top: 32px;
  padding: 16px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 11px;
  border-top: 1px solid var(--border-light);
}
</style>
