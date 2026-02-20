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
    copyright: '© 2026 游戏化财富管理. 保留所有权利.'
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
    copyright: '© 2026 Gamified Wealth Management. All rights reserved.'
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
