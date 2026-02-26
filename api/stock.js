export default async function handler(req, res) {
  const { symbols } = req.query
  
  if (!symbols) {
    return res.status(400).json({ error: 'Missing symbols parameter' })
  }

  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`
    
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30')
    res.status(200).json(data)
  } catch (error) {
    console.error('Stock API error:', error)
    res.status(500).json({ error: 'Failed to fetch stock data' })
  }
}
