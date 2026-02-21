<template>
  <div class="detail-section">
    <div class="detail-header">
      <div class="detail-title">
        <i class="fas fa-coins"></i>
        <span>{{ t('goldDetail') }}</span>
      </div>
      <div class="header-actions">
        <button class="refresh-btn" @click="fetchGoldPrice" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        </button>
      </div>
    </div>

    <div class="gold-content">
      <div class="price-section">
        <div class="current-price">
          <div class="price-label">{{ t('currentGoldPrice') }}</div>
          <div class="price-value">
            <span class="price font-numeric">{{ formatPrice(goldPriceCNY) }}</span>
            <span class="unit">{{ t('cnyPerGram') }}</span>
          </div>
          <div class="price-update">{{ t('lastUpdate') }}: {{ lastUpdateTime }}</div>
        </div>

        <div class="holdings-section">
          <div class="holdings-input">
            <label class="field-label">{{ t('myGoldHoldings') }}</label>
            <div class="input-row">
              <input 
                type="text" 
                :value="goldAmount"
                @input="handleAmountInput"
                @blur="saveData"
                class="field-input amount-input"
                placeholder="0"
              >
              <span class="input-unit">{{ t('gram') }}</span>
            </div>
          </div>
          <div class="total-value">
            <div class="total-label">{{ t('totalValue') }}</div>
            <div class="total-amount font-numeric">{{ formatCurrency(totalValueCNY) }} CNY</div>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <div class="chart-header">
          <div class="chart-title">{{ t('goldPriceChart') }}</div>
          <div class="chart-tabs">
            <button 
              v-for="period in periods" 
              :key="period.value"
              class="tab-btn"
              :class="{ active: selectedPeriod === period.value }"
              @click="changePeriod(period.value)"
            >
              {{ period.label }}
            </button>
          </div>
        </div>
        <div ref="chartRef" class="kline-chart"></div>
      </div>

      <div class="metals-prices">
        <div class="metals-title">{{ t('otherPreciousMetals') }}</div>
        <div class="metals-grid">
          <div class="metal-item" v-for="metal in otherMetals" :key="metal.code">
            <div class="metal-icon" :style="{ color: metal.color }">
              <i :class="metal.icon"></i>
            </div>
            <div class="metal-info">
              <div class="metal-name">{{ t(metal.nameKey) }}</div>
              <div class="metal-price font-numeric">{{ formatPrice(metal.price) }} CNY/{{ t('gram') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  t: {
    type: Function,
    required: true
  },
  formatCurrency: {
    type: Function,
    required: true
  }
});

const emit = defineEmits(['update:total']);

const goldAmount = ref(0);
const goldPriceCNY = ref(0);
const loading = ref(false);
const lastUpdateTime = ref('--');
const selectedPeriod = ref('7d');
const chartRef = ref(null);
let chart = null;

const periods = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' }
];

const otherMetals = ref([
  { code: 'XAG', nameKey: 'silver', price: 0, icon: 'fas fa-circle', color: '#a8a8a8' },
  { code: 'XPT', nameKey: 'platinum', price: 0, icon: 'fas fa-gem', color: '#e5e4e2' },
  { code: 'XPD', nameKey: 'palladium', price: 0, icon: 'fas fa-certificate', color: '#ced4da' }
]);

const totalValueCNY = computed(() => {
  return (Number(goldAmount.value) || 0) * goldPriceCNY.value;
});

const formatPrice = (value) => {
  if (!value) return '0.00';
  return Number(value).toFixed(2);
};

const handleAmountInput = (e) => {
  const value = e.target.value.replace(/[^0-9.]/g, '');
  goldAmount.value = value === '' ? 0 : parseFloat(value) || 0;
};

const fetchGoldPrice = async () => {
  loading.value = true;
  try {
    const response = await fetch('https://api.metals.live/v1/spot/gold');
    const data = await response.json();
    
    if (data && data.price) {
      const priceUSD = data.price;
      goldPriceCNY.value = priceUSD * 7.24 / 31.1035;
      lastUpdateTime.value = new Date().toLocaleTimeString();
    }
  } catch (error) {
    console.error('Failed to fetch gold price:', error);
    goldPriceCNY.value = 580;
  } finally {
    loading.value = false;
  }

  try {
    const response = await fetch('https://api.metals.live/v1/spot');
    const data = await response.json();
    
    data.forEach(item => {
      if (item.metal === 'silver') {
        otherMetals.value[0].price = item.price * 7.24 / 31.1035;
      } else if (item.metal === 'platinum') {
        otherMetals.value[1].price = item.price * 7.24 / 31.1035;
      } else if (item.metal === 'palladium') {
        otherMetals.value[2].price = item.price * 7.24 / 31.1035;
      }
    });
  } catch (error) {
    console.error('Failed to fetch other metals:', error);
  }
};

const generateKlineData = () => {
  const data = [];
  const basePrice = goldPriceCNY.value || 580;
  const now = new Date();
  const days = selectedPeriod.value === '7d' ? 7 : selectedPeriod.value === '30d' ? 30 : 90;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const volatility = (Math.random() - 0.5) * 20;
    const open = basePrice + volatility;
    const close = open + (Math.random() - 0.5) * 15;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;

    data.push({
      date: date.toISOString().split('T')[0],
      open: open.toFixed(2),
      close: close.toFixed(2),
      high: high.toFixed(2),
      low: low.toFixed(2)
    });
  }

  return data;
};

const initChart = () => {
  if (!chartRef.value) return;

  chart = echarts.init(chartRef.value, 'dark');
  updateChart();
};

const updateChart = () => {
  if (!chart) return;

  const klineData = generateKlineData();
  const dates = klineData.map(d => d.date);
  const ohlc = klineData.map(d => [d.open, d.close, d.low, d.high]);

  const option = {
    backgroundColor: 'transparent',
    animation: false,
    grid: {
      left: '10%',
      right: '5%',
      top: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#363a45' } },
      axisLabel: { 
        color: '#787b86',
        fontSize: 10,
        interval: Math.floor(dates.length / 5)
      }
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { lineStyle: { color: '#363a45' } },
      splitLine: { lineStyle: { color: '#2a2e39' } },
      axisLabel: { color: '#787b86', fontSize: 10 }
    },
    series: [{
      type: 'candlestick',
      data: ohlc,
      itemStyle: {
        color: '#ef5350',
        color0: '#26a69a',
        borderColor: '#ef5350',
        borderColor0: '#26a69a'
      }
    }]
  };

  chart.setOption(option);
};

const changePeriod = (period) => {
  selectedPeriod.value = period;
  updateChart();
};

const saveData = () => {
  try {
    localStorage.setItem('goldHoldings', JSON.stringify({
      amount: goldAmount.value
    }));
    emit('update:total', totalValueCNY.value);
  } catch (error) {
    console.error('Save failed:', error);
  }
};

const loadData = () => {
  try {
    const saved = localStorage.getItem('goldHoldings');
    if (saved) {
      const data = JSON.parse(saved);
      goldAmount.value = data.amount || 0;
    }
  } catch (error) {
    console.error('Load failed:', error);
  }
};

const handleResize = () => {
  if (chart) {
    chart.resize();
  }
};

watch(totalValueCNY, (newValue) => {
  emit('update:total', newValue);
});

onMounted(async () => {
  loadData();
  await fetchGoldPrice();
  emit('update:total', totalValueCNY.value);
  nextTick(() => {
    initChart();
  });
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (chart) {
    chart.dispose();
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.detail-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 16px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1;
  padding-top: 7px;
}

.detail-title i {
  color: var(--text-secondary);
  font-size: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 12px;
}

.refresh-btn:hover:not(:disabled) {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.gold-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.price-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.current-price {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 16px;
}

.price-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.price-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
}

.price {
  font-size: 24px;
  font-weight: 500;
  color: var(--text-primary);
}

.unit {
  font-size: 12px;
  color: var(--text-secondary);
}

.price-update {
  font-size: 10px;
  color: var(--text-muted);
}

.holdings-section {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 16px;
}

.holdings-input {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-input {
  flex: 1;
  padding: 8px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
}

.field-input:focus {
  outline: none;
  border-color: var(--border-color);
}

.amount-input {
  font-family: 'Poppins', 'SF Mono', monospace;
  text-align: right;
}

.input-unit {
  font-size: 12px;
  color: var(--text-secondary);
}

.total-value {
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.total-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.total-amount {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
}

.chart-section {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 16px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.chart-tabs {
  display: flex;
  gap: 4px;
}

.tab-btn {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--border-light);
  border-radius: 3px;
  color: var(--text-muted);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  border-color: var(--border-color);
  color: var(--text-secondary);
}

.tab-btn.active {
  background: var(--bg-secondary);
  border-color: #0891b2;
  color: #0891b2;
}

.kline-chart {
  width: 100%;
  height: 200px;
}

.metals-prices {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 16px;
}

.metals-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.metals-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.metal-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
}

.metal-icon {
  font-size: 16px;
}

.metal-info {
  flex: 1;
}

.metal-name {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.metal-price {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .price-section {
    grid-template-columns: 1fr;
  }

  .metals-grid {
    grid-template-columns: 1fr;
  }
}
</style>
