<template>
  <div class="penguin-section">
    <div class="penguin-header">
      <div class="penguin-title">
        <i class="fas fa-penguin"></i>
        <span>PENGUIN FEED</span>
      </div>
      <div class="header-actions">
        <button class="add-link-btn" @click="showAddModal = true">
          <i class="fas fa-plus"></i>
        </button>
        <button class="refresh-btn" @click="sortLinks">
          <i class="fas fa-sort-amount-down"></i>
        </button>
      </div>
    </div>

    <div class="penguin-list" v-if="links.length > 0">
      <div 
        v-for="(item, index) in links" 
        :key="item.id" 
        class="penguin-item"
      >
        <div class="penguin-time">
          <span class="time-value">{{ formatDateValue(item.date) }}</span>
          <span class="time-unit">{{ formatDateUnit(item.date) }}</span>
        </div>
        <div class="penguin-content" @click="openLink(item.url)">
          <div class="penguin-headline">{{ item.title }}</div>
          <div class="penguin-source">
            <span class="source-name">{{ item.source }}</span>
            <span v-if="item.author" class="source-author">· {{ item.author }}</span>
          </div>
        </div>
        <div class="penguin-actions">
          <i class="fas fa-external-link-alt link-icon" @click="openLink(item.url)"></i>
          <i class="fas fa-trash-alt delete-icon" @click="deleteLink(item.id)"></i>
        </div>
      </div>
    </div>

    <div class="penguin-empty" v-else>
      <i class="fas fa-link"></i>
      <span>{{ t('noPenguinLinks') || 'No links yet. Click + to add.' }}</span>
    </div>

    <div class="add-modal-overlay" v-if="showAddModal" @click="showAddModal = false">
      <div class="add-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ t('addLink') || 'ADD LINK' }}</h3>
          <button class="modal-close" @click="showAddModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="add-form">
            <div class="form-group">
              <label>TITLE</label>
              <input type="text" v-model="newLink.title" class="form-input" placeholder="Article title...">
            </div>
            <div class="form-group">
              <label>URL</label>
              <input type="text" v-model="newLink.url" class="form-input" placeholder="https://...">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>SOURCE</label>
                <input type="text" v-model="newLink.source" class="form-input" placeholder="Futu">
              </div>
              <div class="form-group">
                <label>AUTHOR</label>
                <input type="text" v-model="newLink.author" class="form-input" placeholder="Username">
              </div>
            </div>
            <div class="form-group">
              <label>DATE</label>
              <input type="date" v-model="newLink.date" class="form-input">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showAddModal = false">{{ t('cancel') }}</button>
          <button class="confirm-btn" @click="addLink" :disabled="!canAdd">{{ t('confirm') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  t: {
    type: Function,
    required: true
  }
});

const links = ref([]);
const showAddModal = ref(false);
const newLink = ref({
  title: '',
  url: '',
  source: 'Futu',
  author: '',
  date: new Date().toISOString().split('T')[0]
});

const canAdd = computed(() => {
  return newLink.value.title.trim() && newLink.value.url.trim();
});

const formatDateValue = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 86400) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return days;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDateUnit = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 86400) return props.t('today') || 'Today';
  if (diff < 604800) return props.t('daysAgo') || 'days ago';
  return '';
};

const openLink = (url) => {
  if (url) {
    window.open(url, '_blank');
  }
};

const addLink = () => {
  if (!canAdd.value) return;

  links.value.unshift({
    id: Date.now(),
    title: newLink.value.title.trim(),
    url: newLink.value.url.trim(),
    source: newLink.value.source.trim() || 'Futu',
    author: newLink.value.author.trim(),
    date: newLink.value.date
  });

  saveData();
  
  newLink.value = {
    title: '',
    url: '',
    source: 'Futu',
    author: '',
    date: new Date().toISOString().split('T')[0]
  };
  
  showAddModal.value = false;
};

const deleteLink = (id) => {
  links.value = links.value.filter(l => l.id !== id);
  saveData();
};

const sortLinks = () => {
  links.value.sort((a, b) => new Date(b.date) - new Date(a.date));
  saveData();
};

const saveData = () => {
  try {
    localStorage.setItem('penguinLinks', JSON.stringify(links.value));
  } catch (error) {
    console.error('Save failed:', error);
  }
};

const loadData = () => {
  try {
    const saved = localStorage.getItem('penguinLinks');
    if (saved) {
      links.value = JSON.parse(saved);
    }
  } catch (error) {
    console.error('Load failed:', error);
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.penguin-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 16px;
}

.penguin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.penguin-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  line-height: 1;
  padding-top: 7px;
}

.penguin-title i {
  color: #f7931a;
  font-size: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.add-link-btn,
.refresh-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-link-btn:hover,
.refresh-btn:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.penguin-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.penguin-list::-webkit-scrollbar {
  width: 4px;
}

.penguin-list::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 2px;
}

.penguin-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.penguin-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.penguin-item:hover {
  border-color: var(--border-color);
  background: var(--bg-hover);
}

.penguin-time {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 10px;
  color: var(--text-muted);
  min-width: 50px;
  padding-top: 2px;
}

.time-value {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.time-unit {
  font-size: 9px;
  color: var(--text-muted);
}

.penguin-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.penguin-headline {
  font-size: 12px;
  color: var(--text-primary);
  line-height: 1.4;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.penguin-content:hover .penguin-headline {
  color: #0891b2;
}

.penguin-source {
  font-size: 10px;
  color: var(--text-muted);
}

.source-author {
  color: var(--text-secondary);
}

.penguin-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 2px;
}

.link-icon,
.delete-icon {
  font-size: 10px;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s ease;
}

.penguin-item:hover .link-icon,
.penguin-item:hover .delete-icon {
  opacity: 1;
}

.link-icon:hover {
  color: #0891b2;
}

.delete-icon:hover {
  color: var(--accent-red);
}

.penguin-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-muted);
  gap: 8px;
}

.penguin-empty i {
  font-size: 24px;
  opacity: 0.5;
}

.penguin-empty span {
  font-size: 12px;
}

.add-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.add-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
}

.add-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.add-modal .modal-header h3 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 0.5px;
}

.modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.15s ease;
}

.modal-close:hover {
  color: var(--text-primary);
}

.add-modal .modal-body {
  padding: 20px;
  overflow-y: auto;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 600;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
}

.form-input {
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
}

.form-input:focus {
  outline: none;
  border-color: #0891b2;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-light);
}

.cancel-btn {
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cancel-btn:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.confirm-btn {
  padding: 8px 16px;
  background: #0891b2;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.confirm-btn:hover:not(:disabled) {
  background: #0e7490;
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
