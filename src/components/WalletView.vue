<template>
  <div class="wallet-container">
    <div class="wallet-tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'profit' }"
        @click="activeTab = 'profit'"
      >
        <i class="fas fa-chart-line"></i>
        <span>PROFIT</span>
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'position' }"
        @click="activeTab = 'position'"
      >
        <i class="fas fa-pie-chart"></i>
        <span>POSITION</span>
      </button>

      <div class="type-selector">
        <button class="type-btn icon-only" @click="toggleTypeDropdown" :class="{ active: showTypeDropdown }">
          <i class="fas fa-filter"></i>
        </button>
        <div class="type-dropdown" v-if="showTypeDropdown" @click.stop>
          <label class="type-option" v-for="tab in tabs" :key="tab.id">
            <input 
              type="checkbox" 
              :checked="activeTabs.includes(tab.id)"
              @change="toggleTab(tab.id)"
            >
            <span class="checkmark"></span>
            <span class="type-name">{{ tab.name }}</span>
          </label>
        </div>
        <div class="dropdown-overlay" v-if="showTypeDropdown" @click="closeTypeDropdown"></div>
      </div>

      <div class="add-selector">
        <button class="action-btn" @click="toggleAddDropdown" :class="{ active: showAddDropdown }">
          <i class="fas fa-plus"></i>
        </button>
        <div class="add-dropdown" v-if="showAddDropdown" @click.stop>
          <button class="add-option" @click="importCSV">
            <i class="fas fa-file-csv"></i>
            <span>IMPORT CSV</span>
          </button>
          <button class="add-option" @click="manualAdd">
            <i class="fas fa-keyboard"></i>
            <span>MANUAL ADD</span>
          </button>
        </div>
        <div class="dropdown-overlay" v-if="showAddDropdown" @click="closeAddDropdown"></div>
      </div>

      <button class="action-btn" @click="toggleHistory" :class="{ active: showHistory }">
        <i class="fas fa-history"></i>
      </button>

      <button class="action-btn refresh-btn" @click="refreshData">
        <i class="fas fa-sync-alt"></i>
      </button>
    </div>

    <div class="wallet-content">
      <div v-if="activeTab === 'profit'">
        <div class="section-header">
          <span class="section-title">ASSET MONITOR</span>
        </div>

        <div class="data-table" v-if="filteredAssets.length > 0">
        <div class="table-header">
          <div class="th col-type sortable" :class="getSortClass('type')" @click="toggleSort('type')">TYPE</div>
          <div class="th col-source">SOURCE</div>
          <div class="th col-price">CURRENT</div>
          <div class="th col-price">BUY</div>
          <div class="th col-unit">UNIT</div>
          <div class="th col-value sortable" :class="getSortClass('value')" @click="toggleSort('value')">VALUE</div>
          <div class="th col-profit sortable" :class="getSortClass('profit')" @click="toggleSort('profit')">PROFIT</div>
          <div class="th col-change sortable" :class="getSortClass('change')" @click="toggleSort('change')">CHANGE</div>
        </div>
        <div class="table-header mobile-header-row">
          <div class="th col-type">
            <span class="header-top">TYPE</span>
            <span class="header-bottom">SOURCE</span>
          </div>
          <div class="th col-value">
            <span class="header-top">CURRENT</span>
            <span class="header-bottom">BUY</span>
          </div>
          <div class="th col-amount">
            <span class="header-top">UNIT</span>
            <span class="header-bottom">VALUE</span>
          </div>
          <div class="th col-profit">
            <span class="header-top">PROFIT</span>
            <span class="header-bottom">CHANGE</span>
          </div>
        </div>
        <div class="table-body">
          <template v-for="asset in filteredAssets" :key="asset.id">
            <div 
              class="table-row desktop-row"
              :class="{ selected: selectedAssetId === asset.id }"
              @click="selectAsset(asset.id)"
              @contextmenu.prevent="showAssetContextMenu($event, asset)"
              @touchstart="startLongPress($event, 'asset', asset)"
              @touchend="endLongPress"
              @touchmove="endLongPress"
            >
              <div class="td col-type">{{ asset.type.toUpperCase() }}</div>
              <div class="td col-source">{{ asset.source }}</div>
              <div class="td col-price font-numeric">{{ formatNumber(asset.currentPrice) }}</div>
              <div class="td col-price font-numeric">{{ formatNumber(asset.buyPrice) }}</div>
              <div class="td col-unit font-numeric">{{ asset.unit }}</div>
              <div class="td col-value font-numeric">{{ formatNumber(asset.value) }}</div>
              <div class="td col-profit font-numeric" :class="asset.profit >= 0 ? 'positive' : 'negative'">
                {{ asset.profit >= 0 ? '+' : '' }}{{ formatNumber(asset.profit) }}
              </div>
              <div class="td col-change font-numeric" :class="asset.change >= 0 ? 'positive' : 'negative'">
                {{ asset.change >= 0 ? '+' : '' }}{{ formatNumber(asset.change) }}%
              </div>
            </div>
            <div 
              class="table-row mobile-row"
              :class="{ selected: selectedAssetId === asset.id }"
              @click="selectAsset(asset.id)"
              @contextmenu.prevent="showAssetContextMenu($event, asset)"
              @touchstart="startLongPress($event, 'asset', asset)"
              @touchend="endLongPress"
              @touchmove="endLongPress"
            >
              <div class="td col-type">
                <span class="cell-top">{{ asset.type.toUpperCase() }}</span>
                <span class="cell-bottom">{{ asset.source }}</span>
              </div>
              <div class="td col-value">
                <span class="cell-top">{{ formatNumber(asset.currentPrice) }}</span>
                <span class="cell-bottom">{{ formatNumber(asset.buyPrice) }}</span>
              </div>
              <div class="td col-amount">
                <span class="cell-top">{{ asset.unit }}</span>
                <span class="cell-bottom">{{ formatNumber(asset.value) }}</span>
              </div>
              <div class="td col-profit">
                <span class="cell-top" :class="asset.profit >= 0 ? 'positive' : 'negative'">{{ asset.profit >= 0 ? '+' : '' }}{{ formatNumber(asset.profit) }}</span>
                <span class="cell-bottom" :class="asset.change >= 0 ? 'positive' : 'negative'">{{ asset.change >= 0 ? '+' : '' }}{{ formatNumber(asset.change) }}%</span>
              </div>
            </div>
            
            <div v-if="selectedAssetId === asset.id && asset.history && asset.history.length > 0" class="asset-detail">
              <div class="detail-table">
                <div class="detail-row detail-header">
                  <div class="detail-col date">
                    <span class="desktop-only">DATE</span>
                    <span class="mobile-header">
                      <span class="header-top">TYPE</span>
                      <span class="header-bottom">DATE</span>
                    </span>
                  </div>
                  <div class="detail-col type desktop-only">TYPE</div>
                  <div class="detail-col price">
                    <span class="desktop-only">PRICE</span>
                    <span class="mobile-header">
                      <span class="header-top">PRICE</span>
                      <span class="header-bottom">UNIT</span>
                    </span>
                  </div>
                  <div class="detail-col unit desktop-only">UNIT</div>
                  <div class="detail-col value">
                    <span class="desktop-only">VALUE</span>
                    <span class="mobile-header">
                      <span class="header-top">VALUE</span>
                      <span class="header-bottom">CHANGE</span>
                    </span>
                  </div>
                  <div class="detail-col change desktop-only">CHANGE</div>
                </div>
                <div class="detail-row" v-for="(item, idx) in getSortedHistory(asset.history)" :key="idx"
                  @contextmenu.prevent="showHistoryContextMenu($event, asset, item, idx)"
                  @touchstart="startHistoryLongPress($event, asset, item, idx)"
                  @touchend="cancelHistoryLongPress"
                  @touchmove="cancelHistoryLongPress">
                  <div class="detail-col date">
                    <span class="desktop-only">{{ item.date }}</span>
                    <span class="cell-top" :class="item.type">{{ item.type.toUpperCase() }}</span>
                    <span class="cell-bottom">{{ item.date }}</span>
                  </div>
                  <div class="detail-col type desktop-only" :class="item.type">{{ item.type.toUpperCase() }}</div>
                  <div class="detail-col price font-numeric">
                    <span class="desktop-only">{{ formatNumber(item.price) }}</span>
                    <span class="cell-top">{{ formatNumber(item.price) }}</span>
                    <span class="cell-bottom">{{ item.unit }}</span>
                  </div>
                  <div class="detail-col unit desktop-only font-numeric">{{ item.unit }}</div>
                  <div class="detail-col value font-numeric">
                    <span class="desktop-only">{{ formatNumber(item.value) }}</span>
                    <span class="cell-top">{{ formatNumber(item.value) }}</span>
                    <span class="cell-bottom" :class="item.change >= 0 ? 'positive' : 'negative'">{{ item.change >= 0 ? '+' : '' }}{{ formatNumber(item.change) }}%</span>
                  </div>
                  <div class="detail-col change desktop-only font-numeric" :class="item.change >= 0 ? 'positive' : 'negative'">
                    {{ item.change >= 0 ? '+' : '' }}{{ formatNumber(item.change) }}%
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="empty-state" v-else>
        <i class="fas fa-wallet"></i>
        <p>No assets selected</p>
        <button class="add-first-btn" @click="showAddModal = true">ADD ASSET</button>
      </div>

      <div class="section-summary" v-if="filteredAssets.length > 0">
        <div class="summary-row">
          <span class="summary-label">TOTAL SELECTED</span>
          <span class="summary-value font-numeric">{{ formatNumber(totalSelectedValue) }} CNY</span>
        </div>
      </div>
      </div>

      <div v-if="activeTab === 'position'" class="position-section">
        <div class="section-header">
          <span class="section-title">ASSET ALLOCATION</span>
        </div>
        
        <div class="data-table">
          <div class="table-header position-header">
            <div class="th col-type">TYPE</div>
            <div class="th col-percent">CURRENT</div>
            <div class="th col-percent">TARGET</div>
            <div class="th col-diff">DEVIATION</div>
          </div>
          <div class="table-body">
            <template v-for="item in assetAllocation" :key="item.type">
              <div 
                class="table-row position-row"
                :class="{ selected: selectedPositionType === item.type }"
                @click="selectedPositionType = selectedPositionType === item.type ? null : item.type"
              >
                <div class="td col-type">{{ item.name }}</div>
                <div class="td col-percent font-numeric">{{ item.currentPercent.toFixed(1) }}%</div>
                <div class="td col-percent font-numeric">{{ item.targetPercent.toFixed(1) }}%</div>
                <div class="td col-diff font-numeric" :class="getDiffClass(item.deviation)">
                  {{ item.deviation > 0 ? '+' : '' }}{{ item.deviation.toFixed(1) }}%
                </div>
              </div>
              
              <div v-if="selectedPositionType === item.type && item.assets" class="asset-detail">
                <div class="detail-table position-detail-table">
                  <div class="detail-row detail-header">
                    <div class="detail-col source">SOURCE</div>
                    <div class="detail-col value">VALUE</div>
                    <div class="detail-col percent">%</div>
                  </div>
                  <div class="detail-row" v-for="asset in item.assets" :key="asset.id">
                    <div class="detail-col source">{{ asset.source }}</div>
                    <div class="detail-col value font-numeric">{{ formatNumber(asset.value) }}</div>
                    <div class="detail-col percent font-numeric">{{ totalWalletValue > 0 ? (asset.value / totalWalletValue * 100).toFixed(1) : 0 }}%</div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
        
        <div class="section-summary">
          <div class="summary-row">
            <span class="summary-label">TOTAL VALUE</span>
            <span class="summary-value font-numeric">{{ formatNumber(totalWalletValue) }} CNY</span>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <span class="modal-title">{{ editingAsset ? 'EDIT ASSET' : 'ADD ASSET' }}</span>
            <button class="modal-close" @click="closeAddModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group half">
                <label class="form-label">TYPE</label>
                <select class="form-select" v-model="addForm.type">
                  <option value="cash">CASH</option>
                  <option value="gold">GOLD</option>
                  <option value="bond">BOND</option>
                  <option value="stock">STOCK</option>
                  <option value="emerging">EMERGING</option>
                </select>
              </div>
              <div class="form-group half">
                <label class="form-label">ACTION</label>
                <select class="form-select" v-model="addForm.action">
                  <option value="buy">BUY</option>
                  <option value="sell">SELL</option>
                  <option value="update">UPDATE</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">SOURCE</label>
              <input type="text" class="form-input" v-model="addForm.source" placeholder="e.g., ICBC, A股, 港股">
            </div>
            <div class="form-row">
              <div class="form-group half">
                <label class="form-label">PRICE</label>
                <input type="number" class="form-input" v-model="addForm.price">
              </div>
              <div class="form-group half">
                <label class="form-label">UNIT</label>
                <input type="number" class="form-input" v-model="addForm.unit">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">DATE</label>
              <input type="date" class="form-input" v-model="addForm.date">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeAddModal">CANCEL</button>
            <button class="btn-confirm" @click="editingAsset ? updateAsset() : addItem()">CONFIRM</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showContextMenu" class="context-menu-overlay" @click="closeContextMenu">
        <div 
          class="context-menu" 
          :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
          @click.stop
        >
          <button class="context-menu-item" @click="editAsset">
            <i class="fas fa-edit"></i>
            <span>EDIT</span>
          </button>
          <button class="context-menu-item delete" @click="deleteAsset">
            <i class="fas fa-trash"></i>
            <span>DELETE</span>
          </button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showImportModal" class="modal-overlay" @click="closeImportModal">
        <div class="modal-container import-modal" @click.stop>
          <div class="modal-header">
            <span class="modal-title">IMPORT CSV</span>
            <button class="modal-close" @click="closeImportModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="importStep === 1" class="import-step">
              <div class="file-upload-row">
                <input type="file" id="csvFile" accept=".csv" @change="handleFileSelect" style="display: none">
                <div class="file-path">{{ importFile ? importFile.name : '未选择文件' }}</div>
                <label for="csvFile" class="file-select-btn">
                  <i class="fas fa-folder-open"></i>
                  <span>选择文件</span>
                </label>
              </div>
              <div class="import-instructions">
                <div class="instruction-title">
                  CSV 格式要求
                  <button class="help-btn" @click="showImportHelp = !showImportHelp">
                    <i class="fas fa-info-circle"></i>
                  </button>
                </div>
                <div v-if="showImportHelp" class="help-content">
                  <div class="help-row">
                    <span class="help-label">类型</span>
                    <span class="help-names">类型、type、Type（cash/gold/bond/stock/emerging）</span>
                  </div>
                  <div class="help-row">
                    <span class="help-label">来源</span>
                    <span class="help-names">来源、source、Source</span>
                  </div>
                  <div class="help-row">
                    <span class="help-label">操作</span>
                    <span class="help-names">操作、action、Action（buy/sell/update）</span>
                  </div>
                  <div class="help-row">
                    <span class="help-label">价格</span>
                    <span class="help-names">价格、price、Price</span>
                  </div>
                  <div class="help-row">
                    <span class="help-label">数量</span>
                    <span class="help-names">数量、unit、Unit</span>
                  </div>
                  <div class="help-row optional">
                    <span class="help-label">日期</span>
                    <span class="help-names">日期、date、Date（格式：2024-01-15）</span>
                  </div>
                </div>
                <div v-else class="instruction-text">
                  必填：类型、来源、操作、价格、数量<br>
                  可选：日期
                </div>
              </div>
            </div>
            <div v-if="importStep === 2" class="import-step">
              <div class="import-preview-header">
                <span>预览数据</span>
                <span class="import-count">共 {{ importData.length }} 条记录</span>
              </div>
              <div class="import-preview-table">
                <table>
                  <thead>
                    <tr>
                      <th>类型</th>
                      <th>来源</th>
                      <th>操作</th>
                      <th>价格</th>
                      <th>数量</th>
                      <th>日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, index) in importData" :key="index">
                      <td>{{ row['类型'] || row['type'] || row['Type'] || '-' }}</td>
                      <td>{{ row['来源'] || row['source'] || row['Source'] || '-' }}</td>
                      <td>{{ row['操作'] || row['action'] || row['Action'] || '-' }}</td>
                      <td>{{ row['价格'] || row['price'] || row['Price'] || '-' }}</td>
                      <td>{{ formatNumber(parseNumber(row['数量'] || row['unit'] || row['Unit'] || 0)) }}</td>
                      <td>{{ row['日期'] || row['date'] || row['Date'] || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeImportModal">CANCEL</button>
            <button v-if="importStep === 2" class="btn-confirm" @click="confirmImport">
              <i class="fas fa-check"></i>
              确认导入
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <div v-if="historyContextMenu.show" class="context-menu" :style="{ left: historyContextMenu.x + 'px', top: historyContextMenu.y + 'px' }" @click.stop>
      <button class="context-menu-item" @click="editHistoryItem">
        <i class="fas fa-edit"></i>
        <span>EDIT</span>
      </button>
      <button class="context-menu-item delete" @click="deleteHistoryItem">
        <i class="fas fa-trash"></i>
        <span>DELETE</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSupabase } from '../lib/supabase'

const { saveUserData, loadUserData, getUser } = useSupabase()
const currentUser = ref(null)

const props = defineProps({
  t: { type: Function, required: true },
  formatAmount: { type: Function, required: true },
  preset: { 
    type: Object, 
    default: () => ({
      modules: ['cash', 'stock', 'bond', 'gold', 'emerging'],
      percentages: { cash: 20, stock: 30, bond: 25, gold: 15, emerging: 10 }
    })
  }
})

const emit = defineEmits(['update:total'])

const activeTab = ref('profit')
const activeTabs = ref(['cash', 'gold', 'bond', 'stock', 'emerging'])
const selectedAssetId = ref(null)
const selectedPositionType = ref(null)
const showAddModal = ref(false)
const showTypeDropdown = ref(false)
const showAddDropdown = ref(false)
const showHistory = ref(false)
const showImportModal = ref(false)
const showImportHelp = ref(false)
const importFile = ref(null)
const importData = ref([])
const importStep = ref(1)
const sortState = ref({ field: null, order: 0 })
const historyContextMenu = ref({ show: false, x: 0, y: 0, asset: null, item: null, index: -1 })
const longPressTimer = ref(null)
const addForm = ref({ 
  type: 'cash', 
  action: 'buy',
  source: '', 
  price: '', 
  unit: '', 
  date: '' 
})
const editingAsset = ref(null)
const editingHistoryIndex = ref(-1)
const assets = ref([
  {
    id: 1,
    type: 'gold',
    source: 'ICBC Gold',
    currentPrice: 680.50,
    buyPrice: 620.00,
    unit: 150,
    value: 102075,
    profit: 9075,
    change: 9.76,
    history: [
      { date: '2025-08-15', type: 'buy', price: 580.00, unit: 50, value: 29000, change: 0 },
      { date: '2025-11-20', type: 'buy', price: 640.00, unit: 50, value: 32000, change: 10.34 },
      { date: '2026-01-10', type: 'buy', price: 660.00, unit: 50, value: 33000, change: 3.13 }
    ]
  },
  {
    id: 2,
    type: 'gold',
    source: 'Bank of China Gold',
    currentPrice: 680.50,
    buyPrice: 595.00,
    unit: 80,
    value: 54440,
    profit: 6840,
    change: 14.37,
    history: [
      { date: '2025-06-01', type: 'buy', price: 550.00, unit: 40, value: 22000, change: 0 },
      { date: '2025-09-15', type: 'buy', price: 640.00, unit: 40, value: 25600, change: 16.36 }
    ]
  },
  {
    id: 3,
    type: 'bond',
    source: 'Treasury 3Y',
    currentPrice: 102.80,
    buyPrice: 100.00,
    unit: 500,
    value: 51400,
    profit: 1400,
    change: 2.80,
    history: [
      { date: '2025-01-15', type: 'buy', price: 100.00, unit: 500, value: 50000, change: 0 }
    ]
  },
  {
    id: 4,
    type: 'bond',
    source: 'Corporate Bond ABC',
    currentPrice: 98.50,
    buyPrice: 100.00,
    unit: 200,
    value: 19700,
    profit: -300,
    change: -1.50,
    history: [
      { date: '2025-03-20', type: 'buy', price: 100.00, unit: 200, value: 20000, change: 0 }
    ]
  },
  {
    id: 11,
    type: 'emerging',
    source: 'BTC',
    currentPrice: 680000,
    buyPrice: 420000,
    unit: 0.5,
    value: 340000,
    profit: 130000,
    change: 61.9,
    history: [
      { date: '2024-06-15', type: 'buy', price: 420000, unit: 0.5, value: 210000, change: 0 }
    ]
  },
  {
    id: 13,
    type: 'stock',
    source: 'A股',
    currentPrice: 33000,
    buyPrice: 36006,
    unit: 1,
    value: 33000,
    profit: -3006,
    change: -8.35,
    history: [
      { date: '2024-01-31', type: 'update', price: 90000, unit: 1, value: 90000, change: 0 },
      { date: '2024-02-29', type: 'update', price: 186000, unit: 1, value: 186000, change: 106.7 },
      { date: '2024-03-31', type: 'update', price: 195000, unit: 1, value: 195000, change: 4.8 },
      { date: '2024-04-30', type: 'update', price: 188000, unit: 1, value: 188000, change: -3.6 },
      { date: '2024-05-31', type: 'update', price: 192000, unit: 1, value: 192000, change: 2.1 },
      { date: '2024-06-30', type: 'update', price: 185000, unit: 1, value: 185000, change: -3.6 },
      { date: '2024-07-31', type: 'update', price: 178000, unit: 1, value: 178000, change: -3.8 },
      { date: '2024-08-31', type: 'update', price: 172000, unit: 1, value: 172000, change: -3.4 },
      { date: '2024-09-30', type: 'update', price: 165000, unit: 1, value: 165000, change: -4.1 },
      { date: '2024-10-31', type: 'update', price: 158000, unit: 1, value: 158000, change: -4.2 },
      { date: '2024-11-30', type: 'update', price: 152000, unit: 1, value: 152000, change: -3.8 },
      { date: '2024-12-31', type: 'update', price: 148000, unit: 1, value: 148000, change: -2.6 },
      { date: '2025-01-31', type: 'update', price: 145000, unit: 1, value: 145000, change: -2.0 },
      { date: '2025-02-28', type: 'update', price: 142000, unit: 1, value: 142000, change: -2.1 },
      { date: '2025-03-31', type: 'update', price: 138000, unit: 1, value: 138000, change: -2.8 },
      { date: '2025-04-30', type: 'update', price: 135000, unit: 1, value: 135000, change: -2.2 },
      { date: '2025-05-31', type: 'update', price: 132000, unit: 1, value: 132000, change: -2.2 },
      { date: '2025-06-30', type: 'update', price: 128000, unit: 1, value: 128000, change: -3.0 },
      { date: '2025-07-31', type: 'update', price: 125000, unit: 1, value: 125000, change: -2.3 },
      { date: '2025-08-31', type: 'update', price: 122000, unit: 1, value: 122000, change: -2.4 },
      { date: '2025-09-30', type: 'update', price: 118000, unit: 1, value: 118000, change: -3.3 },
      { date: '2025-10-31', type: 'update', price: 115000, unit: 1, value: 115000, change: -2.5 },
      { date: '2025-11-30', type: 'update', price: 112000, unit: 1, value: 112000, change: -2.6 },
      { date: '2025-12-31', type: 'update', price: 108000, unit: 1, value: 108000, change: -3.6 },
      { date: '2026-01-31', type: 'update', price: 33000, unit: 1, value: 33000, change: -69.4 }
    ]
  },
  {
    id: 14,
    type: 'stock',
    source: '港股',
    currentPrice: 48070,
    buyPrice: 47030,
    unit: 1,
    value: 48070,
    profit: 1040,
    change: 2.21,
    history: [
      { date: '2024-01-31', type: 'update', price: 25760, unit: 1, value: 25760, change: 0 },
      { date: '2024-02-29', type: 'update', price: 32200, unit: 1, value: 32200, change: 25.0 },
      { date: '2024-03-31', type: 'update', price: 45500, unit: 1, value: 45500, change: 41.3 },
      { date: '2024-04-30', type: 'update', price: 43200, unit: 1, value: 43200, change: -5.1 },
      { date: '2024-05-31', type: 'update', price: 44800, unit: 1, value: 44800, change: 3.7 },
      { date: '2024-06-30', type: 'update', price: 46200, unit: 1, value: 46200, change: 3.1 },
      { date: '2024-07-31', type: 'update', price: 44500, unit: 1, value: 44500, change: -3.7 },
      { date: '2024-08-31', type: 'update', price: 42800, unit: 1, value: 42800, change: -3.8 },
      { date: '2024-09-30', type: 'update', price: 44200, unit: 1, value: 44200, change: 3.3 },
      { date: '2024-10-31', type: 'update', price: 45500, unit: 1, value: 45500, change: 2.9 },
      { date: '2024-11-30', type: 'update', price: 46800, unit: 1, value: 46800, change: 2.9 },
      { date: '2024-12-31', type: 'update', price: 47200, unit: 1, value: 47200, change: 0.9 },
      { date: '2025-01-31', type: 'update', price: 46500, unit: 1, value: 46500, change: -1.5 },
      { date: '2025-02-28', type: 'update', price: 45800, unit: 1, value: 45800, change: -1.5 },
      { date: '2025-03-31', type: 'update', price: 45200, unit: 1, value: 45200, change: -1.3 },
      { date: '2025-04-30', type: 'update', price: 46500, unit: 1, value: 46500, change: 2.9 },
      { date: '2025-05-31', type: 'update', price: 47800, unit: 1, value: 47800, change: 2.8 },
      { date: '2025-06-30', type: 'update', price: 47200, unit: 1, value: 47200, change: -1.3 },
      { date: '2025-07-31', type: 'update', price: 46500, unit: 1, value: 46500, change: -1.5 },
      { date: '2025-08-31', type: 'update', price: 45800, unit: 1, value: 45800, change: -1.5 },
      { date: '2025-09-30', type: 'update', price: 46800, unit: 1, value: 46800, change: 2.2 },
      { date: '2025-10-31', type: 'update', price: 47500, unit: 1, value: 47500, change: 1.5 },
      { date: '2025-11-30', type: 'update', price: 48200, unit: 1, value: 48200, change: 1.5 },
      { date: '2025-12-31', type: 'update', price: 47800, unit: 1, value: 47800, change: -0.8 },
      { date: '2026-01-31', type: 'update', price: 48070, unit: 1, value: 48070, change: 0.6 }
    ]
  },
  {
    id: 15,
    type: 'stock',
    source: '美股',
    currentPrice: 479950,
    buyPrice: 327840,
    unit: 1,
    value: 479950,
    profit: 152110,
    change: 46.4,
    history: [
      { date: '2024-01-31', type: 'update', price: 219960, unit: 1, value: 219960, change: 0 },
      { date: '2024-02-29', type: 'update', price: 419900, unit: 1, value: 419900, change: 90.9 },
      { date: '2024-03-31', type: 'update', price: 445000, unit: 1, value: 445000, change: 6.0 },
      { date: '2024-04-30', type: 'update', price: 425000, unit: 1, value: 425000, change: -4.5 },
      { date: '2024-05-31', type: 'update', price: 468000, unit: 1, value: 468000, change: 10.1 },
      { date: '2024-06-30', type: 'update', price: 495000, unit: 1, value: 495000, change: 5.8 },
      { date: '2024-07-31', type: 'update', price: 512000, unit: 1, value: 512000, change: 3.4 },
      { date: '2024-08-31', type: 'update', price: 485000, unit: 1, value: 485000, change: -5.3 },
      { date: '2024-09-30', type: 'update', price: 528000, unit: 1, value: 528000, change: 8.9 },
      { date: '2024-10-31', type: 'update', price: 555000, unit: 1, value: 555000, change: 5.1 },
      { date: '2024-11-30', type: 'update', price: 582000, unit: 1, value: 582000, change: 4.9 },
      { date: '2024-12-31', type: 'update', price: 598000, unit: 1, value: 598000, change: 2.7 },
      { date: '2025-01-31', type: 'update', price: 575000, unit: 1, value: 575000, change: -3.8 },
      { date: '2025-02-28', type: 'update', price: 592000, unit: 1, value: 592000, change: 3.0 },
      { date: '2025-03-31', type: 'update', price: 568000, unit: 1, value: 568000, change: -4.1 },
      { date: '2025-04-30', type: 'update', price: 545000, unit: 1, value: 545000, change: -4.0 },
      { date: '2025-05-31', type: 'update', price: 528000, unit: 1, value: 528000, change: -3.1 },
      { date: '2025-06-30', type: 'update', price: 512000, unit: 1, value: 512000, change: -3.0 },
      { date: '2025-07-31', type: 'update', price: 495000, unit: 1, value: 495000, change: -3.3 },
      { date: '2025-08-31', type: 'update', price: 478000, unit: 1, value: 478000, change: -3.4 },
      { date: '2025-09-30', type: 'update', price: 462000, unit: 1, value: 462000, change: -3.3 },
      { date: '2025-10-31', type: 'update', price: 448000, unit: 1, value: 448000, change: -3.0 },
      { date: '2025-11-30', type: 'update', price: 435000, unit: 1, value: 435000, change: -2.9 },
      { date: '2025-12-31', type: 'update', price: 428000, unit: 1, value: 428000, change: -1.6 },
      { date: '2026-01-31', type: 'update', price: 479950, unit: 1, value: 479950, change: 12.1 }
    ]
  }
])

const showContextMenu = ref(false)
const contextMenuType = ref('')
const contextMenuData = ref(null)
const contextMenuX = ref(0)
const contextMenuY = ref(0)

const tabs = [
  { id: 'cash', name: 'CASH', icon: 'fas fa-wallet' },
  { id: 'gold', name: 'GOLD', icon: 'fas fa-coins' },
  { id: 'bond', name: 'BOND', icon: 'fas fa-landmark' },
  { id: 'stock', name: 'STOCK', icon: 'fas fa-chart-line' },
  { id: 'emerging', name: 'EMERGING', icon: 'fas fa-globe' }
]

const filteredAssets = computed(() => {
  let data = assets.value.filter(asset => activeTabs.value.includes(asset.type))
  
  if (!showHistory.value) {
    data = data.filter(asset => asset.value > 0)
  }
  
  if (sortState.value.field && sortState.value.order !== 0) {
    const field = sortState.value.field
    const order = sortState.value.order
    
    data = [...data].sort((a, b) => {
      let valueA, valueB
      
      if (field === 'type') {
        valueA = a.type
        valueB = b.type
        if (order === 1) {
          return valueA.localeCompare(valueB)
        } else {
          return valueB.localeCompare(valueA)
        }
      } else {
        valueA = a[field] || 0
        valueB = b[field] || 0
        if (order === 1) {
          return valueB - valueA
        } else {
          return valueA - valueB
        }
      }
    })
  }
  
  return data
})

const toggleSort = (field) => {
  if (sortState.value.field === field) {
    if (sortState.value.order === 0) {
      sortState.value = { field, order: 1 }
    } else if (sortState.value.order === 1) {
      sortState.value = { field, order: 2 }
    } else {
      sortState.value = { field: null, order: 0 }
    }
  } else {
    sortState.value = { field, order: 1 }
  }
}

const getSortClass = (field) => {
  if (sortState.value.field === field) {
    return sortState.value.order === 1 ? 'sort-desc' : sortState.value.order === 2 ? 'sort-asc' : ''
  }
  return ''
}

const totalSelectedValue = computed(() => {
  return filteredAssets.value.reduce((sum, asset) => sum + asset.value, 0)
})

const totalWalletValue = computed(() => {
  return assets.value.reduce((sum, asset) => sum + asset.value, 0)
})

const assetAllocation = computed(() => {
  const allocation = {}
  const total = totalWalletValue.value
  
  assets.value.forEach(asset => {
    const type = asset.type
    if (!allocation[type]) {
      allocation[type] = { value: 0, assets: [] }
    }
    allocation[type].value += asset.value
    allocation[type].assets.push(asset)
  })
  
  const result = []
  const typeNames = {
    cash: 'CASH',
    gold: 'GOLD',
    bond: 'BOND',
    stock: 'STOCK',
    emerging: 'EMERGING'
  }
  
  Object.keys(allocation).forEach(type => {
    const currentPercent = total > 0 ? (allocation[type].value / total * 100) : 0
    const targetPercent = props.preset.percentages[type] || 0
    const deviation = currentPercent - targetPercent
    
    result.push({
      type,
      name: typeNames[type] || type.toUpperCase(),
      value: allocation[type].value,
      currentPercent,
      targetPercent,
      deviation,
      assets: allocation[type].assets
    })
  })
  
  return result.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
})

const formatNumber = (value) => {
  if (!value && value !== 0) return '0.00'
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const getSortedHistory = (history) => {
  if (!history) return []
  return [...history].sort((a, b) => {
    const dateA = new Date(a.date.replace(/\//g, '-'))
    const dateB = new Date(b.date.replace(/\//g, '-'))
    return dateB - dateA
  })
}

const getDiffClass = (diff) => {
  if (Math.abs(diff) <= 5) return 'balanced'
  if (diff > 5) return 'overweight'
  return 'underweight'
}

const toggleTab = (tabId) => {
  const index = activeTabs.value.indexOf(tabId)
  if (index >= 0) {
    activeTabs.value.splice(index, 1)
  } else {
    activeTabs.value.push(tabId)
  }
}

const toggleTypeDropdown = () => {
  showTypeDropdown.value = !showTypeDropdown.value
}

const closeTypeDropdown = () => {
  showTypeDropdown.value = false
}

const toggleAddDropdown = () => {
  showAddDropdown.value = !showAddDropdown.value
}

const closeAddDropdown = () => {
  showAddDropdown.value = false
}

const manualAdd = () => {
  closeAddDropdown()
  showAddModal.value = true
}

const importCSV = () => {
  closeAddDropdown()
  showImportModal.value = true
  importStep.value = 1
  importFile.value = null
  importData.value = []
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    importFile.value = file
    parseCSVFile(file)
  }
}

const parseCSVFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      let text = e.target.result
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1)
      }
      
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('CSV 文件格式错误或没有数据')
        return
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const data = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        if (values.length >= 4) {
          const row = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          data.push(row)
        }
      }
      
      if (data.length === 0) {
        alert('CSV 文件没有有效数据')
        return
      }
      
      importData.value = data
      importStep.value = 2
    } catch (err) {
      console.error('CSV 解析错误:', err)
      alert('CSV 文件解析失败: ' + err.message)
    }
  }
  reader.onerror = () => {
    alert('文件读取失败')
  }
  reader.readAsText(file, 'UTF-8')
}

const parseNumber = (value) => {
  if (!value) return 0
  const str = String(value).replace(/,/g, '')
  return parseFloat(str) || 0
}

const confirmImport = () => {
  importData.value.forEach(row => {
    const type = (row['类型'] || row['type'] || row['Type'] || 'cash').toLowerCase()
    const source = row['来源'] || row['source'] || row['Source'] || ''
    const action = (row['操作'] || row['action'] || row['Action'] || 'buy').toLowerCase()
    const price = parseNumber(row['价格'] || row['price'] || row['Price'] || 0)
    const unit = parseNumber(row['数量'] || row['unit'] || row['Unit'] || 0)
    const date = row['日期'] || row['date'] || row['Date'] || new Date().toISOString().split('T')[0]
    
    if (source && price > 0 && unit > 0) {
      const existingAsset = assets.value.find(a => a.type === type && a.source === source)
      
      if (existingAsset) {
        const value = price * unit
        
        if (action === 'buy') {
          const totalCost = existingAsset.buyPrice * existingAsset.unit + price * unit
          const totalUnits = existingAsset.unit + unit
          existingAsset.buyPrice = totalCost / totalUnits
          existingAsset.unit = totalUnits
          existingAsset.currentPrice = price
          existingAsset.value = existingAsset.currentPrice * existingAsset.unit
          existingAsset.profit = (existingAsset.currentPrice - existingAsset.buyPrice) * existingAsset.unit
          existingAsset.change = existingAsset.buyPrice > 0 ? ((existingAsset.currentPrice - existingAsset.buyPrice) / existingAsset.buyPrice * 100) : 0
          existingAsset.history.push({ date, type: 'buy', price, unit, value, change: 0 })
        } else if (action === 'sell') {
          existingAsset.unit -= unit
          if (existingAsset.unit < 0) existingAsset.unit = 0
          existingAsset.currentPrice = price
          existingAsset.value = existingAsset.currentPrice * existingAsset.unit
          existingAsset.profit = (existingAsset.currentPrice - existingAsset.buyPrice) * existingAsset.unit
          existingAsset.change = existingAsset.buyPrice > 0 ? ((existingAsset.currentPrice - existingAsset.buyPrice) / existingAsset.buyPrice * 100) : 0
          existingAsset.history.push({ date, type: 'sell', price, unit, value, change: existingAsset.change })
        } else if (action === 'update') {
          existingAsset.currentPrice = price
          existingAsset.value = existingAsset.currentPrice * existingAsset.unit
          existingAsset.profit = (existingAsset.currentPrice - existingAsset.buyPrice) * existingAsset.unit
          existingAsset.change = existingAsset.buyPrice > 0 ? ((existingAsset.currentPrice - existingAsset.buyPrice) / existingAsset.buyPrice * 100) : 0
          existingAsset.history.push({ date, type: 'update', price, unit: existingAsset.unit, value: existingAsset.value, change: existingAsset.change })
        }
      } else {
        const newAsset = {
          id: Date.now() + Math.random(),
          type,
          source,
          buyPrice: price,
          currentPrice: price,
          unit: action === 'buy' ? unit : 0,
          value: price * unit,
          profit: 0,
          change: 0,
          history: [{
            date,
            type: action,
            price,
            unit,
            value: price * unit,
            change: 0
          }]
        }
        assets.value.push(newAsset)
      }
    }
  })
  
  saveData()
  showImportModal.value = false
  importStep.value = 1
  importFile.value = null
  importData.value = []
}

const closeImportModal = () => {
  showImportModal.value = false
  importStep.value = 1
  importFile.value = null
  importData.value = []
}

const showHistoryContextMenu = (event, asset, item, index) => {
  historyContextMenu.value = {
    show: true,
    x: event.clientX || event.touches?.[0]?.clientX || 0,
    y: event.clientY || event.touches?.[0]?.clientY || 0,
    asset,
    item,
    index
  }
}

const closeHistoryContextMenu = () => {
  historyContextMenu.value = { show: false, x: 0, y: 0, asset: null, item: null, index: -1 }
}

const startHistoryLongPress = (event, asset, item, index) => {
  longPressTimer.value = setTimeout(() => {
    showHistoryContextMenu(event, asset, item, index)
  }, 500)
}

const cancelHistoryLongPress = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const editHistoryItem = () => {
  const { asset, item, index } = historyContextMenu.value
  if (!asset || !item) return
  
  addForm.value = {
    type: asset.type,
    action: item.type,
    source: asset.source,
    price: item.price,
    unit: item.unit,
    date: item.date
  }
  
  editingAsset.value = asset
  editingHistoryIndex.value = index
  closeHistoryContextMenu()
  showAddModal.value = true
}

const deleteHistoryItem = () => {
  const { asset, index } = historyContextMenu.value
  if (!asset || index < 0) return
  
  asset.history.splice(index, 1)
  
  if (asset.history.length > 0) {
    const lastHistory = asset.history[asset.history.length - 1]
    asset.currentPrice = lastHistory.price
    asset.unit = lastHistory.unit
    asset.value = lastHistory.value
  } else {
    asset.unit = 0
    asset.value = 0
  }
  
  saveData()
  closeHistoryContextMenu()
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
}

const refreshData = () => {
  loadData()
  receiveStockSyncData()
  fetchCryptoAndGoldPrices()
}

const fetchCryptoAndGoldPrices = async () => {
  try {
    const btcResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
    const btcData = await btcResponse.json()
    
    console.log('BTC API response:', btcData)
    
    if (btcData.bitcoin && btcData.bitcoin.usd) {
      const btcPrice = btcData.bitcoin.usd
      console.log('BTC price:', btcPrice)
      
      assets.value.filter(a => a.type === 'emerging').forEach(emergingAsset => {
        emergingAsset.currentPrice = btcPrice
        emergingAsset.value = btcPrice * emergingAsset.unit
      })
    }
  } catch (e) {
    console.log('Failed to fetch BTC price:', e)
  }
  
  try {
    const goldResponse = await fetch('https://v2.xxapi.cn/api/goldprice')
    const goldData = await goldResponse.json()
    
    console.log('Gold API response:', goldData)
    
    if (goldData && goldData.data) {
      const bocGold = goldData.data.find(item => item.name === '中国银行金条')
      console.log('BOC Gold data:', bocGold)
      
      if (bocGold && bocGold.price) {
        const goldPrice = parseFloat(bocGold.price)
        console.log('Gold price:', goldPrice)
        
        assets.value.filter(a => a.type === 'gold').forEach(goldAsset => {
          goldAsset.currentPrice = goldPrice
          goldAsset.value = goldPrice * goldAsset.unit
        })
      }
    }
  } catch (e) {
    console.log('Failed to fetch gold price:', e)
  }
  
  saveData()
}

const startLongPress = (event, type, data) => {
  longPressTimer.value = setTimeout(() => {
    const rect = event.target.getBoundingClientRect()
    contextMenuX.value = rect.left
    contextMenuY.value = rect.bottom + 5
    contextMenuType.value = type
    contextMenuData.value = data
    showContextMenu.value = true
  }, 500)
}

const endLongPress = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const closeContextMenu = () => {
  showContextMenu.value = false
  contextMenuType.value = ''
  contextMenuData.value = null
}

const showAssetContextMenu = (event, asset) => {
  contextMenuX.value = event.clientX || event.touches?.[0]?.clientX || 0
  contextMenuY.value = event.clientY || event.touches?.[0]?.clientY || 0
  contextMenuType.value = 'asset'
  contextMenuData.value = asset
  showContextMenu.value = true
}

const editAsset = () => {
  if (contextMenuType.value === 'asset' && contextMenuData.value) {
    editingAsset.value = contextMenuData.value
    addForm.value = {
      type: contextMenuData.value.type,
      action: 'update',
      source: contextMenuData.value.source,
      price: contextMenuData.value.currentPrice.toString(),
      unit: contextMenuData.value.unit.toString(),
      date: new Date().toISOString().split('T')[0]
    }
    showAddModal.value = true
  }
  closeContextMenu()
}

const deleteAsset = () => {
  if (contextMenuType.value === 'asset' && contextMenuData.value) {
    removeAsset(contextMenuData.value.id)
  }
  closeContextMenu()
}

const selectAsset = (id) => {
  if (selectedAssetId.value === id) {
    selectedAssetId.value = null
  } else {
    selectedAssetId.value = id
  }
}

const closeAddModal = () => {
  showAddModal.value = false
  editingAsset.value = null
  addForm.value = { 
    type: 'cash', 
    action: 'buy',
    source: '', 
    price: '', 
    unit: '', 
    date: '' 
  }
}

const addItem = () => {
  const type = addForm.value.type
  const action = addForm.value.action
  const source = addForm.value.source.trim()
  const price = parseFloat(addForm.value.price) || 0
  const unit = parseFloat(addForm.value.unit) || 0
  const date = addForm.value.date || new Date().toISOString().split('T')[0]

  if (!source || price <= 0 || unit <= 0) return

  const value = price * unit

  const existingAsset = assets.value.find(a => 
    a.type === type && a.source.toLowerCase() === source.toLowerCase()
  )

  if (existingAsset) {
    if (action === 'buy') {
      const totalCost = existingAsset.buyPrice * existingAsset.unit + price * unit
      const totalUnits = existingAsset.unit + unit
      existingAsset.buyPrice = totalCost / totalUnits
      existingAsset.unit = totalUnits
      existingAsset.currentPrice = price
      existingAsset.value = existingAsset.currentPrice * existingAsset.unit
      existingAsset.profit = (existingAsset.currentPrice - existingAsset.buyPrice) * existingAsset.unit
      existingAsset.change = existingAsset.buyPrice > 0 ? ((existingAsset.currentPrice - existingAsset.buyPrice) / existingAsset.buyPrice * 100) : 0
      existingAsset.history.push({ date, type: 'buy', price, unit, value, change: 0 })
    } else if (action === 'sell') {
      existingAsset.unit -= unit
      if (existingAsset.unit < 0) existingAsset.unit = 0
      existingAsset.currentPrice = price
      existingAsset.value = existingAsset.currentPrice * existingAsset.unit
      existingAsset.profit = (existingAsset.currentPrice - existingAsset.buyPrice) * existingAsset.unit
      existingAsset.change = existingAsset.buyPrice > 0 ? ((existingAsset.currentPrice - existingAsset.buyPrice) / existingAsset.buyPrice * 100) : 0
      existingAsset.history.push({ date, type: 'sell', price, unit, value, change: existingAsset.change })
    } else if (action === 'update') {
      existingAsset.currentPrice = price
      existingAsset.value = existingAsset.currentPrice * existingAsset.unit
      existingAsset.profit = (existingAsset.currentPrice - existingAsset.buyPrice) * existingAsset.unit
      existingAsset.change = existingAsset.buyPrice > 0 ? ((existingAsset.currentPrice - existingAsset.buyPrice) / existingAsset.buyPrice * 100) : 0
      existingAsset.history.push({ date, type: 'update', price, unit: existingAsset.unit, value: existingAsset.value, change: existingAsset.change })
    }
  } else {
    if (action === 'buy') {
      const newAsset = {
        id: Date.now(),
        type,
        source,
        currentPrice: price,
        buyPrice: price,
        unit,
        value,
        profit: 0,
        change: 0,
        history: [{ date, type: 'buy', price, unit, value, change: 0 }]
      }
      assets.value.push(newAsset)
    }
  }

  saveData()
  closeAddModal()
}

const updateAsset = () => {
  if (!editingAsset.value) return

  const asset = assets.value.find(a => a.id === editingAsset.value.id)
  if (asset) {
    const action = addForm.value.action
    const price = parseFloat(addForm.value.price) || 0
    const unit = parseFloat(addForm.value.unit) || 0
    const date = addForm.value.date || new Date().toISOString().split('T')[0]
    const value = price * unit

    if (action === 'buy') {
      const totalCost = asset.buyPrice * asset.unit + price * unit
      const totalUnits = asset.unit + unit
      asset.buyPrice = totalCost / totalUnits
      asset.unit = totalUnits
      asset.currentPrice = price
      asset.value = asset.currentPrice * asset.unit
      asset.profit = (asset.currentPrice - asset.buyPrice) * asset.unit
      asset.change = asset.buyPrice > 0 ? ((asset.currentPrice - asset.buyPrice) / asset.buyPrice * 100) : 0
      asset.history.push({ date, type: 'buy', price, unit, value, change: 0 })
    } else if (action === 'sell') {
      asset.unit -= unit
      if (asset.unit < 0) asset.unit = 0
      asset.currentPrice = price
      asset.value = asset.currentPrice * asset.unit
      asset.profit = (asset.currentPrice - asset.buyPrice) * asset.unit
      asset.change = asset.buyPrice > 0 ? ((asset.currentPrice - asset.buyPrice) / asset.buyPrice * 100) : 0
      asset.history.push({ date, type: 'sell', price, unit, value, change: asset.change })
    } else if (action === 'update') {
      asset.currentPrice = price
      asset.value = asset.currentPrice * asset.unit
      asset.profit = (asset.currentPrice - asset.buyPrice) * asset.unit
      asset.change = asset.buyPrice > 0 ? ((asset.currentPrice - asset.buyPrice) / asset.buyPrice * 100) : 0
      asset.history.push({ date, type: 'update', price, unit: asset.unit, value: asset.value, change: asset.change })
    }
    
    saveData()
  }
  
  closeAddModal()
}

const removeAsset = (id) => {
  const index = assets.value.findIndex(asset => asset.id === id)
  if (index >= 0) {
    assets.value.splice(index, 1)
    if (selectedAssetId.value === id) {
      selectedAssetId.value = null
    }
    saveData()
  }
}

const saveData = () => {
  localStorage.setItem('walletData', JSON.stringify(assets.value))
  localStorage.setItem('walletDataVersion', '8')
  emit('update:total', totalWalletValue.value)
  
  if (currentUser.value) {
    saveUserData(currentUser.value.id, 'wallet', assets.value)
  }
}

const loadData = async () => {
  const version = localStorage.getItem('walletDataVersion')
  
  if (currentUser.value) {
    const { data: cloudData, error } = await loadUserData(currentUser.value.id, 'wallet')
    if (!error && cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
      assets.value = cloudData
      localStorage.setItem('walletData', JSON.stringify(cloudData))
      return
    }
  }
  
  if (version === '8') {
    const saved = localStorage.getItem('walletData')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (Array.isArray(data) && data.length > 0) {
          assets.value = data
        }
      } catch (e) {
      }
    }
  }
}

const receiveStockSyncData = () => {
  const syncDataStr = localStorage.getItem('stockSyncData')
  if (!syncDataStr) return
  
  try {
    const syncData = JSON.parse(syncDataStr)
    const { date, markets, transactions, isLastDayOfMonth } = syncData
    
    const marketAssets = {
      'A股': assets.value.find(a => a.type === 'stock' && a.source === 'A股'),
      '港股': assets.value.find(a => a.type === 'stock' && a.source === '港股'),
      '美股': assets.value.find(a => a.type === 'stock' && a.source === '美股')
    }
    
    Object.keys(markets).forEach(market => {
      const asset = marketAssets[market]
      if (!asset) return
      
      const newValue = markets[market]
      const oldValue = asset.value
      const changePercent = oldValue > 0 ? ((newValue - oldValue) / oldValue * 100) : 0
      
      asset.currentPrice = newValue
      asset.value = newValue
      
      if (transactions && transactions[market]) {
        asset.history = transactions[market].map(trans => ({
          date: trans.date,
          type: trans.type,
          price: trans.price,
          unit: trans.quantity,
          value: trans.value,
          change: 0,
          code: trans.code,
          name: trans.name
        }))
      }
      
      if (isLastDayOfMonth) {
        const lastHistory = asset.history[asset.history.length - 1]
        const lastDate = lastHistory ? lastHistory.date : null
        const lastValue = lastHistory ? lastHistory.value : 0
        const monthChange = lastValue > 0 ? ((newValue - lastValue) / lastValue * 100) : 0
        
        if (lastDate !== date) {
          asset.history.push({
            date,
            type: 'update',
            price: newValue,
            unit: 1,
            value: newValue,
            change: monthChange
          })
          
          asset.profit = newValue - (asset.buyPrice || newValue)
          asset.change = monthChange
        }
      }
    })
    
    saveData()
  } catch (e) {
    console.error('Failed to parse stock sync data:', e)
  }
}

onMounted(async () => {
  const { user } = await getUser()
  currentUser.value = user
  
  await loadData()
  receiveStockSyncData()
  fetchCryptoAndGoldPrices()
  emit('update:total', totalWalletValue.value)
  
  window.addEventListener('storage', (e) => {
    if (e.key === 'stockSyncData') {
      receiveStockSyncData()
    }
  })
  
  document.addEventListener('click', () => {
    closeHistoryContextMenu()
  })
  
  setInterval(() => {
    receiveStockSyncData()
  }, 5000)
  
  setInterval(() => {
    fetchCryptoAndGoldPrices()
  }, 60000)
})

defineExpose({
  totalWalletValue
})
</script>

<style scoped>
.wallet-container {
  margin-bottom: 16px;
}

.wallet-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
}

.type-selector {
  position: relative;
}

.add-selector {
  position: relative;
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

.type-btn.icon-only {
  width: 36px;
  height: 36px;
  padding: 0;
  justify-content: center;
}

.type-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.type-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.type-btn.active {
  border-color: #0891b2;
  color: #0891b2;
}

.type-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  min-width: 140px;
  padding: 8px 0;
}

.type-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.type-option:hover {
  background: var(--bg-tertiary);
}

.type-option input {
  display: none;
}

.checkmark {
  width: 16px;
  height: 16px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.type-option input:checked + .checkmark {
  background: #0891b2;
  border-color: #0891b2;
}

.type-option input:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-size: 10px;
}

.type-name {
  font-size: 12px;
  color: var(--text-primary);
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}

.add-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  min-width: 140px;
  padding: 8px 0;
}

.add-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease;
  text-align: left;
}

.add-option:hover {
  background: var(--bg-tertiary);
}

.add-option i {
  color: var(--text-secondary);
  width: 14px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.action-btn.active {
  background: rgba(8, 145, 178, 0.15);
  border-color: #0891b2;
  color: #0891b2;
}

.wallet-tabs .type-selector {
  margin-left: auto;
}

.wallet-content {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-light);
  height: 38px;
  box-sizing: border-box;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table {
  width: 100%;
  border-bottom: 1px solid var(--border-light);
}

.table-header {
  display: grid;
  grid-template-columns: 90px 1fr 90px 90px 90px 90px 90px 90px;
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

.mobile-header {
  display: none;
}

.mobile-header-row {
  display: none !important;
}

.mobile-row {
  display: none !important;
}

.cell-top,
.cell-bottom {
  display: none;
}

.mobile-only {
  display: none;
}

.th.sortable {
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}

.th.sortable:hover {
  color: var(--text-primary);
}

.th.sortable.sort-desc {
  color: #0891b2;
}

.th.sortable.sort-asc {
  color: #0891b2;
}

.col-type, .col-source {
  justify-content: flex-start;
}

.col-price, .col-unit, .col-value, .col-profit, .col-change {
  justify-content: flex-end;
}

.table-header.position-header {
  grid-template-columns: 1fr 90px 90px 90px;
}

.table-row.position-row {
  grid-template-columns: 1fr 90px 90px 90px;
  cursor: pointer;
}

.col-type {
  font-weight: 600;
  color: var(--text-primary);
}

.col-percent {
  justify-content: flex-end;
}

.col-diff {
  justify-content: flex-end;
}

.col-diff.overweight {
  color: #f59e0b;
}

.col-diff.underweight {
  color: #ef4444;
}

.col-diff.balanced {
  color: #22c55e;
}

.th.sortable {
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}

.th.sortable:hover {
  color: var(--text-primary);
}

.th.sortable.sort-desc {
  color: #0891b2;
}

.th.sortable.sort-asc {
  color: #0891b2;
}

.table-body {
}

.table-row {
  display: grid;
  grid-template-columns: 90px 1fr 90px 90px 90px 90px 90px 90px;
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

.table-row.selected {
  background: rgba(8, 145, 178, 0.15);
  border-left: 3px solid #0891b2;
  cursor: pointer;
}

.td {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.col-type, .col-source {
  justify-content: flex-start;
}

.col-value, .col-vlw {
  justify-content: flex-end;
}

.positive { color: var(--accent-green); }
.negative { color: var(--accent-red); }

.asset-detail {
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-light);
  padding: 4px 8px 8px;
}

.detail-table {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  overflow: hidden;
}

.detail-row {
  display: grid;
  grid-template-columns: 120px 1fr 90px 90px 90px 90px;
  border-bottom: 1px solid var(--border-light);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row.detail-header {
  background: var(--bg-tertiary);
}

.detail-col {
  padding: 8px 10px;
  font-size: 11px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.detail-header .detail-col {
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.detail-col.source {
  justify-content: flex-start;
}

.detail-col.value,
.detail-col.percent {
  justify-content: flex-end;
}

.detail-col.type.buy {
  color: var(--accent-green);
  font-weight: 600;
}

.detail-col.type.sell {
  color: var(--accent-red);
  font-weight: 600;
}

.detail-col.price,
.detail-col.unit,
.detail-col.value,
.detail-col.change {
  justify-content: flex-end;
}

.position-detail-table .detail-row {
  grid-template-columns: 1fr 90px 90px;
}

.position-detail-table .detail-col.source {
  justify-content: flex-start;
}

.position-detail-table .detail-col.value,
.position-detail-table .detail-col.percent {
  justify-content: flex-end;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.empty-state i {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 13px;
  margin-bottom: 16px;
}

.add-first-btn {
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-first-btn:hover {
  border-color: #0891b2;
  color: #0891b2;
}

.section-summary {
  padding: 12px 16px;
  background: var(--bg-tertiary);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.summary-value {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
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
  z-index: 10000;
}

.modal-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
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
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group.half {
  flex: 1;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-label {
  display: block;
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #0891b2;
}

.form-input::-webkit-outer-spin-button,
.form-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.form-input[type=number] {
  -moz-appearance: textfield;
}

.form-input[type=date]::-webkit-calendar-picker-indicator {
  filter: invert(0.6);
  cursor: pointer;
  opacity: 0.7;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-light);
}

.btn-cancel {
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.btn-confirm {
  padding: 8px 16px;
  background: #0891b2;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.btn-confirm:hover {
  background: #0e7490;
}

.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.context-menu {
  position: absolute;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 120px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}

.context-menu-item:hover {
  background: var(--bg-hover);
}

.context-menu-item i {
  font-size: 12px;
  color: var(--text-muted);
  width: 14px;
}

.context-menu-item.delete {
  color: var(--accent-red);
}

.context-menu-item.delete i {
  color: var(--accent-red);
}

@media (max-width: 768px) {
  .wallet-tabs {
    overflow: visible;
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
  
  .type-dropdown,
  .add-dropdown {
    z-index: 1000;
  }
  
  .desktop-only {
    display: none !important;
  }
  
  .cell-top,
  .cell-bottom {
    display: block;
  }
  
  .mobile-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  
  .detail-col.price .mobile-header,
  .detail-col.value .mobile-header {
    align-items: flex-end;
  }
  
  .mobile-header-row {
    display: grid !important;
    grid-template-columns: 1fr 90px 90px 90px;
  }
  
  .mobile-row {
    display: grid !important;
    grid-template-columns: 1fr 90px 90px 90px;
  }
  
  .desktop-row {
    display: none !important;
  }
  
  .table-header:not(.mobile-header-row):not(.position-header) {
    display: none !important;
  }
  
  .mobile-only {
    display: block;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr 90px 90px 90px;
  }
  
  .table-header.position-header,
  .table-row.position-row {
    grid-template-columns: 1fr 90px 90px 90px;
  }
  
  .position-header .th {
    flex-direction: row;
    align-items: center;
  }
  
  .position-header .th.col-type {
    justify-content: flex-start;
  }
  
  .position-header .th.col-percent,
  .position-header .th.col-diff {
    justify-content: flex-end;
  }
  
  .position-row .td {
    flex-direction: row;
    align-items: center;
  }
  
  .position-row .td.col-percent,
  .position-row .td.col-diff {
    justify-content: flex-end;
  }
  
  .th {
    font-size: 8px;
    padding: 8px 6px;
    flex-direction: column;
    gap: 2px;
    align-items: flex-start;
  }
  
  .col-value .th,
  .col-amount .th,
  .col-profit .th {
    align-items: flex-end;
  }
  
  .header-top {
    font-size: 9px;
    font-weight: 600;
    color: var(--text-muted);
    line-height: 1.2;
  }
  
  .header-bottom {
    font-size: 8px;
    color: var(--text-muted);
    opacity: 0.7;
    line-height: 1.2;
  }
  
  .td {
    padding: 8px 6px;
    font-size: 11px;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  
  .cell-top {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.3;
  }
  
  .cell-bottom {
    font-size: 10px;
    color: var(--text-muted);
    line-height: 1.3;
  }
  
  .col-type .td,
  .col-type {
    align-items: flex-start;
  }
  
  .col-value .td,
  .col-value,
  .col-amount .td,
  .col-amount,
  .col-profit .td,
  .col-profit {
    align-items: flex-end;
    text-align: right;
  }
  
  .col-profit .cell-top {
    font-weight: 600;
  }
  
  .col-profit .cell-top.positive {
    color: var(--accent-green);
  }
  
  .col-profit .cell-top.negative {
    color: var(--accent-red);
  }
  
  .col-profit .cell-bottom.positive {
    color: var(--accent-green);
  }
  
  .col-profit .cell-bottom.negative {
    color: var(--accent-red);
  }
  
  .detail-row {
    grid-template-columns: 1fr 80px 80px;
  }
  
  .position-detail-table .detail-row {
    grid-template-columns: 1fr 80px 80px;
  }
  
  .detail-col.date,
  .detail-col.price,
  .detail-col.value {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 8px 6px;
    font-size: 11px;
  }
  
  .detail-col.date {
    align-items: flex-start;
  }
  
  .detail-col.price,
  .detail-col.value {
    align-items: flex-end;
    text-align: right;
  }
  
  .detail-col .cell-top.buy {
    color: var(--accent-green);
    font-weight: 600;
  }
  
  .detail-col .cell-top.sell {
    color: var(--accent-red);
    font-weight: 600;
  }
  
  .detail-col .cell-bottom.positive {
    color: var(--accent-green);
  }
  
  .detail-col .cell-bottom.negative {
    color: var(--accent-red);
  }
}

.import-modal {
  width: 400px;
  max-width: 90vw;
}

.import-step {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 6px;
}

.file-path {
  flex: 1;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 8px 12px;
  background: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-select-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--accent-blue);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.file-select-btn:hover {
  opacity: 0.9;
}

.import-instructions {
  padding: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 6px;
}

.instruction-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-btn {
  background: none;
  border: none;
  color: var(--accent-blue);
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.help-btn:hover {
  opacity: 1;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.help-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  background: var(--bg-primary);
  border-radius: 4px;
  font-size: 10px;
}

.help-row.optional {
  opacity: 0.7;
}

.help-label {
  font-weight: 600;
  color: var(--accent-blue);
  min-width: 40px;
}

.help-row.optional .help-label {
  color: var(--text-muted);
}

.help-names {
  color: var(--text-secondary);
}

.instruction-text {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.import-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.import-count {
  font-size: 11px;
  color: var(--accent-blue);
  font-weight: 500;
}

.import-preview-table {
  overflow-y: auto;
  max-height: 240px;
  border: 1px solid var(--border-light);
  border-radius: 4px;
}

.import-preview-table table {
  width: 100%;
  border-collapse: collapse;
}

.import-preview-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.import-preview-table th,
.import-preview-table td {
  padding: 8px 10px;
  text-align: left;
  font-size: 11px;
  border-bottom: 1px solid var(--border-light);
}

.import-preview-table th {
  background: var(--bg-tertiary);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.import-preview-table td {
  color: var(--text-primary);
}

.import-preview-table tr:last-child td {
  border-bottom: none;
}
</style>
