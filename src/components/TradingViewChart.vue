<template>
  <div class="tradingview-widget-container" ref="containerRef">
    <div :id="widgetId" class="tradingview-widget-container__widget"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

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
const widgetId = ref('tv_' + Math.random().toString(36).substr(2, 9));
let widgetInstance = null;

const loadWidget = async () => {
  await nextTick();
  
  if (!containerRef.value) return;
  
  const widgetDiv = containerRef.value.querySelector('.tradingview-widget-container__widget');
  if (!widgetDiv) return;
  
  widgetDiv.innerHTML = '';
  
  if (typeof TradingView === 'undefined') {
    await new Promise((resolve) => {
      const existingScript = document.querySelector('script[src*="tradingview"]');
      if (existingScript) {
        existingScript.onload = resolve;
      } else {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.onload = resolve;
        document.head.appendChild(script);
      }
    });
  }
  
  if (typeof TradingView !== 'undefined' && TradingView.widget) {
    widgetInstance = new TradingView.widget({
      width: '100%',
      height: '100%',
      symbol: props.symbol,
      interval: props.interval,
      timezone: 'Etc/UTC',
      theme: props.theme,
      style: '1',
      locale: 'en',
      backgroundColor: props.theme === 'dark' ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: false,
      container_id: widgetId.value,
      hide_side_toolbar: false,
      toolbar_bg: props.theme === 'dark' ? '#1e222d' : '#f1f3f6'
    });
  }
};

onMounted(() => {
  loadWidget();
});

watch(() => props.symbol, () => {
  if (widgetInstance) {
    widgetInstance.chart().setSymbol(props.symbol);
  } else {
    loadWidget();
  }
});

watch(() => props.theme, () => {
  loadWidget();
});

onBeforeUnmount(() => {
  widgetInstance = null;
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
