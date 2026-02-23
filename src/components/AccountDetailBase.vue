<template>
  <div class="detail-section" ref="sectionRef">
    <div class="detail-header">
      <div class="detail-title">
        <i :class="icon"></i>
        <span>{{ t(titleKey) }}</span>
      </div>
      <div class="header-actions">
        <button class="edit-toggle-btn" @click="toggleEditMode" :class="{ 'is-editing': isEditMode }">
          <i :class="isEditMode ? 'fas fa-save' : 'fas fa-edit'"></i>
        </button>
        <button class="transfer-btn" @click="showTransferModal = true">
          <i class="fas fa-exchange-alt"></i>
        </button>
        <button class="help-btn" @click="showHelpModal = true">
          <i class="fas fa-info-circle"></i>
        </button>
        <label class="import-btn">
          <i class="fas fa-file-import"></i>
          <span>{{ t('importFile') }}</span>
          <input 
            type="file" 
            ref="fileInput"
            accept=".csv,.xlsx,.xls"
            @change="handleFileImport"
            style="display: none"
          >
        </label>
        <button class="add-btn" @click="addAccount">
          <i class="fas fa-plus"></i>
          <span>{{ t('addAccount') }}</span>
        </button>
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
              <label>{{ t('fromAccount') }}</label>
              <select v-model="transferFrom" class="form-select">
                <option value="">{{ t('selectAccount') }}</option>
                <option v-for="(acc, idx) in accounts" :key="idx" :value="idx">
                  {{ acc.bankName || t('untitled') }} ({{ formatNumber(acc.amount) }} {{ acc.currency }})
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
                <option v-for="asset in transferTargets" :key="asset.value" :value="asset.value">{{ asset.label }}</option>
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
                  <span class="history-amount">{{ formatNumber(tf.amount) }} {{ tf.currency }}</span>
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
                  <td><span class="col-name">name</span></td>
                  <td>{{ t('column1') }}</td>
                  <td>{{ nameExample }}</td>
                </tr>
                <tr>
                  <td><span class="col-name">currency</span></td>
                  <td>{{ t('column2') }}</td>
                  <td>CNY / USD / HKD</td>
                </tr>
                <tr>
                  <td><span class="col-name">amount</span></td>
                  <td>{{ t('column3') }}</td>
                  <td>50000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="guide-section">
            <h4>{{ t('exampleFile') }}</h4>
            <div class="example-table">
              <div class="example-row header">
                <span>name</span>
                <span>currency</span>
                <span>amount</span>
              </div>
              <div class="example-row">
                <span>{{ nameExample }}</span>
                <span>CNY</span>
                <span>50000</span>
              </div>
              <div class="example-row">
                <span>{{ nameExample }} 2</span>
                <span>USD</span>
                <span>10000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="accounts-list" v-if="accounts.length > 0">
      <div class="accounts-header">
        <div class="header-cell bank-cell">
          <div class="header-dropdown" @click.stop="toggleBankDropdown">
            <span class="header-text">{{ nameLabel }}</span>
            <i class="fas fa-chevron-down dropdown-icon" :class="{ 'rotated': showBankDropdown }"></i>
          </div>
          <div class="dropdown-menu" v-if="showBankDropdown" @click.stop>
            <div class="dropdown-section">
              <div class="dropdown-label">{{ t('sortBy') }}</div>
              <button class="dropdown-item" :class="{ 'active': sortField === 'bankName' && sortOrder === 'asc' }" @click="selectSort('bankName', 'asc')">
                <i class="fas fa-sort-alpha-down"></i>
                <span>A → Z</span>
              </button>
              <button class="dropdown-item" :class="{ 'active': sortField === 'bankName' && sortOrder === 'desc' }" @click="selectSort('bankName', 'desc')">
                <i class="fas fa-sort-alpha-up"></i>
                <span>Z → A</span>
              </button>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-section">
              <div class="dropdown-label">{{ t('filterBy') }}</div>
              <button class="dropdown-item" :class="{ 'active': !filterBank }" @click="selectBankFilter('')">
                <span>{{ t('all') }}</span>
              </button>
              <button v-for="bank in uniqueBanks" :key="bank" class="dropdown-item" :class="{ 'active': filterBank === bank }" @click="selectBankFilter(bank)">
                <span>{{ bank }}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="header-cell currency-cell">
          <div class="header-dropdown" @click.stop="toggleCurrencyDropdown">
            <span class="header-text">{{ t('currencyLabel') }}</span>
            <i class="fas fa-chevron-down dropdown-icon" :class="{ 'rotated': showCurrencyDropdown }"></i>
          </div>
          <div class="dropdown-menu" v-if="showCurrencyDropdown" @click.stop>
            <div class="dropdown-section">
              <div class="dropdown-label">{{ t('sortBy') }}</div>
              <button class="dropdown-item" :class="{ 'active': sortField === 'currency' && sortOrder === 'asc' }" @click="selectSort('currency', 'asc')">
                <i class="fas fa-sort-alpha-down"></i>
                <span>A → Z</span>
              </button>
              <button class="dropdown-item" :class="{ 'active': sortField === 'currency' && sortOrder === 'desc' }" @click="selectSort('currency', 'desc')">
                <i class="fas fa-sort-alpha-up"></i>
                <span>Z → A</span>
              </button>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-section">
              <div class="dropdown-label">{{ t('filterBy') }}</div>
              <button class="dropdown-item" :class="{ 'active': !filterCurrency }" @click="selectCurrencyFilter('')">
                <span>{{ t('all') }}</span>
              </button>
              <button class="dropdown-item" :class="{ 'active': filterCurrency === 'CNY' }" @click="selectCurrencyFilter('CNY')">
                <span>CNY</span>
              </button>
              <button class="dropdown-item" :class="{ 'active': filterCurrency === 'USD' }" @click="selectCurrencyFilter('USD')">
                <span>USD</span>
              </button>
              <button class="dropdown-item" :class="{ 'active': filterCurrency === 'HKD' }" @click="selectCurrencyFilter('HKD')">
                <span>HKD</span>
              </button>
            </div>
          </div>
        </div>
        <div class="header-cell amount-cell" @click="toggleAmountSort">
          <span class="header-text">{{ t('amount') }}</span>
          <i v-if="sortField === 'amount'" :class="sortIcon('amount')"></i>
          <i v-else class="fas fa-sort sort-icon"></i>
        </div>
        <div class="header-cell comments-cell">{{ t('comments') }}</div>
        <div class="header-cell action-cell">
          <button v-if="filterBank || filterCurrency" class="clear-filter-btn" @click="clearFilters">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div 
        v-for="(account, index) in filteredAccounts" 
        :key="index" 
        class="account-row"
        :class="{ 'is-editing': isEditMode }"
      >
        <div class="cell bank-cell">
          <input 
            v-if="isEditMode"
            type="text" 
            v-model="account.bankName" 
            class="field-input"
            :placeholder="namePlaceholder"
          >
          <span v-else class="field-display">{{ account.bankName || '-' }}</span>
        </div>
        <div class="cell currency-cell">
          <select v-if="isEditMode" v-model="account.currency" class="field-select">
            <option value="CNY">CNY</option>
            <option value="USD">USD</option>
            <option value="HKD">HKD</option>
          </select>
          <span v-else class="field-display">{{ account.currency }}</span>
        </div>
        <div class="cell amount-cell">
          <input 
            v-if="isEditMode"
            type="text" 
            :value="account.amount"
            @input="handleAmountInput($event, index)"
            class="field-input amount-input"
            placeholder="0.00"
          >
          <span v-else class="field-display font-numeric">{{ formatNumber(account.amount) }}</span>
        </div>
        <div class="cell comments-cell">
          <input 
            v-if="isEditMode"
            type="text" 
            v-model="account.comments" 
            class="field-input"
            placeholder="..."
          >
          <span v-else class="field-display comments-text">{{ account.comments || '-' }}</span>
        </div>
        <div class="cell action-cell">
          <button class="delete-btn" @click="removeAccount(index)">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
      
      <div v-if="filteredAccounts.length === 0 && accounts.length > 0" class="no-results-row">
        <span>{{ t('noMatchingResults') }}</span>
      </div>
    </div>

    <div class="empty-state" v-if="accounts.length === 0">
      <i :class="icon"></i>
      <p>{{ t('noAccounts') }}</p>
    </div>

    <div class="detail-summary" v-if="accounts.length > 0">
      <div class="summary-row">
        <span class="summary-label">{{ t(totalLabelKey) }}</span>
        <span class="summary-value font-numeric">{{ formatAmount(filteredTotalCNY) }} CNY</span>
        <span v-if="filterBank || filterCurrency" class="filtered-hint">({{ t('filtered') }})</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import * as XLSX from 'xlsx';

const props = defineProps({
  t: {
    type: Function,
    required: true
  },
  formatAmount: {
    type: Function,
    required: true
  },
  titleKey: {
    type: String,
    required: true
  },
  totalLabelKey: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  storageKey: {
    type: String,
    required: true
  },
  assetId: {
    type: String,
    required: true
  },
  nameLabel: {
    type: String,
    default: 'NAME'
  },
  namePlaceholder: {
    type: String,
    default: 'Enter name'
  },
  nameExample: {
    type: String,
    default: 'Account 1'
  },
  transferTargets: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:total', 'transfer']);

const accounts = ref([]);
const showHelpModal = ref(false);
const showTransferModal = ref(false);
const isEditMode = ref(false);

const sectionRef = ref(null);
const transferFrom = ref('');
const transferAmount = ref('');
const transferToAsset = ref('');
const transferNote = ref('');
const transfers = ref([]);

const sortField = ref('bankName');
const sortOrder = ref('asc');
const filterBank = ref('');
const filterCurrency = ref('');
const showBankDropdown = ref(false);
const showCurrencyDropdown = ref(false);

const exchangeRates = {
  CNY: 1,
  USD: 7.24,
  HKD: 0.93
};

const uniqueBanks = computed(() => {
  const banks = new Set(accounts.value.map(a => a.bankName).filter(Boolean));
  return Array.from(banks).sort();
});

const filteredAccounts = computed(() => {
  let result = [...accounts.value];
  
  if (filterBank.value) {
    result = result.filter(a => a.bankName === filterBank.value);
  }
  if (filterCurrency.value) {
    result = result.filter(a => a.currency === filterCurrency.value);
  }
  
  if (sortField.value) {
    result.sort((a, b) => {
      let aVal = a[sortField.value];
      let bVal = b[sortField.value];
      
      if (sortField.value === 'amount') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }
      
      if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  return result;
});

const filteredTotalCNY = computed(() => {
  return filteredAccounts.value.reduce((sum, account) => {
    const rate = exchangeRates[account.currency] || 1;
    return sum + (Number(account.amount) || 0) * rate;
  }, 0);
});

const totalCNY = computed(() => {
  return accounts.value.reduce((sum, account) => {
    const rate = exchangeRates[account.currency] || 1;
    return sum + (Number(account.amount) || 0) * rate;
  }, 0);
});

const toggleSort = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'asc';
  }
};

const toggleAmountSort = () => {
  toggleSort('amount');
};

const toggleBankDropdown = () => {
  showBankDropdown.value = !showBankDropdown.value;
  showCurrencyDropdown.value = false;
};

const toggleCurrencyDropdown = () => {
  showCurrencyDropdown.value = !showCurrencyDropdown.value;
  showBankDropdown.value = false;
};

const selectSort = (field, order) => {
  sortField.value = field;
  sortOrder.value = order;
  showBankDropdown.value = false;
  showCurrencyDropdown.value = false;
};

const selectBankFilter = (bank) => {
  filterBank.value = bank;
  showBankDropdown.value = false;
};

const selectCurrencyFilter = (currency) => {
  filterCurrency.value = currency;
  showCurrencyDropdown.value = false;
};

const sortIcon = (field) => {
  if (sortField.value !== field) return 'fas fa-sort';
  return sortOrder.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
};

const clearFilters = () => {
  filterBank.value = '';
  filterCurrency.value = '';
};

const formatNumber = (value) => {
  if (!value && value !== 0) return '0.00';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const handleAmountInput = (e, filteredIndex) => {
  const value = e.target.value.replace(/[^0-9.]/g, '');
  const account = filteredAccounts.value[filteredIndex];
  const originalIndex = accounts.value.findIndex(a => a === account);
  if (originalIndex !== -1) {
    accounts.value[originalIndex].amount = value === '' ? 0 : parseFloat(value) || 0;
  }
};

const toggleEditMode = () => {
  if (isEditMode.value) {
    saveData();
  }
  isEditMode.value = !isEditMode.value;
};

const addAccount = () => {
  accounts.value.push({
    bankName: '',
    currency: 'CNY',
    amount: 0,
    comments: ''
  });
  isEditMode.value = true;
};

const removeAccount = (filteredIndex) => {
  const account = filteredAccounts.value[filteredIndex];
  const originalIndex = accounts.value.findIndex(a => a === account);
  if (originalIndex !== -1) {
    accounts.value.splice(originalIndex, 1);
    saveData();
  }
};

const executeTransfer = () => {
  if (transferFrom.value === '' || !transferAmount.value || !transferToAsset.value) {
    return;
  }

  const fromIdx = parseInt(transferFrom.value);
  const amount = parseFloat(transferAmount.value) || 0;
  
  if (amount <= 0 || amount > accounts.value[fromIdx].amount) {
    return;
  }

  accounts.value[fromIdx].amount -= amount;

  transfers.value.unshift({
    amount: amount,
    currency: accounts.value[fromIdx].currency,
    toAsset: transferToAsset.value,
    note: transferNote.value,
    date: new Date().toLocaleDateString()
  });

  emit('transfer', {
    amount: amount,
    currency: accounts.value[fromIdx].currency,
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
      const bankName = row['name'] || row['bankName'] || row['Name'] || row['Bank Name'] || '';
      const currency = row['currency'] || row['Currency'] || 'CNY';
      const amount = parseFloat(row['amount'] || row['Amount'] || 0) || 0;
      const comments = row['comments'] || row['Comments'] || row['comment'] || row['Note'] || '';

      if (bankName || amount > 0) {
        accounts.value.push({
          bankName: String(bankName).trim(),
          currency: ['CNY', 'USD', 'HKD'].includes(String(currency).toUpperCase()) 
            ? String(currency).toUpperCase() 
            : 'CNY',
          amount: amount,
          comments: String(comments).trim()
        });
      }
    });

    saveData();
    e.target.value = '';
  } catch (error) {
    console.error('Import failed:', error);
    alert(props.t('importFailed'));
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
    localStorage.setItem(props.storageKey, JSON.stringify(accounts.value));
    emit('update:total', totalCNY.value);
  } catch (error) {
    console.error('Save failed:', error);
  }
};

const saveTransfers = () => {
  try {
    localStorage.setItem(`${props.storageKey}Transfers`, JSON.stringify(transfers.value));
  } catch (error) {
    console.error('Save transfers failed:', error);
  }
};

const loadData = () => {
  try {
    const saved = localStorage.getItem(props.storageKey);
    if (saved) {
      accounts.value = JSON.parse(saved);
    }
    const savedTransfers = localStorage.getItem(`${props.storageKey}Transfers`);
    if (savedTransfers) {
      transfers.value = JSON.parse(savedTransfers);
    }
  } catch (error) {
    console.error('Load failed:', error);
  }
};

watch(totalCNY, (newValue) => {
  emit('update:total', newValue);
});

const handleClickOutside = (e) => {
  const target = e.target;
  const isDropdown = target.closest('.dropdown-menu');
  const isHeaderDropdown = target.closest('.header-dropdown');
  
  if (!isDropdown && !isHeaderDropdown) {
    showBankDropdown.value = false;
    showCurrencyDropdown.value = false;
  }
};

onMounted(() => {
  loadData();
  emit('update:total', totalCNY.value);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
@import './AccountDetailStyles.css';
</style>
