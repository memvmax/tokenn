<template>
  <div class="detail-section">
    <div class="detail-header">
      <div class="detail-title">
        <i class="fas fa-chart-line"></i>
        <span>{{ t('stockDetail') || 'Stock Detail' }}</span>
      </div>
      <div class="header-actions">
        <div class="action-menu-wrapper">
          <button class="action-menu-btn" @click.stop="showActionMenu = !showActionMenu">
            <i class="fas fa-ellipsis-h"></i>
          </button>
          <div class="action-menu-dropdown" v-if="showActionMenu" @click.stop>
            <button class="menu-item" @click="fetchPrices(); showActionMenu = false">
              <i class="fas fa-sync-alt"></i>
              <span>{{ t('refresh') || 'Refresh' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="stock-content">
      <div class="holdings-table-section">
        <div class="holdings-list" v-if="assets.length > 0">
          <div class="accounts-header">
            <div class="header-cell asset-cell">
              <div class="header-dropdown" @click.stop="toggleAssetDropdown">
                <span class="header-text">STOCK</span>
                <i class="fas fa-chevron-down dropdown-icon" :class="{ 'rotated': showAssetDropdown }"></i>
              </div>
              <div class="dropdown-menu" v-if="showAssetDropdown" @click.stop>
                <div class="dropdown-section">
                  <div class="dropdown-label">{{ t('sortBy') }}</div>
                  <button class="dropdown-item" :class="{ 'active': sortField === 'name' && sortOrder === 'asc' }" @click="selectSort('name', 'asc')">
                    <i class="fas fa-sort-alpha-down"></i>
                    <span>A → Z</span>
                  </button>
                  <button class="dropdown-item" :class="{ 'active': sortField === 'name' && sortOrder === 'desc' }" @click="selectSort('name', 'desc')">
                    <i class="fas fa-sort-alpha-up"></i>
                    <span>Z → A</span>
                  </button>
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-section">
                  <div class="dropdown-label">{{ t('filterBy') }}</div>
                  <button class="dropdown-item" :class="{ 'active': !filterAsset }" @click="selectAssetFilter('')">
                    <span>{{ t('all') }}</span>
                  </button>
                  <button v-for="a in uniqueAssets" :key="a" class="dropdown-item" :class="{ 'active': filterAsset === a }" @click="selectAssetFilter(a)">
                    <span>{{ a }}</span>
                  </button>
                </div>
              </div>
            </div>
            <div class="header-cell current-price-cell" @click="togglePriceSort">
              <span class="header-text">CURRENT PRICE</span>
              <i v-if="sortField === 'price'" :class="sortIcon('price')"></i>
              <i v-else class="fas fa-sort sort-icon"></i>
            </div>
            <div class="header-cell cost-price-cell" @click="toggleCostSort">
              <span class="header-text">COST PRICE</span>
              <i v-if="sortField === 'costPrice'" :class="sortIcon('costPrice')"></i>
              <i v-else class="fas fa-sort sort-icon"></i>
            </div>
            <div class="header-cell amount-cell" @click="toggleAmountSort">
              <span class="header-text">SHARES</span>
              <i v-if="sortField === 'totalAmount'" :class="sortIcon('totalAmount')"></i>
              <i v-else class="fas fa-sort sort-icon"></i>
            </div>
            <div class="header-cell value-cell">
              <span class="header-text">VALUE (CNY)</span>
            </div>
            <div class="header-cell pnl-cell">
              <span class="header-text">P&L</span>
            </div>
            <div class="header-cell action-cell">
              <button v-if="filterAsset" class="clear-filter-btn" @click="clearFilters">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div 
            v-for="(asset, index) in filteredAssets" 
            :key="asset.code"
            class="asset-row"
          >
            <div class="cell asset-cell">
              <div class="asset-info">
                <span class="asset-dot" :style="{ background: asset.color }"></span>
                <span class="asset-name">{{ asset.name }}</span>
              </div>
              <div class="mobile-amount">
                <span class="amount-value font-numeric">{{ formatNumber(getTotalAmount(asset.code)) }}</span>
                <span class="amount-unit">{{ asset.unit }}</span>
              </div>
            </div>
            <div class="cell price-cell">
              <div class="price-row">
                <span class="price-label">现价</span>
                <span class="price-value font-numeric">{{ formatPrice(asset.price) }}</span>
              </div>
              <div class="price-row cost">
                <span class="price-label">成本</span>
                <span class="cost-value font-numeric" :class="getCostPriceClass(asset)">
                  {{ formatPrice(getCostPrice(asset.code)) }}
                </span>
              </div>
            </div>
            <div class="cell value-cell">
              <div class="value-row">
                <span class="value-label">市值</span>
                <span class="value-amount font-numeric">{{ formatCurrency(getTotalAmount(asset.code) * asset.price) }}</span>
              </div>
              <div class="value-row pnl">
                <span class="value-label">盈亏</span>
                <span class="pnl-value font-numeric" :class="getPnLClass(asset)">
                  {{ formatPnL(asset) }}
                </span>
              </div>
            </div>
          </div>
          
          <div v-if="filteredAssets.length === 0 && assets.length > 0" class="no-results-row">
            <span>{{ t('noMatchingResults') }}</span>
          </div>
        </div>

        <div class="detail-summary" v-if="assets.length > 0">
          <div class="summary-row">
            <span class="summary-label">TOTAL VALUE</span>
            <span class="summary-value font-numeric">{{ formatCurrency(filteredTotalValue) }} CNY</span>
            <span v-if="filterAsset" class="filtered-hint">({{ t('filtered') }})</span>
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
    </div>

    <div class="buy-modal-overlay" v-if="showBuyModal" @click="closeBuyModal">
      <div class="buy-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ currentAssetName }} - {{ t('addBuyRecord') || 'ADD BUY RECORD' }}</h3>
          <button class="modal-close" @click="closeBuyModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="buy-form">
            <div class="form-row">
              <div class="form-group">
                <label>SHARES</label>
                <input type="text" v-model="buyForm.amount" class="form-input font-numeric" placeholder="0.00">
              </div>
              <div class="form-group">
                <label>PRICE (CNY/SHARE)</label>
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
          
          <div class="buy-records" v-if="currentAssetRecords.length > 0">
            <div class="records-header">
              <h4>{{ t('buyRecords') || 'BUY RECORDS' }}</h4>
              <span class="records-count">{{ currentAssetRecords.length }} {{ t('records') || 'records' }}</span>
            </div>
            <div class="records-list">
              <div v-for="(record, idx) in currentAssetRecords" :key="record.id" class="record-item">
                <div class="record-main">
                  <div class="record-amount">
                    <span class="amount-num font-numeric">{{ formatNumber(record.amount) }}</span>
                    <span class="amount-unit">{{ currentAssetUnit }}</span>
                  </div>
                  <div class="record-price">
                    <span class="price-label">@</span>
                    <span class="price-num font-numeric">{{ formatPrice(record.price) }}</span>
                    <span class="price-unit">CNY/SHARE</span>
                  </div>
                  <div class="record-fee" v-if="record.fee > 0">
                    <span class="fee-label">+{{ formatCurrency(record.fee) }}</span>
                  </div>
                </div>
                <div class="record-meta">
                  <span class="record-date">{{ record.date }}</span>
                  <span class="record-total font-numeric">= {{ formatCurrency(record.amount * record.price + (record.fee || 0)) }} CNY</span>
                </div>
                <button class="record-delete" @click="deleteRecord(buyAssetCode, record.id)">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
            <div class="records-summary">
              <div class="records-summary-row">
                <span>TOTAL</span>
                <span class="font-numeric">{{ formatNumber(getTotalAmount(buyAssetCode)) }} {{ currentAssetUnit }}</span>
              </div>
              <div class="records-summary-row">
                <span>AVG COST</span>
                <span class="font-numeric">{{ formatPrice(getCostPrice(buyAssetCode)) }} CNY/SHARE</span>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  t: {
    type: Function,
    required: true
  },
  formatAmount: {
    type: Function,
    required: true
  }
});

const emit = defineEmits(['update:total']);

const showActionMenu = ref(false);

const formatCurrency = (value) => {
  if (!value && value !== 0) return '0.00';
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const assets = ref([
  { code: 'aapl', name: 'AAPL', color: '#555555', price: 0, unit: '股', symbol: 'AAPL' },
  { code: 'googl', name: 'GOOGL', color: '#4285f4', price: 0, unit: '股', symbol: 'GOOGL' },
  { code: 'msft', name: 'MSFT', color: '#00a4ef', price: 0, unit: '股', symbol: 'MSFT' },
  { code: 'amzn', name: 'AMZN', color: '#ff9900', price: 0, unit: '股', symbol: 'AMZN' },
  { code: 'tsla', name: 'TSLA', color: '#cc0000', price: 0, unit: '股', symbol: 'TSLA' }
]);

const buyRecords = ref({});

const loading = ref(false);
const lastUpdateTime = ref('--');

const sortField = ref('name');
const sortOrder = ref('asc');
const filterAsset = ref('');
const showAssetDropdown = ref(false);

const showBuyModal = ref(false);
const buyAssetCode = ref('');
const buyForm = ref({
  amount: '',
  price: '',
  fee: '',
  date: new Date().toISOString().split('T')[0]
});

const uniqueAssets = computed(() => {
  return assets.value.map(a => a.name);
});

const filteredAssets = computed(() => {
  let result = [...assets.value];
  
  if (filterAsset.value) {
    result = result.filter(a => a.name === filterAsset.value);
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
  return filteredAssets.value.reduce((sum, a) => sum + getTotalAmount(a.code) * a.price, 0);
});

const totalValue = computed(() => {
  return assets.value.reduce((sum, a) => sum + getTotalAmount(a.code) * a.price, 0);
});

const totalCost = computed(() => {
  return assets.value.reduce((sum, a) => sum + getTotalCost(a.code), 0);
});

const totalPnL = computed(() => {
  return totalValue.value - totalCost.value;
});

const totalPnLPercent = computed(() => {
  if (totalCost.value === 0) return 0;
  return (totalPnL.value / totalCost.value) * 100;
});

const currentAssetName = computed(() => {
  const a = assets.value.find(a => a.code === buyAssetCode.value);
  return a ? a.name : 'STOCK';
});

const currentAssetUnit = computed(() => {
  return '股';
});

const currentAssetRecords = computed(() => {
  return buyRecords.value[buyAssetCode.value] || [];
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

const getCostPriceClass = (asset) => {
  const costPrice = getCostPrice(asset.code);
  if (costPrice === 0) return '';
  return asset.price >= costPrice ? 'positive' : 'negative';
};

const getPnLClass = (asset) => {
  const pnl = getTotalAmount(asset.code) * asset.price - getTotalCost(asset.code);
  if (pnl === 0) return '';
  return pnl > 0 ? 'positive' : 'negative';
};

const formatPnL = (asset) => {
  const totalAmount = getTotalAmount(asset.code);
  const totalCost = getTotalCost(asset.code);
  const currentValue = totalAmount * asset.price;
  const pnl = currentValue - totalCost;
  
  if (totalAmount === 0) return '-';
  
  const pnlPercent = totalCost > 0 ? (pnl / totalCost * 100) : 0;
  const sign = pnl >= 0 ? '+' : '';
  return `${sign}${formatCurrency(Math.abs(pnl))} (${sign}${pnlPercent.toFixed(2)}%)`;
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

const toggleAssetDropdown = () => {
  showAssetDropdown.value = !showAssetDropdown.value;
};

const selectSort = (field, order) => {
  sortField.value = field;
  sortOrder.value = order;
  showAssetDropdown.value = false;
};

const selectAssetFilter = (asset) => {
  filterAsset.value = asset;
  showAssetDropdown.value = false;
};

const sortIcon = (field) => {
  if (sortField.value !== field) return 'fas fa-sort';
  return sortOrder.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
};

const clearFilters = () => {
  filterAsset.value = '';
};

const openBuyModal = (code) => {
  buyAssetCode.value = code;
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
  buyAssetCode.value = '';
};

const addBuyRecord = () => {
  if (!canAddRecord.value) return;
  
  const code = buyAssetCode.value;
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

    for (const asset of assets.value) {
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${asset.symbol}?interval=1d&range=1d`
        );
        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
          const meta = data.chart.result[0].meta;
          const priceUSD = meta.regularMarketPrice || meta.previousClose;
          asset.price = priceUSD * usdToCny;
        }
      } catch (e) {
        console.error(`Failed to fetch ${asset.code}:`, e);
      }
    }
    
    lastUpdateTime.value = new Date().toLocaleTimeString();
  } catch (error) {
    console.error('Failed to fetch prices:', error);
  } finally {
    loading.value = false;
  }
};

const saveData = () => {
  try {
    localStorage.setItem('stockBuyRecords', JSON.stringify(buyRecords.value));
    emit('update:total', totalValue.value);
  } catch (error) {
    console.error('Save failed:', error);
  }
};

const loadData = () => {
  try {
    const saved = localStorage.getItem('stockBuyRecords');
    if (saved) {
      buyRecords.value = JSON.parse(saved);
    }
  } catch (error) {
    console.error('Load failed:', error);
  }
};

const handleClickOutside = (e) => {
  const target = e.target;
  const isDropdown = target.closest('.dropdown-menu');
  const isHeaderDropdown = target.closest('.header-dropdown');
  const isActionMenu = target.closest('.action-menu-wrapper');
  
  if (!isDropdown && !isHeaderDropdown) {
    showAssetDropdown.value = false;
  }
  if (!isActionMenu) {
    showActionMenu.value = false;
  }
};

watch(totalValue, (newValue) => {
  emit('update:total', newValue);
});

onMounted(async () => {
  loadData();
  await fetchPrices();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
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

.stock-content {
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
  display: flex;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-light);
  position: relative;
  min-width: max-content;
}

.header-cell {
  padding: 10px 12px;
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.15s ease;
  position: relative;
  height: 44px;
  box-sizing: border-box;
  white-space: nowrap;
}

.header-cell.action-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 10px;
  cursor: default;
}

.header-cell:hover {
  color: var(--text-secondary);
}

.header-text {
  text-decoration: underline;
  text-decoration-color: var(--border-color);
  text-underline-offset: 3px;
}

.header-dropdown {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dropdown-icon {
  font-size: 8px;
  opacity: 0.6;
  transition: transform 0.15s ease;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  min-width: 140px;
  overflow: hidden;
}

.dropdown-section {
  padding: 8px 0;
}

.dropdown-label {
  padding: 4px 12px;
  font-size: 8px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-light);
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.dropdown-item.active {
  background: rgba(8, 145, 178, 0.15);
  color: #0891b2;
}

.dropdown-item i {
  font-size: 10px;
  width: 14px;
}

.sort-icon {
  font-size: 8px;
  opacity: 0.4;
}

.clear-filter-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 3px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 10px;
}

.clear-filter-btn:hover {
  color: var(--accent-red);
  border-color: var(--accent-red);
}

.asset-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  transition: background 0.15s ease;
  height: 44px;
  box-sizing: border-box;
  min-width: max-content;
}

.asset-row:last-of-type {
  border-bottom: none;
}

.asset-row:hover {
  background: var(--bg-hover);
}

.cell {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.asset-cell {
  flex: 0 0 140px;
}

.current-price-cell {
  flex: 0 0 120px;
}

.cost-price-cell {
  flex: 0 0 120px;
}

.amount-cell {
  flex: 0 0 110px;
}

.value-cell {
  flex: 0 0 130px;
}

.pnl-cell {
  flex: 1;
  min-width: 150px;
}

.action-cell {
  flex: 0 0 50px;
  display: flex;
  justify-content: flex-end;
  padding-right: 10px;
}

.asset-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.asset-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.asset-name {
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

@media (max-width: 480px) {
  .action-menu-btn {
    width: 28px;
    height: 28px;
  }
  
  .action-menu-dropdown {
    min-width: 120px;
  }
  
  .menu-item {
    padding: 8px 12px;
    font-size: 12px;
  }

  .accounts-header {
    display: none;
  }

  .holdings-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: none;
    overflow-x: visible;
  }

  .asset-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    height: auto;
    min-width: auto;
    padding: 0;
    border: 1px solid var(--border-light);
    border-radius: 6px;
    overflow: hidden;
    cursor: default;
  }

  .asset-row .cell {
    padding: 8px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 70px;
  }

  .asset-row .asset-cell {
    background: var(--bg-tertiary);
    gap: 6px;
  }

  .asset-row .asset-info {
    flex-direction: column;
    gap: 2px;
  }

  .asset-row .asset-name {
    font-size: 14px;
    font-weight: 600;
  }

  .asset-row .mobile-amount {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .asset-row .mobile-amount .amount-value {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .asset-row .mobile-amount .amount-unit {
    font-size: 9px;
    color: var(--text-muted);
  }

  .asset-row .price-cell {
    background: var(--bg-secondary);
    gap: 6px;
  }

  .asset-row .price-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 100%;
  }

  .asset-row .price-label {
    font-size: 9px;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .asset-row .price-value {
    font-size: 13px;
    font-weight: 500;
  }

  .asset-row .price-row.cost .cost-value {
    font-size: 12px;
  }

  .asset-row .value-cell {
    background: var(--bg-tertiary);
    gap: 6px;
  }

  .asset-row .value-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 100%;
  }

  .asset-row .value-label {
    font-size: 9px;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .asset-row .value-amount {
    font-size: 12px;
    font-weight: 500;
  }

  .asset-row .value-row.pnl .pnl-value {
    font-size: 11px;
  }

  .asset-row .action-cell {
    display: none;
  }

  .asset-row .current-price-cell,
  .asset-row .cost-price-cell,
  .asset-row .amount-cell,
  .asset-row .pnl-cell {
    display: none;
  }
}
</style>
