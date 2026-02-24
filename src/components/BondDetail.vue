<template>
  <div class="detail-section" ref="sectionRef">
    <div class="detail-header">
      <div class="detail-title">
        <i class="fas fa-landmark"></i>
        <span>{{ t('bondDetail') }}</span>
      </div>
      <div class="header-actions">
        <div class="action-menu-wrapper">
          <button class="action-menu-btn" @click.stop="showActionMenu = !showActionMenu">
            <i class="fas fa-ellipsis-h"></i>
          </button>
          <div class="action-menu-dropdown" v-if="showActionMenu" @click.stop>
            <button class="menu-item" @click="toggleEditMode(); showActionMenu = false">
              <i :class="isEditMode ? 'fas fa-save' : 'fas fa-edit'"></i>
              <span>{{ isEditMode ? (t('save') || 'Save') : (t('edit') || 'Edit') }}</span>
            </button>
            <button class="menu-item" @click="showTransferModal = true; showActionMenu = false">
              <i class="fas fa-exchange-alt"></i>
              <span>{{ t('transferFunds') || 'Transfer' }}</span>
            </button>
            <button class="menu-item" @click="showHelpModal = true; showActionMenu = false">
              <i class="fas fa-info-circle"></i>
              <span>{{ t('help') || 'Help' }}</span>
            </button>
            <label class="menu-item menu-label">
              <i class="fas fa-file-import"></i>
              <span>{{ t('importFile') || 'Import' }}</span>
              <input type="file" accept=".csv,.xlsx,.xls" @change="handleFileImport" style="display:none">
            </label>
            <button class="menu-item" @click="addBond(); showActionMenu = false">
              <i class="fas fa-plus"></i>
              <span>{{ t('addBond') || 'Add Bond' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="transfer-modal-overlay" v-if="showTransferModal" @click="showTransferModal = false">
      <div class="transfer-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ t('transferFunds') }}</h3>
          <button class="modal-close" @click="showTransferModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="transfer-form">
            <div class="form-group">
              <label>{{ t('fromBond') || 'FROM BOND' }}</label>
              <select v-model="transferFrom" class="form-select">
                <option value="">{{ t('selectBond') || 'Select Bond' }}</option>
                <option v-for="bond in bondsWithHoldings" :key="bond.code" :value="bond.code">
                  {{ bond.name }} ({{ formatNumber(getTotalAmount(bond.code)) }} 份)
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ t('transferAmount') }}</label>
              <input type="text" v-model="transferAmount" class="form-input" placeholder="0.00">
            </div>
            <div class="form-group">
              <label>{{ t('toAsset') }}</label>
              <select v-model="transferToAsset" class="form-select">
                <option value="">{{ t('selectAsset') }}</option>
                <option value="cash">{{ t('cash') }}</option>
                <option value="stock">{{ t('stock') }}</option>
                <option value="gold">{{ t('gold') }}</option>
                <option value="emerging">{{ t('emerging') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ t('note') }}</label>
              <input type="text" v-model="transferNote" class="form-input" :placeholder="t('notePlaceholder')">
            </div>
          </div>
          <div class="transfer-history" v-if="transfers.length > 0">
            <h4>{{ t('transferHistory') }}</h4>
            <div class="history-list">
              <div v-for="(tf, idx) in transfers" :key="idx" class="history-item">
                <div class="history-info">
                  <span class="history-amount">{{ formatNumber(tf.amount) }} 份</span>
                  <span class="history-arrow">→</span>
                  <span class="history-target">{{ t(tf.toAsset) }}</span>
                </div>
                <div class="history-meta">
                  <span class="history-date">{{ tf.date }}</span>
                  <span v-if="tf.note" class="history-note">{{ tf.note }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showTransferModal = false">{{ t('cancel') }}</button>
          <button class="confirm-btn" @click="executeTransfer">{{ t('confirm') }}</button>
        </div>
      </div>
    </div>

    <div class="help-modal-overlay" v-if="showHelpModal" @click="showHelpModal = false">
      <div class="help-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ t('importGuide') }}</h3>
          <button class="modal-close" @click="showHelpModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="guide-section">
            <h4>{{ t('supportedFormats') }}</h4>
            <div class="format-tags">
              <span class="format-tag">.csv</span>
              <span class="format-tag">.xlsx</span>
              <span class="format-tag">.xls</span>
            </div>
          </div>
          <div class="guide-section">
            <h4>{{ t('columnRequirements') }}</h4>
            <table class="format-table">
              <thead>
                <tr>
                  <th>{{ t('columnName') }}</th>
                  <th>{{ t('columnOrder') }}</th>
                  <th>{{ t('example') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span class="col-name">bondName</span></td>
                  <td>{{ t('column1') }}</td>
                  <td>国债2024</td>
                </tr>
                <tr>
                  <td><span class="col-name">amount</span></td>
                  <td>{{ t('column2') }}</td>
                  <td>1000</td>
                </tr>
                <tr>
                  <td><span class="col-name">price</span></td>
                  <td>{{ t('column3') }}</td>
                  <td>100.50</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="guide-section">
            <h4>{{ t('exampleFile') }}</h4>
            <div class="example-table">
              <div class="example-row header">
                <span>bondName</span>
                <span>amount</span>
                <span>price</span>
              </div>
              <div class="example-row">
                <span>国债2024</span>
                <span>1000</span>
                <span>100.50</span>
              </div>
              <div class="example-row">
                <span>企业债A</span>
                <span>500</span>
                <span>98.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bond-content">
      <div class="holdings-table-section">
        <div class="holdings-list" v-if="bonds.length > 0">
          <div class="accounts-header">
            <div class="header-cell bond-name-cell" @click="toggleNameSort">
              <span class="header-text">BOND NAME</span>
              <i v-if="sortField === 'name'" :class="sortIcon('name')"></i>
              <i v-else class="fas fa-sort sort-icon"></i>
            </div>
            <div class="header-cell holdings-cell" @click="toggleHoldingsSort">
              <span class="header-text">#</span>
              <i v-if="sortField === 'holdings'" :class="sortIcon('holdings')"></i>
              <i v-else class="fas fa-sort sort-icon"></i>
            </div>
            <div class="header-cell cost-price-cell" @click="toggleCostPriceSort">
              <span class="header-text">COST PRICE</span>
              <i v-if="sortField === 'costPrice'" :class="sortIcon('costPrice')"></i>
              <i v-else class="fas fa-sort sort-icon"></i>
            </div>
            <div class="header-cell cost-value-cell">COST VALUE</div>
            <div class="header-cell current-price-cell" @click="togglePriceSort">
              <span class="header-text">CURRENT PRICE</span>
              <i v-if="sortField === 'price'" :class="sortIcon('price')"></i>
              <i v-else class="fas fa-sort sort-icon"></i>
            </div>
            <div class="header-cell current-value-cell">CURRENT VALUE</div>
            <div class="header-cell pnl-cell" @click="togglePnLSort">
              <span class="header-text">P&L</span>
              <i v-if="sortField === 'pnl'" :class="sortIcon('pnl')"></i>
              <i v-else class="fas fa-sort sort-icon"></i>
            </div>
            <div class="header-cell action-cell">
              <button v-if="sortField || filterBond" class="clear-filter-btn" @click="clearFilters">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div 
            v-for="(bond, index) in filteredBonds" 
            :key="bond.code"
            class="bond-row"
            :class="{ 'is-editing': isEditMode }"
          >
            <div class="cell bond-name-cell">
              <input 
                v-if="isEditMode"
                type="text" 
                v-model="bond.name" 
                class="field-input"
                placeholder="Bond name"
              >
              <div v-else class="bond-info">
                <span class="bond-dot" :style="{ background: bond.color }"></span>
                <span class="bond-name">{{ bond.name }}</span>
              </div>
              <div class="mobile-holdings">
                <span class="holdings-value font-numeric">{{ formatNumber(bond.holdings || 0) }}</span>
                <span class="holdings-unit">份</span>
              </div>
            </div>
            <div class="cell price-cell">
              <div class="price-row">
                <span class="price-label">现价</span>
                <span class="price-value font-numeric">{{ formatPrice(bond.price) }}</span>
              </div>
              <div class="price-row cost">
                <span class="price-label">成本</span>
                <span class="cost-value font-numeric">{{ formatPrice(bond.costPrice || 0) }}</span>
              </div>
            </div>
            <div class="cell value-cell">
              <div class="value-row">
                <span class="value-label">市值</span>
                <span class="value-amount font-numeric">{{ formatCurrency((bond.holdings || 0) * bond.price) }}</span>
              </div>
              <div class="value-row pnl">
                <span class="value-label">盈亏</span>
                <span class="pnl-value font-numeric" :class="getPnLClassNew(bond)">{{ formatPnLNew(bond) }}</span>
              </div>
            </div>
            <div class="cell holdings-cell">
              <input 
                v-if="isEditMode"
                type="text" 
                v-model.number="bond.holdings" 
                class="field-input font-numeric"
                placeholder="0"
              >
              <span v-else class="font-numeric">{{ formatNumber(bond.holdings || 0) }}</span>
            </div>
            <div class="cell cost-price-cell">
              <input 
                v-if="isEditMode"
                type="text" 
                v-model.number="bond.costPrice" 
                class="field-input font-numeric"
                placeholder="0.00"
              >
              <span v-else class="font-numeric">{{ formatPrice(bond.costPrice || 0) }}</span>
            </div>
            <div class="cell cost-value-cell">
              <span class="font-numeric">{{ formatCurrency((bond.holdings || 0) * (bond.costPrice || 0)) }}</span>
            </div>
            <div class="cell current-price-cell">
              <input 
                v-if="isEditMode"
                type="text" 
                v-model.number="bond.price" 
                class="field-input font-numeric"
                placeholder="0.00"
              >
              <span v-else class="font-numeric">{{ formatPrice(bond.price) }}</span>
            </div>
            <div class="cell current-value-cell">
              <span class="font-numeric">{{ formatCurrency((bond.holdings || 0) * bond.price) }}</span>
            </div>
            <div class="cell pnl-cell">
              <span class="font-numeric" :class="getPnLClassNew(bond)">{{ formatPnLNew(bond) }}</span>
            </div>
            <div class="cell action-cell" v-if="!isEditMode">
              <button class="add-buy-btn" @click.stop="openBuyModal(bond.code)" title="Add Buy Record">
                <i class="fas fa-plus"></i>
              </button>
            </div>
            <div class="cell action-cell" v-else>
              <button class="delete-btn" @click.stop="removeBond(bond.code)" title="Remove Bond">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
          
          <div v-if="filteredBonds.length === 0 && bonds.length > 0" class="no-results-row">
            <span>{{ t('noMatchingResults') }}</span>
          </div>
        </div>

        <div class="detail-summary" v-if="bonds.length > 0">
          <div class="summary-row">
            <span class="summary-label">TOTAL VALUE</span>
            <span class="summary-value font-numeric">{{ formatCurrency(filteredTotalValue) }} CNY</span>
            <span v-if="filterBond" class="filtered-hint">({{ t('filtered') }})</span>
          </div>
          <div class="summary-row summary-pnl">
            <span class="summary-label">TOTAL P&L</span>
            <span class="summary-pnl-value font-numeric" :class="totalPnL >= 0 ? 'positive' : 'negative'">
              {{ totalPnL >= 0 ? '+' : '' }}{{ formatCurrency(Math.abs(totalPnL)) }} CNY
              <span class="pnl-percent">({{ totalPnLPercent >= 0 ? '+' : '' }}{{ totalPnLPercent.toFixed(2) }}%)</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="buy-modal-overlay" v-if="showBuyModal" @click="closeBuyModal">
      <div class="buy-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ currentBondName }} - {{ t('addBuyRecord') || 'ADD BUY RECORD' }}</h3>
          <button class="modal-close" @click="closeBuyModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="buy-form">
            <div class="form-row">
              <div class="form-group">
                <label>AMOUNT (份)</label>
                <input type="text" v-model="buyForm.amount" class="form-input font-numeric" placeholder="0.00">
              </div>
              <div class="form-group">
                <label>PRICE (CNY/份)</label>
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
          
          <div class="buy-records" v-if="currentBondRecords.length > 0">
            <div class="records-header">
              <h4>{{ t('buyRecords') || 'BUY RECORDS' }}</h4>
              <span class="records-count">{{ currentBondRecords.length }} {{ t('records') || 'records' }}</span>
            </div>
            <div class="records-list">
              <div v-for="(record, idx) in currentBondRecords" :key="record.id" class="record-item">
                <div class="record-main">
                  <div class="record-amount">
                    <span class="amount-num font-numeric">{{ formatNumber(record.amount) }}</span>
                    <span class="amount-unit">份</span>
                  </div>
                  <div class="record-price">
                    <span class="price-label">@</span>
                    <span class="price-num font-numeric">{{ formatPrice(record.price) }}</span>
                    <span class="price-unit">CNY/份</span>
                  </div>
                  <div class="record-fee" v-if="record.fee > 0">
                    <span class="fee-label">+{{ formatCurrency(record.fee) }}</span>
                  </div>
                </div>
                <div class="record-meta">
                  <span class="record-date">{{ record.date }}</span>
                  <span class="record-total font-numeric">= {{ formatCurrency(record.amount * record.price + (record.fee || 0)) }} CNY</span>
                </div>
                <button class="record-delete" @click="deleteRecord(buyBondCode, record.id)">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
            <div class="records-summary">
              <div class="records-summary-row">
                <span>TOTAL</span>
                <span class="font-numeric">{{ formatNumber(getTotalAmount(buyBondCode)) }}份</span>
              </div>
              <div class="records-summary-row">
                <span>AVG COST</span>
                <span class="font-numeric">{{ formatPrice(getCostPrice(buyBondCode)) }} CNY/份</span>
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
import * as XLSX from 'xlsx';

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

const emit = defineEmits(['update:total', 'transfer']);

const sectionRef = ref(null);
const fileInput = ref(null);
const showActionMenu = ref(false);
const showHelpModal = ref(false);
const showTransferModal = ref(false);
const isEditMode = ref(false);

const transferFrom = ref('');
const transferAmount = ref('');
const transferToAsset = ref('');
const transferNote = ref('');
const transfers = ref([]);

const formatCurrency = (value) => {
  if (!value && value !== 0) return '0.00';
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const bonds = ref([
  { code: 'treasury', name: 'TREASURY BOND', color: '#4ade80', price: 100, holdings: 0, costPrice: 0 },
  { code: 'corporate', name: 'CORPORATE BOND', color: '#60a5fa', price: 100, holdings: 0, costPrice: 0 },
  { code: 'municipal', name: 'MUNICIPAL BOND', color: '#f472b6', price: 100, holdings: 0, costPrice: 0 },
  { code: 'financial', name: 'FINANCIAL BOND', color: '#a78bfa', price: 100, holdings: 0, costPrice: 0 }
]);

const buyRecords = ref({});

const sortField = ref('name');
const sortOrder = ref('asc');
const filterBond = ref('');
const showBondDropdown = ref(false);

const showBuyModal = ref(false);
const buyBondCode = ref('');
const buyForm = ref({
  amount: '',
  price: '',
  fee: '',
  date: new Date().toISOString().split('T')[0]
});

const uniqueBonds = computed(() => {
  return bonds.value.map(b => b.name);
});

const filteredBonds = computed(() => {
  let result = [...bonds.value];
  
  if (filterBond.value) {
    result = result.filter(b => b.name === filterBond.value);
  }
  
  if (sortField.value) {
    result.sort((a, b) => {
      let aVal, bVal;
      
      if (sortField.value === 'holdings') {
        aVal = a.holdings || 0;
        bVal = b.holdings || 0;
      } else if (sortField.value === 'costPrice') {
        aVal = a.costPrice || 0;
        bVal = b.costPrice || 0;
      } else if (sortField.value === 'price') {
        aVal = a.price;
        bVal = b.price;
      } else if (sortField.value === 'pnl') {
        const aPnL = ((a.holdings || 0) * a.price) - ((a.holdings || 0) * (a.costPrice || 0));
        const bPnL = ((b.holdings || 0) * b.price) - ((b.holdings || 0) * (b.costPrice || 0));
        aVal = aPnL;
        bVal = bPnL;
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
  return filteredBonds.value.reduce((sum, b) => sum + getTotalAmount(b.code) * b.price, 0);
});

const totalValue = computed(() => {
  return bonds.value.reduce((sum, b) => sum + (b.holdings || 0) * b.price, 0);
});

const totalCost = computed(() => {
  return bonds.value.reduce((sum, b) => sum + (b.holdings || 0) * (b.costPrice || 0), 0);
});

const totalPnL = computed(() => {
  return totalValue.value - totalCost.value;
});

const totalPnLPercent = computed(() => {
  if (totalCost.value === 0) return 0;
  return (totalPnL.value / totalCost.value) * 100;
});

const currentBondName = computed(() => {
  const b = bonds.value.find(b => b.code === buyBondCode.value);
  return b ? b.name : 'BOND';
});

const currentBondRecords = computed(() => {
  return buyRecords.value[buyBondCode.value] || [];
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

const bondsWithHoldings = computed(() => {
  return bonds.value.filter(b => getTotalAmount(b.code) > 0);
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

const getCostPriceClass = (bond) => {
  const costPrice = getCostPrice(bond.code);
  if (costPrice === 0) return '';
  return bond.price >= costPrice ? 'positive' : 'negative';
};

const getPnLClassNew = (bond) => {
  const holdings = bond.holdings || 0;
  const costPrice = bond.costPrice || 0;
  const currentPrice = bond.price || 0;
  const costValue = holdings * costPrice;
  const currentValue = holdings * currentPrice;
  const pnl = currentValue - costValue;
  if (pnl === 0) return '';
  return pnl > 0 ? 'positive' : 'negative';
};

const formatPnLNew = (bond) => {
  const holdings = bond.holdings || 0;
  const costPrice = bond.costPrice || 0;
  const currentPrice = bond.price || 0;
  const costValue = holdings * costPrice;
  const currentValue = holdings * currentPrice;
  const pnl = currentValue - costValue;
  
  if (holdings === 0 || costPrice === 0) return '-';
  
  const pnlPercent = costValue > 0 ? (pnl / costValue * 100) : 0;
  const sign = pnl >= 0 ? '+' : '';
  return `${sign}${formatCurrency(pnl)} (${sign}${pnlPercent.toFixed(2)}%)`;
};

const getPnLClass = (bond) => {
  const pnl = getTotalAmount(bond.code) * bond.price - getTotalCost(bond.code);
  if (pnl === 0) return '';
  return pnl > 0 ? 'positive' : 'negative';
};

const formatPnL = (bond) => {
  const totalAmount = getTotalAmount(bond.code);
  const totalCost = getTotalCost(bond.code);
  const currentValue = totalAmount * bond.price;
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
const toggleCostPriceSort = () => toggleSort('costPrice');
const toggleHoldingsSort = () => toggleSort('holdings');
const toggleNameSort = () => toggleSort('name');
const togglePnLSort = () => toggleSort('pnl');

const toggleBondDropdown = () => {
  showBondDropdown.value = !showBondDropdown.value;
};

const selectSort = (field, order) => {
  sortField.value = field;
  sortOrder.value = order;
  showBondDropdown.value = false;
};

const selectBondFilter = (bond) => {
  filterBond.value = bond;
  showBondDropdown.value = false;
};

const sortIcon = (field) => {
  if (sortField.value !== field) return 'fas fa-sort';
  return sortOrder.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
};

const clearFilters = () => {
  sortField.value = '';
  sortOrder.value = 'asc';
  filterBond.value = '';
};

const openBuyModal = (code) => {
  buyBondCode.value = code;
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
  buyBondCode.value = '';
};

const addBuyRecord = () => {
  if (!canAddRecord.value) return;
  
  const code = buyBondCode.value;
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

const toggleEditMode = () => {
  if (isEditMode.value) {
    saveData();
  }
  isEditMode.value = !isEditMode.value;
};

const addBond = () => {
  const newCode = 'bond_' + Date.now();
  bonds.value.push({
    code: newCode,
    name: 'NEW BOND',
    color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
    price: 100
  });
  isEditMode.value = true;
};

const removeBond = (code) => {
  bonds.value = bonds.value.filter(b => b.code !== code);
  delete buyRecords.value[code];
  saveData();
};

const executeTransfer = () => {
  if (transferFrom.value === '' || !transferAmount.value || !transferToAsset.value) {
    return;
  }

  const amount = parseFloat(transferAmount.value) || 0;
  const currentAmount = getTotalAmount(transferFrom.value);
  
  if (amount <= 0 || amount > currentAmount) {
    return;
  }

  const records = buyRecords.value[transferFrom.value] || [];
  if (records.length > 0) {
    const costPrice = getCostPrice(transferFrom.value);
    const remainingAmount = currentAmount - amount;
    
    if (remainingAmount > 0) {
      buyRecords.value[transferFrom.value] = [{
        id: Date.now(),
        amount: remainingAmount,
        price: costPrice,
        fee: 0,
        date: new Date().toISOString().split('T')[0]
      }];
    } else {
      buyRecords.value[transferFrom.value] = [];
    }
  }

  transfers.value.unshift({
    amount: amount,
    fromBond: transferFrom.value,
    toAsset: transferToAsset.value,
    note: transferNote.value,
    date: new Date().toLocaleDateString()
  });

  emit('transfer', {
    amount: amount,
    fromBond: transferFrom.value,
    toAsset: transferToAsset.value
  });

  saveData();
  saveTransfers();

  transferFrom.value = '';
  transferAmount.value = '';
  transferToAsset.value = '';
  transferNote.value = '';
  showTransferModal.value = false;
};

const handleFileImport = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const data = await readFile(file);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    jsonData.forEach(row => {
      const bondName = row['bondName'] || row['Bond Name'] || row['bond_name'] || row['Bond'] || '';
      const amount = parseFloat(row['amount'] || row['Amount'] || 0) || 0;
      const price = parseFloat(row['price'] || row['Price'] || 100) || 100;

      if (bondName && amount > 0) {
        const newCode = 'bond_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        bonds.value.push({
          code: newCode,
          name: String(bondName).trim().toUpperCase(),
          color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
          price: price
        });
        
        if (!buyRecords.value[newCode]) {
          buyRecords.value[newCode] = [];
        }
        buyRecords.value[newCode].push({
          id: Date.now(),
          amount: amount,
          price: price,
          fee: 0,
          date: new Date().toISOString().split('T')[0]
        });
      }
    });

    saveData();
    e.target.value = '';
  } catch (error) {
    console.error('Import failed:', error);
    alert(t('importFailed'));
  }
};

const readFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(new Uint8Array(e.target.result));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

const saveData = () => {
  try {
    localStorage.setItem('bondsBuyRecords', JSON.stringify(buyRecords.value));
    localStorage.setItem('bondsList', JSON.stringify(bonds.value));
    emit('update:total', totalValue.value);
  } catch (error) {
    console.error('Save failed:', error);
  }
};

const saveTransfers = () => {
  try {
    localStorage.setItem('bondsTransfers', JSON.stringify(transfers.value));
  } catch (error) {
    console.error('Save transfers failed:', error);
  }
};

const loadData = () => {
  try {
    const saved = localStorage.getItem('bondsBuyRecords');
    if (saved) {
      buyRecords.value = JSON.parse(saved);
    }
    const savedBonds = localStorage.getItem('bondsList');
    if (savedBonds) {
      bonds.value = JSON.parse(savedBonds);
    }
    const savedTransfers = localStorage.getItem('bondsTransfers');
    if (savedTransfers) {
      transfers.value = JSON.parse(savedTransfers);
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
    showBondDropdown.value = false;
  }
  if (!isActionMenu) {
    showActionMenu.value = false;
  }
};

watch(totalValue, (newValue) => {
  emit('update:total', newValue);
});

onMounted(() => {
  loadData();
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

.edit-toggle-btn {
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

.edit-toggle-btn:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.edit-toggle-btn.is-editing {
  border-color: #0891b2;
  color: #0891b2;
  background: rgba(8, 145, 178, 0.1);
}

.transfer-btn {
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

.transfer-btn:hover {
  border-color: var(--border-color);
  color: #f59e0b;
}

.help-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  height: 30px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 12px;
  box-sizing: border-box;
}

.help-btn:hover {
  border-color: var(--border-color);
  color: #06b6d4;
}

.import-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
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

.import-btn:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
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

.add-btn:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.transfer-modal-overlay {
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

.transfer-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.transfer-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.transfer-modal .modal-header h3 {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.transfer-modal .modal-body {
  padding: 20px;
  max-height: calc(80vh - 130px);
  overflow-y: auto;
}

.transfer-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
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

.form-input,
.form-select {
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--border-color);
}

.transfer-history {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

.transfer-history h4 {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.history-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.history-amount {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.history-arrow {
  color: var(--text-muted);
  font-size: 11px;
}

.history-target {
  font-size: 12px;
  color: var(--text-secondary);
}

.history-meta {
  display: flex;
  gap: 12px;
  font-size: 10px;
  color: var(--text-muted);
}

.help-modal-overlay {
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

.help-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  overflow: hidden;
}

.help-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.help-modal .modal-header h3 {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.help-modal .modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(80vh - 60px);
}

.guide-section {
  margin-bottom: 20px;
}

.guide-section:last-child {
  margin-bottom: 0;
}

.guide-section h4 {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.format-tags {
  display: flex;
  gap: 8px;
}

.format-tag {
  padding: 4px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-primary);
  font-family: 'Space Grotesk', monospace;
}

.format-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.format-table th,
.format-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-light);
}

.format-table th {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.format-table td {
  color: var(--text-primary);
}

.format-table tr:last-child td {
  border-bottom: none;
}

.col-name {
  font-family: 'Space Grotesk', monospace;
  color: #06b6d4;
  background: rgba(6, 182, 212, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
}

.example-table {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  overflow: hidden;
}

.example-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 8px 12px;
  font-size: 12px;
  border-bottom: 1px solid var(--border-light);
}

.example-row:last-child {
  border-bottom: none;
}

.example-row.header {
  background: var(--bg-secondary);
  color: var(--text-muted);
  font-size: 10px;
  text-transform: uppercase;
}

.example-row span {
  color: var(--text-primary);
}

.example-row.header span {
  color: var(--text-muted);
}

.bond-content {
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

.header-cell.bond-name-cell {
  flex: 0 0 140px;
}

.header-cell.holdings-cell {
  flex: 0 0 80px;
  justify-content: flex-end;
  padding-right: 10px;
}

.header-cell.cost-price-cell {
  flex: 0 0 100px;
  justify-content: flex-end;
  padding-right: 10px;
}

.header-cell.cost-value-cell {
  flex: 0 0 120px;
  justify-content: flex-end;
  padding-right: 10px;
  cursor: default;
}

.header-cell.current-price-cell {
  flex: 0 0 120px;
  justify-content: flex-end;
  padding-right: 10px;
}

.header-cell.current-value-cell {
  flex: 0 0 120px;
  justify-content: flex-end;
  padding-right: 10px;
  cursor: default;
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

.bond-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  transition: background 0.15s ease;
  height: 44px;
  box-sizing: border-box;
  min-width: max-content;
}

.bond-row:last-of-type {
  border-bottom: none;
}

.bond-row:hover {
  background: var(--bg-hover);
}

.cell {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.bond-name-cell {
  flex: 0 0 140px;
}

.holdings-cell {
  flex: 0 0 80px;
  justify-content: flex-end;
  padding-right: 10px;
}

.cost-price-cell {
  flex: 0 0 100px;
  justify-content: flex-end;
  padding-right: 10px;
}

.cost-value-cell {
  flex: 0 0 120px;
  justify-content: flex-end;
  padding-right: 10px;
}

.current-price-cell {
  flex: 0 0 120px;
  justify-content: flex-end;
  padding-right: 10px;
}

.current-value-cell {
  flex: 0 0 120px;
  justify-content: flex-end;
  padding-right: 10px;
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

.bond-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bond-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.bond-name {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.field-input {
  width: 100%;
  padding: 6px 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-primary);
  font-size: 12px;
}

.field-input:focus {
  outline: none;
  border-color: #0891b2;
}

.field-input::placeholder {
  color: var(--text-muted);
}

.field-input.font-numeric {
  font-family: 'Space Grotesk', 'SF Mono', monospace;
  text-align: right;
}

.delete-btn {
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
}

.delete-btn:hover {
  color: var(--accent-red);
  border-color: var(--accent-red);
}

.bond-row.is-editing {
  background: var(--bg-tertiary);
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

.menu-label {
  cursor: pointer;
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

  .bond-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    height: auto;
    min-width: auto;
    padding: 0;
    border: 1px solid var(--border-light);
    border-radius: 6px;
    overflow: hidden;
  }

  .bond-row .cell {
    padding: 8px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 70px;
  }

  .bond-row .bond-name-cell {
    background: var(--bg-tertiary);
    gap: 6px;
  }

  .bond-row .bond-info {
    flex-direction: column;
    gap: 2px;
  }

  .bond-row .bond-name {
    font-size: 14px;
    font-weight: 600;
  }

  .bond-row .mobile-holdings {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .bond-row .mobile-holdings .holdings-value {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .bond-row .mobile-holdings .holdings-unit {
    font-size: 9px;
    color: var(--text-muted);
  }

  .bond-row .price-cell {
    background: var(--bg-secondary);
    gap: 6px;
  }

  .bond-row .price-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 100%;
  }

  .bond-row .price-label {
    font-size: 9px;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .bond-row .price-value {
    font-size: 13px;
    font-weight: 500;
  }

  .bond-row .price-row.cost .cost-value {
    font-size: 12px;
  }

  .bond-row .value-cell {
    background: var(--bg-tertiary);
    gap: 6px;
  }

  .bond-row .value-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 100%;
  }

  .bond-row .value-label {
    font-size: 9px;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .bond-row .value-amount {
    font-size: 12px;
    font-weight: 500;
  }

  .bond-row .value-row.pnl .pnl-value {
    font-size: 11px;
  }

  .bond-row .holdings-cell,
  .bond-row .cost-price-cell,
  .bond-row .cost-value-cell,
  .bond-row .current-price-cell,
  .bond-row .current-value-cell,
  .bond-row .pnl-cell,
  .bond-row .action-cell {
    display: none;
  }
}
</style>
