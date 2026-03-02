<template>
  <div class="pixel-agent-view">
    <div class="agent-header">
      <div class="header-left">
        <span class="agent-title">🤖 Pixel Agent</span>
        <span class="agent-date">{{ currentDate }}</span>
      </div>
      <div class="header-right">
        <span class="status-badge" :class="agentStatus">{{ statusText }}</span>
      </div>
    </div>

    <div class="agent-main">
      <div class="agent-left">
        <div class="character-section">
          <PixelCharacter 
            ref="characterRef"
            :state="characterState"
            width="80"
            height="80"
          />
          <div class="character-mood">{{ moodEmoji }}</div>
        </div>
        
        <div class="quick-stats">
          <div class="stat-item">
            <span class="stat-icon">✅</span>
            <span class="stat-value">{{ completedTasks }}/{{ totalTasks }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">⏱️</span>
            <span class="stat-value">{{ focusTime }}min</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🔥</span>
            <span class="stat-value">{{ streak }}天</span>
          </div>
        </div>
      </div>

      <div class="agent-right">
        <div class="chat-section">
          <div class="chat-messages" ref="chatRef">
            <div 
              v-for="(msg, idx) in messages" 
              :key="idx"
              class="chat-message"
              :class="msg.role"
            >
              <div class="message-content">{{ msg.content }}</div>
            </div>
          </div>
          
          <div class="chat-input-area">
            <input 
              v-model="userInput"
              @keyup.enter="sendMessage"
              placeholder="Ask agent..."
              class="chat-input"
            />
            <button class="send-btn" @click="sendMessage">
              <span>➤</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="agent-bottom">
      <div class="tracker-section">
        <div class="tracker-header">
          <span class="tracker-title">📋 今日追踪</span>
          <button class="add-track-btn" @click="showAddTracker = true">+</button>
        </div>
        <div class="tracker-items">
          <div 
            v-for="track in dailyTracks" 
            :key="track.id"
            class="tracker-item"
            :class="{ done: track.done }"
            @click="toggleTrack(track.id)"
          >
            <span class="track-icon">{{ track.icon }}</span>
            <span class="track-name">{{ track.name }}</span>
            <span class="track-check">{{ track.done ? '✓' : '' }}</span>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <button class="action-btn" @click="quickAction('work')">
          <span class="action-icon">💼</span>
          <span class="action-text">工作</span>
        </button>
        <button class="action-btn" @click="quickAction('break')">
          <span class="action-icon">☕</span>
          <span class="action-text">休息</span>
        </button>
        <button class="action-btn" @click="quickAction('exercise')">
          <span class="action-icon">🏃</span>
          <span class="action-text">运动</span>
        </button>
        <button class="action-btn" @click="quickAction('read')">
          <span class="action-icon">📖</span>
          <span class="action-text">阅读</span>
        </button>
      </div>
    </div>

    <div class="add-tracker-modal" v-if="showAddTracker" @click.self="showAddTracker = false">
      <div class="modal-content">
        <h3>添加追踪项</h3>
        <input v-model="newTrackName" placeholder="输入名称" class="modal-input" />
        <div class="icon-picker">
          <span 
            v-for="icon in iconOptions" 
            :key="icon"
            class="icon-option"
            :class="{ selected: newTrackIcon === icon }"
            @click="newTrackIcon = icon"
          >{{ icon }}</span>
        </div>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showAddTracker = false">取消</button>
          <button class="modal-btn confirm" @click="addTracker">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import PixelCharacter from './PixelCharacter.vue'

const characterRef = ref(null)
const chatRef = ref(null)
const characterState = ref('idle')
const agentStatus = ref('ready')
const userInput = ref('')
const showAddTracker = ref(false)
const newTrackName = ref('')
const newTrackIcon = ref('📌')

const iconOptions = ['📌', '💧', '🥗', '😴', '💊', '🧘', '📝', '🎯', '💪', '🧹']

const messages = ref([
  { role: 'agent', content: '你好！我是你的 Pixel Agent，有什么可以帮助你的吗？' }
])

const dailyTracks = ref([
  { id: 1, name: '喝水 8 杯', icon: '💧', done: false },
  { id: 2, name: '运动 30 分钟', icon: '🏃', done: true },
  { id: 3, name: '阅读 20 页', icon: '📖', done: false },
  { id: 4, name: '早睡早起', icon: '😴', done: false }
])

const tasks = ref([
  { id: 1, text: '完成项目报告', completed: true },
  { id: 2, text: '回复邮件', completed: false },
  { id: 3, text: '学习新技能', completed: false }
])

const focusTime = ref(45)
const streak = ref(7)

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })
})

const statusText = computed(() => {
  const statusMap = {
    ready: '待命',
    working: '工作中',
    thinking: '思考中'
  }
  return statusMap[agentStatus.value] || '待命'
})

const moodEmoji = computed(() => {
  const rate = completedTasks.value / totalTasks.value
  if (rate >= 0.8) return '😊'
  if (rate >= 0.5) return '😐'
  return '😴'
})

const completedTasks = computed(() => tasks.value.filter(t => t.completed).length)
const totalTasks = computed(() => tasks.value.length)

const sendMessage = async () => {
  if (!userInput.value.trim()) return
  
  const input = userInput.value.trim()
  messages.value.push({ role: 'user', content: input })
  userInput.value = ''
  
  agentStatus.value = 'thinking'
  characterState.value = 'type'
  
  await nextTick()
  scrollToBottom()
  
  setTimeout(() => {
    const response = generateResponse(input)
    messages.value.push({ role: 'agent', content: response })
    agentStatus.value = 'ready'
    characterState.value = 'idle'
    characterRef.value?.speak(response.slice(0, 20) + '...')
    scrollToBottom()
  }, 1000)
}

const generateResponse = (input) => {
  const lowerInput = input.toLowerCase()
  
  if (lowerInput.includes('股票') || lowerInput.includes('股价')) {
    return '我可以帮你查询股票信息。请在 Invest 页面查看实时数据，或告诉我具体股票代码。'
  }
  if (lowerInput.includes('资产') || lowerInput.includes('钱包')) {
    return `你今天完成了 ${completedTasks.value}/${totalTasks.value} 个任务，继续保持！`
  }
  if (lowerInput.includes('提醒') || lowerInput.includes('记得')) {
    return '好的，我会帮你记住的！你可以在追踪列表中添加新的习惯。'
  }
  if (lowerInput.includes('谢谢') || lowerInput.includes('感谢')) {
    return '不客气！能帮到你我很开心 🌟'
  }
  
  const responses = [
    '收到！我正在处理你的请求...',
    '好的，让我想想怎么帮你...',
    '这个想法不错！我们可以一起规划一下。',
    '我明白了，有什么具体需要我帮忙的吗？'
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

const scrollToBottom = () => {
  if (chatRef.value) {
    chatRef.value.scrollTop = chatRef.value.scrollHeight
  }
}

const toggleTrack = (id) => {
  const track = dailyTracks.value.find(t => t.id === id)
  if (track) {
    track.done = !track.done
    if (track.done) {
      characterRef.value?.speak(`太棒了！完成「${track.name}」！`)
    }
  }
}

const addTracker = () => {
  if (!newTrackName.value.trim()) return
  dailyTracks.value.push({
    id: Date.now(),
    name: newTrackName.value.trim(),
    icon: newTrackIcon.value,
    done: false
  })
  newTrackName.value = ''
  newTrackIcon.value = '📌'
  showAddTracker.value = false
}

const quickAction = (action) => {
  const actions = {
    work: { state: 'type', msg: '开始工作模式！专注时间开始计时 ⏱️' },
    break: { state: 'idle', msg: '休息一下吧，喝杯水放松一下 ☕' },
    exercise: { state: 'walk', msg: '运动时间到！活动一下身体 🏃' },
    read: { state: 'idle', msg: '阅读模式开启，享受知识的乐趣 📖' }
  }
  
  const config = actions[action]
  if (config) {
    characterState.value = config.state
    messages.value.push({ role: 'agent', content: config.msg })
    characterRef.value?.speak(config.msg.slice(0, 15))
    scrollToBottom()
    
    if (action === 'work') {
      focusTime.value += 25
    }
  }
}

onMounted(() => {
  setTimeout(() => {
    characterRef.value?.speak('你好！')
  }, 500)
})
</script>

<style scoped>
.pixel-agent-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-title {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.agent-date {
  font-size: 12px;
  color: #aaa;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.ready {
  background: #4caf50;
  color: #fff;
}

.status-badge.working {
  background: #2196f3;
  color: #fff;
}

.status-badge.thinking {
  background: #ff9800;
  color: #fff;
}

.agent-main {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.agent-left {
  width: 120px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.character-section {
  background: rgba(135, 206, 235, 0.3);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.character-mood {
  font-size: 20px;
  margin-top: 4px;
}

.quick-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.1);
  padding: 6px 10px;
  border-radius: 6px;
}

.stat-icon {
  font-size: 14px;
}

.stat-value {
  font-size: 12px;
  color: #fff;
  font-weight: 500;
}

.agent-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255,255,255,0.95);
  border-radius: 12px;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-message {
  max-width: 85%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.4;
}

.chat-message.agent {
  background: #e3f2fd;
  color: #1565c0;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}

.chat-message.user {
  background: #4a9eff;
  color: #fff;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

.chat-input-area {
  display: flex;
  padding: 8px;
  gap: 8px;
  border-top: 1px solid #eee;
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #ddd;
  border-radius: 20px;
  font-size: 13px;
  outline: none;
}

.chat-input:focus {
  border-color: #4a9eff;
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #4a9eff;
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.agent-bottom {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.tracker-section {
  flex: 1;
  background: rgba(255,255,255,0.95);
  border-radius: 12px;
  padding: 12px;
}

.tracker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.tracker-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.add-track-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: #4a9eff;
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.tracker-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tracker-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: #f5f5f5;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tracker-item.done {
  background: #c8e6c9;
  text-decoration: line-through;
  opacity: 0.7;
}

.track-icon {
  font-size: 14px;
}

.track-name {
  color: #333;
}

.track-check {
  color: #4caf50;
  font-weight: bold;
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.15);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255,255,255,0.25);
}

.action-icon {
  font-size: 20px;
}

.action-text {
  font-size: 10px;
  color: #fff;
}

.add-tracker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: #fff;
  padding: 20px;
  border-radius: 16px;
  width: 280px;
}

.modal-content h3 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #333;
}

.modal-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.icon-option {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
}

.icon-option.selected {
  background: #4a9eff;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.modal-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.modal-btn.confirm {
  background: #4a9eff;
  color: #fff;
}

@media (max-width: 600px) {
  .agent-main {
    flex-direction: column;
  }
  
  .agent-left {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }
  
  .character-section {
    flex-direction: row;
    gap: 12px;
  }
  
  .agent-bottom {
    flex-direction: column;
  }
  
  .quick-actions {
    justify-content: center;
  }
}
</style>
