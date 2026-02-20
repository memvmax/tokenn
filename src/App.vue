<template>
  <div class="app-container">
    <div class="main-content">
      <main>
        <TotalAsset :assets="assets" :t="t" :format-currency="formatCurrency" />

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

        <div class="chart-section">
          <div class="section-header">
            <h3 class="section-title">
              <i class="fas fa-chart-pie"></i>
              {{ t('assetDistribution') }}
            </h3>
          </div>
          <div ref="chartRef" class="chart-container"></div>
        </div>
      </main>

      <footer class="app-footer">
        <p>{{ t('copyright') }}</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import TotalAsset from './components/TotalAsset.vue';
import AssetCard from './components/AssetCard.vue';
import WarningAlert from './components/WarningAlert.vue';
import { useLocale } from './composables/useLocale';

const { t, currentLocale, initLocale, formatAmount, formatCurrency } = useLocale();

const chartRef = ref(null);
let chart = null;

const selectedAssetId = ref(null);

const assets = ref([
  {
    id: 'cash',
    nameKey: 'cash',
    amount: 10000,
    idealPercentage: 20,
    icon: 'fa-wallet',
    color: '#9ca3af'
  },
  {
    id: 'stock',
    nameKey: 'stock',
    amount: 20000,
    idealPercentage: 30,
    icon: 'fa-chart-line',
    color: '#787b86'
  },
  {
    id: 'bond',
    nameKey: 'bond',
    amount: 15000,
    idealPercentage: 25,
    icon: 'fa-file-invoice-dollar',
    color: '#5d606b'
  },
  {
    id: 'gold',
    nameKey: 'gold',
    amount: 8000,
    idealPercentage: 15,
    icon: 'fa-coins',
    color: '#4b5563'
  },
  {
    id: 'emerging',
    nameKey: 'emerging',
    amount: 7000,
    idealPercentage: 10,
    icon: 'fa-rocket',
    color: '#374151'
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
  cash: '#9ca3af',
  stock: '#787b86',
  bond: '#5d606b',
  gold: '#4b5563',
  emerging: '#374151'
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

const updateAssetIdealPercentage = (id, idealPercentage) => {
  const assetIndex = assets.value.findIndex(asset => asset.id === id);
  if (assetIndex !== -1) {
    assets.value[assetIndex].idealPercentage = idealPercentage;
    saveToLocalStorage();
    updateChart();
  }
};

const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value, 'dark');
    updateChart();
  }
};

const updateChart = () => {
  if (!chart) return;

  const chartData = assets.value.map(asset => ({
    name: t(asset.nameKey),
    value: asset.amount,
    itemStyle: {
      color: asset.color
    }
  }));

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
      backgroundColor: '#1e222d',
      borderColor: '#363a45',
      borderWidth: 1,
      textStyle: {
        color: '#d1d4dc',
        fontSize: 12
      }
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      data: assets.value.map(asset => t(asset.nameKey)),
      textStyle: {
        color: '#787b86',
        fontSize: 11
      },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 16
    },
    series: [
      {
        name: t('assetDistribution'),
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#1e222d',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 500,
            color: '#d1d4dc'
          },
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: false
        },
        data: chartData
      }
    ]
  };

  chart.setOption(option);
};

const handleResize = () => {
  if (chart) {
    chart.resize();
  }
};

onMounted(() => {
  initLocale();
  loadFromLocalStorage();
  nextTick(() => {
    initChart();
  });
  window.addEventListener('resize', handleResize);
});

watch(assets, () => {
  updateChart();
}, { deep: true });

watch(currentLocale, () => {
  updateChart();
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

.chart-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 16px;
}

.section-header {
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.section-title i {
  color: var(--text-secondary);
  font-size: 12px;
}

.chart-container {
  width: 100%;
  height: 280px;
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
