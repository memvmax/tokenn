export default async function handler(req, res) {
  const { symbols } = req.query
  
  if (!symbols) {
    return res.status(400).json({ error: 'Missing symbols parameter' })
  }

  console.log('Fetching stock data for symbols:', symbols)

  try {
    const symbolList = symbols.split(',')
    const results = []
    
    for (const symbol of symbolList) {
      let price = 0
      let name = symbol
      let change = 0
      let changePercent = 0
      
      try {
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
        
        const response = await fetch(yahooUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const result = data.chart?.result?.[0]
          if (result) {
            const meta = result.meta
            name = meta.shortName || meta.longName || meta.symbol || symbol
            price = meta.regularMarketPrice || 0
            const prevClose = meta.chartPreviousClose || meta.previousClose || price
            change = price - prevClose
            changePercent = prevClose > 0 ? (change / prevClose * 100) : 0
            console.log(`Got price for ${symbol}: ${price}`)
          }
        } else {
          console.error(`Yahoo API error for ${symbol}: ${response.status}`)
        }
      } catch (e) {
        console.error('Yahoo API error for', symbol, e.message)
      }
      
      results.push({
        symbol: symbol,
        shortName: name,
        regularMarketPrice: price,
        regularMarketChange: change,
        regularMarketChangePercent: changePercent
      })
    }
    
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json({
      quoteResponse: {
        result: results,
        error: null
      }
    })
  } catch (error) {
    console.error('Stock API error:', error.message, error.stack)
    res.status(500).json({ 
      error: 'Failed to fetch stock data',
      message: error.message
    })
  }
}
