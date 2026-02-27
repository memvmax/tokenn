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
          :current-view="currentView"
          :invest-tab="investRef?.activeTab"
          :stock-value="investRef?.totalStockValue || 0"
          :wallet-value="walletRef?.totalWalletValue || 0"
          :cash-value="cashAmount"
          :total-profit="investRef?.totalProfit || 0"
        />

        <template v-if="currentView === 'wallet'">
          <WalletView :t="t" :format-amount="formatAmount" ref="walletRef" />
        </template>

        <template v-else-if="currentView === 'invest'">
          <InvestView :t="t" :format-amount="formatAmount" ref="investRef" />
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
import NewsFeed from './components/NewsFeed.vue';
import AuthModal from './components/AuthModal.vue';
import InvestView from './components/InvestView.vue';
import NotesView from './components/NotesView.vue';
import WalletView from './components/WalletView.vue';
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
const investRef = ref(null);
const walletRef = ref(null);

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
  return assets.value;
});

const totalAsset = computed(() => {
  return visibleAssets.value.reduce((sum, asset) => {
    return sum + (Number(asset.amount) || 0);
  }, 0);
});

const cashAmount = computed(() => {
  const cash = assets.value.find(asset => asset.id === 'cash');
  return cash ? cash.amount : 0;
});

const loadFromStorage = async () => {
  try {
    const savedAssets = await loadData('wealthAssets');
    if (savedAssets) {
      if (Array.isArray(savedAssets) && savedAssets.length === 5) {
        savedAssets.forEach((saved, index) => {
          if (assets.value[index]) {
            assets.value[index].amount = saved.amount || 0;
          }
        });
      }
    }
  } catch (error) {
    console.error('Load failed:', error);
  }
};

const saveToStorage = async () => {
  try {
    await saveAllData({
      wealthAssets: assets.value
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
  localStorage.setItem('theme', currentTheme.value);
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

.app-footer {
  margin-top: 32px;
  padding: 16px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 11px;
  border-top: 1px solid var(--border-light);
}
</style>
