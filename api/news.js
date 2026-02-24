import playwright from 'playwright-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const source = req.query.source || 'sina';
  
  let browser = null;
  
  try {
    browser = await playwright.chromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'zh-CN',
    });

    const page = await context.newPage();
    
    let posts = [];
    
    if (source === 'sina') {
      await page.goto('https://finance.sina.com.cn/7x24/', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await page.waitForTimeout(2000);

      posts = await page.evaluate(() => {
        const items = [];
        const newsItems = document.querySelectorAll('.bd_i_list_c');
        
        newsItems.forEach((el, index) => {
          if (index < 15) {
            const timeEl = el.querySelector('.bd_i_time_c');
            const contentEl = el.querySelector('.bd_i_list_c_a');
            
            if (contentEl) {
              const time = timeEl?.textContent?.trim() || '';
              const content = contentEl?.textContent?.trim();
              
              if (content) {
                items.push({
                  title: content.substring(0, 150),
                  link: 'https://finance.sina.com.cn/7x24/',
                  pubDate: time,
                  source: '新浪财经 7x24'
                });
              }
            }
          }
        });
        
        return items;
      });
    } else if (source === 'eastmoney') {
      await page.goto('https://kuaixun.eastmoney.com/', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await page.waitForTimeout(2000);

      posts = await page.evaluate(() => {
        const items = [];
        const newsItems = document.querySelectorAll('.news-item, .list_item');
        
        newsItems.forEach((el, index) => {
          if (index < 15) {
            const timeEl = el.querySelector('.time, .timer');
            const titleEl = el.querySelector('.title, .content, a');
            
            if (titleEl) {
              const time = timeEl?.textContent?.trim() || '';
              const title = titleEl?.textContent?.trim();
              const link = titleEl?.href || 'https://kuaixun.eastmoney.com/';
              
              if (title) {
                items.push({
                  title: title.substring(0, 150),
                  link: link,
                  pubDate: time,
                  source: '东方财富快讯'
                });
              }
            }
          }
        });
        
        return items;
      });
    }

    if (posts.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No news found',
        posts: []
      });
    }

    return res.status(200).json({
      success: true,
      posts
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      posts: []
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
