<template>
  <div class="detail-section">
    <div class="section-header">
      <span class="section-title">{{ t('goldDetail') }}</span>
      <button class="add-btn" @click="openAddModal">
        <i class="fas fa-plus"></i>
      </button>
    </div>

    <div class="data-table" v-if="holdings.length > 0">
      <div class="table-header">
        <div class="th col-name">NAME</div>
        <div class="th col-shares">SHARES</div>
        <div class="th col-price">PRICE</div>
        <div class="th col-cost">COST</div>
        <div class="th col-value">VALUE</div>
        <div class="th col-pnl">P&L</div>
        <div class="th col-actions"></div>
      </div>
      <div class="table-body">
        <div v-for="(item, index) in holdings" :key="index" class="table-row">
          <div class="td col-name">
            <span class="metal-dot" :style="{ background: item.color }"></span>
            {{ item.name }}
          </div>
          <div class="td col-shares font-numeric">{{ formatNumber(item.shares) }}g</div>
          <div class="td col-price font-numeric">{{ formatPrice(item.price) }}</div>
          <div class="td col-cost font-numeric">{{ formatPrice(item.cost) }}</div>
          <div class="td col-value font-numeric">{{ formatCurrency(item.shares * item.price) }}</div>
          <div class="td col-pnl font-numeric" :class="getPnLClass(item)">
            {{ item.pnl >= 0 ? '+' : '' }}{{ formatCurrency(item.pnl) }}
          </div>
          <div class="td col-actions">
            <button class="action-btn" @click="openAddModal(item.code)">
              <i class="fas fa-plus"></i>
            </button>
            <button class="action-btn delete" @click="removeHolding(index)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <i class="fas fa-coins"></i>
      <p>{{ t('noHoldings') || 'No holdings' }}</p>
      <button class="add-first-btn" @click="openAddModal()">{{ t('add') || 'ADD' }}</button>
    </div>

    <div class="detail-summary" v-if="holdings.length > 0">
      <div class="summary-row">
        <span class="summary-label">TOTAL VALUE</span>
        <span class="summary-value font-numeric">{{ formatCurrency(totalValue) }} CNY</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">TOTAL P&L</span>
        <span class="summary-pnl font-numeric" :class="totalPnL >= 0 ? 'positive' : 'negative'">
          {{ totalPnL >= 0 ? '+' : '' }}{{ formatCurrency(Math.abs(totalPnL)) }} CNY
        </span>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <span class="modal-title">ADD RECORD</span>
            <button class="modal-close" @click="closeAddModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">METAL</label>
              <select class="form-select" v-model="addForm.metal">
                <option value="gold">GOLD</option>
                <option value="silver">SILVER</option>
                <option value="copper">COPPER</option>
                <option value="crude">CRUDE OIL</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group half">
                <label class="form-label">AMOUNT (g)</label>
                <input type="number" class="form-input" v-model="addForm.amount" placeholder="0.00">
              </div>
              <div class="form-group half">
                <label class="form-label">PRICE (CNY/g)</label>
                <input type="number" class="form-input" v-model="addForm.price" placeholder="0.00">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group half">
                <label class="form-label">FEE (CNY)</label>
                <input type="number" class="form-input" v-model="addForm.fee" placeholder="0.00">
              </div>
              <div class="form-group half">
                <label class="form-label">DATE</label>
                <input type="date" class="form-input" v-model="addForm.date">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeAddModal">{{ t('cancel') }}</button>
            <button class="btn-confirm" @click="addRecord">{{ t('confirm') }}</button>
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

const metalConfig = {
  gold: { name: 'GOLD', color: '#ffd700', price: 580 },
  silver: { name: 'SILVER', color: '#a8a8a8', price: 7.5 },
  copper: { name: 'COPPER', color: '#b87333', price: 0.07 },
  crude: { name: 'CRUDE OIL', color: '#2d2d2d', price: 550 }
};

const holdings = ref([]);
const showAddModal = ref(false);
const addForm = ref({
  metal: 'gold',
  amount: '',
  price: '',
  fee: '',
  date: new Date().toISOString().split('T')[0]
});

const totalValue = computed(() => {
  return holdings.value.reduce((sum, h) => sum + h.shares * h.price, 0);
});

const totalPnL = computed(() => {
  return holdings.value.reduce((sum, h) => sum + h.pnl, 0);
});

const formatNumber = (value) => {
  if (!value && value !== 0) return '0.00';
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPrice = (value) => {
  if (!value && value !== 0) return '0.00';
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getPnLClass = (item) => {
  return item.pnl >= 0 ? 'positive' : 'negative';
};

const openAddModal = (metal = 'gold') => {
  addForm.value = {
    metal: metal,
    amount: '',
    price: '',
    fee: '',
    date: new Date().toISOString().split('T')[0]
  };
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
};

const addRecord = () => {
  const config = metalConfig[addForm.value.metal];
  const amount = parseFloat(addForm.value.amount) || 0;
  const price = parseFloat(addForm.value.price) || 0;
  const fee = parseFloat(addForm.value.fee) || 0;
  
  if (amount <= 0 || price <= 0) return;
  
  const existingIndex = holdings.value.findIndex(h => h.code === addForm.value.metal);
  
  if (existingIndex >= 0) {
    const existing = holdings.value[existingIndex];
    const totalShares = existing.shares + amount;
    const totalCost = existing.cost * existing.shares + price * amount + fee;
    existing.shares = totalShares;
    existing.cost = totalCost / totalShares;
    existing.pnl = (existing.price - existing.cost) * existing.shares;
  } else {
    const cost = (price * amount + fee) / amount;
    holdings.value.push({
      code: addForm.value.metal,
      name: config.name,
      color: config.color,
      shares: amount,
      price: config.price,
      cost: cost,
      pnl: (config.price - cost) * amount
    });
  }
  
  saveData();
  closeAddModal();
};

const removeHolding = (index) => {
  holdings.value.splice(index, 1);
  saveData();
};

const saveData = () => {
  localStorage.setItem('goldHoldings', JSON.stringify(holdings.value));
  emit('update:total', totalValue.value);
};

const loadData = () => {
  const saved = localStorage.getItem('goldHoldings');
  if (saved) {
    holdings.value = JSON.parse(saved);
  }
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
  grid-template-columns: 100px 90px 80px 80px 90px 90px 70px;
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
  grid-template-columns: 100px 90px 80px 80px 90px 90px 70px;
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

.col-name { justify-content: flex-start; gap: 8px; }
.col-shares, .col-price, .col-cost, .col-value, .col-pnl { justify-content: flex-end; }
.col-actions { justify-content: flex-end; gap: 4px; }

.metal-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.positive { color: var(--accent-green); }
.negative { color: var(--accent-red); }

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
  color: var(--accent-blue);
}

.action-btn.delete:hover {
  color: var(--accent-red);
}

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

.summary-pnl {
  font-size: 14px;
  font-weight: 500;
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

.form-input,
.form-select {
  width: 100%;
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
    grid-template-columns: 80px 70px 70px 70px 60px;
  }
  
  .col-cost,
  .col-actions {
    display: none;
  }
}
</style>
