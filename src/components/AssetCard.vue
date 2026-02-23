<template>
  <div 
    class="asset-tile" 
    :class="{ 'is-selected': selected }"
    @click="handleSelect"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="tile-indicator" :style="indicatorStyle"></div>
    <div class="tile-header">
      <div class="tile-icon" :style="{ backgroundColor: asset.color + '15', color: asset.color }">
        <i :class="['fas', asset.icon]"></i>
      </div>
      <div class="tile-name">{{ t(asset.nameKey) }}</div>
    </div>
    
    <div class="tile-amount">
      <span class="currency">{{ t('currency') }}</span>
      <span class="value font-numeric">{{ formatAmount(asset.amount) }}</span>
    </div>
    
    <div class="tile-percentages">
      <div class="percentage-row">
        <span class="label">{{ t('currentRatio') }}</span>
        <span class="value font-numeric" :style="{ color: asset.color }">{{ currentPercentage }}%</span>
      </div>
      <div class="percentage-bar">
        <div 
          class="bar-fill" 
          :style="{ width: currentPercentage + '%', backgroundColor: asset.color }"
        ></div>
      </div>
      
      <div class="percentage-row" v-if="asset.idealPercentage > 0">
        <span class="label">{{ t('idealRatio') }}</span>
        <span class="value font-numeric">{{ asset.idealPercentage }}%</span>
      </div>
      <div class="percentage-bar ideal" v-if="asset.idealPercentage > 0">
        <div 
          class="bar-fill" 
          :style="{ width: asset.idealPercentage + '%', backgroundColor: getIdealBarColor() }"
        ></div>
      </div>
    </div>
    
    <div class="tile-status" v-if="showPercentageDiff && asset.idealPercentage > 0">
      <div class="status-badge" :class="statusClass">
        <i :class="statusIcon"></i>
        <span class="font-numeric">{{ Math.abs(percentageDiff).toFixed(1) }}%</span>
      </div>
      <span class="status-text">{{ percentageDiff >= 0 ? t('aboveTarget') : t('belowTarget') }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  asset: {
    type: Object,
    required: true
  },
  totalAsset: {
    type: Number,
    required: true
  },
  t: {
    type: Function,
    required: true
  },
  formatAmount: {
    type: Function,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select']);

const isHovered = ref(false);

const currentPercentage = computed(() => {
  if (props.totalAsset === 0) return 0;
  return ((Number(props.asset.amount) || 0) / props.totalAsset * 100).toFixed(1);
});

const percentageDiff = computed(() => {
  return Number(currentPercentage.value) - Number(props.asset.idealPercentage || 0);
});

const showPercentageDiff = computed(() => {
  return props.asset.idealPercentage > 0;
});

const indicatorStyle = computed(() => {
  if (props.selected) {
    return { backgroundColor: props.asset.color }
  }
  if (isHovered.value) {
    return { backgroundColor: 'var(--border-color)' }
  }
  return { backgroundColor: 'transparent' }
});

const statusClass = computed(() => {
  if (percentageDiff.value >= 0) return 'status-positive';
  return 'status-negative';
});

const statusIcon = computed(() => {
  return percentageDiff.value >= 0 ? 'fas fa-caret-up' : 'fas fa-caret-down';
});

const getIdealBarColor = () => {
  return '#d1d4dc';
};

const handleSelect = () => {
  emit('select', props.asset.id);
};
</script>

<style scoped>
.asset-tile {
  position: relative;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 14px;
  padding-left: 16px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.asset-tile:hover {
  border-color: var(--border-color);
  background: var(--bg-tertiary);
}

.asset-tile.is-selected {
  border-color: var(--border-color);
}

.tile-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 4px 0 0 4px;
  transition: background-color 0.15s ease;
}

.tile-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.tile-icon {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.tile-name {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.tile-amount {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-bottom: 14px;
}

.tile-amount .currency {
  font-size: 11px;
  color: var(--text-secondary);
}

.tile-amount .value {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
}

.tile-percentages {
  margin-bottom: 10px;
}

.percentage-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
}

.percentage-row .label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 500;
}

.percentage-row .value {
  font-size: 12px;
  font-weight: 500;
}

.percentage-bar {
  height: 3px;
  background: var(--bg-tertiary);
  border-radius: 1px;
  overflow: hidden;
  margin-bottom: 6px;
}

.percentage-bar.ideal {
  margin-bottom: 0;
}

.bar-fill {
  height: 100%;
  border-radius: 1px;
  transition: width 0.2s ease;
}

.tile-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--border-light);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
}

.status-positive {
  background: rgba(38, 166, 154, 0.12);
  color: var(--accent-green);
}

.status-negative {
  background: rgba(239, 83, 80, 0.12);
  color: var(--accent-red);
}

.status-text {
  font-size: 10px;
  color: var(--text-muted);
}
</style>
