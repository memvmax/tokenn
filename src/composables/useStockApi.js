import { ref } from 'vue'

const CACHE_DURATION = 60000
const cache = new Map()

export function useStockApi() {
  const loading = ref(false)
  const error = ref(null)

  const convertSymbol = (code, market) => {
    if (!code) return null
    
    if (market === 'A股') {
      if (code.startsWith('6')) {
        return `${code}.SS`
      } else if (code.startsWith('0') || code.startsWith('3')) {
        return `${code}.SZ`
      }
      return `${code}.SS`
    }
    
    if (market === '港股') {
      return `${code}.HK`
    }
    
    if (market === '美股') {
      return code
    }
    
    return code
  }

  const fetchStockPrice = async (code, market = 'A股') => {
    const symbol = convertSymbol(code, market)
    if (!symbol) return null

    const cacheKey = symbol
    const cached = cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }

    loading.value = true
    error.value = null

    try {
      const isDev = import.meta.env.DEV
      const baseUrl = isDev ? '' : ''
      const apiUrl = `/api/stock?symbols=${symbol}`
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.quoteResponse && data.quoteResponse.result && data.quoteResponse.result.length > 0) {
        const quote = data.quoteResponse.result[0]
        const result = {
          symbol: code,
          price: quote.regularMarketPrice || 0,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
          name: quote.shortName || quote.longName || code,
          market: market
        }
        
        cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        })
        
        return result
      }
      
      return null
    } catch (e) {
      error.value = e.message
      console.error('Failed to fetch stock price:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchMultipleStockPrices = async (stocks) => {
    if (!stocks || stocks.length === 0) return []
    
    const symbolMap = new Map()
    stocks.forEach(s => {
      const yahooSymbol = convertSymbol(s.code, s.market)
      if (yahooSymbol) {
        symbolMap.set(yahooSymbol, s.code)
      }
    })
    
    const symbols = Array.from(symbolMap.keys())
    
    console.log('Fetching prices for symbols:', symbols)
    console.log('Symbol map:', Object.fromEntries(symbolMap))
    
    if (symbols.length === 0) return []

    const symbolsToFetch = symbols.filter(s => {
      const cached = cache.get(s)
      return !cached || Date.now() - cached.timestamp >= CACHE_DURATION
    })

    if (symbolsToFetch.length === 0) {
      return symbols.map(s => cache.get(s)?.data).filter(Boolean)
    }

    loading.value = true
    error.value = null

    try {
      const apiUrl = `/api/stock?symbols=${symbolsToFetch.join(',')}`
      console.log('API URL:', apiUrl)
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log('API response:', data)
      
      if (data.quoteResponse && data.quoteResponse.result) {
        const results = data.quoteResponse.result.map(quote => {
          const originalCode = symbolMap.get(quote.symbol) || quote.symbol
          console.log(`Mapping ${quote.symbol} -> ${originalCode}, price: ${quote.regularMarketPrice}`)
          
          return {
            symbol: originalCode,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            name: quote.shortName || quote.longName || originalCode
          }
        })

        results.forEach(result => {
          const yahooSymbol = symbols.find(s => symbolMap.get(s) === result.symbol)
          if (yahooSymbol) {
            cache.set(yahooSymbol, {
              data: result,
              timestamp: Date.now()
            })
          }
        })

        return results
      }
      
      return []
    } catch (e) {
      error.value = e.message
      console.error('Failed to fetch stock prices:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  const searchStock = async (query) => {
    if (!query || query.length < 1) return []
    
    loading.value = true
    error.value = null

    try {
      const apiUrl = `/api/stock/search?q=${encodeURIComponent(query)}`
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data.quotes || []
    } catch (e) {
      error.value = e.message
      console.error('Failed to search stocks:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchStockPrice,
    fetchMultipleStockPrices,
    searchStock,
    convertSymbol
  }
}
