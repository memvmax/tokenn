<template>
  <div class="detail-section">
    <div class="section-header">
      <span class="section-title">{{ t('cashDetail') }}</span>
      <button class="add-btn" @click="addAccount">
        <i class="fas fa-plus"></i>
      </button>
    </div>

    <div class="data-table" v-if="accounts.length > 0">
      <div class="table-header">
        <div class="th col-bank">{{ t('bankName') }}</div>
        <div class="th col-currency">{{ t('currencyLabel') }}</div>
        <div class="th col-amount">{{ t('amount') }}</div>
        <div class="th col-comments">{{ t('comments') }}</div>
        <div class="th col-actions"></div>
      </div>
      <div class="table-body">
        <div 
          v-for="(account, index) in accounts" 
          :key="index" 
          class="table-row"
          :class="{ 'editing': editingIndex === index }"
        >
          <div class="td col-bank">
            <input v-if="editingIndex === index" type="text" v-model="account.bankName" class="field-input" :placeholder="t('enterBankName')">
            <span v-else class="field-display">{{ account.bankName || '-' }}</span>
          </div>
          <div class="td col-currency">
            <select v-if="editingIndex === index" v-model="account.currency" class="field-select">
              <option value="CNY">CNY</option>
              <option value="USD">USD</option>
              <option value="HKD">HKD</option>
            </select>
            <span v-else class="field-display">{{ account.currency }}</span>
          </div>
          <div class="td col-amount font-numeric">
            <input v-if="editingIndex === index" type="text" v-model.number="account.amount" class="field-input amount-input" placeholder="0.00">
            <span v-else class="field-display">{{ formatNumber(account.amount) }}</span>
          </div>
          <div class="td col-comments">
            <input v-if="editingIndex === index" type="text" v-model="account.comments" class="field-input" placeholder="...">
            <span v-else class="field-display comments-text">{{ account.comments || '-' }}</span>
          </div>
          <div class="td col-actions">
            <button v-if="editingIndex === index" class="action-btn save" @click="saveAccount(index)">
              <i class="fas fa-check"></i>
            </button>
            <button v-else class="action-btn edit" @click="editAccount(index)">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" @click="removeAccount(index)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <i class="fas fa-wallet"></i>
      <p>{{ t('noAccounts') }}</p>
      <button class="add-first-btn" @click="addAccount">{{ t('addAccount') }}</button>
    </div>

    <div class="detail-summary" v-if="accounts.length > 0">
      <div class="summary-row">
        <span class="summary-label">{{ t('totalCash') }}</span>
        <span class="summary-value font-numeric">{{ formatAmount(totalCNY) }} CNY</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  t: { type: Function, required: true },
  formatAmount: { type: Function, required: true }
});

const emit = defineEmits(['update:total']);

const accounts = ref([]);
const editingIndex = ref(-1);

const exchangeRates = { CNY: 1, USD: 7.24, HKD: 0.93 };

const totalCNY = computed(() => {
  return accounts.value.reduce((sum, acc) => {
    const rate = exchangeRates[acc.currency] || 1;
    return sum + (Number(acc.amount) || 0) * rate;
  }, 0);
});

const formatNumber = (value) => {
  if (!value && value !== 0) return '0.00';
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const addAccount = () => {
  accounts.value.push({ bankName: '', currency: 'CNY', amount: 0, comments: '' });
  editingIndex.value = accounts.value.length - 1;
};

const editAccount = (index) => {
  editingIndex.value = index;
};

const saveAccount = (index) => {
  editingIndex.value = -1;
  saveData();
};

const removeAccount = (index) => {
  accounts.value.splice(index, 1);
  editingIndex.value = -1;
  saveData();
};

const saveData = () => {
  localStorage.setItem('cashAccounts', JSON.stringify(accounts.value));
  emit('update:total', totalCNY.value);
};

const loadData = () => {
  const saved = localStorage.getItem('cashAccounts');
  if (saved) accounts.value = JSON.parse(saved);
};

watch(totalCNY, (v) => emit('update:total', v));

onMounted(() => {
  loadData();
  emit('update:total', totalCNY.value);
});
</script>

<style scoped>
.detail-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.add-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-btn:hover {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.data-table {
  border: 1px solid var(--border-light);
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 80px 120px 1fr 80px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-light);
}

.th {
  padding: 10px 12px;
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 80px 120px 1fr 80px;
  border-bottom: 1px solid var(--border-light);
  transition: background 0.15s ease;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: var(--bg-hover);
}

.table-row.editing {
  background: rgba(41, 98, 255, 0.05);
}

.td {
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.col-bank { justify-content: flex-start; }
.col-currency { justify-content: center; }
.col-amount { justify-content: flex-end; }
.col-comments { justify-content: flex-start; }
.col-actions { justify-content: flex-end; gap: 4px; }

.field-display {
  font-size: 13px;
}

.comments-text {
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.field-select {
  padding: 6px 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-primary);
  font-size: 12px;
}

.amount-input {
  text-align: right;
  font-family: 'Space Grotesk', 'SF Mono', monospace;
}

.action-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--bg-tertiary);
}

.action-btn.edit:hover { color: var(--accent-blue); }
.action-btn.save { color: var(--accent-green); }
.action-btn.delete:hover { color: var(--accent-red); }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
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
  margin-bottom: 16px;
}

.add-first-btn {
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-first-btn:hover {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.detail-summary {
  margin-top: 12px;
  padding: 12px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
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

@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr 60px 90px 60px;
  }
  
  .col-comments {
    display: none;
  }
  
  .th.col-comments,
  .td.col-comments {
    display: none;
  }
}
</style>
