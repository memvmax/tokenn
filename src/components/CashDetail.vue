<template>
  <div class="detail-section" ref="sectionRef">
    <div class="detail-header">
      <div class="detail-title">
        <i class="fas fa-wallet"></i>
        <span>{{ t('cashDetail') }}</span>
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
                <option value="stock">{{ t('stock') }}</option>
                <option value="bond">{{ t('bond') }}</option>
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
                  <td><span class="col-name">bankName</span></td>
                  <td>{{ t('column1') }}</td>
                  <td>招商银行</td>
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
                <span>bankName</span>
                <span>currency</span>
                <span>amount</span>
              </div>
              <div class="example-row">
                <span>招商银行</span>
                <span>CNY</span>
                <span>50000</span>
              </div>
              <div class="example-row">
                <span>Bank of America</span>
                <span>USD</span>
                <span>10000</span>
              </div>
              <div class="example-row">
                <span>汇丰银行</span>
                <span>HKD</span>
                <span>20000</span>
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
            <span class="header-text">{{ t('bankName') }}</span>
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
            :placeholder="t('enterBankName')"
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

      <div class="detail-summary" v-if="accounts.length > 0">
        <div class="summary-row">
          <span class="summary-label">{{ t('totalCash') }}</span>
          <span class="summary-value font-numeric">{{ formatAmount(filteredTotalCNY) }} CNY</span>
          <span v-if="filterBank || filterCurrency" class="filtered-hint">({{ t('filtered') }})</span>
        </div>
      </div>
    </div>

    <div class="empty-state" v-if="accounts.length === 0">
      <i class="fas fa-university"></i>
      <p>{{ t('noAccounts') }}</p>
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
  }
});

const emit = defineEmits(['update:total', 'transfer']);

const sectionRef = ref(null);
const accounts = ref([]);
const showHelpModal = ref(false);
const showTransferModal = ref(false);
const isEditMode = ref(false);

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
      const bankName = row['bankName'] || row['Bank Name'] || row['bank_name'] || row['Bank'] || '';
      const currency = row['currency'] || row['Currency'] || row['CNY'] || 'CNY';
      const amount = parseFloat(row['amount'] || row['Amount'] || row['amount '] || 0) || 0;
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
    localStorage.setItem('cashAccounts', JSON.stringify(accounts.value));
    emit('update:total', totalCNY.value);
  } catch (error) {
    console.error('Save failed:', error);
  }
};

const saveTransfers = () => {
  try {
    localStorage.setItem('cashTransfers', JSON.stringify(transfers.value));
  } catch (error) {
    console.error('Save transfers failed:', error);
  }
};

const loadData = () => {
  try {
    const saved = localStorage.getItem('cashAccounts');
    if (saved) {
      accounts.value = JSON.parse(saved);
    }
    const savedTransfers = localStorage.getItem('cashTransfers');
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
  border-color: var(--accent-blue);
  color: var(--accent-blue);
  background: rgba(41, 98, 255, 0.1);
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-light);
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
  background: var(--accent-blue);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.confirm-btn:hover {
  background: #0e7490;
}

.accounts-list {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  overflow: visible;
}

.accounts-header {
  display: flex;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-light);
  position: relative;
}

.header-cell {
  padding: 10px 14px;
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
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
}

.header-cell:hover {
  color: var(--text-secondary);
}

.header-cell.comments-cell {
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
  background: rgba(41, 98, 255, 0.15);
  color: var(--accent-blue);
}

.dropdown-item i {
  font-size: 10px;
  width: 14px;
}

.sort-icon {
  font-size: 8px;
  opacity: 0.4;
}

.no-results-row {
  padding: 24px 14px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
  border-bottom: 1px solid var(--border-light);
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

.account-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  height: 44px;
  box-sizing: border-box;
}

.account-row:last-of-type {
  border-bottom: none;
}

.account-row.is-editing {
  background: var(--bg-tertiary);
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
  border-color: var(--accent-blue);
}

.field-input::placeholder {
  color: var(--text-muted);
}

.field-input.font-numeric {
  font-family: 'Space Grotesk', 'SF Mono', monospace;
  text-align: right;
}

.cell {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.bank-cell {
  flex: 0 0 160px;
}

.currency-cell {
  flex: 0 0 100px;
}

.amount-cell {
  flex: 0 0 140px;
}

.comments-cell {
  flex: 1;
  min-width: 120px;
}

.action-cell {
  flex: 0 0 50px;
  display: flex;
  justify-content: flex-end;
  padding-right: 10px;
}

.field-input {
  width: 100%;
  padding: 6px 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-primary);
  font-size: 13px;
}

.field-input:focus {
  outline: none;
  border-color: var(--accent-blue);
}

.field-input::placeholder {
  color: var(--text-muted);
}

.amount-input {
  font-family: 'Space Grotesk', 'SF Mono', monospace;
  text-align: right;
}

.field-select {
  width: 100%;
  padding: 6px 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
}

.field-select:focus {
  outline: none;
  border-color: var(--accent-blue);
}

.field-display {
  font-size: 13px;
  color: var(--text-primary);
}

.comments-text {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.delete-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.delete-btn:hover {
  color: var(--accent-red);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.empty-state i {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 13px;
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

.filtered-hint {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: 8px;
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-header h3 {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
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
</style>
