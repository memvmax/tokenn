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
  investTab: {
    type: String,
    default: 'profit'
  },
  stockValue: {
    type: Number,
    default: 0
  },
  cashValue: {
    type: Number,
    default: 0
  }
})

const totalAmount = computed(() => {
  return props.assets.reduce((sum, asset) => sum + (asset.amount || 0), 0)
})

const showInvestMode = computed(() => {
  return props.investTab === 'profit'
})
</script>

<template>
  <div class="total-asset-container">
    <div class="asset-main">
      <div class="asset-label">{{ showInvestMode ? 'STOCK VALUE (CNY)' : 'CNY' }}</div>
      <div class="asset-value">
        <span class="amount font-numeric">{{ showInvestMode ? formatCurrency(stockValue) : formatCurrency(totalAmount) }}</span>
      </div>
      <div class="asset-change">
        <span class="change-value positive">+0.00%</span>
        <span class="change-period">this month</span>
      </div>
    </div>
    <div class="asset-health" v-if="!showInvestMode">
      <div class="health-label">HEALTH PTS</div>
      <div class="health-score">
        <span class="score-value font-numeric">85</span>
      </div>
      <div class="health-change">
        <span class="health-delta negative">-2 pts</span>
        <span class="health-period">vs yesterday</span>
      </div>
    </div>
    <div class="asset-cash" v-if="showInvestMode">
      <div class="cash-label">CASH</div>
      <div class="cash-value">
        <span class="cash-amount font-numeric">{{ formatCurrency(cashValue) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.total-asset-container {
  background: var(--total-asset-bg);
  background-image: var(--total-asset-overlay);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 24px 20px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
}

.asset-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 2px;
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
}

.asset-change {
  display: flex;
  align-items: center;
  gap: 8px;
}

.change-value {
  font-size: 14px;
  font-weight: 500;
}

.change-value.positive {
  color: var(--accent-green);
}

.change-value.negative {
  color: var(--accent-red);
}

.change-period {
  font-size: 13px;
  color: var(--text-muted);
}

.asset-health {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.health-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 2px;
}

.health-score {
  margin-bottom: 0;
}

.score-value {
  font-size: 42px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -1px;
}

.health-change {
  display: flex;
  align-items: center;
  gap: 8px;
}

.health-delta {
  font-size: 14px;
  font-weight: 500;
}

.health-delta.positive {
  color: var(--accent-green);
}

.health-delta.negative {
  color: var(--accent-red);
}

.health-period {
  font-size: 13px;
  color: var(--text-muted);
}

.asset-cash {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.cash-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 2px;
}

.cash-value {
  margin-bottom: 0;
}

.cash-amount {
  font-size: 42px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -1px;
}
</style>
