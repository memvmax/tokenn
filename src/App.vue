<template>
  <div class="app-container">
    <div class="main-content">
      <main>
        <TotalAsset 
          :assets="assets" 
          :t="t" 
          :format-currency="formatCurrency"
        />

        <WarningAlert :total-ideal-percentage="totalIdealPercentage" :t="t" />

        <div class="assets-grid">
          <AssetCard 
            v-for="asset in assets" 
            :key="asset.id" 
            :asset="asset" 
            :total-asset="totalAsset" 
            :t="t"
            :format-amount="formatAmount"
            :selected="selectedAssetId === asset.id"
            @update:ideal-percentage="updateAssetIdealPercentage" 
            @select="handleAssetSelect" 
          />
        </div>

        <div class="detail-section" v-if="selectedAssetId && selectedAssetId !== 'overview'">
          <CashDetail 
            v-if="selectedAssetId === 'cash'"
            :t="t"
            :format-amount="formatAmount"
            @update:total="updateCashTotal"
            @transfer="handleTransfer"
          />
          <GoldDetail 
            v-else-if="selectedAssetId === 'gold'"
            :t="t"
            :format-currency="formatCurrency"
            @update:total="updateGoldTotal"
          />
          <div v-else class="detail-placeholder">
            <i class="fas fa-tools"></i>
            <p>{{ t('detailComingSoon') }}</p>
          </div>
        </div>

        <NewsFeed :t="t" />
      </main>

      <footer class="app-footer">
        <p>{{ t('copyright') }}</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import TotalAsset from './components/TotalAsset.vue';
import AssetCard from './components/AssetCard.vue';
import WarningAlert from './components/WarningAlert.vue';
import CashDetail from './components/CashDetail.vue';
import GoldDetail from './components/GoldDetail.vue';
import NewsFeed from './components/NewsFeed.vue';
import { useLocale } from './composables/useLocale';

const { t, initLocale, formatAmount, formatCurrency } = useLocale();

const selectedAssetId = ref(null);

const assets = ref([
  {
    id: 'cash',
    nameKey: 'cash',
    amount: 10000,
    idealPercentage: 20,
    icon: 'fa-wallet',
    color: '#67e8f9'
  },
  {
    id: 'stock',
    nameKey: 'stock',
    amount: 20000,
    idealPercentage: 30,
    icon: 'fa-chart-line',
    color: '#22d3ee'
  },
  {
    id: 'bond',
    nameKey: 'bond',
    amount: 15000,
    idealPercentage: 25,
    icon: 'fa-file-invoice-dollar',
    color: '#06b6d4'
  },
  {
    id: 'gold',
    nameKey: 'gold',
    amount: 8000,
    idealPercentage: 15,
    icon: 'fa-coins',
    color: '#0891b2'
  },
  {
    id: 'emerging',
    nameKey: 'emerging',
    amount: 7000,
    idealPercentage: 10,
    icon: 'fa-rocket',
    color: '#0e7490'
  }
]);

const totalAsset = computed(() => {
  return assets.value.reduce((sum, asset) => {
    return sum + (Number(asset.amount) || 0);
  }, 0);
});

const totalIdealPercentage = computed(() => {
  return assets.value.reduce((sum, asset) => {
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

const loadFromLocalStorage = () => {
  try {
    const savedAssets = localStorage.getItem('wealthAssets');
    if (savedAssets) {
      const parsed = JSON.parse(savedAssets);
      if (Array.isArray(parsed) && parsed.length === 5) {
        parsed.forEach((saved, index) => {
          if (assets.value[index]) {
            assets.value[index].amount = saved.amount || 0;
            assets.value[index].idealPercentage = saved.idealPercentage || 0;
            assets.value[index].color = defaultColors[saved.id] || assets.value[index].color;
          }
        });
      } else {
        localStorage.removeItem('wealthAssets');
      }
    }
  } catch (error) {
    console.error('Load failed:', error);
    localStorage.removeItem('wealthAssets');
  }
};

const saveToLocalStorage = () => {
  try {
    localStorage.setItem('wealthAssets', JSON.stringify(assets.value));
  } catch (error) {
    console.error('Save failed:', error);
  }
};

const handleAssetSelect = (id) => {
  selectedAssetId.value = selectedAssetId.value === id ? null : id;
};

const updateCashTotal = (total) => {
  const cashIndex = assets.value.findIndex(asset => asset.id === 'cash');
  if (cashIndex !== -1) {
    assets.value[cashIndex].amount = total;
    saveToLocalStorage();
  }
};

const updateGoldTotal = (total) => {
  const goldIndex = assets.value.findIndex(asset => asset.id === 'gold');
  if (goldIndex !== -1) {
    assets.value[goldIndex].amount = total;
    saveToLocalStorage();
  }
};

const handleTransfer = ({ amount, currency, toAsset }) => {
  const targetIndex = assets.value.findIndex(asset => asset.id === toAsset);
  if (targetIndex !== -1) {
    const rate = currency === 'CNY' ? 1 : currency === 'USD' ? 7.24 : 0.93;
    assets.value[targetIndex].amount += amount * rate;
    saveToLocalStorage();
  }
};

const updateAssetIdealPercentage = (id, idealPercentage) => {
  const assetIndex = assets.value.findIndex(asset => asset.id === id);
  if (assetIndex !== -1) {
    assets.value[assetIndex].idealPercentage = idealPercentage;
    saveToLocalStorage();
  }
};

onMounted(() => {
  initLocale();
  loadFromLocalStorage();
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

@media (max-width: 1280px) {
  .assets-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .assets-grid {
    grid-template-columns: repeat(2, 1fr);
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
