export default async function handler(req, res) {
  const { q } = req.query
  
  if (!q || q.length < 1) {
    return res.status(400).json({ error: 'Missing query parameter' })
  }

  console.log('Searching stocks for:', q)

  try {
    const quotes = []
    
    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`
      
      const response = await fetch(yahooUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.quotes) {
          for (const quote of data.quotes.slice(0, 10)) {
            quotes.push({
              symbol: quote.symbol,
              name: quote.shortname || quote.longname || quote.symbol,
              exchange: quote.exchange || 'Unknown',
              type: quote.quoteType || 'EQUITY'
            })
          }
        }
      }
    } catch (e) {
      console.error('Yahoo search error:', e.message)
    }
    
    console.log('Search results:', quotes.length, 'quotes found')
    
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json({ quotes })
  } catch (error) {
    console.error('Stock search error:', error.message, error.stack)
    res.status(500).json({ 
      error: 'Failed to search stocks',
      message: error.message
    })
  }
}
