import playwright from 'playwright-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
    
    await page.goto('https://q.futunn.com/profile/34125173/post/original', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    const posts = await page.evaluate(() => {
      const items = [];
      
      const postElements = document.querySelectorAll('.post-item, .feed-item, [class*="post"], [class*="article"]');
      
      if (postElements.length === 0) {
        const allLinks = document.querySelectorAll('a[href*="/post/"], a[href*="/article/"]');
        allLinks.forEach(link => {
          const titleEl = link.querySelector('[class*="title"]') || link;
          const title = titleEl.textContent?.trim();
          const href = link.href;
          if (title && href) {
            items.push({
              title: title.substring(0, 100),
              link: href,
              pubDate: new Date().toISOString(),
              source: 'Futu User'
            });
          }
        });
      } else {
        postElements.forEach(el => {
          const titleEl = el.querySelector('[class*="title"]') || el.querySelector('h3') || el.querySelector('h4');
          const linkEl = el.querySelector('a[href*="/post/"]') || el.querySelector('a');
          const timeEl = el.querySelector('[class*="time"]') || el.querySelector('time');
          
          if (titleEl && linkEl) {
            items.push({
              title: titleEl.textContent?.trim().substring(0, 100),
              link: linkEl.href,
              pubDate: timeEl?.textContent?.trim() || new Date().toISOString(),
              source: 'Futu User'
            });
          }
        });
      }
      
      return items.slice(0, 10);
    });

    if (posts.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No posts found. The page may require login.',
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
