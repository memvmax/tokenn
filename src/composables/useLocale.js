import { ref, watch, onMounted } from 'vue'

const messages = {
  'zh-CN': {
    appName: '游戏化财富管理',
    appSlogan: '管理你的财富星球，实现财务自由',
    totalAsset: '我的财富星球',
    currency: 'CNY',
    assetComposition: '由现金、股票、债券/低风险基金、黄金/贵金属、新兴资产组成',
    currentAmount: '当前金额',
    currentRatio: '当前占比',
    idealRatio: '理想占比',
    aboveTarget: '高于目标',
    belowTarget: '低于目标',
    assetDistribution: '资产分布',
    warningIdealRatio: '理想占比总和应为100%',
    currentTotal: '当前总和',
    cash: '现金',
    stock: '股票',
    bond: '债券/低风险基金',
    gold: '黄金/贵金属',
    emerging: '新兴资产',
    settings: '设置',
    language: '语言',
    exchangeRate: '汇率',
    chinese: '中文',
    english: 'EN',
    copyright: '© 2026 thatwhereisnot. 保留所有权利.',
    cashDetail: '现金详情',
    addAccount: '添加账户',
    bankName: '银行名称',
    enterBankName: '输入银行名称',
    currencyLabel: '币种',
    amount: '金额',
    subtotal: '小计',
    noAccounts: '暂无账户',
    addFirstAccount: '添加第一个账户',
    totalCash: '现金总计',
    detailComingSoon: '详情功能开发中...',
    importFile: '导入文件',
    importFailed: '导入失败，请检查文件格式',
    financialNews: '财经资讯',
    loadingNews: '加载中...',
    noNews: '暂无资讯',
    justNow: '刚刚',
    minutesAgo: '分钟前',
    hoursAgo: '小时前',
    importGuide: '导入指南',
    supportedFormats: '支持的文件格式',
    columnRequirements: '列要求',
    columnName: '列名',
    columnOrder: '列序',
    column1: '第1列',
    column2: '第2列',
    column3: '第3列',
    example: '示例',
    exampleFile: '示例文件',
    goldDetail: '黄金详情',
    currentGoldPrice: '当前金价',
    cnyPerGram: 'CNY/克',
    lastUpdate: '最后更新',
    myGoldHoldings: '我的黄金持有量',
    gram: '克',
    totalValue: '总价值',
    goldPriceChart: '金价走势',
    otherPreciousMetals: '其他贵金属',
    silver: '白银',
    platinum: '铂金',
    palladium: '钯金',
    save: '保存',
    transferFunds: '资金转账',
    fromAccount: '转出账户',
    selectAccount: '选择账户',
    transferAmount: '转账金额',
    toAsset: '转入资产',
    selectAsset: '选择资产',
    note: '备注',
    notePlaceholder: '可选备注',
    transferHistory: '转账记录',
    cancel: '取消',
    confirm: '确认',
    untitled: '未命名',
    themes: '主题',
    browseThemes: '切换主题',
    themeDefault: '默认皮肤',
    themeAI: 'AI壁纸',
    themeHalo: 'HALO',
    switchAccount: '切换账户',
    logout: '退出登录',
    login: '登录',
    register: '注册',
    email: '邮箱',
    emailPlaceholder: '请输入邮箱',
    password: '密码',
    passwordPlaceholder: '请输入密码',
    confirmPassword: '确认密码',
    confirmPasswordPlaceholder: '请再次输入密码',
    passwordMismatch: '两次密码输入不一致',
    noAccount: '没有账号？',
    hasAccount: '已有账号？',
    registerNow: '立即注册',
    loginNow: '立即登录',
    comments: '备注',
    filtered: '已筛选',
    sortBy: '排序',
    filterBy: '筛选',
    all: '全部',
    noMatchingResults: '没有匹配的结果',
    bondDetail: '债券详情',
    totalBond: '债券总计',
    stockDetail: '股票详情',
    totalStock: '股票总计',
    emergingDetail: '新兴投资详情',
    totalEmerging: '新兴投资总计',
    silverPriceChart: '银价走势图',
    priceChart: '价格走势',
    addOrder: '添加订单',
    addBuyRecord: '添加买入记录',
    buyRecords: '买入记录',
    records: '条记录',
    newPreset: '新建预设',
    editPreset: '编辑预设',
    delete: '删除',
    selectSource: '选择信息源',
    addLink: '添加链接',
    noPenguinLinks: '暂无链接，点击 + 添加',
    today: '今天',
    daysAgo: '天前'
  },
  'en-US': {
    appName: 'GAMIFIED WEALTH MANAGEMENT',
    appSlogan: 'MANAGE YOUR WEALTH PLANET, ACHIEVE FINANCIAL FREEDOM',
    totalAsset: 'MY WEALTH PLANET',
    currency: 'CNY',
    assetComposition: 'COMPOSED OF CASH, STOCKS, BONDS/LOW-RISK FUNDS, GOLD/PRECIOUS METALS, EMERGING ASSETS',
    currentAmount: 'CURRENT AMOUNT',
    currentRatio: 'CURRENT RATIO',
    idealRatio: 'IDEAL RATIO',
    aboveTarget: 'ABOVE TARGET',
    belowTarget: 'BELOW TARGET',
    assetDistribution: 'ASSET DISTRIBUTION',
    warningIdealRatio: 'IDEAL RATIO TOTAL SHOULD BE 100%',
    currentTotal: 'CURRENT TOTAL',
    cash: 'CASH',
    stock: 'STOCKS',
    bond: 'BONDS',
    gold: 'GOLD',
    emerging: 'EMERGING',
    settings: 'SETTINGS',
    language: 'LANGUAGE',
    exchangeRate: 'EXCHANGE RATE',
    chinese: '中文',
    english: 'EN',
    copyright: '© 2026 THATWHEREISNOT. ALL RIGHTS RESERVED.',
    cashDetail: 'CASH DETAIL',
    addAccount: 'ADD ACCOUNT',
    bankName: 'BANK NAME',
    enterBankName: 'Enter bank name',
    currencyLabel: 'CURRENCY',
    amount: 'AMOUNT',
    subtotal: 'SUBTOTAL',
    noAccounts: 'NO ACCOUNTS YET',
    addFirstAccount: 'ADD YOUR FIRST ACCOUNT',
    totalCash: 'TOTAL CASH',
    detailComingSoon: 'DETAIL FEATURE COMING SOON...',
    importFile: 'IMPORT FILE',
    importFailed: 'Import failed, please check file format',
    financialNews: 'FINANCIAL NEWS',
    loadingNews: 'LOADING...',
    noNews: 'NO NEWS AVAILABLE',
    justNow: 'JUST NOW',
    minutesAgo: 'MIN AGO',
    hoursAgo: 'H AGO',
    importGuide: 'IMPORT GUIDE',
    supportedFormats: 'SUPPORTED FORMATS',
    columnRequirements: 'COLUMN REQUIREMENTS',
    columnName: 'COLUMN NAME',
    columnOrder: 'COLUMN ORDER',
    column1: 'COLUMN 1',
    column2: 'COLUMN 2',
    column3: 'COLUMN 3',
    example: 'EXAMPLE',
    exampleFile: 'EXAMPLE FILE',
    goldDetail: 'GOLD DETAIL',
    currentGoldPrice: 'CURRENT GOLD PRICE',
    cnyPerGram: 'CNY/g',
    lastUpdate: 'LAST UPDATE',
    myGoldHoldings: 'MY GOLD HOLDINGS',
    gram: 'g',
    totalValue: 'TOTAL VALUE',
    goldPriceChart: 'GOLD PRICE CHART',
    otherPreciousMetals: 'OTHER PRECIOUS METALS',
    silver: 'SILVER',
    platinum: 'PLATINUM',
    palladium: 'PALLADIUM',
    save: 'SAVE',
    transferFunds: 'TRANSFER FUNDS',
    fromAccount: 'FROM ACCOUNT',
    selectAccount: 'SELECT ACCOUNT',
    transferAmount: 'TRANSFER AMOUNT',
    toAsset: 'TO ASSET',
    selectAsset: 'SELECT ASSET',
    note: 'NOTE',
    notePlaceholder: 'Optional note',
    transferHistory: 'TRANSFER HISTORY',
    cancel: 'CANCEL',
    confirm: 'CONFIRM',
    untitled: 'UNTITLED',
    themes: 'THEMES',
    browseThemes: 'SWITCH THEME',
    themeDefault: 'Default',
    themeAI: 'AI Wallpaper',
    themeHalo: 'HALO',
    switchAccount: 'SWITCH ACCOUNT',
    logout: 'LOGOUT',
    login: 'LOGIN',
    register: 'REGISTER',
    email: 'EMAIL',
    emailPlaceholder: 'Enter your email',
    password: 'PASSWORD',
    passwordPlaceholder: 'Enter your password',
    confirmPassword: 'CONFIRM PASSWORD',
    confirmPasswordPlaceholder: 'Enter password again',
    passwordMismatch: 'Passwords do not match',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    registerNow: 'Register now',
    loginNow: 'Login now',
    comments: 'COMMENTS',
    filtered: 'FILTERED',
    sortBy: 'SORT BY',
    filterBy: 'FILTER BY',
    all: 'ALL',
    noMatchingResults: 'NO MATCHING RESULTS',
    bondDetail: 'BOND DETAIL',
    totalBond: 'TOTAL BONDS',
    stockDetail: 'STOCK DETAIL',
    totalStock: 'TOTAL STOCK',
    emergingDetail: 'EMERGING DETAIL',
    totalEmerging: 'TOTAL EMERGING',
    silverPriceChart: 'SILVER PRICE CHART',
    priceChart: 'PRICE CHART',
    addOrder: 'ADD ORDER',
    addBuyRecord: 'ADD BUY RECORD',
    buyRecords: 'BUY RECORDS',
    records: 'records',
    newPreset: 'NEW PRESET',
    editPreset: 'EDIT PRESET',
    delete: 'DELETE',
    selectSource: 'SELECT SOURCE',
    addLink: 'ADD LINK',
    noPenguinLinks: 'No links yet. Click + to add.',
    today: 'Today',
    daysAgo: 'days ago'
  }
}

const currentLocale = ref('zh-CN')

export function useLocale() {
  const initLocale = () => {
    const savedLocale = localStorage.getItem('locale')
    if (savedLocale && messages[savedLocale]) {
      currentLocale.value = savedLocale
    } else {
      const browserLang = navigator.language
      if (browserLang.startsWith('zh')) {
        currentLocale.value = 'zh-CN'
      } else {
        currentLocale.value = 'en-US'
      }
    }
  }

  const setLocale = (locale) => {
    if (messages[locale]) {
      currentLocale.value = locale
      localStorage.setItem('locale', locale)
    }
  }

  const t = (key) => {
    return messages[currentLocale.value]?.[key] || key
  }

  const toggleLocale = () => {
    const newLocale = currentLocale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
    setLocale(newLocale)
  }

  const formatAmount = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0'
    
    const absValue = Math.abs(value)
    const sign = value < 0 ? '-' : ''
    
    if (absValue >= 1e12) {
      return sign + (absValue / 1e12).toFixed(2) + 'T'
    } else if (absValue >= 1e9) {
      return sign + (absValue / 1e9).toFixed(2) + 'B'
    } else if (absValue >= 1e6) {
      return sign + (absValue / 1e6).toFixed(2) + 'M'
    } else if (absValue >= 1e4) {
      return sign + (absValue / 1e4).toFixed(2) + 'W'
    } else if (absValue >= 1e3) {
      return sign + (absValue / 1e3).toFixed(2) + 'K'
    } else {
      return sign + absValue.toFixed(2)
    }
  }

  const formatCurrency = (value) => {
    return value.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  watch(currentLocale, () => {
    document.documentElement.lang = currentLocale.value
  })

  onMounted(() => {
    initLocale()
  })

  return {
    currentLocale,
    setLocale,
    toggleLocale,
    t,
    initLocale,
    formatAmount,
    formatCurrency
  }
}
