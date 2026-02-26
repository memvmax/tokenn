<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStockApi } from '../composables/useStockApi'

const props = defineProps({
  t: {
    type: Function,
    required: true
  },
  formatAmount: {
    type: Function,
    required: true
  }
})

const { 
  loading: stockLoading, 
  fetchStockPrice, 
  fetchMultipleStockPrices, 
  searchStock,
  convertSymbol 
} = useStockApi()

const activeTab = ref('profit')
const showMarketDropdown = ref(false)
const showAddDropdown = ref(false)
const showHistory = ref(false)
const showAddModal = ref(false)
const selectedStockCode = ref(null)
const selectedCategoryCode = ref(null)
const positionViewType = ref('industry')
const sortState = ref({ field: null, order: 0 })
const positionSortState = ref({ field: null, order: 0 })
const selectedMarkets = ref(['A股', '港股', '美股'])
const searchSuggestions = ref([])
const showSuggestions = ref(false)
const priceLoading = ref(false)

const markets = [
  { id: 'A股', name: 'A股', nameEn: 'A-SHARE' },
  { id: '港股', nameEn: 'HK STOCK', name: '港股' },
  { id: '美股', nameEn: 'US STOCK', name: '美股' }
]

const profitData = ref([
  { 
    code: '600519', 
    name: '贵州茅台', 
    market: 'A股', 
    buyPrice: 1500.10, 
    currentPrice: 1680.00, 
    shares: 100, 
    profit: 17990.00, 
    profitPercent: 12.0,
    transactions: [
      { type: 'buy', price: 1450.00, quantity: 50, date: '2024-01-10', commission: 5.00 },
      { type: 'buy', price: 1550.00, quantity: 50, date: '2024-02-15', commission: 5.00 },
    ]
  },
  { 
    code: '000858', 
    name: '五粮液', 
    market: 'A股', 
    buyPrice: 180.03, 
    currentPrice: 165.00, 
    shares: 200, 
    profit: -3006.00, 
    profitPercent: -8.3,
    transactions: [
      { type: 'buy', price: 175.00, quantity: 100, date: '2024-01-05', commission: 3.00 },
      { type: 'buy', price: 185.00, quantity: 100, date: '2024-02-20', commission: 3.00 },
    ]
  },
  { 
    code: '00700', 
    name: '腾讯控股', 
    market: '港股', 
    buyPrice: 350.20, 
    currentPrice: 380.00, 
    shares: 100, 
    profit: 2980.00, 
    profitPercent: 8.5,
    transactions: [
      { type: 'buy', price: 340.00, quantity: 50, date: '2024-01-15', commission: 10.00 },
      { type: 'buy', price: 360.00, quantity: 50, date: '2024-03-01', commission: 10.00 },
    ]
  },
  { 
    code: '09988', 
    name: '阿里巴巴', 
    market: '港股', 
    buyPrice: 120.08, 
    currentPrice: 95.00, 
    shares: 150, 
    profit: -3762.00, 
    profitPercent: -20.9,
    transactions: [
      { type: 'buy', price: 110.00, quantity: 100, date: '2024-01-20', commission: 8.00 },
      { type: 'buy', price: 130.00, quantity: 50, date: '2024-02-25', commission: 4.00 },
    ]
  },
  { 
    code: 'AAPL', 
    name: 'Apple Inc.', 
    market: '美股', 
    buyPrice: 150.04, 
    currentPrice: 178.50, 
    shares: 100, 
    profit: 2846.00, 
    profitPercent: 19.0,
    transactions: [
      { type: 'buy', price: 145.00, quantity: 50, date: '2024-01-08', commission: 2.00 },
      { type: 'buy', price: 155.00, quantity: 50, date: '2024-02-12', commission: 2.00 },
    ]
  },
  { 
    code: 'TSLA', 
    name: 'Tesla Inc.', 
    market: '美股', 
    buyPrice: 200.05, 
    currentPrice: 185.00, 
    shares: 50, 
    profit: -752.50, 
    profitPercent: -7.5,
    transactions: [
      { type: 'buy', price: 190.00, quantity: 30, date: '2024-01-25', commission: 1.50 },
      { type: 'buy', price: 210.00, quantity: 20, date: '2024-03-05', commission: 1.00 },
    ]
  },
  { 
    code: 'NVDA', 
    name: 'NVIDIA Corp.', 
    market: '美股', 
    buyPrice: 300.05, 
    currentPrice: 450.00, 
    shares: 30, 
    profit: 4498.50, 
    profitPercent: 50.0,
    transactions: [
      { type: 'buy', price: 280.00, quantity: 20, date: '2024-01-12', commission: 1.00 },
      { type: 'buy', price: 320.00, quantity: 10, date: '2024-02-28', commission: 0.50 },
    ]
  },
  { 
    code: 'MSFT', 
    name: 'Microsoft Corp.', 
    market: '美股', 
    buyPrice: 280.05, 
    currentPrice: 320.00, 
    shares: 80, 
    profit: 3196.00, 
    profitPercent: 14.3,
    transactions: [
      { type: 'buy', price: 270.00, quantity: 40, date: '2024-01-18', commission: 2.00 },
      { type: 'buy', price: 290.00, quantity: 40, date: '2024-02-22', commission: 2.00 },
    ]
  },
])

const positionData = ref([
  { code: '600519', name: '贵州茅台', market: 'A股', category1: 'consumption', category2: 'dividend', targetPercent: 15, currentPercent: 12.5, value: 168000.00 },
  { code: '000858', name: '五粮液', market: 'A股', category1: 'consumption', category2: 'dividend', targetPercent: 10, currentPercent: 8.25, value: 33000.00 },
  { code: '00700', name: '腾讯控股', market: '港股', category1: 'technology', category2: 'growth', targetPercent: 15, currentPercent: 9.5, value: 38000.00 },
  { code: '09988', name: '阿里巴巴', market: '港股', category1: 'technology', category2: 'value', targetPercent: 10, currentPercent: 3.56, value: 14250.00 },
  { code: 'AAPL', name: 'Apple Inc.', market: '美股', category1: 'technology', category2: 'growth', targetPercent: 20, currentPercent: 14.4, value: 17850.00 },
  { code: 'TSLA', name: 'Tesla Inc.', market: '美股', category1: 'technology', category2: 'hot', targetPercent: 10, currentPercent: 4.63, value: 9250.00 },
  { code: 'NVDA', name: 'NVIDIA Corp.', market: '美股', category1: 'technology', category2: 'hot', targetPercent: 15, currentPercent: 10.8, value: 13500.00 },
  { code: 'MSFT', name: 'Microsoft Corp.', market: '美股', category1: 'technology', category2: 'bluechip', targetPercent: 15, currentPercent: 20.48, value: 25600.00 },
])

const filteredProfitData = computed(() => {
  let data = profitData.value.filter(item => selectedMarkets.value.includes(item.market))
  
  if (sortState.value.field && sortState.value.order !== 0) {
    const field = sortState.value.field
    const order = sortState.value.order
    
    data = [...data].sort((a, b) => {
      let valueA, valueB
      
      if (field === 'value') {
        valueA = a.currentPrice * a.shares
        valueB = b.currentPrice * b.shares
      } else if (field === 'profit') {
        valueA = a.profit
        valueB = b.profit
      } else if (field === 'change') {
        valueA = a.profitPercent
        valueB = b.profitPercent
      }
      
      if (order === 1) {
        return valueB - valueA
      } else {
        return valueA - valueB
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

const filteredPositionData = computed(() => {
  return positionData.value.filter(item => selectedMarkets.value.includes(item.market))
})

const totalProfit = computed(() => {
  return filteredProfitData.value.reduce((sum, item) => sum + item.profit, 0)
})

const totalProfitPercent = computed(() => {
  const totalCost = filteredProfitData.value.reduce((sum, item) => sum + item.buyPrice * item.shares, 0)
  return totalCost > 0 ? (totalProfit.value / totalCost * 100) : 0
})

const toggleMarket = (marketId) => {
  const index = selectedMarkets.value.indexOf(marketId)
  if (index > -1) {
    if (selectedMarkets.value.length > 1) {
      selectedMarkets.value.splice(index, 1)
    }
  } else {
    selectedMarkets.value.push(marketId)
  }
}

const toggleMarketDropdown = () => {
  showMarketDropdown.value = !showMarketDropdown.value
}

const closeMarketDropdown = () => {
  showMarketDropdown.value = false
}

const toggleAddDropdown = () => {
  showAddDropdown.value = !showAddDropdown.value
}

const closeAddDropdown = () => {
  showAddDropdown.value = false
}

const importCSV = () => {
  closeAddDropdown()
}

const manualAdd = () => {
  closeAddDropdown()
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
  editingTransaction.value = null
}

const newOrder = ref({
  stockInput: '',
  tradeType: 'buy',
  price: '',
  quantity: '',
  commission: '',
  tax: '',
  date: new Date().toISOString().split('T')[0]
})

const editingTransaction = ref(null)
const editingStock = ref(null)
const showEditStockModal = ref(false)

const category1Options = [
  { id: 'consumption', name: '消费', nameEn: 'Consumption' },
  { id: 'technology', name: '科技', nameEn: 'Technology' },
  { id: 'finance', name: '金融', nameEn: 'Finance' },
  { id: 'healthcare', name: '医疗', nameEn: 'Healthcare' },
  { id: 'energy', name: '能源', nameEn: 'Energy' },
  { id: 'materials', name: '材料', nameEn: 'Materials' },
  { id: 'industrial', name: '工业', nameEn: 'Industrial' },
  { id: 'realestate', name: '地产', nameEn: 'Real Estate' },
]

const category2Options = [
  { id: 'dividend', name: '高股息', nameEn: 'High Dividend' },
  { id: 'growth', name: '成长', nameEn: 'Growth' },
  { id: 'hot', name: '热点进攻', nameEn: 'Hot Topic' },
  { id: 'value', name: '价值', nameEn: 'Value' },
  { id: 'bluechip', name: '蓝筹', nameEn: 'Blue Chip' },
]

const submitOrder = async () => {
  if (editingTransaction.value) {
    const stock = profitData.value.find(item => item.code === editingTransaction.value.stockCode)
    if (stock && stock.transactions) {
      const trans = stock.transactions[editingTransaction.value.transIndex]
      if (trans) {
        trans.type = newOrder.value.tradeType
        trans.price = parseFloat(newOrder.value.price) || 0
        trans.quantity = parseInt(newOrder.value.quantity) || 0
        trans.commission = parseFloat(newOrder.value.commission) || 0
        trans.date = newOrder.value.date
        recalculateStock(stock)
      }
    }
  } else {
    const input = newOrder.value.stockInput.trim()
    if (!input) return
    
    const parts = input.split(/\s+/)
    const code = parts[0]
    const name = parts.slice(1).join(' ') || code
    
    const price = parseFloat(newOrder.value.price) || 0
    const quantity = parseInt(newOrder.value.quantity) || 0
    const commission = parseFloat(newOrder.value.commission) || 0
    const date = newOrder.value.date || new Date().toISOString().split('T')[0]
    
    let market = '美股'
    if (code.match(/^(6|60|68)\d+$/) || code.startsWith('60') || code.startsWith('68')) {
      market = 'A股'
    } else if (code.match(/^(0|00|30)\d+$/) || code.startsWith('00') || code.startsWith('30')) {
      market = 'A股'
    } else if (code.match(/^0\d{4}$/) || code.match(/^\d{5}$/)) {
      market = '港股'
    }
    
    let existingStock = profitData.value.find(item => item.code === code)
    
    if (!existingStock) {
      let currentPrice = price
      
      try {
        const priceData = await fetchStockPrice(code, market)
        if (priceData) {
          currentPrice = priceData.price
        }
      } catch (e) {
        console.log('Could not fetch current price, using buy price')
      }
      
      existingStock = {
        code,
        name,
        market,
        buyPrice: price,
        currentPrice,
        shares: 0,
        profit: 0,
        profitPercent: 0,
        transactions: [],
        category1: '',
        category2: ''
      }
      profitData.value.unshift(existingStock)
    }
    
    existingStock.transactions.push({
      type: newOrder.value.tradeType,
      price,
      quantity,
      date,
      commission
    })
    
    recalculateStock(existingStock)
  }
  
  closeAddModal()
  newOrder.value = {
    stockInput: '',
    tradeType: 'buy',
    price: '',
    quantity: '',
    commission: '',
    tax: '',
    date: new Date().toISOString().split('T')[0]
  }
}

const editTransaction = () => {
  if (contextMenuType.value === 'transaction' && contextMenuData.value) {
    const stock = profitData.value.find(item => item.code === contextMenuData.value.stockCode)
    if (stock && stock.transactions) {
      const trans = stock.transactions[contextMenuData.value.transIndex]
      if (trans) {
        editingTransaction.value = {
          stockCode: contextMenuData.value.stockCode,
          transIndex: contextMenuData.value.transIndex
        }
        newOrder.value = {
          stockInput: `${stock.code} ${stock.name}`,
          tradeType: trans.type,
          price: trans.price.toString(),
          quantity: trans.quantity.toString(),
          commission: trans.commission.toString(),
          tax: '0',
          date: trans.date || new Date().toISOString().split('T')[0]
        }
        showAddModal.value = true
      }
    }
  }
  closeContextMenu()
}

const editStock = () => {
  if (contextMenuType.value === 'stock' && contextMenuData.value) {
    editingStock.value = { ...contextMenuData.value }
    showEditStockModal.value = true
  }
  closeContextMenu()
}

const saveStockEdit = () => {
  if (editingStock.value) {
    const stock = profitData.value.find(item => item.code === editingStock.value.code)
    if (stock) {
      stock.category1 = editingStock.value.category1 || ''
      stock.category2 = editingStock.value.category2 || ''
    }
  }
  showEditStockModal.value = false
  editingStock.value = null
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
}

const selectStock = (code) => {
  if (selectedStockCode.value === code) {
    selectedStockCode.value = null
  } else {
    selectedStockCode.value = code
  }
}

const getSelectedStock = (code) => {
  return filteredProfitData.value.find(item => item.code === code)
}

const togglePositionViewType = () => {
  positionViewType.value = positionViewType.value === 'industry' ? 'style' : 'industry'
  selectedCategoryCode.value = null
}

const showContextMenu = ref(false)
const contextMenuType = ref('')
const contextMenuData = ref(null)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const longPressTimer = ref(null)

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

const deleteStock = (code) => {
  profitData.value = profitData.value.filter(item => item.code !== code)
  if (selectedStockCode.value === code) {
    selectedStockCode.value = null
  }
  closeContextMenu()
}

const deleteTransaction = (stockCode, transIndex) => {
  const stock = profitData.value.find(item => item.code === stockCode)
  if (stock && stock.transactions) {
    stock.transactions.splice(transIndex, 1)
    if (stock.transactions.length === 0) {
      deleteStock(stockCode)
    } else {
      recalculateStock(stock)
    }
  }
  closeContextMenu()
}

const recalculateStock = (stock) => {
  if (!stock.transactions || stock.transactions.length === 0) return
  
  let totalCost = 0
  let totalShares = 0
  
  stock.transactions.forEach(trans => {
    if (trans.type === 'buy') {
      totalCost += trans.price * trans.quantity + trans.commission
      totalShares += trans.quantity
    } else {
      totalCost -= trans.price * trans.quantity - trans.commission
      totalShares -= trans.quantity
    }
  })
  
  stock.shares = totalShares
  stock.buyPrice = totalShares > 0 ? totalCost / totalShares : 0
  stock.profit = stock.currentPrice * stock.shares - totalCost
  stock.profitPercent = totalCost > 0 ? (stock.profit / totalCost * 100) : 0
}

let searchTimeout = null

const handleStockInput = async (value) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (!value || value.length < 1) {
    searchSuggestions.value = []
    showSuggestions.value = false
    return
  }
  
  searchTimeout = setTimeout(async () => {
    const results = await searchStock(value)
    searchSuggestions.value = results.slice(0, 8)
    showSuggestions.value = results.length > 0
  }, 300)
}

const selectSuggestion = (suggestion) => {
  newOrder.value.stockInput = `${suggestion.symbol} ${suggestion.name}`
  
  let market = '美股'
  if (suggestion.exchange && suggestion.exchange.includes('SH')) {
    market = 'A股'
  } else if (suggestion.exchange && suggestion.exchange.includes('SZ')) {
    market = 'A股'
  } else if (suggestion.exchange && suggestion.exchange.includes('HK')) {
    market = '港股'
  }
  
  showSuggestions.value = false
  searchSuggestions.value = []
}

const refreshPrices = async () => {
  if (profitData.value.length === 0) return
  
  priceLoading.value = true
  
  try {
    const stocks = profitData.value.map(item => ({
      code: item.code,
      market: item.market
    }))
    
    console.log('Refreshing prices for stocks:', stocks)
    
    const prices = await fetchMultipleStockPrices(stocks)
    
    console.log('Received prices:', prices)
    
    prices.forEach(priceData => {
      const stock = profitData.value.find(s => s.code === priceData.symbol)
      console.log(`Looking for stock ${priceData.symbol}, found:`, stock ? stock.code : 'not found')
      if (stock) {
        stock.currentPrice = priceData.price
        stock.profit = (priceData.price - stock.buyPrice) * stock.shares
        stock.profitPercent = stock.buyPrice > 0 
          ? ((priceData.price - stock.buyPrice) / stock.buyPrice * 100) 
          : 0
        console.log(`Updated ${stock.code}: currentPrice=${stock.currentPrice}`)
      }
    })
  } catch (e) {
    console.error('Failed to refresh prices:', e)
  } finally {
    priceLoading.value = false
  }
}

onMounted(() => {
  refreshPrices()
})

const selectCategory = (code) => {
  if (selectedCategoryCode.value === code) {
    selectedCategoryCode.value = null
  } else {
    selectedCategoryCode.value = code
  }
}

const positionSummaryData = computed(() => {
  const type = positionViewType.value
  const categoryMap = new Map()
  
  filteredPositionData.value.forEach(item => {
    const category = type === 'industry' ? item.category1 : item.category2
    if (!category) return
    
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { 
        code: category, 
        name: getCategoryLabel(type === 'industry' ? category1Options : category2Options, category),
        currentValue: 0, 
        targetPercent: 0,
        count: 0,
        stocks: []
      })
    }
    
    const cat = categoryMap.get(category)
    cat.currentValue += item.value
    cat.targetPercent += item.targetPercent
    cat.count += 1
    cat.stocks.push(item)
  })
  
  const totalValue = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.currentValue, 0)
  
  let data = Array.from(categoryMap.values()).map(cat => ({
    ...cat,
    currentPercent: totalValue > 0 ? (cat.currentValue / totalValue * 100) : 0,
    avgTargetPercent: cat.targetPercent / cat.count,
    deviation: totalValue > 0 ? (cat.currentValue / totalValue * 100) - (cat.targetPercent / cat.count) : 0
  }))
  
  if (positionSortState.value.field && positionSortState.value.order !== 0) {
    const field = positionSortState.value.field
    const order = positionSortState.value.order
    
    data = [...data].sort((a, b) => {
      let valueA, valueB
      
      if (field === 'current') {
        valueA = a.currentPercent
        valueB = b.currentPercent
      } else if (field === 'target') {
        valueA = a.avgTargetPercent
        valueB = b.avgTargetPercent
      } else if (field === 'deviation') {
        valueA = a.deviation
        valueB = b.deviation
      }
      
      if (order === 1) {
        return valueB - valueA
      } else {
        return valueA - valueB
      }
    })
  } else {
    data.sort((a, b) => b.currentValue - a.currentValue)
  }
  
  return data
})

const togglePositionSort = (field) => {
  if (positionSortState.value.field === field) {
    if (positionSortState.value.order === 0) {
      positionSortState.value = { field, order: 1 }
    } else if (positionSortState.value.order === 1) {
      positionSortState.value = { field, order: 2 }
    } else {
      positionSortState.value = { field: null, order: 0 }
    }
  } else {
    positionSortState.value = { field, order: 1 }
  }
}

const getPositionSortClass = (field) => {
  if (positionSortState.value.field === field) {
    return positionSortState.value.order === 1 ? 'sort-desc' : positionSortState.value.order === 2 ? 'sort-asc' : ''
  }
  return ''
}

const historyData = ref([
  { code: 'BABA', name: 'Alibaba Group', market: '美股', buyPrice: 75.00, currentPrice: 85.00, shares: 100, profit: 2500.00, profitPercent: 15.5 },
  { code: '01810', name: '小米集团', market: '港股', buyPrice: 16.00, currentPrice: 18.50, shares: 200, profit: 1200.00, profitPercent: 8.2 },
])

const totalHistoryProfit = computed(() => {
  return historyData.value.reduce((sum, item) => sum + item.profit, 0)
})

const totalHistoryProfitPercent = computed(() => {
  const totalCost = historyData.value.reduce((sum, item) => sum + item.buyPrice * item.shares, 0)
  return totalCost > 0 ? (totalHistoryProfit.value / totalCost * 100) : 0
})

const formatPrice = (value) => {
  return value.toFixed(2)
}

const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0'
  return Math.round(value).toLocaleString('en-US')
}

const getProfitClass = (value) => {
  return value >= 0 ? 'positive' : 'negative'
}

const getDiffClass = (value) => {
  if (value > 5) return 'overweight'
  if (value < -5) return 'underweight'
  return 'balanced'
}

const getMarketLabel = (market) => {
  const locale = localStorage.getItem('locale') || 'zh-CN'
  const m = markets.find(item => item.id === market)
  return locale === 'zh-CN' ? m?.name : m?.nameEn
}

const getCategoryLabel = (options, id) => {
  const locale = localStorage.getItem('locale') || 'zh-CN'
  const opt = options.find(item => item.id === id)
  return locale === 'zh-CN' ? opt?.name : opt?.nameEn
}

const labels = {
  profitManagement: { 'zh-CN': '收益管理', 'en-US': 'PROFIT' },
  positionDistribution: { 'zh-CN': '仓位分布', 'en-US': 'POSITION' },
  profitMonitor: { 'zh-CN': '收益监控', 'en-US': 'PROFIT MONITOR' },
  totalProfit: { 'zh-CN': '总收益', 'en-US': 'TOTAL PROFIT' },
  positionConfig: { 'zh-CN': '仓位配置', 'en-US': 'POSITION CONFIG' },
  totalValue: { 'zh-CN': '总市值', 'en-US': 'TOTAL VALUE' },
  code: { 'zh-CN': '代码', 'en-US': 'CODE' },
  name: { 'zh-CN': '名称', 'en-US': 'NAME' },
  market: { 'zh-CN': '市场', 'en-US': 'MARKET' },
  buyPrice: { 'zh-CN': '买入价', 'en-US': 'BUY PRICE' },
  currentPrice: { 'zh-CN': '现价', 'en-US': 'CURRENT' },
  shares: { 'zh-CN': '股数', 'en-US': 'SHARES' },
  profit: { 'zh-CN': '收益', 'en-US': 'PROFIT' },
  changePercent: { 'zh-CN': '涨幅', 'en-US': 'CHANGE' },
  targetPosition: { 'zh-CN': '目标仓位', 'en-US': 'TARGET' },
  currentPosition: { 'zh-CN': '当前仓位', 'en-US': 'CURRENT' },
  marketValue: { 'zh-CN': '市值', 'en-US': 'VALUE' },
  tradeAmount: { 'zh-CN': '交易额', 'en-US': 'AMOUNT' },
  total: { 'zh-CN': '总计', 'en-US': 'TOTAL' },
  deviation: { 'zh-CN': '偏离度', 'en-US': 'DEVIATION' },
  selectMarket: { 'zh-CN': '选择市场', 'en-US': 'SELECT MARKET' },
  addOrder: { 'zh-CN': '添加订单', 'en-US': 'ADD ORDER' },
  importCSV: { 'zh-CN': '导入CSV', 'en-US': 'IMPORT CSV' },
  manualAdd: { 'zh-CN': '手动添加', 'en-US': 'MANUAL ADD' },
  history: { 'zh-CN': '历史记录', 'en-US': 'HISTORY' },
  cleared: { 'zh-CN': '已清仓', 'en-US': 'CLEARED' },
  addOrderTitle: { 'zh-CN': '添加订单', 'en-US': 'ADD ORDER' },
  editOrderTitle: { 'zh-CN': '修改订单', 'en-US': 'EDIT ORDER' },
  stockCode: { 'zh-CN': '股票代码/名称', 'en-US': 'STOCK CODE/NAME' },
  stockCodePlaceholder: { 'zh-CN': '输入股票代码或名称', 'en-US': 'Enter stock code or name' },
  tradeType: { 'zh-CN': '交易类型', 'en-US': 'TRADE TYPE' },
  buy: { 'zh-CN': '买入', 'en-US': 'BUY' },
  sell: { 'zh-CN': '卖出', 'en-US': 'SELL' },
  price: { 'zh-CN': '价格', 'en-US': 'PRICE' },
  quantity: { 'zh-CN': '数量', 'en-US': 'QUANTITY' },
  commission: { 'zh-CN': '佣金', 'en-US': 'COMMISSION' },
  tax: { 'zh-CN': '税费', 'en-US': 'TAX' },
  tradeDate: { 'zh-CN': '交易日期', 'en-US': 'TRADE DATE' },
  editStockTitle: { 'zh-CN': '编辑股票', 'en-US': 'EDIT STOCK' },
  category1: { 'zh-CN': '行业分类', 'en-US': 'INDUSTRY' },
  category2: { 'zh-CN': '投资风格', 'en-US': 'STYLE' },
  confirm: { 'zh-CN': '确认', 'en-US': 'CONFIRM' },
  cancel: { 'zh-CN': '取消', 'en-US': 'CANCEL' },
  select: { 'zh-CN': '请选择', 'en-US': 'SELECT' },
  transactionDetail: { 'zh-CN': '交易明细', 'en-US': 'TRANSACTION DETAIL' },
  tradeType: { 'zh-CN': '类型', 'en-US': 'TYPE' },
  tradeDate: { 'zh-CN': '日期', 'en-US': 'DATE' },
  commissionLabel: { 'zh-CN': '佣金', 'en-US': 'COMM' },
  commissionLabelShort: { 'zh-CN': '佣', 'en-US': 'COMM' },
  industry: { 'zh-CN': '行业', 'en-US': 'INDUSTRY' },
  style: { 'zh-CN': '风格', 'en-US': 'STYLE' },
  currentPercent: { 'zh-CN': '当前占比', 'en-US': 'CURRENT' },
  targetPercent: { 'zh-CN': '目标占比', 'en-US': 'TARGET' },
  deviation: { 'zh-CN': '偏离度', 'en-US': 'DEVIATION' },
  stocks: { 'zh-CN': '持仓明细', 'en-US': 'HOLDINGS' },
  edit: { 'zh-CN': '修改', 'en-US': 'EDIT' },
  delete: { 'zh-CN': '删除', 'en-US': 'DELETE' },
}

const getLabel = (key) => {
  const locale = localStorage.getItem('locale') || 'zh-CN'
  return labels[key]?.[locale] || key
}

const totalStockValue = computed(() => {
  return filteredProfitData.value.reduce((sum, item) => sum + item.currentPrice * item.shares, 0)
})

defineExpose({
  activeTab,
  totalStockValue,
  totalProfit
})
</script>

<template>
  <div class="invest-container">
    <div class="invest-tabs">
      <button 
        class="tab-btn" 
        :class="{ 'active': activeTab === 'profit' }"
        @click="activeTab = 'profit'"
      >
        <i class="fas fa-chart-line"></i>
        <span>{{ getLabel('profitManagement') }}</span>
      </button>
      <button 
        class="tab-btn" 
        :class="{ 'active': activeTab === 'position' }"
        @click="activeTab = 'position'"
      >
        <i class="fas fa-pie-chart"></i>
        <span>{{ getLabel('positionDistribution') }}</span>
      </button>

      <div class="market-selector">
        <button class="market-btn icon-only" @click="toggleMarketDropdown" :class="{ 'active': showMarketDropdown }">
          <i class="fas fa-filter"></i>
        </button>
        <div class="market-dropdown" v-if="showMarketDropdown" @click.stop>
          <label class="market-option" v-for="market in markets" :key="market.id">
            <input 
              type="checkbox" 
              :checked="selectedMarkets.includes(market.id)"
              @change="toggleMarket(market.id)"
            >
            <span class="checkmark"></span>
            <span class="market-name">{{ getMarketLabel(market.id) }}</span>
          </label>
        </div>
        <div class="dropdown-overlay" v-if="showMarketDropdown" @click="closeMarketDropdown"></div>
      </div>

      <div class="add-selector">
        <button class="action-btn" @click="toggleAddDropdown" :class="{ 'active': showAddDropdown }">
          <i class="fas fa-plus"></i>
        </button>
        <div class="add-dropdown" v-if="showAddDropdown" @click.stop>
          <button class="add-option" @click="importCSV">
            <i class="fas fa-file-csv"></i>
            <span>{{ getLabel('importCSV') }}</span>
          </button>
          <button class="add-option" @click="manualAdd">
            <i class="fas fa-keyboard"></i>
            <span>{{ getLabel('manualAdd') }}</span>
          </button>
        </div>
        <div class="dropdown-overlay" v-if="showAddDropdown" @click="closeAddDropdown"></div>
      </div>

      <button class="action-btn" @click="toggleHistory" :class="{ 'active': showHistory }">
        <i class="fas fa-history"></i>
      </button>

      <button class="action-btn refresh-btn" @click="refreshPrices" :disabled="priceLoading" :class="{ 'loading': priceLoading }">
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': priceLoading }"></i>
      </button>
    </div>

    <div class="invest-content">
      <div v-if="activeTab === 'profit'" class="profit-section">
        <div class="section-header">
          <span class="section-title">{{ getLabel('profitMonitor') }}</span>
          <div class="section-summary">
            <span class="summary-label">{{ getLabel('totalProfit') }}</span>
            <span class="summary-value" :class="getProfitClass(totalProfit)">
              {{ totalProfit >= 0 ? '+' : '' }}{{ formatNumber(totalProfit) }} CNY
            </span>
            <span class="summary-percent" :class="getProfitClass(totalProfit)">
              ({{ totalProfitPercent >= 0 ? '+' : '' }}{{ totalProfitPercent.toFixed(2) }}%)
            </span>
          </div>
        </div>
        
        <div class="data-table">
          <div class="table-header">
            <div class="th col-code">{{ getLabel('code') }}</div>
            <div class="th col-name">{{ getLabel('name') }}</div>
            <div class="th col-price">{{ getLabel('buyPrice') }}</div>
            <div class="th col-price">{{ getLabel('currentPrice') }}</div>
            <div class="th col-shares">{{ getLabel('shares') }}</div>
            <div class="th col-value sortable" :class="getSortClass('value')" @click="toggleSort('value')">{{ getLabel('marketValue') }}</div>
            <div class="th col-profit sortable" :class="getSortClass('profit')" @click="toggleSort('profit')">{{ getLabel('profit') }}</div>
            <div class="th col-percent sortable" :class="getSortClass('change')" @click="toggleSort('change')">{{ getLabel('changePercent') }}</div>
          </div>
          <div class="table-body">
            <template v-for="item in filteredProfitData" :key="item.code">
              <div 
                class="table-row" 
                :class="{ 'selected': selectedStockCode === item.code }"
                @click="selectStock(item.code)"
                @touchstart="startLongPress($event, 'stock', item)"
                @touchend="endLongPress"
                @touchmove="endLongPress"
                @mousedown="startLongPress($event, 'stock', item)"
                @mouseup="endLongPress"
                @mouseleave="endLongPress"
              >
                <div class="td col-code">{{ item.code }}</div>
                <div class="td col-name">{{ item.name }}</div>
                <div class="td col-price font-numeric">{{ formatNumber(item.buyPrice) }}</div>
                <div class="td col-price font-numeric">{{ formatNumber(item.currentPrice) }}</div>
                <div class="td col-shares font-numeric">{{ item.shares }}</div>
                <div class="td col-value font-numeric">{{ formatNumber(item.currentPrice * item.shares) }}</div>
                <div class="td col-profit font-numeric" :class="getProfitClass(item.profit)">
                  {{ item.profit >= 0 ? '+' : '' }}{{ formatNumber(item.profit) }}
                </div>
                <div class="td col-percent font-numeric" :class="getProfitClass(item.profit)">
                  {{ item.profitPercent >= 0 ? '+' : '' }}{{ item.profitPercent.toFixed(1) }}%
                </div>
              </div>
              
              <div v-if="selectedStockCode === item.code && item.transactions" class="transaction-detail">
                <div class="transaction-table">
                  <div class="trans-row trans-header profit-trans">
                    <div class="trans-col date">{{ getLabel('tradeDate') }}</div>
                    <div class="trans-col type">{{ getLabel('tradeType') }}</div>
                    <div class="trans-col price">{{ getLabel('price') }}</div>
                    <div class="trans-col qty">{{ getLabel('shares') }}</div>
                    <div class="trans-col comm">{{ getLabel('commissionLabel') }}</div>
                    <div class="trans-col amount">{{ getLabel('total') }}</div>
                  </div>
                  <div class="trans-row profit-trans" v-for="(trans, idx) in item.transactions" :key="idx"
                    @touchstart="startLongPress($event, 'transaction', { stockCode: item.code, transIndex: idx })"
                    @touchend="endLongPress"
                    @touchmove="endLongPress"
                    @mousedown="startLongPress($event, 'transaction', { stockCode: item.code, transIndex: idx })"
                    @mouseup="endLongPress"
                    @mouseleave="endLongPress"
                  >
                    <div class="trans-col date">{{ trans.date }}</div>
                    <div class="trans-col type" :class="trans.type === 'buy' ? 'buy' : 'sell'">
                      {{ trans.type === 'buy' ? getLabel('buy') : getLabel('sell') }}
                    </div>
                    <div class="trans-col price font-numeric">{{ formatNumber(trans.price) }}</div>
                    <div class="trans-col qty font-numeric">{{ trans.quantity }}</div>
                    <div class="trans-col comm font-numeric">{{ trans.commission }}</div>
                    <div class="trans-col amount font-numeric">{{ formatNumber(trans.price * trans.quantity + trans.commission) }}</div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'position'" class="position-section">
        <div class="section-header">
          <span class="section-title">{{ getLabel('positionConfig') }}</span>
          <button class="type-toggle-btn" @click="togglePositionViewType">
            {{ positionViewType === 'industry' ? getLabel('industry') : getLabel('style') }}
            <i class="fas fa-exchange-alt"></i>
          </button>
          <div class="section-summary">
            <span class="summary-label">{{ getLabel('totalValue') }}</span>
            <span class="summary-value">{{ formatNumber(positionSummaryData.reduce((s, i) => s + i.currentValue, 0)) }} CNY</span>
          </div>
        </div>
        
        <div class="data-table">
          <div class="table-header position-header">
            <div class="th col-category">{{ positionViewType === 'industry' ? getLabel('industry') : getLabel('style') }}</div>
            <div class="th col-percent sortable" :class="getPositionSortClass('current')" @click="togglePositionSort('current')">{{ getLabel('currentPercent') }}</div>
            <div class="th col-percent sortable" :class="getPositionSortClass('target')" @click="togglePositionSort('target')">{{ getLabel('targetPercent') }}</div>
            <div class="th col-diff sortable" :class="getPositionSortClass('deviation')" @click="togglePositionSort('deviation')">{{ getLabel('deviation') }}</div>
          </div>
          <div class="table-body">
            <template v-for="item in positionSummaryData" :key="item.code">
              <div 
                class="table-row position-row" 
                :class="{ 'selected': selectedCategoryCode === item.code }"
                @click="selectCategory(item.code)"
              >
                <div class="td col-category">{{ item.name }}</div>
                <div class="td col-percent font-numeric">{{ item.currentPercent.toFixed(1) }}%</div>
                <div class="td col-percent font-numeric">{{ item.avgTargetPercent.toFixed(1) }}%</div>
                <div class="td col-diff font-numeric" :class="getDiffClass(item.deviation)">
                  {{ item.deviation > 0 ? '+' : '' }}{{ item.deviation.toFixed(1) }}%
                </div>
              </div>
              
              <div v-if="selectedCategoryCode === item.code && item.stocks" class="transaction-detail">
                <div class="transaction-table">
                  <div class="trans-row trans-header stock-row">
                    <div class="trans-col code">{{ getLabel('code') }}</div>
                    <div class="trans-col name">{{ getLabel('name') }}</div>
                    <div class="trans-col value">{{ getLabel('marketValue') }}</div>
                  </div>
                  <div class="trans-row stock-row" v-for="stock in item.stocks" :key="stock.code">
                    <div class="trans-col code">{{ stock.code }}</div>
                    <div class="trans-col name">{{ stock.name }}</div>
                    <div class="trans-col value font-numeric">{{ formatNumber(stock.value) }}</div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div v-if="showHistory" class="history-section">
        <div class="section-header">
          <span class="section-title">{{ getLabel('cleared') }}</span>
          <div class="section-summary">
            <span class="summary-label">{{ getLabel('totalProfit') }}</span>
            <span class="summary-value" :class="getProfitClass(totalHistoryProfit)">
              {{ totalHistoryProfit >= 0 ? '+' : '' }}{{ formatAmount(totalHistoryProfit) }} CNY
            </span>
            <span class="summary-percent" :class="getProfitClass(totalHistoryProfit)">
              ({{ totalHistoryProfitPercent >= 0 ? '+' : '' }}{{ totalHistoryProfitPercent.toFixed(2) }}%)
            </span>
          </div>
        </div>
        <div class="data-table">
          <div class="table-header">
            <div class="th col-code">{{ getLabel('code') }}</div>
            <div class="th col-name">{{ getLabel('name') }}</div>
            <div class="th col-market">{{ getLabel('market') }}</div>
            <div class="th col-price">{{ getLabel('buyPrice') }}</div>
            <div class="th col-price">{{ getLabel('currentPrice') }}</div>
            <div class="th col-shares">{{ getLabel('shares') }}</div>
            <div class="th col-profit">{{ getLabel('profit') }}</div>
            <div class="th col-percent">{{ getLabel('changePercent') }}</div>
          </div>
          <div class="table-body">
            <div class="table-row" v-for="item in historyData" :key="item.code">
              <div class="td col-code">{{ item.code }}</div>
              <div class="td col-name">{{ item.name }}</div>
              <div class="td col-market">{{ getMarketLabel(item.market) }}</div>
              <div class="td col-price font-numeric">{{ formatPrice(item.buyPrice) }}</div>
              <div class="td col-price font-numeric">{{ formatPrice(item.currentPrice) }}</div>
              <div class="td col-shares font-numeric">{{ item.shares }}</div>
              <div class="td col-profit font-numeric" :class="getProfitClass(item.profit)">
                {{ item.profit >= 0 ? '+' : '' }}{{ formatAmount(item.profit) }}
              </div>
              <div class="td col-percent font-numeric" :class="getProfitClass(item.profit)">
                {{ item.profitPercent >= 0 ? '+' : '' }}{{ item.profitPercent.toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <span class="modal-title">{{ editingTransaction ? getLabel('editOrderTitle') : getLabel('addOrderTitle') }}</span>
            <button class="modal-close" @click="closeAddModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group stock-input-group">
              <label class="form-label">{{ getLabel('stockCode') }}</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="newOrder.stockInput"
                :placeholder="getLabel('stockCodePlaceholder')"
                @input="handleStockInput($event.target.value)"
                @focus="newOrder.stockInput && handleStockInput(newOrder.stockInput)"
                @blur="setTimeout(() => showSuggestions = false, 200)"
              >
              <div class="suggestions-dropdown" v-if="showSuggestions && searchSuggestions.length > 0">
                <div 
                  class="suggestion-item" 
                  v-for="item in searchSuggestions" 
                  :key="item.symbol"
                  @mousedown="selectSuggestion(item)"
                >
                  <span class="suggestion-symbol">{{ item.symbol }}</span>
                  <span class="suggestion-name">{{ item.name }}</span>
                  <span class="suggestion-exchange">{{ item.exchange }}</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ getLabel('tradeType') }}</label>
              <div class="trade-type-btns">
                <button 
                  class="type-btn buy" 
                  :class="{ 'active': newOrder.tradeType === 'buy' }"
                  @click="newOrder.tradeType = 'buy'"
                >
                  {{ getLabel('buy') }}
                </button>
                <button 
                  class="type-btn sell" 
                  :class="{ 'active': newOrder.tradeType === 'sell' }"
                  @click="newOrder.tradeType = 'sell'"
                >
                  {{ getLabel('sell') }}
                </button>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label class="form-label">{{ getLabel('price') }}</label>
                <input type="number" class="form-input" v-model="newOrder.price" placeholder="0.00">
              </div>
              <div class="form-group half">
                <label class="form-label">{{ getLabel('quantity') }}</label>
                <input type="number" class="form-input" v-model="newOrder.quantity" placeholder="0">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label class="form-label">{{ getLabel('commission') }}</label>
                <input type="number" class="form-input" v-model="newOrder.commission" placeholder="0.00">
              </div>
              <div class="form-group half">
                <label class="form-label">{{ getLabel('tax') }}</label>
                <input type="number" class="form-input" v-model="newOrder.tax" placeholder="0.00">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ getLabel('tradeDate') }}</label>
              <input type="date" class="form-input" v-model="newOrder.date">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeAddModal">{{ getLabel('cancel') }}</button>
            <button class="btn-confirm" @click="submitOrder">{{ getLabel('confirm') }}</button>
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
          <button v-if="contextMenuType === 'stock'" class="context-menu-item" @click="editStock">
            <i class="fas fa-edit"></i>
            <span>{{ getLabel('edit') }}</span>
          </button>
          <button v-if="contextMenuType === 'transaction'" class="context-menu-item" @click="editTransaction">
            <i class="fas fa-edit"></i>
            <span>{{ getLabel('edit') }}</span>
          </button>
          <button class="context-menu-item delete" @click="contextMenuType === 'stock' ? deleteStock(contextMenuData.code) : deleteTransaction(contextMenuData.stockCode, contextMenuData.transIndex)">
            <i class="fas fa-trash"></i>
            <span>{{ getLabel('delete') }}</span>
          </button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showEditStockModal" class="modal-overlay" @click="showEditStockModal = false">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <span class="modal-title">{{ getLabel('editStockTitle') }}</span>
            <button class="modal-close" @click="showEditStockModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="stock-info">
              <span class="stock-code">{{ editingStock?.code }}</span>
              <span class="stock-name">{{ editingStock?.name }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">{{ getLabel('category1') }}</label>
              <select class="form-select" v-model="editingStock.category1">
                <option value="">{{ getLabel('select') }}</option>
                <option v-for="opt in category1Options" :key="opt.id" :value="opt.id">
                  {{ getCategoryLabel(category1Options, opt.id) }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">{{ getLabel('category2') }}</label>
              <select class="form-select" v-model="editingStock.category2">
                <option value="">{{ getLabel('select') }}</option>
                <option v-for="opt in category2Options" :key="opt.id" :value="opt.id">
                  {{ getCategoryLabel(category2Options, opt.id) }}
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showEditStockModal = false">{{ getLabel('cancel') }}</button>
            <button class="btn-confirm" @click="saveStockEdit">{{ getLabel('confirm') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.invest-container {
  margin-top: 16px;
}

.invest-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
}

.market-selector {
  position: relative;
}

.add-selector {
  position: relative;
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

.market-btn.icon-only {
  width: 36px;
  height: 36px;
  padding: 0;
  justify-content: center;
}

.market-btn {
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

.market-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.market-btn.active {
  border-color: #0891b2;
  color: #0891b2;
}

.market-icon {
  font-size: 10px;
  transition: transform 0.15s ease;
}

.market-icon.rotated {
  transform: rotate(180deg);
}

.market-dropdown {
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

.market-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.market-option:hover {
  background: var(--bg-tertiary);
}

.market-option input {
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

.market-option input:checked + .checkmark {
  background: #0891b2;
  border-color: #0891b2;
}

.market-option input:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-size: 10px;
}

.market-name {
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

.history-section {
  margin-top: 16px;
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

.invest-tabs .market-selector {
  margin-left: auto;
}

.invest-content {
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

.section-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.summary-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.summary-percent {
  font-size: 12px;
  font-weight: 500;
}

.data-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 90px 1fr 90px 90px 90px 90px 90px 90px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-light);
}

.table-header.position-header {
  grid-template-columns: 1fr 90px 90px 90px;
}

.type-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1;
  height: 18px;
  box-sizing: border-box;
}

.type-toggle-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.type-toggle-btn i {
  font-size: 9px;
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

.table-row.position-row {
  grid-template-columns: 1fr 90px 90px 90px;
  cursor: pointer;
}

.col-category {
  font-weight: 600;
  color: var(--text-primary);
}

.col-percent {
  justify-content: flex-end;
}

.transaction-detail {
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-light);
  padding: 4px 8px 8px;
}

.transaction-table {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  overflow: hidden;
}

.trans-row {
  display: grid;
  grid-template-columns: 120px 1fr 90px 90px 90px 90px;
  border-bottom: 1px solid var(--border-light);
}

.trans-row.profit-trans {
  grid-template-columns: 120px 1fr 90px 90px 90px 90px;
}

.trans-row.stock-row {
  grid-template-columns: 90px 1fr 90px;
}

.trans-row.stock-row .trans-col.value {
  justify-content: flex-end;
}

.trans-row:last-child {
  border-bottom: none;
}

.trans-row.trans-header {
  background: var(--bg-tertiary);
}

.trans-col {
  padding: 8px 10px;
  font-size: 11px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.trans-header .trans-col {
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.trans-col.type.buy {
  color: var(--accent-green);
  font-weight: 600;
}

.trans-col.type.sell {
  color: var(--accent-red);
  font-weight: 600;
}

.trans-col.price,
.trans-col.qty,
.trans-col.comm,
.trans-col.amount {
  justify-content: flex-end;
}

.trans-col.date,
.trans-col.type {
  justify-content: flex-start;
}

.trans-col.code {
  font-weight: 600;
  color: #0891b2;
}

.trans-col.name {
}

.trans-col.value {
  justify-content: flex-end;
}

.td {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.col-code {
  font-weight: 600;
  color: #0891b2;
}

.col-name {
  color: var(--text-secondary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-date {
  font-size: 11px;
  color: var(--text-muted);
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
  max-width: 480px;
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
.form-select {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #0891b2;
}

.form-input::placeholder {
  color: var(--text-muted);
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
}

.trade-type-btns {
  display: flex;
  gap: 8px;
}

.type-btn {
  flex: 1;
  padding: 10px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.type-btn:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.type-btn.buy.active {
  background: rgba(34, 197, 94, 0.15);
  border-color: var(--accent-green);
  color: var(--accent-green);
}

.type-btn.sell.active {
  background: rgba(239, 68, 68, 0.15);
  border-color: var(--accent-red);
  color: var(--accent-red);
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

.col-price,
.col-shares,
.col-profit,
.col-percent,
.col-target,
.col-current,
.col-value,
.col-diff {
  justify-content: flex-end;
}

.positive {
  color: var(--accent-green);
}

.negative {
  color: var(--accent-red);
}

.overweight {
  color: var(--accent-red);
}

.underweight {
  color: var(--accent-green);
}

.balanced {
  color: var(--text-secondary);
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

.stock-input-group {
  position: relative;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 240px;
  overflow-y: auto;
  z-index: 100;
  margin-top: 4px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.suggestion-item:hover {
  background: var(--bg-hover);
}

.suggestion-symbol {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 80px;
}

.suggestion-name {
  font-size: 12px;
  color: var(--text-secondary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestion-exchange {
  font-size: 10px;
  color: var(--text-muted);
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn.loading {
  pointer-events: none;
}

.stock-info {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

.stock-code {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.stock-name {
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
