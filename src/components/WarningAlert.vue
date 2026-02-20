<template>
  <div v-if="showWarning" class="warning-alert">
    <i class="fas fa-exclamation-triangle"></i>
    <div class="warning-content">
      <span class="warning-title">{{ t('warningIdealRatio') }}</span>
      <span class="warning-detail">{{ t('currentTotal') }}: {{ totalIdealPercentage }}%</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  totalIdealPercentage: {
    type: Number,
    required: true
  },
  t: {
    type: Function,
    required: true
  }
});

const showWarning = computed(() => {
  return props.totalIdealPercentage !== 100;
});
</script>

<style scoped>
.warning-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 152, 0, 0.08);
  border: 1px solid rgba(255, 152, 0, 0.2);
  border-left: 2px solid #ff9800;
  border-radius: 4px;
  padding: 10px 14px;
  margin-bottom: 16px;
}

.warning-alert i {
  color: #ff9800;
  font-size: 14px;
}

.warning-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-title {
  color: #ff9800;
  font-size: 12px;
  font-weight: 500;
}

.warning-detail {
  color: var(--text-muted);
  font-size: 11px;
}
</style>
