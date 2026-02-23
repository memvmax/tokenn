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
  }
})

const totalAmount = computed(() => {
  return props.assets.reduce((sum, asset) => sum + (asset.amount || 0), 0)
})
</script>

<template>
  <div class="total-asset-container">
    <div class="asset-header">
      <span class="asset-label">{{ t('totalAsset') }}</span>
    </div>
    <div class="asset-value">
      <span class="currency">¥</span>
      <span class="amount font-numeric">{{ formatCurrency(totalAmount) }}</span>
    </div>
    <div class="asset-change">
      <span class="change-value positive">+0.00%</span>
      <span class="change-period">this month</span>
    </div>
  </div>
</template>

<style scoped>
.total-asset-container {
  background: var(--total-asset-bg);
  background-image: var(--total-asset-overlay);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 16px 20px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
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

.asset-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.asset-label {
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.asset-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.asset-value .currency {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-secondary);
}

.asset-value .amount {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.asset-change {
  display: flex;
  align-items: center;
  gap: 8px;
}

.change-value {
  font-size: 13px;
  font-weight: 500;
}

.change-value.positive {
  color: var(--accent-green);
}

.change-value.negative {
  color: var(--accent-red);
}

.change-period {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
