<template>
  <div class="tradingview-widget-container" ref="containerRef">
    <div :id="widgetId" class="tradingview-widget-container__widget"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  symbol: {
    type: String,
    default: 'FX:XAUUSD'
  },
  theme: {
    type: String,
    default: 'dark'
  },
  interval: {
    type: String,
    default: 'D'
  }
});

const containerRef = ref(null);
const widgetId = ref('tv_chart_' + Math.random().toString(36).substr(2, 9));

const loadWidget = () => {
  if (!containerRef.value) return;
  
  const widgetDiv = document.getElementById(widgetId.value);
  if (!widgetDiv) return;
  
  widgetDiv.innerHTML = '';
  
  if (typeof TradingView === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.onload = () => createWidget();
    document.head.appendChild(script);
  } else {
    createWidget();
  }
};

const createWidget = () => {
  const widgetDiv = document.getElementById(widgetId.value);
  if (!widgetDiv || typeof TradingView === 'undefined') return;
  
  new TradingView.widget({
    width: '100%',
    height: '100%',
    symbol: props.symbol,
    interval: props.interval,
    timezone: 'Etc/UTC',
    theme: props.theme,
    style: '1',
    locale: 'en',
    backgroundColor: props.theme === 'dark' ? '#1e222d' : '#f1f3f6',
    hide_top_toolbar: false,
    hide_legend: false,
    allow_symbol_change: true,
    save_image: false,
    container_id: widgetId.value,
    hide_side_toolbar: false,
    toolbar_bg: props.theme === 'dark' ? '#1e222d' : '#f1f3f6'
  });
};

onMounted(() => {
  loadWidget();
});

watch(() => props.symbol, () => {
  loadWidget();
});

watch(() => props.theme, () => {
  loadWidget();
});

onBeforeUnmount(() => {
});
</script>

<style scoped>
.tradingview-widget-container {
  width: 100%;
  aspect-ratio: 2 / 1;
  min-height: 200px;
}

.tradingview-widget-container__widget {
  width: 100%;
  height: 100%;
}
</style>
