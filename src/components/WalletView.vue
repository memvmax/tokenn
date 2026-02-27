<template>
  <div class="wallet-view">
    <div class="wallet-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id" 
        class="tab-btn" 
        :class="{ 'active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <i :class="tab.icon"></i>
        <span>{{ tab.name }}</span>
      </button>
    </div>

    <div class="wallet-content">
      <div v-if="activeTab === 'cash'" class="cash-section">
        <div class="section-header">
          <span class="section-title">CASH ACCOUNTS</span>
          <button class="add-btn" @click="showAddModal = true">
            <i class="fas fa-plus"></i>
          </button>
        </div>

        <div class="data-table" v-if="cashAccounts.length > 0">
          <div class="table-header">
            <div class="th col-bank">BANK</div>
            <div class="th col-currency">CURRENCY</div>
            <div class="th col-amount">AMOUNT</div>
            <div class="th col-cny">CNY VALUE</div>
            <div class="th col-actions"></div>
          </div>
          <div class="table-body">
            <div v-for="(account, index) in cashAccounts" :key="index" class="table-row">
              <div class="td col-bank">{{ account.bank }}</div>
              <div class="td col-currency">{{ account.currency }}</div>
              <div class="td col-amount font-numeric">{{ formatNumber(account.amount) }}</div>
              <div class="td col-cny font-numeric">{{ formatNumber(account.amount * getRate(account.currency)) }}</div>
              <div class="td col-actions">
                <button class="action-btn delete" @click="removeCashAccount(index)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" v-else>
          <i class="fas fa-wallet"></i>
          <p>No cash accounts</p>
          <button class="add-first-btn" @click="showAddModal = true">ADD ACCOUNT</button>
        </div>

        <div class="section-summary" v-if="cashAccounts.length > 0">
          <div class="summary-row">
            <span class="summary-label">TOTAL CASH</span>
            <span class="summary-value font-numeric">{{ formatNumber(totalCashCNY) }} CNY</span>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'gold'" class="gold-section">
        <div class="section-header">
          <span class="section-title">PRECIOUS METALS</span>
          <button class="add-btn" @click="showAddModal = true">
            <i class="fas fa-plus"></i>
          </button>
        </div>

        <div class="data-table" v-if="goldHoldings.length > 0">
          <div class="table-header">
            <div class="th col-name">NAME</div>
            <div class="th col-shares">WEIGHT</div>
            <div class="th col-price">PRICE</div>
            <div class="th col-value">VALUE</div>
            <div class="th col-pnl">P&L</div>
            <div class="th col-actions"></div>
          </div>
          <div class="table-body">
            <div v-for="(item, index) in goldHoldings" :key="index" class="table-row">
              <div class="td col-name">
                <span class="metal-dot" :style="{ background: item.color }"></span>
                {{ item.name }}
              </div>
              <div class="td col-shares font-numeric">{{ item.weight }}g</div>
              <div class="td col-price font-numeric">{{ formatNumber(item.price) }}</div>
              <div class="td col-value font-numeric">{{ formatNumber(item.weight * item.price) }}</div>
              <div class="td col-pnl font-numeric" :class="item.pnl >= 0 ? 'positive' : 'negative'">
                {{ item.pnl >= 0 ? '+' : '' }}{{ formatNumber(item.pnl) }}
              </div>
              <div class="td col-actions">
                <button class="action-btn delete" @click="removeGoldHolding(index)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" v-else>
          <i class="fas fa-coins"></i>
          <p>No precious metals</p>
          <button class="add-first-btn" @click="showAddModal = true">ADD HOLDING</button>
        </div>

        <div class="section-summary" v-if="goldHoldings.length > 0">
          <div class="summary-row">
            <span class="summary-label">TOTAL VALUE</span>
            <span class="summary-value font-numeric">{{ formatNumber(totalGoldValue) }} CNY</span>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'bond'" class="bond-section">
        <div class="section-header">
          <span class="section-title">BONDS</span>
          <button class="add-btn" @click="showAddModal = true">
            <i class="fas fa-plus"></i>
          </button>
        </div>

        <div class="data-table" v-if="bondHoldings.length > 0">
          <div class="table-header">
            <div class="th col-name">NAME</div>
            <div class="th col-shares">SHARES</div>
            <div class="th col-price">PRICE</div>
            <div class="th col-value">VALUE</div>
            <div class="th col-rate">RATE</div>
            <div class="th col-actions"></div>
          </div>
          <div class="table-body">
            <div v-for="(item, index) in bondHoldings" :key="index" class="table-row">
              <div class="td col-name">{{ item.name }}</div>
              <div class="td col-shares font-numeric">{{ item.shares }}</div>
              <div class="td col-price font-numeric">{{ formatNumber(item.price) }}</div>
              <div class="td col-value font-numeric">{{ formatNumber(item.shares * item.price) }}</div>
              <div class="td col-rate font-numeric">{{ item.rate }}%</div>
              <div class="td col-actions">
                <button class="action-btn delete" @click="removeBondHolding(index)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" v-else>
          <i class="fas fa-landmark"></i>
          <p>No bonds</p>
          <button class="add-first-btn" @click="showAddModal = true">ADD BOND</button>
        </div>

        <div class="section-summary" v-if="bondHoldings.length > 0">
          <div class="summary-row">
            <span class="summary-label">TOTAL VALUE</span>
            <span class="summary-value font-numeric">{{ formatNumber(totalBondValue) }} CNY</span>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'stock'" class="stock-section">
        <div class="section-header">
          <span class="section-title">STOCKS</span>
          <button class="add-btn" @click="showAddModal = true">
            <i class="fas fa-plus"></i>
          </button>
        </div>

        <div class="data-table" v-if="stockHoldings.length > 0">
          <div class="table-header">
            <div class="th col-name">NAME</div>
            <div class="th col-shares">SHARES</div>
            <div class="th col-price">PRICE</div>
            <div class="th col-value">VALUE</div>
            <div class="th col-pnl">P&L</div>
            <div class="th col-actions"></div>
          </div>
          <div class="table-body">
            <div v-for="(item, index) in stockHoldings" :key="index" class="table-row">
              <div class="td col-name">{{ item.name }}</div>
              <div class="td col-shares font-numeric">{{ item.shares }}</div>
              <div class="td col-price font-numeric">{{ formatNumber(item.price) }}</div>
              <div class="td col-value font-numeric">{{ formatNumber(item.shares * item.price) }}</div>
              <div class="td col-pnl font-numeric" :class="item.pnl >= 0 ? 'positive' : 'negative'">
                {{ item.pnl >= 0 ? '+' : '' }}{{ formatNumber(item.pnl) }}
              </div>
              <div class="td col-actions">
                <button class="action-btn delete" @click="removeStockHolding(index)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" v-else>
          <i class="fas fa-chart-line"></i>
          <p>No stocks</p>
          <button class="add-first-btn" @click="showAddModal = true">ADD STOCK</button>
        </div>

        <div class="section-summary" v-if="stockHoldings.length > 0">
          <div class="summary-row">
            <span class="summary-label">TOTAL VALUE</span>
            <span class="summary-value font-numeric">{{ formatNumber(totalStockValue) }} CNY</span>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'emerging'" class="emerging-section">
        <div class="section-header">
          <span class="section-title">EMERGING MARKETS</span>
          <button class="add-btn" @click="showAddModal = true">
            <i class="fas fa-plus"></i>
          </button>
        </div>

        <div class="data-table" v-if="emergingHoldings.length > 0">
          <div class="table-header">
            <div class="th col-name">NAME</div>
            <div class="th col-shares">SHARES</div>
            <div class="th col-price">PRICE</div>
            <div class="th col-value">VALUE</div>
            <div class="th col-pnl">P&L</div>
            <div class="th col-actions"></div>
          </div>
          <div class="table-body">
            <div v-for="(item, index) in emergingHoldings" :key="index" class="table-row">
              <div class="td col-name">{{ item.name }}</div>
              <div class="td col-shares font-numeric">{{ item.shares }}</div>
              <div class="td col-price font-numeric">{{ formatNumber(item.price) }}</div>
              <div class="td col-value font-numeric">{{ formatNumber(item.shares * item.price) }}</div>
              <div class="td col-pnl font-numeric" :class="item.pnl >= 0 ? 'positive' : 'negative'">
                {{ item.pnl >= 0 ? '+' : '' }}{{ formatNumber(item.pnl) }}
              </div>
              <div class="td col-actions">
                <button class="action-btn delete" @click="removeEmergingHolding(index)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" v-else>
          <i class="fas fa-globe"></i>
          <p>No emerging market funds</p>
          <button class="add-first-btn" @click="showAddModal = true">ADD FUND</button>
        </div>

        <div class="section-summary" v-if="emergingHoldings.length > 0">
          <div class="summary-row">
            <span class="summary-label">TOTAL VALUE</span>
            <span class="summary-value font-numeric">{{ formatNumber(totalEmergingValue) }} CNY</span>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <span class="modal-title">ADD {{ activeTab.toUpperCase() }}</span>
            <button class="modal-close" @click="showAddModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">NAME</label>
              <input type="text" class="form-input" v-model="addForm.name" placeholder="Enter name">
            </div>
            <div class="form-row">
              <div class="form-group half">
                <label class="form-label">AMOUNT</label>
                <input type="number" class="form-input" v-model="addForm.amount" placeholder="0.00">
              </div>
              <div class="form-group half">
                <label class="form-label">PRICE</label>
                <input type="number" class="form-input" v-model="addForm.price" placeholder="0.00">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showAddModal = false">CANCEL</button>
            <button class="btn-confirm" @click="addItem">CONFIRM</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  t: { type: Function, required: true },
  formatAmount: { type: Function, required: true }
})

const emit = defineEmits(['update:total'])

const activeTab = ref('cash')
const showAddModal = ref(false)
const addForm = ref({ name: '', amount: '', price: '' })

const tabs = [
  { id: 'cash', name: 'CASH', icon: 'fas fa-wallet' },
  { id: 'gold', name: 'GOLD', icon: 'fas fa-coins' },
  { id: 'bond', name: 'BOND', icon: 'fas fa-landmark' },
  { id: 'stock', name: 'STOCK', icon: 'fas fa-chart-line' },
  { id: 'emerging', name: 'EMERGING', icon: 'fas fa-globe' }
]

const exchangeRates = { CNY: 1, USD: 7.24, HKD: 0.93 }

const cashAccounts = ref([])
const goldHoldings = ref([])
const bondHoldings = ref([])
const stockHoldings = ref([])
const emergingHoldings = ref([])

const getRate = (currency) => exchangeRates[currency] || 1

const totalCashCNY = computed(() => {
  return cashAccounts.value.reduce((sum, acc) => sum + acc.amount * getRate(acc.currency), 0)
})

const totalGoldValue = computed(() => {
  return goldHoldings.value.reduce((sum, item) => sum + item.weight * item.price, 0)
})

const totalBondValue = computed(() => {
  return bondHoldings.value.reduce((sum, item) => sum + item.shares * item.price, 0)
})

const totalStockValue = computed(() => {
  return stockHoldings.value.reduce((sum, item) => sum + item.shares * item.price, 0)
})

const totalEmergingValue = computed(() => {
  return emergingHoldings.value.reduce((sum, item) => sum + item.shares * item.price, 0)
})

const totalWalletValue = computed(() => {
  return totalCashCNY.value + totalGoldValue.value + totalBondValue.value + totalStockValue.value + totalEmergingValue.value
})

const formatNumber = (value) => {
  if (!value && value !== 0) return '0.00'
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const addItem = () => {
  const name = addForm.value.name.trim()
  const amount = parseFloat(addForm.value.amount) || 0
  const price = parseFloat(addForm.value.price) || 0

  if (!name || amount <= 0) return

  switch (activeTab.value) {
    case 'cash':
      cashAccounts.value.push({ bank: name, currency: 'CNY', amount })
      break
    case 'gold':
      goldHoldings.value.push({ name, weight: amount, price, color: '#ffd700', pnl: 0 })
      break
    case 'bond':
      bondHoldings.value.push({ name, shares: amount, price, rate: 3.5 })
      break
    case 'stock':
      stockHoldings.value.push({ name, shares: amount, price, pnl: 0 })
      break
    case 'emerging':
      emergingHoldings.value.push({ name, shares: amount, price, pnl: 0 })
      break
  }

  saveData()
  showAddModal.value = false
  addForm.value = { name: '', amount: '', price: '' }
}

const removeCashAccount = (index) => {
  cashAccounts.value.splice(index, 1)
  saveData()
}

const removeGoldHolding = (index) => {
  goldHoldings.value.splice(index, 1)
  saveData()
}

const removeBondHolding = (index) => {
  bondHoldings.value.splice(index, 1)
  saveData()
}

const removeStockHolding = (index) => {
  stockHoldings.value.splice(index, 1)
  saveData()
}

const removeEmergingHolding = (index) => {
  emergingHoldings.value.splice(index, 1)
  saveData()
}

const saveData = () => {
  localStorage.setItem('walletData', JSON.stringify({
    cash: cashAccounts.value,
    gold: goldHoldings.value,
    bond: bondHoldings.value,
    stock: stockHoldings.value,
    emerging: emergingHoldings.value
  }))
  emit('update:total', totalWalletValue.value)
}

const loadData = () => {
  const saved = localStorage.getItem('walletData')
  if (saved) {
    const data = JSON.parse(saved)
    cashAccounts.value = data.cash || []
    goldHoldings.value = data.gold || []
    bondHoldings.value = data.bond || []
    stockHoldings.value = data.stock || []
    emergingHoldings.value = data.emerging || []
  }
}

onMounted(() => {
  loadData()
  emit('update:total', totalWalletValue.value)
})

defineExpose({
  totalWalletValue
})
</script>

<style scoped>
.wallet-view {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  overflow: hidden;
}

.wallet-tabs {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-light);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.tab-btn.active {
  color: var(--accent-blue);
  background: var(--bg-secondary);
  border-color: var(--border-light);
}

.tab-btn i {
  font-size: 12px;
}

.wallet-content {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-light);
  height: 38px;
  box-sizing: border-box;
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
  border-bottom: 1px solid var(--border-light);
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 80px 100px 100px 70px;
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
  grid-template-columns: 1fr 80px 100px 100px 70px;
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

.col-bank, .col-name { justify-content: flex-start; }
.col-currency, .col-shares, .col-price, .col-amount, .col-cny, .col-value, .col-rate, .col-pnl { justify-content: flex-end; }
.col-actions { justify-content: flex-end; gap: 4px; }

.metal-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
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

.section-summary {
  padding: 12px 16px;
  background: var(--bg-tertiary);
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
  border-color: var(--accent-blue);
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
  .wallet-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .tab-btn span {
    display: none;
  }
  
  .tab-btn {
    padding: 8px 12px;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr 70px 80px 60px;
  }
  
  .col-currency,
  .col-actions {
    display: none;
  }
}
</style>
