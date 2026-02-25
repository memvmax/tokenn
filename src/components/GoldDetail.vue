<template>
  <div class="detail-section" ref="sectionRef">
    <div class="detail-header">
      <div class="detail-title">
        <i class="fas fa-coins"></i>
        <span>{{ t('goldDetail') }}</span>
      </div>
      <div class="header-actions">
      </div>
    </div>

    <div class="gold-content">
      <div class="holdings-table-section">
        <div class="holdings-list" v-if="metals.length > 0">
          <div class="accounts-header">
            <div class="header-cell col-1">NAME / SHARE</div>
            <div class="header-cell col-2">PRICE / COST</div>
            <div class="header-cell col-3">VALUE / P&L</div>
          </div>
          <div 
            v-for="(metal, index) in filteredMetals" 
            :key="metal.code"
            class="metal-row"
            :class="{ 'active': chartMetal === metal.code }"
            @click="switchChart(metal.code)"
          >
            <div class="cell col-1">
              <span class="cell-text">
                <span class="metal-dot" :style="{ background: metal.color }"></span>
                {{ metal.name }} <span class="separator">/</span> <span class="font-numeric">{{ formatNumber(getTotalAmount(metal.code)) }}g</span>
              </span>
            </div>
            <div class="cell col-2">
              <span class="cell-text font-numeric">{{ formatPrice(metal.price) }} <span class="separator">/</span> <span :class="getCostPriceClass(metal)">{{ formatPrice(getCostPrice(metal.code)) }}</span></span>
            </div>
            <div class="cell col-3">
              <span class="cell-text font-numeric">{{ formatCurrency(getTotalAmount(metal.code) * metal.price) }} <span class="separator">/</span> <span :class="getPnLClass(metal)">{{ formatPnLShort(metal) }}</span></span>
            </div>
          </div>
          
          <div v-if="filteredMetals.length === 0 && metals.length > 0" class="no-results-row">
            <span>{{ t('noMatchingResults') }}</span>
          </div>
        </div>

        <div class="detail-summary" v-if="metals.length > 0">
          <div class="summary-row">
            <span class="summary-label">TOTAL VALUE</span>
            <span class="summary-value font-numeric">{{ formatCurrency(filteredTotalValue) }} CNY</span>
            <span v-if="filterMetal" class="filtered-hint">({{ t('filtered') }})</span>
          </div>
          <div class="summary-row summary-pnl">
            <span class="summary-label">TOTAL P&L</span>
            <span class="summary-pnl-value font-numeric" :class="totalPnL >= 0 ? 'positive' : 'negative'">
              {{ totalPnL >= 0 ? '+' : '' }}{{ formatCurrency(Math.abs(totalPnL)) }} CNY
              <span class="pnl-percent">({{ totalPnLPercent >= 0 ? '+' : '' }}{{ totalPnLPercent.toFixed(2) }}%)</span>
            </span>
          </div>
          <div class="summary-row update-info">
            <span class="update-label">{{ t('lastUpdate') }}: {{ lastUpdateTime }}</span>
          </div>
        </div>
      </div>

      <div class="chart-section" v-show="false">
        <div class="chart-header">
          <div class="chart-title">{{ currentMetalName }} {{ currentMetalDisplayPrice }} {{ t('priceChart') }}</div>
        </div>
        <TradingViewChart 
          :key="chartMetal"
          :symbol="currentMetalTvSymbol" 
          theme="dark"
        />
        <div class="chart-hint">
          <i class="fas fa-hand-pointer"></i>
          <span>Powered by TradingView</span>
        </div>
      </div>
    </div>

    <div class="buy-modal-overlay" v-if="showBuyModal" @click="closeBuyModal">
      <div class="buy-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ currentMetalName }} - {{ t('addBuyRecord') || 'ADD BUY RECORD' }}</h3>
          <button class="modal-close" @click="closeBuyModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="buy-form">
            <div class="form-row">
              <div class="form-group">
                <label>AMOUNT (g)</label>
                <input type="text" v-model="buyForm.amount" class="form-input font-numeric" placeholder="0.00">
              </div>
              <div class="form-group">
                <label>PRICE (CNY/g)</label>
                <input type="text" v-model="buyForm.price" class="form-input font-numeric" placeholder="0.00">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>FEE (CNY)</label>
                <input type="text" v-model="buyForm.fee" class="form-input font-numeric" placeholder="0.00">
              </div>
              <div class="form-group">
                <label>DATE</label>
                <input type="date" v-model="buyForm.date" class="form-input">
              </div>
            </div>
            <div class="form-summary">
              <div class="form-summary-row">
                <span>TOTAL COST</span>
                <span class="font-numeric">{{ formatCurrency(calculateTotalCost) }} CNY</span>
              </div>
            </div>
          </div>
          
          <div class="buy-records" v-if="currentMetalRecords.length > 0">
            <div class="records-header">
              <h4>{{ t('buyRecords') || 'BUY RECORDS' }}</h4>
              <span class="records-count">{{ currentMetalRecords.length }} {{ t('records') || 'records' }}</span>
            </div>
            <div class="records-list">
              <div v-for="(record, idx) in currentMetalRecords" :key="record.id" class="record-item">
                <div class="record-main">
                  <div class="record-amount">
                    <span class="amount-num font-numeric">{{ formatNumber(record.amount) }}</span>
                    <span class="amount-unit">g</span>
                  </div>
                  <div class="record-price">
                    <span class="price-label">@</span>
                    <span class="price-num font-numeric">{{ formatPrice(record.price) }}</span>
                    <span class="price-unit">CNY/g</span>
                  </div>
                  <div class="record-fee" v-if="record.fee > 0">
                    <span class="fee-label">+{{ formatCurrency(record.fee) }}</span>
                  </div>
                </div>
                <div class="record-meta">
                  <span class="record-date">{{ record.date }}</span>
                  <span class="record-total font-numeric">= {{ formatCurrency(record.amount * record.price + (record.fee || 0)) }} CNY</span>
                </div>
                <button class="record-delete" @click="deleteRecord(buyMetalCode, record.id)">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
            <div class="records-summary">
              <div class="records-summary-row">
                <span>TOTAL</span>
                <span class="font-numeric">{{ formatNumber(getTotalAmount(buyMetalCode)) }}g</span>
              </div>
              <div class="records-summary-row">
                <span>AVG COST</span>
                <span class="font-numeric">{{ formatPrice(getCostPrice(buyMetalCode)) }} CNY/g</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeBuyModal">{{ t('cancel') }}</button>
          <button class="confirm-btn" @click="addBuyRecord" :disabled="!canAddRecord">{{ t('confirm') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import TradingViewChart from './TradingViewChart.vue';

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

const metals = ref([
  { code: 'gold', name: 'GOLD', color: '#ffd700', price: 0, symbol: 'FX:XAUUSD', tvSymbol: 'XAUUSD', displayPrice: 0, chartData: [] },
  { code: 'silver', name: 'SILVER', color: '#a8a8a8', price: 0, symbol: 'OANDA:XAGUSD', tvSymbol: 'OANDA:XAGUSD', displayPrice: 0, chartData: [] },
  { code: 'copper', name: 'COPPER', color: '#b87333', price: 0, symbol: 'OANDA:XCUUSD', tvSymbol: 'OANDA:XCUUSD', displayPrice: 0, chartData: [] },
  { code: 'crude', name: 'CRUDE OIL', color: '#2d2d2d', price: 0, symbol: 'OILUSD', tvSymbol: 'OILUSD', displayPrice: 0, chartData: [] }
]);

const buyRecords = ref({});

const loading = ref(false);
const lastUpdateTime = ref('--');
const chartRef = ref(null);
const chartMetal = ref('');
let chart = null;

const sortField = ref('name');
const sortOrder = ref('asc');
const filterMetal = ref('');
const showMetalDropdown = ref(false);

const showBuyModal = ref(false);
const buyMetalCode = ref('');
const buyForm = ref({
  amount: '',
  price: '',
  fee: '',
  date: new Date().toISOString().split('T')[0]
});

const uniqueMetals = computed(() => {
  return metals.value.map(m => m.name);
});

const filteredMetals = computed(() => {
  let result = [...metals.value];
  
  if (filterMetal.value) {
    result = result.filter(m => m.name === filterMetal.value);
  }
  
  if (sortField.value) {
    result.sort((a, b) => {
      let aVal, bVal;
      
      if (sortField.value === 'totalAmount') {
        aVal = getTotalAmount(a.code);
        bVal = getTotalAmount(b.code);
      } else if (sortField.value === 'costPrice') {
        aVal = getCostPrice(a.code);
        bVal = getCostPrice(b.code);
      } else if (sortField.value === 'price') {
        aVal = a.price;
        bVal = b.price;
      } else {
        aVal = String(a[sortField.value] || '').toLowerCase();
        bVal = String(b[sortField.value] || '').toLowerCase();
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  return result;
});

const filteredTotalValue = computed(() => {
  return filteredMetals.value.reduce((sum, m) => sum + getTotalAmount(m.code) * m.price, 0);
});

const totalValue = computed(() => {
  return metals.value.reduce((sum, m) => sum + getTotalAmount(m.code) * m.price, 0);
});

const totalCost = computed(() => {
  return metals.value.reduce((sum, m) => sum + getTotalCost(m.code), 0);
});

const totalPnL = computed(() => {
  return totalValue.value - totalCost.value;
});

const totalPnLPercent = computed(() => {
  if (totalCost.value === 0) return 0;
  return (totalPnL.value / totalCost.value) * 100;
});

const currentMetalName = computed(() => {
  const m = metals.value.find(m => m.code === chartMetal.value);
  return m ? m.name : 'GOLD';
});

const currentMetalDisplayPrice = computed(() => {
  const m = metals.value.find(m => m.code === chartMetal.value);
  if (m && m.displayPrice) {
    return `$${m.displayPrice.toLocaleString()}`;
  }
  return '';
});

const currentMetalTvSymbol = computed(() => {
  const m = metals.value.find(m => m.code === chartMetal.value);
  return m ? m.tvSymbol : 'FX:XAUUSD';
});

const currentMetalRecords = computed(() => {
  return buyRecords.value[buyMetalCode.value] || [];
});

const calculateTotalCost = computed(() => {
  const amount = parseFloat(buyForm.value.amount) || 0;
  const price = parseFloat(buyForm.value.price) || 0;
  const fee = parseFloat(buyForm.value.fee) || 0;
  return amount * price + fee;
});

const canAddRecord = computed(() => {
  const amount = parseFloat(buyForm.value.amount);
  const price = parseFloat(buyForm.value.price);
  return amount > 0 && price > 0;
});

const getTotalAmount = (code) => {
  const records = buyRecords.value[code] || [];
  return records.reduce((sum, r) => sum + r.amount, 0);
};

const getTotalCost = (code) => {
  const records = buyRecords.value[code] || [];
  return records.reduce((sum, r) => sum + r.amount * r.price + (r.fee || 0), 0);
};

const getCostPrice = (code) => {
  const totalAmount = getTotalAmount(code);
  if (totalAmount === 0) return 0;
  return getTotalCost(code) / totalAmount;
};

const getCostPriceClass = (metal) => {
  const costPrice = getCostPrice(metal.code);
  if (costPrice === 0) return '';
  return metal.price >= costPrice ? 'positive' : 'negative';
};

const getPnLClass = (metal) => {
  const pnl = getTotalAmount(metal.code) * metal.price - getTotalCost(metal.code);
  if (pnl === 0) return '';
  return pnl > 0 ? 'positive' : 'negative';
};

const formatPnL = (metal) => {
  const totalAmount = getTotalAmount(metal.code);
  const totalCost = getTotalCost(metal.code);
  const currentValue = totalAmount * metal.price;
  const pnl = currentValue - totalCost;
  
  if (totalAmount === 0) return '-';
  
  const pnlPercent = totalCost > 0 ? (pnl / totalCost * 100) : 0;
  const sign = pnl >= 0 ? '+' : '';
  return `${sign}${formatCurrency(Math.abs(pnl))} (${sign}${pnlPercent.toFixed(2)}%)`;
};

const formatPnLShort = (metal) => {
  const totalAmount = getTotalAmount(metal.code);
  const totalCost = getTotalCost(metal.code);
  const currentValue = totalAmount * metal.price;
  const pnl = currentValue - totalCost;
  
  if (totalAmount === 0) return '-';
  
  const pnlPercent = totalCost > 0 ? (pnl / totalCost * 100) : 0;
  const sign = pnl >= 0 ? '+' : '-';
  return `${sign}${formatCurrency(Math.abs(pnl))} / ${sign}${pnlPercent.toFixed(1)}%`;
};

const formatPrice = (value) => {
  if (!value) return '0.00';
  return Number(value).toFixed(2);
};

const formatNumber = (value) => {
  if (!value && value !== 0) return '0';
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const toggleSort = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'asc';
  }
};

const togglePriceSort = () => toggleSort('price');
const toggleCostSort = () => toggleSort('costPrice');
const toggleAmountSort = () => toggleSort('totalAmount');

const toggleMetalDropdown = () => {
  showMetalDropdown.value = !showMetalDropdown.value;
};

const selectSort = (field, order) => {
  sortField.value = field;
  sortOrder.value = order;
  showMetalDropdown.value = false;
};

const selectMetalFilter = (metal) => {
  filterMetal.value = metal;
  showMetalDropdown.value = false;
};

const sortIcon = (field) => {
  if (sortField.value !== field) return 'fas fa-sort';
  return sortOrder.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
};

const clearFilters = () => {
  filterMetal.value = '';
};

const openAddOrderModal = () => {
  if (chartMetal.value) {
    openBuyModal(chartMetal.value);
  } else if (filteredMetals.value.length > 0) {
    openBuyModal(filteredMetals.value[0].code);
  }
};

const openBuyModal = (code) => {
  buyMetalCode.value = code;
  buyForm.value = {
    amount: '',
    price: '',
    fee: '',
    date: new Date().toISOString().split('T')[0]
  };
  showBuyModal.value = true;
};

const closeBuyModal = () => {
  showBuyModal.value = false;
  buyMetalCode.value = '';
};

const addBuyRecord = () => {
  if (!canAddRecord.value) return;
  
  const code = buyMetalCode.value;
  if (!buyRecords.value[code]) {
    buyRecords.value[code] = [];
  }
  
  buyRecords.value[code].unshift({
    id: Date.now(),
    amount: parseFloat(buyForm.value.amount),
    price: parseFloat(buyForm.value.price),
    fee: parseFloat(buyForm.value.fee) || 0,
    date: buyForm.value.date
  });
  
  saveData();
  
  buyForm.value = {
    amount: '',
    price: '',
    fee: '',
    date: new Date().toISOString().split('T')[0]
  };
};

const deleteRecord = (code, id) => {
  if (buyRecords.value[code]) {
    buyRecords.value[code] = buyRecords.value[code].filter(r => r.id !== id);
    saveData();
  }
};

const fetchPrices = async () => {
  loading.value = true;
  try {
    let usdToCny = 7.2;
    try {
      const forexResponse = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/USDCNY=X?interval=1d&range=1d'
      );
      const forexData = await forexResponse.json();
      if (forexData.chart && forexData.chart.result && forexData.chart.result[0]) {
        usdToCny = forexData.chart.result[0].meta.regularMarketPrice || 7.2;
      }
    } catch (e) {
      console.error('Failed to fetch forex rate:', e);
    }

    for (const metal of metals.value) {
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${metal.symbol}?interval=1d&range=90d`
        );
        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
          const meta = data.chart.result[0].meta;
          const priceUSD = meta.regularMarketPrice || meta.previousClose;
          const result = data.chart.result[0];
          
          metal.displayPrice = priceUSD;
          
          if (result.timestamp && result.indicators && result.indicators.quote && result.indicators.quote[0]) {
            const timestamps = result.timestamp;
            const quotes = result.indicators.quote[0];
            
            metal.chartData = timestamps.map((ts, idx) => ({
              date: new Date(ts * 1000).toISOString().split('T')[0],
              open: quotes.open[idx] || priceUSD,
              high: quotes.high[idx] || priceUSD,
              low: quotes.low[idx] || priceUSD,
              close: quotes.close[idx] || priceUSD
            }));
          }
          
          let priceCNYPerUnit = priceUSD * usdToCny;
          
          if (metal.code === 'gold' || metal.code === 'silver') {
            metal.price = priceCNYPerUnit / 31.1035;
          } else if (metal.code === 'copper') {
            metal.price = priceCNYPerUnit * 0.0283495;
          } else if (metal.code === 'crude') {
            metal.price = priceCNYPerUnit * 0.1364;
          }
        }
      } catch (e) {
        console.error(`Failed to fetch ${metal.code}:`, e);
      }
    }
    
    lastUpdateTime.value = new Date().toLocaleTimeString();
    
    if (chart) {
      updateChart();
    }
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    const goldMetal = metals.value.find(m => m.code === 'gold');
    const silverMetal = metals.value.find(m => m.code === 'silver');
    if (goldMetal) goldMetal.price = 1134;
    if (silverMetal) silverMetal.price = 18;
  } finally {
    loading.value = false;
  }
};

const generateKlineData = (basePrice, days = 90) => {
  const data = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const trendFactor = Math.sin(i / 10) * (basePrice * 0.03);
    const volatility = (Math.random() - 0.5) * (basePrice * 0.02);
    const open = basePrice + trendFactor + volatility;
    const close = open + (Math.random() - 0.5) * (basePrice * 0.01);
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.005);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.005);

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

const calculateMA = (data, dayCount) => {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < dayCount - 1) {
      result.push('-');
      continue;
    }
    let sum = 0;
    for (let j = 0; j < dayCount; j++) {
      sum += parseFloat(data[i - j].close);
    }
    result.push((sum / dayCount).toFixed(2));
  }
  return result;
};

const initChart = () => {
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value, 'dark');
  updateChart();
};

const updateChart = () => {
  if (!chart) return;

  const metal = metals.value.find(m => m.code === chartMetal.value);
  let klineData = metal && metal.chartData && metal.chartData.length > 0 
    ? metal.chartData 
    : generateKlineData(metal ? metal.displayPrice || 2000 : 2000);
    
  const dates = klineData.map(d => {
    const parts = d.date.split('-');
    return `${parts[1]}/${parts[2]}`;
  });
  const ohlc = klineData.map(d => [d.open, d.close, d.low, d.high]);
  
  const ma5 = calculateMA(klineData, 5);
  const ma10 = calculateMA(klineData, 10);
  const ma20 = calculateMA(klineData, 20);

  const upColor = 'var(--accent-green)';
  const downColor = 'var(--accent-red)';

  const option = {
    backgroundColor: 'transparent',
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        lineStyle: { color: '#363a45' }
      },
      backgroundColor: 'rgba(30, 34, 45, 0.95)',
      borderColor: '#363a45',
      borderWidth: 1,
      padding: [10, 15],
      textStyle: { color: '#d1d4dc', fontSize: 12 },
      formatter: function(params) {
        const date = params[0].axisValue;
        let result = `<div style="font-weight:600;margin-bottom:8px;">${date}</div>`;
        params.forEach(param => {
          if (param.seriesType === 'candlestick') {
            const data = param.data;
            const change = ((data[2] - data[1]) / data[1] * 100).toFixed(2);
            const changeColor = data[2] >= data[1] ? upColor : downColor;
            result += `<div style="margin-bottom:4px;">`;
            result += `<span style="color:#787b86">Open:</span> <span style="color:#d1d4dc">${data[1]}</span><br/>`;
            result += `<span style="color:#787b86">Close:</span> <span style="color:#d1d4dc">${data[2]}</span> <span style="color:${changeColor}">(${change}%)</span><br/>`;
            result += `<span style="color:#787b86">High:</span> <span style="color:#d1d4dc">${data[4]}</span><br/>`;
            result += `<span style="color:#787b86">Low:</span> <span style="color:#d1d4dc">${data[3]}</span>`;
            result += `</div>`;
          } else if (param.seriesName && param.value !== '-') {
            result += `<div><span style="color:${param.color}">${param.seriesName}:</span> <span style="color:#d1d4dc">${param.value}</span></div>`;
          }
        });
        return result;
      }
    },
    legend: {
      data: ['MA5', 'MA10', 'MA20'],
      top: 0,
      right: 10,
      textStyle: { color: '#787b86', fontSize: 10 },
      itemWidth: 20,
      itemHeight: 2,
      itemGap: 15
    },
    grid: {
      left: 50,
      right: 30,
      top: 30,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: true,
      axisLine: { lineStyle: { color: '#363a45' } },
      axisLabel: { color: '#787b86', fontSize: 9, interval: 14 },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax'
    },
    yAxis: {
      scale: true,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#2a2e39', type: 'dashed' } },
      axisLabel: { color: '#787b86', fontSize: 10 }
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0],
        start: 0,
        end: 100,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: false
      }
    ],
    series: [
      {
        name: 'K-Line',
        type: 'candlestick',
        data: ohlc,
        itemStyle: {
          color: upColor,
          color0: downColor,
          borderColor: upColor,
          borderColor0: downColor
        },
        barWidth: '50%'
      },
      {
        name: 'MA5',
        type: 'line',
        data: ma5,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.5, color: '#f5a623' }
      },
      {
        name: 'MA10',
        type: 'line',
        data: ma10,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.5, color: '#7b68ee' }
      },
      {
        name: 'MA20',
        type: 'line',
        data: ma20,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.5, color: '#00bcd4' }
      }
    ]
  };

  chart.setOption(option, true);
};

const switchChart = (code) => {
  if (chartMetal.value === code) {
    chartMetal.value = '';
  } else {
    chartMetal.value = code;
  }
  updateChart();
};

const saveData = () => {
  try {
    localStorage.setItem('metalsBuyRecords', JSON.stringify(buyRecords.value));
    emit('update:total', totalValue.value);
  } catch (error) {
    console.error('Save failed:', error);
  }
};

const loadData = () => {
  try {
    const saved = localStorage.getItem('metalsBuyRecords');
    if (saved) {
      buyRecords.value = JSON.parse(saved);
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

const handleClickOutside = (e) => {
  const target = e.target;
  const isDropdown = target.closest('.dropdown-menu');
  const isHeaderDropdown = target.closest('.header-dropdown');
  
  if (!isDropdown && !isHeaderDropdown) {
    showMetalDropdown.value = false;
  }
};

watch(totalValue, (newValue) => {
  emit('update:total', newValue);
});

onMounted(async () => {
  loadData();
  await fetchPrices();
  await nextTick();
  initChart();
  window.addEventListener('resize', handleResize);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('click', handleClickOutside);
  if (chart) {
    chart.dispose();
    chart = null;
  }
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
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
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
  height: 30px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-sizing: border-box;
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
  gap: 16px;
}

.holdings-table-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.holdings-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.accounts-header {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-light);
}

.header-cell {
  padding: 10px 12px;
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  height: 44px;
  box-sizing: border-box;
}

.header-cell.col-1 {
  justify-content: flex-start;
}

.header-cell.col-2 {
  justify-content: center;
}

.header-cell.col-3 {
  justify-content: flex-end;
}

.metal-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  cursor: pointer;
  transition: background 0.15s ease;
  min-height: 44px;
  box-sizing: border-box;
}

.metal-row:last-of-type {
  border-bottom: none;
}

.metal-row:hover {
  background: var(--bg-hover);
}

.metal-row.active {
  background: rgba(8, 145, 178, 0.15);
  border-left: 3px solid #0891b2;
}

.cell {
  padding: 10px 12px;
  display: flex;
  align-items: center;
}

.cell.col-1 {
  justify-content: flex-start;
}

.cell.col-2 {
  justify-content: center;
}

.cell.col-3 {
  justify-content: flex-end;
}

.cell-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.separator {
  color: var(--text-muted);
  margin: 0 2px;
}

.metal-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.positive {
  color: var(--accent-green);
}

.negative {
  color: var(--accent-red);
}

.no-results-row {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.price-value {
  font-size: 13px;
  color: var(--text-primary);
}

.cost-value {
  font-size: 13px;
  color: var(--text-secondary);
}

.cost-value.positive {
  color: var(--accent-green);
}

.cost-value.negative {
  color: var(--accent-red);
}

.amount-value {
  font-size: 13px;
  color: var(--text-primary);
}

.amount-unit {
  font-size: 10px;
  color: var(--text-secondary);
  margin-left: 4px;
}

.value-amount {
  font-size: 13px;
  color: var(--text-secondary);
}

.pnl-value {
  font-size: 12px;
  color: var(--text-muted);
}

.pnl-value.positive {
  color: var(--accent-green);
}

.pnl-value.negative {
  color: var(--accent-red);
}

.add-buy-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 3px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 11px;
}

.add-buy-btn:hover {
  color: #0891b2;
  border-color: #0891b2;
}

.no-results-row {
  padding: 24px 14px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
  border-bottom: 1px solid var(--border-light);
}

.detail-summary {
  padding: 12px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-top: none;
  border-radius: 0 0 4px 4px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-pnl {
  margin-top: 8px;
}

.summary-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.summary-value {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.summary-pnl-value {
  font-size: 14px;
  font-weight: 500;
}

.summary-pnl-value.positive {
  color: var(--accent-green);
}

.summary-pnl-value.negative {
  color: var(--accent-red);
}

.pnl-percent {
  font-size: 12px;
  opacity: 0.8;
}

.filtered-hint {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: 8px;
}

.update-info {
  margin-top: 6px;
}

.update-label {
  font-size: 10px;
  color: var(--text-muted);
}

.chart-section {
  background: var(--bg-tertiary);
  border-radius: 4px;
  padding: 14px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.kline-chart {
  width: 100%;
  aspect-ratio: 2 / 1;
  min-height: 200px;
}

.chart-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 10px;
  color: var(--text-muted);
}

.chart-hint i {
  font-size: 10px;
}

.buy-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.buy-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.buy-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.buy-modal .modal-header h3 {
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

.buy-modal .modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.buy-form {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 600;
}

.form-input {
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
}

.form-input:focus {
  outline: none;
  border-color: #0891b2;
}

.form-summary {
  background: var(--bg-tertiary);
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
}

.form-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.form-summary-row span:last-child {
  font-weight: 500;
  color: var(--text-primary);
}

.buy-records {
  border-top: 1px solid var(--border-light);
  padding-top: 16px;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.records-header h4 {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0;
}

.records-count {
  font-size: 10px;
  color: var(--text-muted);
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.record-item {
  background: var(--bg-tertiary);
  border-radius: 4px;
  padding: 10px 12px;
  position: relative;
}

.record-main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.record-amount .amount-num {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.record-amount .amount-unit {
  font-size: 10px;
  color: var(--text-secondary);
  margin-left: 2px;
}

.record-price .price-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-right: 2px;
}

.record-price .price-num {
  font-size: 12px;
  color: var(--text-secondary);
}

.record-price .price-unit {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: 4px;
}

.record-fee .fee-label {
  font-size: 10px;
  color: var(--text-muted);
}

.record-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  color: var(--text-muted);
}

.record-total {
  color: var(--text-secondary);
}

.record-delete {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 3px;
  transition: color 0.15s ease;
  font-size: 10px;
  opacity: 0;
}

.record-item:hover .record-delete {
  opacity: 1;
}

.record-delete:hover {
  color: var(--accent-red);
}

.records-summary {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.records-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.records-summary-row:last-child {
  margin-bottom: 0;
}

.records-summary-row span:last-child {
  font-weight: 500;
  color: var(--text-primary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-light);
  flex-shrink: 0;
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

.confirm-btn {
  padding: 8px 16px;
  background: #0891b2;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.confirm-btn:hover:not(:disabled) {
  background: #0e7490;
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-menu-wrapper {
  position: relative;
}

.action-menu-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-tertiary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.action-menu-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.action-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 140px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.menu-item {
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--text-primary);
  text-align: left;
  transition: background 0.2s ease;
}

.menu-item:hover {
  background: var(--bg-hover);
}

.menu-item i {
  width: 16px;
  color: var(--text-secondary);
}

.menu-item:hover {
  background: var(--bg-hover);
}

.menu-item i {
  width: 16px;
  color: var(--text-secondary);
}

@media (max-width: 480px) {
  .holdings-list {
    border-radius: 6px;
  }

  .accounts-header {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .header-cell {
    padding: 8px 6px;
    font-size: 8px;
    height: 36px;
  }

  .metal-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    min-height: 50px;
  }

  .metal-row .cell {
    padding: 8px 6px;
  }

  .metal-row .cell.col-1 {
    justify-content: flex-start;
  }

  .metal-row .cell.col-2 {
    justify-content: center;
  }

  .metal-row .cell.col-3 {
    justify-content: flex-end;
  }

  .metal-row .cell-text {
    font-size: 11px;
  }
}
</style>
