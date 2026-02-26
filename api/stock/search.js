export default async function handler(req, res) {
  const { q } = req.query
  
  if (!q || q.length < 1) {
    return res.status(400).json({ error: 'Missing query parameter' })
  }

  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`
    
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    const quotes = (data.quotes || []).map(quote => ({
      symbol: quote.symbol,
      name: quote.shortname || quote.longname || quote.symbol,
      exchange: quote.exchange,
      type: quote.quoteType
    }))
    
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30')
    res.status(200).json({ quotes })
  } catch (error) {
    console.error('Stock search error:', error)
    res.status(500).json({ error: 'Failed to search stocks' })
  }
}
