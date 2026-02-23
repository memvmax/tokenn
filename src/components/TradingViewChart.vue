<template>
  <div class="tradingview-widget-container" ref="containerRef">
    <div class="tradingview-widget-container__widget"></div>
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
let widgetScript = null;

const loadWidget = () => {
  if (!containerRef.value) return;
  
  const existingWidget = containerRef.value.querySelector('.tradingview-widget-container__widget');
  if (existingWidget) {
    existingWidget.innerHTML = '';
  }
  
  if (widgetScript) {
    widgetScript.remove();
  }

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
  script.async = true;
  script.innerHTML = JSON.stringify({
    "autosize": true,
    "symbol": props.symbol,
    "interval": props.interval,
    "timezone": "Etc/UTC",
    "theme": props.theme,
    "style": "1",
    "locale": "en",
    "backgroundColor": props.theme === 'dark' ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)",
    "hide_top_toolbar": false,
    "hide_legend": false,
    "allow_symbol_change": true,
    "save_image": false,
    "calendar": false,
    "support_host": "https://www.tradingview.com"
  });
  
  containerRef.value.appendChild(script);
  widgetScript = script;
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
  if (widgetScript) {
    widgetScript.remove();
  }
});
</script>

<style scoped>
.tradingview-widget-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
