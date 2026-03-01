<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  t: {
    type: Function,
    required: true
  }
})

const activeTab = ref('notes')

const notesData = ref([])

const articlesData = ref([])

const searchQuery = ref('')
const showAddModal = ref(false)
const editingItem = ref(null)

const filteredNotes = computed(() => {
  return notesData.value.filter(item => {
    return !searchQuery.value || 
      item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.stockCode && item.stockCode.toLowerCase().includes(searchQuery.value.toLowerCase()))
  })
})

const filteredArticles = computed(() => {
  return articlesData.value.filter(item => {
    return !searchQuery.value || 
      item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.value.toLowerCase())
  })
})

const newItem = ref({
  title: '',
  content: '',
  stockCode: '',
  url: '',
  source: ''
})

const addItem = () => {
  editingItem.value = null
  newItem.value = {
    title: '',
    content: '',
    stockCode: '',
    url: '',
    source: ''
  }
  showAddModal.value = true
}

const editItem = (item) => {
  editingItem.value = item
  newItem.value = { ...item }
  showAddModal.value = true
}

const saveItem = () => {
  if (!newItem.value.title.trim()) return
  
  if (activeTab.value === 'notes') {
    if (editingItem.value) {
      const index = notesData.value.findIndex(n => n.id === editingItem.value.id)
      if (index > -1) {
        notesData.value[index] = { ...editingItem.value, ...newItem.value }
      }
    } else {
      notesData.value.unshift({
        id: Date.now(),
        ...newItem.value,
        createdAt: new Date().toLocaleString('zh-CN')
      })
    }
  } else {
    if (editingItem.value) {
      const index = articlesData.value.findIndex(n => n.id === editingItem.value.id)
      if (index > -1) {
        articlesData.value[index] = { ...editingItem.value, ...newItem.value }
      }
    } else {
      articlesData.value.unshift({
        id: Date.now(),
        ...newItem.value,
        savedAt: new Date().toLocaleDateString('zh-CN')
      })
    }
  }
  
  showAddModal.value = false
  editingItem.value = null
}

const deleteItem = (id) => {
  if (activeTab.value === 'notes') {
    notesData.value = notesData.value.filter(n => n.id !== id)
  } else {
    articlesData.value = articlesData.value.filter(n => n.id !== id)
  }
}

const openArticle = (url) => {
  window.open(url, '_blank')
}

const labels = {
  notes: { 'zh-CN': '个人记录', 'en-US': 'MY NOTES' },
  articles: { 'zh-CN': '好文章', 'en-US': 'ARTICLES' },
  addNote: { 'zh-CN': '添加笔记', 'en-US': 'ADD NOTE' },
  addArticle: { 'zh-CN': '添加文章', 'en-US': 'ADD ARTICLE' },
  searchPlaceholder: { 'zh-CN': '搜索...', 'en-US': 'Search...' },
  title: { 'zh-CN': '标题', 'en-US': 'TITLE' },
  content: { 'zh-CN': '内容', 'en-US': 'CONTENT' },
  stockCode: { 'zh-CN': '关联股票', 'en-US': 'STOCK' },
  stockCodePlaceholder: { 'zh-CN': '可选，如 600519', 'en-US': 'Optional' },
  url: { 'zh-CN': '链接', 'en-US': 'URL' },
  source: { 'zh-CN': '来源', 'en-US': 'SOURCE' },
  save: { 'zh-CN': '保存', 'en-US': 'SAVE' },
  cancel: { 'zh-CN': '取消', 'en-US': 'CANCEL' },
  edit: { 'zh-CN': '编辑', 'en-US': 'EDIT' },
  delete: { 'zh-CN': '删除', 'en-US': 'DELETE' },
  noData: { 'zh-CN': '暂无数据', 'en-US': 'No data' },
  open: { 'zh-CN': '打开', 'en-US': 'OPEN' },
  savedAt: { 'zh-CN': '保存日期', 'en-US': 'DATE' },
}

const getLabel = (key) => {
  const locale = localStorage.getItem('locale') || 'zh-CN'
  return labels[key]?.[locale] || key
}
</script>

<template>
  <div class="notes-container">
    <div class="notes-tabs">
      <button 
        class="tab-btn" 
        :class="{ 'active': activeTab === 'notes' }"
        @click="activeTab = 'notes'"
      >
        <i class="fas fa-sticky-note"></i>
        <span>{{ getLabel('notes') }}</span>
      </button>
      <button 
        class="tab-btn" 
        :class="{ 'active': activeTab === 'articles' }"
        @click="activeTab = 'articles'"
      >
        <i class="fas fa-bookmark"></i>
        <span>{{ getLabel('articles') }}</span>
      </button>

      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          class="search-input" 
          :placeholder="getLabel('searchPlaceholder')"
          v-model="searchQuery"
        >
      </div>

      <button class="add-btn" @click="addItem">
        <i class="fas fa-plus"></i>
        <span>{{ activeTab === 'notes' ? getLabel('addNote') : getLabel('addArticle') }}</span>
      </button>
    </div>

    <div class="notes-content">
      <div v-if="activeTab === 'notes'" class="notes-section">
        <div v-if="filteredNotes.length === 0" class="empty-state">
          <i class="fas fa-sticky-note"></i>
          <p>{{ getLabel('noData') }}</p>
        </div>
        
        <div v-for="item in filteredNotes" :key="item.id" class="note-card">
          <div class="note-header">
            <h3 class="note-title">{{ item.title }}</h3>
            <div class="note-actions">
              <button class="action-btn" @click="editItem(item)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn delete" @click="deleteItem(item.id)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <p class="note-content">{{ item.content }}</p>
          <div class="note-footer">
            <div class="note-meta">
              <span v-if="item.stockCode" class="stock-code">{{ item.stockCode }}</span>
              <span class="note-time">{{ item.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'articles'" class="articles-section">
        <div v-if="filteredArticles.length === 0" class="empty-state">
          <i class="fas fa-bookmark"></i>
          <p>{{ getLabel('noData') }}</p>
        </div>
        
        <div class="articles-table">
          <div class="table-header">
            <div class="th col-title">{{ getLabel('title') }}</div>
            <div class="th col-actions"></div>
            <div class="th col-source">{{ getLabel('source') }}</div>
            <div class="th col-date">{{ getLabel('savedAt') }}</div>
          </div>
          <div class="table-body">
            <div v-for="item in filteredArticles" :key="item.id" class="table-row" @click="openArticle(item.url)">
              <div class="td col-title">{{ item.title }}</div>
              <div class="td col-actions" @click.stop>
                <button class="action-btn" @click="editItem(item)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" @click="deleteItem(item.id)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
              <div class="td col-source">{{ item.source }}</div>
              <div class="td col-date">{{ item.savedAt }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <span class="modal-title">{{ editingItem ? getLabel('edit') : (activeTab === 'notes' ? getLabel('addNote') : getLabel('addArticle')) }}</span>
            <button class="modal-close" @click="showAddModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">{{ getLabel('title') }}</label>
              <input type="text" class="form-input" v-model="newItem.title">
            </div>
            
            <div v-if="activeTab === 'notes'" class="form-group">
              <label class="form-label">{{ getLabel('content') }}</label>
              <textarea class="form-textarea" v-model="newItem.content" rows="4"></textarea>
            </div>

            <div v-if="activeTab === 'articles'" class="form-row">
              <div class="form-group half">
                <label class="form-label">{{ getLabel('url') }}</label>
                <input type="text" class="form-input" v-model="newItem.url" placeholder="https://...">
              </div>
              <div class="form-group half">
                <label class="form-label">{{ getLabel('source') }}</label>
                <input type="text" class="form-input" v-model="newItem.source">
              </div>
            </div>

            <div v-if="activeTab === 'notes'" class="form-group">
              <label class="form-label">{{ getLabel('stockCode') }}</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="newItem.stockCode"
                :placeholder="getLabel('stockCodePlaceholder')"
              >
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showAddModal = false">{{ getLabel('cancel') }}</button>
            <button class="btn-confirm" @click="saveItem">{{ getLabel('save') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.notes-container {
  margin-top: 16px;
}

.notes-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.tab-btn.active {
  background: rgba(8, 145, 178, 0.15);
  border-color: #0891b2;
  color: #0891b2;
}

.tab-btn i {
  font-size: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  flex: 1;
  min-width: 150px;
  max-width: 200px;
}

.search-box i {
  color: var(--text-muted);
  font-size: 12px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.add-btn {
  height: 36px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  background: #0891b2;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-btn:hover {
  background: #0e7490;
}

.notes-content {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-state i {
  font-size: 48px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.empty-state p {
  color: var(--text-muted);
  font-size: 14px;
}

.note-card {
  padding: 16px;
  border-bottom: 1px solid var(--border-light);
  transition: background 0.15s ease;
}

.note-card:last-child {
  border-bottom: none;
}

.note-card:hover {
  background: var(--bg-hover);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.note-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.note-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
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
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.action-btn.delete:hover {
  color: var(--accent-red);
}

.note-content {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 12px;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.note-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  font-size: 10px;
  color: var(--text-muted);
}

.note-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stock-code {
  font-size: 11px;
  font-weight: 600;
  color: #0891b2;
}

.note-time {
  font-size: 11px;
  color: var(--text-muted);
}

.articles-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 90px 90px 90px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-light);
}

.th {
  padding: 10px 12px;
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  min-height: 38px;
  box-sizing: border-box;
}

.th.col-title,
.th.col-actions,
.th.col-source,
.th.col-date {
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
}

.th.col-source,
.th.col-tags,
.th.col-date {
  justify-content: flex-end;
}

.table-body {
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 90px 90px 90px;
  border-bottom: 1px solid var(--border-light);
  transition: background 0.15s ease;
  cursor: pointer;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: var(--bg-hover);
}

.td {
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  box-sizing: border-box;
}

.col-title {
  font-weight: 500;
  justify-content: flex-start;
}

.col-title:hover {
  color: #0891b2;
}

.col-source,
.col-tags,
.col-date {
  justify-content: flex-end;
  font-size: 12px;
}

.col-source {
  color: var(--text-secondary);
}

.col-tags {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.col-date {
  color: var(--text-muted);
}

.col-actions {
  justify-content: center;
  gap: 4px;
}

.modal-overlay {
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

.modal-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
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
  transition: all 0.15s ease;
}

.modal-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group.half {
  flex: 1;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #0891b2;
}

.form-input::placeholder {
  color: var(--text-muted);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-select-btn {
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tag-select-btn:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.tag-select-btn.active {
  background: rgba(8, 145, 178, 0.15);
  border-color: #0891b2;
  color: #0891b2;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-light);
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-confirm {
  background: #0891b2;
  border: none;
  color: white;
}

.btn-confirm:hover {
  background: #0e7490;
}

@media (max-width: 768px) {
  .notes-tabs {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    justify-content: center;
  }
  
  .tab-btn span {
    display: none;
  }
  
  .search-box {
    order: 3;
    flex: 1;
    min-width: 120px;
  }
  
  .add-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    justify-content: center;
    margin-left: auto;
  }
  
  .add-btn span {
    display: none;
  }
}
</style>
