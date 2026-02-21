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
    chinese: '中文',
    english: 'EN',
    copyright: '© 2026 游戏化财富管理. 保留所有权利.',
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
    untitled: '未命名'
  },
  'en-US': {
    appName: 'Gamified Wealth Management',
    appSlogan: 'Manage your wealth planet, achieve financial freedom',
    totalAsset: 'My Wealth Planet',
    currency: 'CNY',
    assetComposition: 'Composed of Cash, Stocks, Bonds/Low-risk Funds, Gold/Precious Metals, Emerging Assets',
    currentAmount: 'Current Amount',
    currentRatio: 'Current Ratio',
    idealRatio: 'Ideal Ratio',
    aboveTarget: 'Above Target',
    belowTarget: 'Below Target',
    assetDistribution: 'Asset Distribution',
    warningIdealRatio: 'Ideal ratio total should be 100%',
    currentTotal: 'Current Total',
    cash: 'Cash',
    stock: 'Stocks',
    bond: 'Bonds/Low-risk Funds',
    gold: 'Gold/Precious Metals',
    emerging: 'Emerging Assets',
    settings: 'Settings',
    language: 'Language',
    chinese: '中文',
    english: 'EN',
    copyright: '© 2026 Gamified Wealth Management. All rights reserved.',
    cashDetail: 'Cash Detail',
    addAccount: 'Add Account',
    bankName: 'Bank Name',
    enterBankName: 'Enter bank name',
    currencyLabel: 'Currency',
    amount: 'Amount',
    subtotal: 'Subtotal',
    noAccounts: 'No accounts yet',
    addFirstAccount: 'Add your first account',
    totalCash: 'Total Cash',
    detailComingSoon: 'Detail feature coming soon...',
    importFile: 'Import File',
    importFailed: 'Import failed, please check file format',
    financialNews: 'Financial News',
    loadingNews: 'Loading...',
    noNews: 'No news available',
    justNow: 'Just now',
    minutesAgo: 'min ago',
    hoursAgo: 'h ago',
    importGuide: 'Import Guide',
    supportedFormats: 'Supported Formats',
    columnRequirements: 'Column Requirements',
    columnName: 'Column Name',
    columnOrder: 'Column Order',
    column1: 'Column 1',
    column2: 'Column 2',
    column3: 'Column 3',
    example: 'Example',
    exampleFile: 'Example File',
    goldDetail: 'Gold Detail',
    currentGoldPrice: 'Current Gold Price',
    cnyPerGram: 'CNY/g',
    lastUpdate: 'Last Update',
    myGoldHoldings: 'My Gold Holdings',
    gram: 'g',
    totalValue: 'Total Value',
    goldPriceChart: 'Gold Price Chart',
    otherPreciousMetals: 'Other Precious Metals',
    silver: 'Silver',
    platinum: 'Platinum',
    palladium: 'Palladium',
    save: 'Save',
    transferFunds: 'Transfer Funds',
    fromAccount: 'From Account',
    selectAccount: 'Select Account',
    transferAmount: 'Transfer Amount',
    toAsset: 'To Asset',
    selectAsset: 'Select Asset',
    note: 'Note',
    notePlaceholder: 'Optional note',
    transferHistory: 'Transfer History',
    cancel: 'Cancel',
    confirm: 'Confirm',
    untitled: 'Untitled'
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
