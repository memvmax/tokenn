<template>
  <div class="pixel-character-container">
    <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight"></canvas>
    <div class="speech-bubble" v-if="showBubble">
      <div class="bubble-content">{{ bubbleText }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  width: { type: Number, default: 128 },
  height: { type: Number, default: 128 },
  state: { type: String, default: 'idle' }
});

const emit = defineEmits(['click']);

const canvasRef = ref(null);
const canvasWidth = ref(props.width);
const canvasHeight = ref(props.height);
const showBubble = ref(false);
const bubbleText = ref('');

let animationId = null;
let frameCount = 0;
let characterState = 'idle';
let walkPhase = 0;
let typePhase = 0;
let headBob = 0;

const drawPixelCharacter = (ctx, state, frame) => {
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  
  const scale = 4;
  const centerX = canvasWidth.value / 2;
  const centerY = canvasHeight.value / 2 + 10;
  
  headBob = Math.sin(frame * 0.1) * 2;
  
  if (state === 'walk') {
    walkPhase = (walkPhase + 0.2) % (Math.PI * 2);
  }
  
  if (state === 'type') {
    typePhase = (typePhase + 0.3) % (Math.PI * 2);
  }
  
  ctx.imageSmoothingEnabled = false;
  
  drawPixelBody(ctx, centerX, centerY, scale, state, frame);
};

const drawPixelBody = (ctx, x, y, scale, state, frame) => {
  const colors = {
    skin: '#ffccaa',
    hair: '#4a3728',
    shirt: '#5b9bd5',
    pants: '#4472c4',
    eyes: '#333333',
    outline: '#222222'
  };
  
  const bobOffset = state === 'walk' ? Math.sin(frame * 0.15) * 3 : headBob;
  const yOffset = y - 20 - bobOffset;
  
  drawPixelRect(ctx, x - 12 * scale, yOffset + 4 * scale, 24 * scale, 6 * scale, colors.hair, colors.outline);
  drawPixelRect(ctx, x - 10 * scale, yOffset, 20 * scale, 4 * scale, colors.hair, colors.outline);
  
  drawPixelRect(ctx, x - 10 * scale, yOffset + 4 * scale, 20 * scale, 16 * scale, colors.skin, colors.outline);
  
  const eyeOffset = state === 'type' ? Math.sin(typePhase) * 1 : 0;
  drawPixelRect(ctx, x - 6 * scale + eyeOffset, yOffset + 8 * scale, 3 * scale, 3 * scale, colors.eyes);
  drawPixelRect(ctx, x + 3 * scale + eyeOffset, yOffset + 8 * scale, 3 * scale, 3 * scale, colors.eyes);
  
  drawPixelRect(ctx, x - 12 * scale, yOffset + 20 * scale, 24 * scale, 16 * scale, colors.shirt, colors.outline);
  
  const armOffset = state === 'type' ? Math.sin(typePhase * 2) * 4 : 0;
  drawPixelRect(ctx, x - 16 * scale, yOffset + 22 * scale - armOffset, 4 * scale, 12 * scale, colors.skin, colors.outline);
  drawPixelRect(ctx, x + 12 * scale, yOffset + 22 * scale + armOffset, 4 * scale, 12 * scale, colors.skin, colors.outline);
  
  const leftLegOffset = state === 'walk' ? Math.sin(walkPhase) * 6 : 0;
  const rightLegOffset = state === 'walk' ? Math.sin(walkPhase + Math.PI) * 6 : 0;
  drawPixelRect(ctx, x - 10 * scale, yOffset + 36 * scale - leftLegOffset, 8 * scale, 12 * scale, colors.pants, colors.outline);
  drawPixelRect(ctx, x + 2 * scale, yOffset + 36 * scale - rightLegOffset, 8 * scale, 12 * scale, colors.pants, colors.outline);
};

const drawPixelRect = (ctx, x, y, width, height, fillColor, outlineColor = null) => {
  ctx.fillStyle = fillColor;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height));
  
  if (outlineColor) {
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height));
  }
};

const animate = () => {
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d');
    drawPixelCharacter(ctx, props.state, frameCount);
    frameCount++;
  }
  animationId = requestAnimationFrame(animate);
};

const speak = (text) => {
  bubbleText.value = text;
  showBubble.value = true;
  setTimeout(() => {
    showBubble.value = false;
  }, 3000);
};

defineExpose({ speak });

onMounted(() => {
  animate();
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
</script>

<style scoped>
.pixel-character-container {
  position: relative;
  display: inline-block;
}

.speech-bubble {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border: 4px solid #222;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-family: 'Press Start 2P', cursive, monospace;
  white-space: nowrap;
  z-index: 10;
}

.speech-bubble::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #222;
}

.speech-bubble::before {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #fff;
  z-index: 1;
}

.bubble-content {
  color: #222;
}
</style>
