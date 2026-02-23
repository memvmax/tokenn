<template>
  <div class="total-asset-container">
    <div class="asset-header">
      <div class="asset-info">
        <div class="asset-label">
          <span>{{ t('totalAsset') }}</span>
        </div>
        <div class="asset-amount">
          <span class="currency">{{ t('currency') }}</span>
          <span class="value font-numeric">{{ formatCurrency(totalAsset) }}</span>
        </div>
      </div>
    </div>
    
    <div class="allocation-bar">
      <div 
        v-for="asset in assets" 
        :key="asset.id"
        class="allocation-segment"
        :style="{ 
          width: getPercentage(asset.amount) + '%',
          backgroundColor: asset.color 
        }"
        :title="`${t(asset.nameKey)}: ${getPercentage(asset.amount)}%`"
      ></div>
    </div>
    
    <div class="allocation-legend">
      <div 
        v-for="asset in assets" 
        :key="asset.id"
        class="legend-item"
      >
        <span class="legend-dot" :style="{ backgroundColor: asset.color }"></span>
        <span class="legend-name">{{ t(asset.nameKey) }}</span>
        <span class="legend-value font-numeric">{{ getPercentage(asset.amount) }}%</span>
      </div>
    </div>
  </div>
</template>

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
});

const totalAsset = computed(() => {
  return props.assets.reduce((sum, asset) => {
    return sum + (Number(asset.amount) || 0);
  }, 0);
});

const getPercentage = (amount) => {
  if (totalAsset.value === 0) return 0;
  return ((Number(amount) || 0) / totalAsset.value * 100).toFixed(1);
};
</script>

<style scoped>
.total-asset-container {
  background: 
    linear-gradient(135deg, rgba(0, 20, 40, 0.85) 0%, rgba(10, 25, 47, 0.9) 100%),
    url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80') center/cover no-repeat;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 16px 20px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}

.total-asset-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(0, 255, 136, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 80% 20%, rgba(0, 191, 255, 0.08) 0%, transparent 40%),
    linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
  pointer-events: none;
}

.total-asset-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.5), transparent);
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
  margin-bottom: 6px;
}

.asset-amount {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.asset-amount .currency {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 400;
}

.asset-amount .value {
  font-size: 28px;
  color: var(--text-primary);
  font-weight: 500;
}

.settings-wrapper {
  position: relative;
}

.allocation-bar {
  display: flex;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
  background: var(--bg-tertiary);
  margin-bottom: 12px;
}

.allocation-segment {
  height: 100%;
  transition: width 0.2s ease;
}

.allocation-segment:first-child {
  border-radius: 2px 0 0 2px;
}

.allocation-segment:last-child {
  border-radius: 0 2px 2px 0;
}

.allocation-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 1px;
}

.legend-name {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.legend-value {
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
}
</style>
