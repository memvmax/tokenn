<template>
  <div class="detail-section">
    <div class="section-header">
      <span class="section-title">{{ t('bondDetail') }}</span>
      <button class="add-btn" @click="openAddModal">
        <i class="fas fa-plus"></i>
      </button>
    </div>

    <div class="data-table" v-if="holdings.length > 0">
      <div class="table-header">
        <div class="th col-name">NAME</div>
        <div class="th col-shares">SHARES</div>
        <div class="th col-price">PRICE</div>
        <div class="th col-value">VALUE</div>
        <div class="th col-rate">RATE</div>
        <div class="th col-actions"></div>
      </div>
      <div class="table-body">
        <div v-for="(item, index) in holdings" :key="index" class="table-row">
          <div class="td col-name">{{ item.name }}</div>
          <div class="td col-shares font-numeric">{{ item.shares }}</div>
          <div class="td col-price font-numeric">{{ formatNumber(item.price) }}</div>
          <div class="td col-value font-numeric">{{ formatCurrency(item.shares * item.price) }}</div>
          <div class="td col-rate font-numeric">{{ item.rate }}%</div>
          <div class="td col-actions">
            <button class="action-btn edit" @click="editHolding(index)">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" @click="removeHolding(index)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <i class="fas fa-landmark"></i>
      <p>{{ t('noHoldings') || 'No holdings' }}</p>
      <button class="add-first-btn" @click="openAddModal()">{{ t('add') || 'ADD' }}</button>
    </div>

    <div class="detail-summary" v-if="holdings.length > 0">
      <div class="summary-row">
        <span class="summary-label">TOTAL VALUE</span>
        <span class="summary-value font-numeric">{{ formatCurrency(totalValue) }} CNY</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">AVG RATE</span>
        <span class="summary-rate font-numeric">{{ avgRate }}%</span>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <span class="modal-title">{{ editingIndex >= 0 ? 'EDIT' : 'ADD' }} BOND</span>
            <button class="modal-close" @click="closeAddModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">NAME</label>
              <input type="text" class="form-input" v-model="addForm.name" placeholder="Bond name">
            </div>
            <div class="form-row">
              <div class="form-group half">
                <label class="form-label">SHARES</label>
                <input type="number" class="form-input" v-model="addForm.shares" placeholder="0">
              </div>
              <div class="form-group half">
                <label class="form-label">PRICE</label>
                <input type="number" class="form-input" v-model="addForm.price" placeholder="0.00">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">RATE (%)</label>
              <input type="number" step="0.01" class="form-input" v-model="addForm.rate" placeholder="0.00">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeAddModal">{{ t('cancel') }}</button>
            <button class="btn-confirm" @click="saveHolding">{{ t('confirm') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  t: { type: Function, required: true },
  formatCurrency: { type: Function, required: true }
});

const emit = defineEmits(['update:total']);

const holdings = ref([]);
const showAddModal = ref(false);
const editingIndex = ref(-1);
const addForm = ref({
  name: '',
  shares: '',
  price: '',
  rate: ''
});

const totalValue = computed(() => {
  return holdings.value.reduce((sum, h) => sum + h.shares * h.price, 0);
});

const avgRate = computed(() => {
  if (holdings.value.length === 0) return '0.00';
  const total = holdings.value.reduce((sum, h) => sum + h.rate * h.shares * h.price, 0);
  return (total / totalValue.value).toFixed(2);
});

const formatNumber = (value) => {
  if (!value && value !== 0) return '0.00';
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const openAddModal = () => {
  addForm.value = { name: '', shares: '', price: '', rate: '' };
  editingIndex.value = -1;
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
};

const editHolding = (index) => {
  const h = holdings.value[index];
  addForm.value = { name: h.name, shares: h.shares, price: h.price, rate: h.rate };
  editingIndex.value = index;
  showAddModal.value = true;
};

const saveHolding = () => {
  const name = addForm.value.name.trim();
  const shares = parseFloat(addForm.value.shares) || 0;
  const price = parseFloat(addForm.value.price) || 0;
  const rate = parseFloat(addForm.value.rate) || 0;
  
  if (!name || shares <= 0 || price <= 0) return;
  
  if (editingIndex.value >= 0) {
    holdings.value[editingIndex.value] = { name, shares, price, rate };
  } else {
    holdings.value.push({ name, shares, price, rate });
  }
  
  saveData();
  closeAddModal();
};

const removeHolding = (index) => {
  holdings.value.splice(index, 1);
  saveData();
};

const saveData = () => {
  localStorage.setItem('bondHoldings', JSON.stringify(holdings.value));
  emit('update:total', totalValue.value);
};

const loadData = () => {
  const saved = localStorage.getItem('bondHoldings');
  if (saved) holdings.value = JSON.parse(saved);
};

watch(totalValue, (v) => emit('update:total', v));

onMounted(() => {
  loadData();
  emit('update:total', totalValue.value);
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
  grid-template-columns: 1fr 80px 90px 100px 70px 70px;
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
  grid-template-columns: 1fr 80px 90px 100px 70px 70px;
  border-bottom: 1px solid var(--border-light);
  transition: background 0.15s ease;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: var(--bg-hover);
}

.td {
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.col-name { justify-content: flex-start; }
.col-shares, .col-price, .col-value, .col-rate { justify-content: flex-end; }
.col-actions { justify-content: flex-end; gap: 4px; }

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
  margin-bottom: 8px;
}

.summary-row:last-child {
  margin-bottom: 0;
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

.summary-rate {
  font-size: 14px;
  font-weight: 500;
  color: var(--accent-green);
}

.modal-overlay {
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

.modal-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
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
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group.half {
  flex: 1;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-label {
  display: block;
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
}

.form-input:focus {
  outline: none;
  border-color: var(--border-color);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-light);
}

.btn-cancel {
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.btn-confirm {
  padding: 8px 16px;
  background: var(--accent-blue);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr 70px 80px 60px;
  }
  
  .col-price,
  .col-actions {
    display: none;
  }
}
</style>
