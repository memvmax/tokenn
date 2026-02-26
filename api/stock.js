export default async function handler(req, res) {
  const { symbols } = req.query
  
  if (!symbols) {
    return res.status(400).json({ error: 'Missing symbols parameter' })
  }

  console.log('Fetching stock data for symbols:', symbols)

  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`
    console.log('Yahoo API URL:', yahooUrl)
    
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    })
    
    console.log('Yahoo API response status:', response.status)
    
    if (!response.ok) {
      const text = await response.text()
      console.error('Yahoo API error response:', text)
      return res.status(response.status).json({ 
        error: `Yahoo API error: ${response.status}`,
        details: text.substring(0, 500)
      })
    }
    
    const data = await response.json()
    console.log('Yahoo API data received:', JSON.stringify(data).substring(0, 500))
    
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json(data)
  } catch (error) {
    console.error('Stock API error:', error.message, error.stack)
    res.status(500).json({ 
      error: 'Failed to fetch stock data',
      message: error.message
    })
  }
}
