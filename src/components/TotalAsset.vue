<script setup>
import { computed } from 'vue';

const props = defineProps({
  assets: {
    type: Array,
    required: true
  },
  t: {
    type: Function,
    required: true
  },
  formatCurrency: {
    type: Function,
    required: true
  },
  currentView: {
    type: String,
    default: 'wallet'
  },
  investTab: {
    type: String,
    default: 'profit'
  },
  stockValue: {
    type: Number,
    default: 0
  },
  walletValue: {
    type: Number,
    default: 0
  },
  totalProfit: {
    type: Number,
    default: 0
  }
})

const totalAmount = computed(() => {
  return props.assets.reduce((sum, asset) => sum + (asset.amount || 0), 0)
})

const showInvestMode = computed(() => {
  return props.currentView === 'invest'
})

const showWalletMode = computed(() => {
  return props.currentView === 'wallet' || props.currentView === 'notes'
})

const displayValue = computed(() => {
  if (showInvestMode.value) return props.stockValue
  if (showWalletMode.value) return props.walletValue ?? 0
  return totalAmount.value
})
</script>

<template>
  <div class="total-asset-container">
    <div class="asset-main">
      <div class="asset-label">{{ showInvestMode ? 'STOCK VALUE (CNY)' : 'TOTAL ASSETS (CNY)' }}</div>
      <div class="asset-value">
        <span class="amount font-numeric">{{ formatCurrency(displayValue) }}</span>
      </div>
      <div class="asset-change" v-if="showInvestMode">
        <span class="change-value" :class="{ 'positive': totalProfit >= 0, 'negative': totalProfit < 0 }">
          {{ totalProfit >= 0 ? '+' : '' }}{{ formatCurrency(totalProfit) }}
        </span>
        <span class="change-period">total profit</span>
      </div>
      <div class="asset-change" v-else>
        <span class="change-value positive">+0.00%</span>
        <span class="change-period">this month</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.total-asset-container {
  background: var(--total-asset-bg);
  border: var(--total-asset-border, 1px solid var(--border-light));
  border-radius: 4px;
  padding: 24px 20px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-asset-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--total-asset-overlay);
  pointer-events: none;
  z-index: 0;
}

.total-asset-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--total-asset-line);
  pointer-events: none;
}

.asset-main {
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.asset-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 2px;
  -webkit-text-stroke: 0.5px rgba(255, 255, 255, 0.3);
}

.asset-value {
  display: flex;
  align-items: baseline;
  margin-bottom: 0;
}

.asset-value .amount {
  font-size: 42px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -1px;
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.5);
}

.asset-change {
  display: flex;
  align-items: center;
  gap: 8px;
}

.change-value {
  font-size: 14px;
  font-weight: 500;
  -webkit-text-stroke: 0.5px rgba(255, 255, 255, 0.3);
}

.change-value.positive {
  color: var(--accent-green);
}

.change-value.negative {
  color: var(--accent-red);
}

.change-period {
  font-size: 13px;
  color: var(--text-secondary);
  -webkit-text-stroke: 0.5px rgba(255, 255, 255, 0.3);
}

.health-period {
  font-size: 13px;
  color: var(--text-muted);
  -webkit-text-stroke: 0.5px rgba(255, 255, 255, 0.3);
}
</style>
