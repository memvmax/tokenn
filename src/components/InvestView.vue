<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStockApi } from '../composables/useStockApi'
import { useSupabase } from '../lib/useSupabase'

const { saveUserData, loadUserData, getUser } = useSupabase()
const currentUser = ref(null)

const exchangeRates = ref({
  'A股': 1,
  '港股': 0.91,
  '美股': 7.25
})

const fetchExchangeRates = async () => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const data = await response.json()
    if (data.rates) {
      const cnyRate = data.rates.CNY || 7.25
      const hkdRate = data.rates.HKD || 7.78
      exchangeRates.value = {
        'A股': 1,
        '港股': cnyRate / hkdRate,
        '美股': cnyRate
      }
    }
  } catch (e) {
    console.log('Failed to fetch exchange rates, using defaults')
  }
}

const convertToCNY = (value, market) => {
  const rate = exchangeRates.value[market] || 1
  return value * rate
}

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
const showImportModal = ref(false)
const showImportHelp = ref(false)
const importFile = ref(null)
const importData = ref([])
const importPreview = ref([])
const importStep = ref(1)
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

const profitData = ref([])

const positionData = computed(() => {
  return profitData.value
    .filter(item => item.shares > 0)
    .map(item => ({
      code: item.code,
      name: item.name,
      market: item.market,
      category1: item.category1 || '',
      category2: item.category2 || '',
      targetPercent: item.targetPercent || 0,
      value: convertToCNY(item.currentPrice * item.shares, item.market)
    }))
})

const filteredProfitData = computed(() => {
  let data = profitData.value.filter(item => selectedMarkets.value.includes(item.market))
  
  if (!showHistory.value) {
    data = data.filter(item => item.shares > 0)
  }
  
  if (sortState.value.field && sortState.value.order !== 0) {
    const field = sortState.value.field
    const order = sortState.value.order
    
    data = [...data].sort((a, b) => {
      let valueA, valueB
      
      if (field === 'value') {
        valueA = convertToCNY(a.currentPrice * a.shares, a.market)
        valueB = convertToCNY(b.currentPrice * b.shares, b.market)
      } else if (field === 'profit') {
        valueA = convertToCNY(a.profit, a.market)
        valueB = convertToCNY(b.profit, b.market)
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

const totalProfitPercent = computed(() => {
  const totalCost = filteredProfitData.value.reduce((sum, item) => {
    return sum + convertToCNY(item.buyPrice * item.shares, item.market)
  }, 0)
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
  showImportModal.value = true
  importStep.value = 1
  importFile.value = null
  importData.value = []
  importPreview.value = []
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

const detectMarket = (code) => {
  if (!code) return 'A股'
  const cleanCode = code.replace(/["'\t]/g, '').trim()
  
  if (cleanCode.startsWith('SH') || cleanCode.startsWith('sh')) {
    return 'A股'
  }
  if (cleanCode.startsWith('SZ') || cleanCode.startsWith('sz')) {
    return 'A股'
  }
  if (/^\d{5}$/.test(cleanCode) || cleanCode.length === 5 && /^\d/.test(cleanCode)) {
    return '港股'
  }
  if (/^[A-Z]{1,5}(\.[A-Z])?$/.test(cleanCode.toUpperCase()) && !cleanCode.startsWith('SH') && !cleanCode.startsWith('SZ')) {
    return '美股'
  }
  if (cleanCode.length === 6 && /^\d+$/.test(cleanCode)) {
    if (cleanCode.startsWith('6')) {
      return 'A股'
    } else if (cleanCode.startsWith('0') || cleanCode.startsWith('3')) {
      return 'A股'
    }
  }
  return '美股'
}

const cleanCode = (code) => {
  if (!code) return ''
  return code.replace(/["'\t]/g, '').replace(/^(SH|SZ|sh|sz)/, '').trim()
}

const parseNumber = (value) => {
  if (!value) return 0
  const str = String(value).replace(/,/g, '')
  return parseFloat(str) || 0
}

const getSortedTransactions = (transactions) => {
  if (!transactions) return []
  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.date.replace(/\//g, '-'))
    const dateB = new Date(b.date.replace(/\//g, '-'))
    return dateB - dateA
  })
}

const confirmImport = () => {
  importData.value.forEach(row => {
    const rawCode = row['代码'] || row['code'] || row['Code'] || row['股票代码'] || ''
    const code = cleanCode(rawCode)
    const name = row['名称'] || row['name'] || row['Name'] || row['股票名称'] || ''
    const type = (row['类型'] || row['type'] || row['Type'] || 'buy').toLowerCase()
    const price = parseNumber(row['价格'] || row['price'] || row['Price'] || row['成交价'])
    const quantity = parseNumber(row['数量'] || row['quantity'] || row['Quantity'] || row['股数'])
    const commission = parseNumber(row['佣金'] || row['commission'] || row['Commission'])
    const tax = parseNumber(row['税费'] || row['tax'] || row['Tax'])
    const date = row['日期'] || row['date'] || row['Date'] || row['交易日期'] || new Date().toISOString().split('T')[0]
    const market = detectMarket(rawCode)
    
    if (code && price > 0 && quantity > 0) {
      const existingStock = profitData.value.find(s => s.code === code)
      
      if (existingStock) {
        existingStock.transactions.push({
          date,
          type,
          price,
          quantity,
          commission,
          tax
        })
      } else {
        profitData.value.push({
          code,
          name,
          market,
          buyPrice: price,
          currentPrice: price,
          shares: type === 'buy' ? quantity : 0,
          profit: 0,
          profitPercent: 0,
          category1: '其他',
          category2: '混合',
          targetPercent: 0,
          transactions: [{
            date,
            type,
            price,
            quantity,
            commission,
            tax
          }]
        })
      }
    }
  })
  
  profitData.value.forEach(stock => {
    recalculateStock(stock)
  })
  
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
  importPreview.value = []
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
        category2: '',
        targetPercent: 0
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
  const types = ['industry', 'style', 'market']
  const currentIndex = types.indexOf(positionViewType.value)
  positionViewType.value = types[(currentIndex + 1) % types.length]
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

const showStockContextMenu = (event, stock) => {
  contextMenuX.value = event.clientX || event.touches?.[0]?.clientX || 0
  contextMenuY.value = event.clientY || event.touches?.[0]?.clientY || 0
  contextMenuType.value = 'stock'
  contextMenuData.value = stock
  showContextMenu.value = true
}

const showTransContextMenu = (event, stockCode, transIndex) => {
  contextMenuX.value = event.clientX || event.touches?.[0]?.clientX || 0
  contextMenuY.value = event.clientY || event.touches?.[0]?.clientY || 0
  contextMenuType.value = 'transaction'
  contextMenuData.value = { stockCode, transIndex }
  showContextMenu.value = true
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

const syncStockValuesToWallet = () => {
  const marketValues = {
    'A股': 0,
    '港股': 0,
    '美股': 0
  }
  
  const marketTransactions = {
    'A股': [],
    '港股': [],
    '美股': []
  }
  
  profitData.value.forEach(stock => {
    if (stock.shares > 0 && marketValues.hasOwnProperty(stock.market)) {
      marketValues[stock.market] += convertToCNY(stock.currentPrice * stock.shares, stock.market)
    }
    
    if (stock.transactions && stock.transactions.length > 0 && marketTransactions.hasOwnProperty(stock.market)) {
      stock.transactions.forEach(trans => {
        marketTransactions[stock.market].push({
          date: trans.date,
          type: trans.type,
          price: trans.price,
          quantity: trans.quantity,
          value: trans.price * trans.quantity,
          commission: trans.commission || 0,
          tax: trans.tax || 0,
          code: stock.code,
          name: stock.name
        })
      })
    }
  })
  
  Object.keys(marketTransactions).forEach(market => {
    marketTransactions[market].sort((a, b) => {
      const dateA = new Date(a.date.replace(/\//g, '-'))
      const dateB = new Date(b.date.replace(/\//g, '-'))
      return dateB - dateA
    })
  })
  
  const today = new Date()
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const isLastDay = today.getDate() === lastDayOfMonth.getDate()
  
  const syncData = {
    date: today.toISOString().split('T')[0],
    markets: marketValues,
    transactions: marketTransactions,
    isLastDayOfMonth: isLastDay
  }
  
  localStorage.setItem('stockSyncData', JSON.stringify(syncData))
  
  return syncData
}

watch(profitData, () => {
  syncStockValuesToWallet()
  saveInvestData()
}, { deep: true })

const saveInvestData = () => {
  localStorage.setItem('investData', JSON.stringify(profitData.value))
  
  if (currentUser.value) {
    saveUserData(currentUser.value.id, 'invest', profitData.value)
  }
}

const loadInvestData = async () => {
  const version = localStorage.getItem('investDataVersion')
  
  if (version !== '9') {
    localStorage.removeItem('investData')
    localStorage.removeItem('investDataVersion')
  }
  
  if (currentUser.value) {
    const { data: cloudData, error } = await loadUserData(currentUser.value.id, 'invest')
    if (!error && cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
      profitData.value = cloudData
      localStorage.setItem('investData', JSON.stringify(cloudData))
      localStorage.setItem('investDataVersion', '9')
      return
    }
  }
  
  const saved = localStorage.getItem('investData')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      if (Array.isArray(data) && data.length > 0) {
        profitData.value = data
        localStorage.setItem('investDataVersion', '9')
      }
    } catch (e) {
    }
  }
}

onMounted(async () => {
  const { user } = await getUser()
  currentUser.value = user
  
  await loadInvestData()
  fetchExchangeRates()
  refreshPrices()
  syncStockValuesToWallet()
  
  document.addEventListener('click', () => {
    closeContextMenu()
  })
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
    let category
    if (type === 'industry') {
      category = item.category1
    } else if (type === 'style') {
      category = item.category2
    } else if (type === 'market') {
      category = item.market
    }
    
    if (!category) return
    
    if (!categoryMap.has(category)) {
      let name
      if (type === 'market') {
        name = getMarketLabel(category)
      } else {
        name = getCategoryLabel(type === 'industry' ? category1Options : category2Options, category)
      }
      
      categoryMap.set(category, { 
        code: category, 
        name: name,
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
    totalValue: cat.currentValue,
    currentPercent: totalValue > 0 ? (cat.currentValue / totalValue * 100) : 0,
    avgTargetPercent: cat.targetPercent / cat.count,
    deviation: totalValue > 0 ? (cat.currentValue / totalValue * 100) - (cat.targetPercent / cat.count) : 0
  }))
  
  if (positionSortState.value.field && positionSortState.value.order !== 0) {
    const field = positionSortState.value.field
    const order = positionSortState.value.order
    
    data = [...data].sort((a, b) => {
      let valueA, valueB
      
      if (field === 'total') {
        valueA = a.totalValue
        valueB = b.totalValue
      } else if (field === 'current') {
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

const formatPrice = (value) => {
  return value.toFixed(2)
}

const formatCNY = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '¥0'
  return '¥' + Math.round(value).toLocaleString('en-US')
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
  return filteredProfitData.value.reduce((sum, item) => {
    return sum + convertToCNY(item.currentPrice * item.shares, item.market)
  }, 0)
})

const totalProfit = computed(() => {
  return filteredProfitData.value.reduce((sum, item) => {
    return sum + convertToCNY(item.profit, item.market)
  }, 0)
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
        </div>
        
        <div class="data-table">
          <div class="table-header">
            <div class="th col-code">
              <span class="desktop-only">{{ getLabel('code') }}</span>
              <span class="mobile-header">
                <span class="header-top">{{ getLabel('code') }}</span>
                <span class="header-bottom">{{ getLabel('name') }}</span>
              </span>
            </div>
            <div class="th col-name desktop-only">{{ getLabel('name') }}</div>
            <div class="th col-price">
              <span class="desktop-only">{{ getLabel('buyPrice') }}</span>
              <span class="mobile-header">
                <span class="header-top">{{ getLabel('currentPrice') }}</span>
                <span class="header-bottom">{{ getLabel('buyPrice') }}</span>
              </span>
            </div>
            <div class="th col-price desktop-only">{{ getLabel('currentPrice') }}</div>
            <div class="th col-shares desktop-only">{{ getLabel('shares') }}</div>
            <div class="th col-value sortable" :class="getSortClass('value')" @click="toggleSort('value')">
              <span class="desktop-only">{{ getLabel('marketValue') }} (CNY)</span>
              <span class="mobile-header">
                <span class="header-top">{{ getLabel('shares') }}</span>
                <span class="header-bottom">{{ getLabel('marketValue') }}</span>
              </span>
            </div>
            <div class="th col-profit sortable" :class="getSortClass('profit')" @click="toggleSort('profit')">
              <span class="desktop-only">{{ getLabel('profit') }} (CNY)</span>
              <span class="mobile-header">
                <span class="header-top">{{ getLabel('profit') }}</span>
                <span class="header-bottom">{{ getLabel('changePercent') }}</span>
              </span>
            </div>
            <div class="th col-percent sortable desktop-only" :class="getSortClass('change')" @click="toggleSort('change')">{{ getLabel('changePercent') }}</div>
          </div>
          <div class="table-body">
            <template v-for="item in filteredProfitData" :key="item.code">
              <div 
                class="table-row" 
                :class="{ 'selected': selectedStockCode === item.code }"
                @click="selectStock(item.code)"
                @contextmenu.prevent="showStockContextMenu($event, item)"
                @touchstart="startLongPress($event, 'stock', item)"
                @touchend="endLongPress"
                @touchmove="endLongPress"
              >
                <div class="td col-code">
                  <span class="desktop-only">{{ item.code }}</span>
                  <span class="cell-top">{{ item.code }}</span>
                  <span class="cell-bottom">{{ item.name }}</span>
                </div>
                <div class="td col-name desktop-only">{{ item.name }}</div>
                <div class="td col-price font-numeric">
                  <span class="desktop-only">{{ formatNumber(item.buyPrice) }}</span>
                  <span class="cell-top">{{ formatNumber(item.currentPrice) }}</span>
                  <span class="cell-bottom">{{ formatNumber(item.buyPrice) }}</span>
                </div>
                <div class="td col-price font-numeric desktop-only">{{ formatNumber(item.currentPrice) }}</div>
                <div class="td col-shares font-numeric desktop-only">{{ formatNumber(item.shares) }}</div>
                <div class="td col-value font-numeric">
                  <span class="desktop-only">{{ formatNumber(convertToCNY(item.currentPrice * item.shares, item.market)) }}</span>
                  <span class="cell-top">{{ formatNumber(item.shares) }}</span>
                  <span class="cell-bottom">{{ formatNumber(convertToCNY(item.currentPrice * item.shares, item.market)) }}</span>
                </div>
                <div class="td col-profit font-numeric" :class="getProfitClass(item.profit)">
                  <span class="desktop-only">{{ item.profit >= 0 ? '+' : '' }}{{ formatNumber(convertToCNY(item.profit, item.market)) }}</span>
                  <span class="cell-top" :class="getProfitClass(item.profit)">{{ item.profit >= 0 ? '+' : '' }}{{ formatNumber(convertToCNY(item.profit, item.market)) }}</span>
                  <span class="cell-bottom" :class="getProfitClass(item.profit)">{{ item.profitPercent >= 0 ? '+' : '' }}{{ item.profitPercent.toFixed(1) }}%</span>
                </div>
                <div class="td col-percent font-numeric desktop-only" :class="getProfitClass(item.profit)">
                  {{ item.profitPercent >= 0 ? '+' : '' }}{{ item.profitPercent.toFixed(1) }}%
                </div>
              </div>
              
              <div v-if="selectedStockCode === item.code && item.transactions" class="transaction-detail">
                <div class="transaction-table">
                  <div class="trans-row trans-header profit-trans">
                    <div class="trans-col date">
                      <span class="desktop-only">{{ getLabel('tradeDate') }}</span>
                      <span class="mobile-header">
                        <span class="header-top">{{ getLabel('tradeType') }}</span>
                        <span class="header-bottom">{{ getLabel('tradeDate') }}</span>
                      </span>
                    </div>
                    <div class="trans-col type desktop-only">{{ getLabel('tradeType') }}</div>
                    <div class="trans-col price">
                      <span class="desktop-only">{{ getLabel('price') }}</span>
                      <span class="mobile-header">
                        <span class="header-top">{{ getLabel('price') }}</span>
                        <span class="header-bottom">{{ getLabel('commissionLabel') }}</span>
                      </span>
                    </div>
                    <div class="trans-col qty desktop-only">{{ getLabel('shares') }}</div>
                    <div class="trans-col comm desktop-only">{{ getLabel('commissionLabel') }}</div>
                    <div class="trans-col amount">
                      <span class="desktop-only">{{ getLabel('total') }}</span>
                      <span class="mobile-header">
                        <span class="header-top">{{ getLabel('shares') }}</span>
                        <span class="header-bottom">{{ getLabel('total') }}</span>
                      </span>
                    </div>
                  </div>
                  <div class="trans-row profit-trans" v-for="(trans, idx) in getSortedTransactions(item.transactions)" :key="idx"
                    @contextmenu.prevent="showTransContextMenu($event, item.code, idx)"
                    @touchstart="startLongPress($event, 'transaction', { stockCode: item.code, transIndex: idx })"
                    @touchend="endLongPress"
                    @touchmove="endLongPress"
                  >
                    <div class="trans-col date">
                      <span class="desktop-only">{{ trans.date }}</span>
                      <span class="cell-top" :class="trans.type === 'buy' ? 'buy' : 'sell'">{{ trans.type.toUpperCase() }}</span>
                      <span class="cell-bottom">{{ trans.date }}</span>
                    </div>
                    <div class="trans-col type desktop-only" :class="trans.type === 'buy' ? 'buy' : 'sell'">
                      {{ trans.type.toUpperCase() }}
                    </div>
                    <div class="trans-col price font-numeric">
                      <span class="desktop-only">{{ formatNumber(trans.price) }}</span>
                      <span class="cell-top">{{ formatNumber(trans.price) }}</span>
                      <span class="cell-bottom">{{ formatNumber(trans.commission) }}</span>
                    </div>
                    <div class="trans-col qty font-numeric desktop-only">{{ trans.quantity }}</div>
                    <div class="trans-col comm font-numeric desktop-only">{{ formatNumber(trans.commission) }}</div>
                    <div class="trans-col amount font-numeric">
                      <span class="desktop-only">{{ formatNumber(trans.price * trans.quantity) }}</span>
                      <span class="cell-top">{{ formatNumber(trans.quantity) }}</span>
                      <span class="cell-bottom">{{ formatNumber(trans.price * trans.quantity) }}</span>
                    </div>
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
            {{ positionViewType === 'industry' ? getLabel('industry') : positionViewType === 'style' ? getLabel('style') : 'MARKET' }}
            <i class="fas fa-exchange-alt"></i>
          </button>
        </div>
        
        <div class="data-table">
          <div class="table-header position-header">
            <div class="th col-category">{{ positionViewType === 'industry' ? getLabel('industry') : positionViewType === 'style' ? getLabel('style') : 'MARKET' }}</div>
            <div class="th col-value sortable" :class="getPositionSortClass('total')" @click="togglePositionSort('total')">TOTAL</div>
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
                <div class="td col-value font-numeric">{{ formatCNY(item.totalValue) }}</div>
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

    <Teleport to="body">
      <div v-if="showImportModal" class="modal-overlay" @click="closeImportModal">
        <div class="modal-container import-modal" @click.stop>
          <div class="modal-header">
            <span class="modal-title">{{ getLabel('importCSV') }}</span>
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
                    <span class="help-label">代码</span>
                    <span class="help-names">代码、code、Code、股票代码</span>
                  </div>
                  <div class="help-row">
                    <span class="help-label">类型</span>
                    <span class="help-names">类型、type、Type（buy/sell）</span>
                  </div>
                  <div class="help-row">
                    <span class="help-label">价格</span>
                    <span class="help-names">价格、price、Price、成交价</span>
                  </div>
                  <div class="help-row">
                    <span class="help-label">数量</span>
                    <span class="help-names">数量、quantity、Quantity、股数</span>
                  </div>
                  <div class="help-row optional">
                    <span class="help-label">名称</span>
                    <span class="help-names">名称、name、Name、股票名称</span>
                  </div>
                  <div class="help-row optional">
                    <span class="help-label">佣金</span>
                    <span class="help-names">佣金、commission、Commission</span>
                  </div>
                  <div class="help-row optional">
                    <span class="help-label">税费</span>
                    <span class="help-names">税费、tax、Tax</span>
                  </div>
                  <div class="help-row optional">
                    <span class="help-label">日期</span>
                    <span class="help-names">日期、date、Date、交易日期（格式：2024-01-15）</span>
                  </div>
                  <div class="help-row optional">
                    <span class="help-label">市场</span>
                    <span class="help-names">市场、market、Market</span>
                  </div>
                </div>
                <div v-else class="instruction-text">
                  必填：代码、类型(buy/sell)、价格、数量<br>
                  可选：名称、佣金、税费、日期、市场
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
                      <th>代码</th>
                      <th>名称</th>
                      <th>市场</th>
                      <th>类型</th>
                      <th>价格</th>
                      <th>数量</th>
                      <th>日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, index) in importData" :key="index">
                      <td>{{ cleanCode(row['代码'] || row['code'] || row['Code'] || '-') }}</td>
                      <td>{{ row['名称'] || row['name'] || row['Name'] || '-' }}</td>
                      <td>{{ detectMarket(row['代码'] || row['code'] || row['Code']) }}</td>
                      <td>{{ row['类型'] || row['type'] || row['Type'] || '-' }}</td>
                      <td>{{ row['价格'] || row['price'] || row['Price'] || '-' }}</td>
                      <td>{{ formatNumber(parseNumber(row['数量'] || row['quantity'] || row['Quantity'] || 0)) }}</td>
                      <td>{{ row['日期'] || row['date'] || row['Date'] || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeImportModal">{{ getLabel('cancel') }}</button>
            <button v-if="importStep === 2" class="btn-confirm" @click="confirmImport">
              <i class="fas fa-check"></i>
              确认导入
            </button>
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
  grid-template-columns: 1fr 90px 90px 90px 90px;
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

.desktop-only {
  display: flex;
}

.mobile-header {
  display: none;
  flex-direction: column;
  gap: 2px;
}

.header-top,
.header-bottom {
  display: block;
}

.cell-top,
.cell-bottom {
  display: none;
}

@media (min-width: 769px) {
  .cell-top,
  .cell-bottom,
  .mobile-header {
    display: none;
  }
  
  .desktop-only {
    display: flex;
  }
}

@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
  
  .cell-top,
  .cell-bottom {
    display: block;
  }
  
  .mobile-header {
    display: flex;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr 80px 80px 80px;
  }
  
  .th {
    font-size: 8px;
    padding: 8px 6px;
    flex-direction: column;
    gap: 2px;
  }
  
  .position-header .th {
    flex-direction: row;
    align-items: center;
  }
  
  .position-header .th.col-category {
    justify-content: flex-start;
  }
  
  .position-header .th.col-value,
  .position-header .th.col-percent,
  .position-header .th.col-diff {
    justify-content: flex-end;
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
  
  .position-row .td {
    flex-direction: row;
    align-items: center;
  }
  
  .position-row .td.col-percent,
  .position-row .td.col-diff {
    justify-content: flex-end;
  }
  
  .col-code .td,
  .col-code {
    align-items: flex-start;
  }
  
  .col-price .td,
  .col-price,
  .col-value .td,
  .col-value,
  .col-profit .td,
  .col-profit {
    align-items: flex-end;
    text-align: right;
  }
  
  .col-code .mobile-header,
  .col-price .mobile-header,
  .col-value .mobile-header,
  .col-profit .mobile-header {
    align-items: flex-start;
  }
  
  .col-price .mobile-header,
  .col-value .mobile-header,
  .col-profit .mobile-header {
    align-items: flex-end;
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
  
  .trans-row.profit-trans {
    grid-template-columns: 1fr 80px 80px;
  }
  
  .trans-col.date,
  .trans-col.price,
  .trans-col.amount {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 8px 6px;
    font-size: 11px;
  }
  
  .trans-col.date {
    align-items: flex-start;
  }
  
  .trans-col.date .mobile-header {
    align-items: flex-start;
  }
  
  .trans-col.price,
  .trans-col.amount {
    align-items: flex-end;
    text-align: right;
  }
  
  .trans-col.price .mobile-header,
  .trans-col.amount .mobile-header {
    align-items: flex-end;
  }
  
  .trans-col.date .cell-top.buy {
    color: var(--accent-green);
  }
  
  .trans-col.date .cell-top.sell {
    color: var(--accent-red);
  }
  
  .table-header.position-header,
  .table-row.position-row {
    grid-template-columns: 1fr 90px 90px 90px;
  }
  
  .trans-row.stock-row {
    grid-template-columns: 90px 1fr 90px;
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
  
  .invest-tabs {
    overflow: visible;
  }
  
  .market-dropdown,
  .add-dropdown {
    z-index: 1000;
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
