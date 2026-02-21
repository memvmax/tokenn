<template>
  <div class="news-section">
    <div class="news-header">
      <div class="news-title">
        <i class="fas fa-newspaper"></i>
        <span>{{ t('financialNews') }}</span>
      </div>
      <button class="refresh-btn" @click="fetchNews" :disabled="loading">
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
      </button>
    </div>

    <div class="news-list" v-if="news.length > 0">
      <div 
        v-for="(item, index) in news" 
        :key="index" 
        class="news-item"
        @click="openNews(item.link)"
      >
        <div class="news-time">
          <span class="time-value">{{ formatTimeValue(item.pubDate) }}</span>
          <span class="time-unit">{{ formatTimeUnit(item.pubDate) }}</span>
        </div>
        <div class="news-content">
          <div class="news-headline">{{ item.title }}</div>
          <div class="news-source">{{ item.source }}</div>
        </div>
        <i class="fas fa-external-link-alt news-link-icon"></i>
      </div>
    </div>

    <div class="news-loading" v-else-if="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>{{ t('loadingNews') }}</span>
    </div>

    <div class="news-empty" v-else>
      <i class="fas fa-rss"></i>
      <span>{{ t('noNews') }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  t: {
    type: Function,
    required: true
  }
});

const news = ref([]);
const loading = ref(false);
let refreshInterval = null;

const RSS_FEEDS = [
  {
    url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^DJI,^IXIC&region=US&lang=en-US',
    source: 'Yahoo Finance'
  },
  {
    url: 'https://www.investing.com/rss/news.rss',
    source: 'Investing.com'
  }
];

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

const fetchNews = async () => {
  loading.value = true;
  const allNews = [];

  try {
    const promises = RSS_FEEDS.map(async (feed) => {
      try {
        const response = await fetch(CORS_PROXY + encodeURIComponent(feed.url));
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = xml.querySelectorAll('item');

        items.forEach((item, index) => {
          if (index < 5) {
            const title = item.querySelector('title')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || '';

            allNews.push({
              title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
              link,
              pubDate,
              source: feed.source
            });
          }
        });
      } catch (error) {
        console.error(`Failed to fetch ${feed.source}:`, error);
      }
    });

    await Promise.all(promises);

    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    news.value = allNews.slice(0, 15);
  } catch (error) {
    console.error('Failed to fetch news:', error);
  } finally {
    loading.value = false;
  }
};

const formatTimeValue = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return '';
  if (diff < 3600) return Math.floor(diff / 60);
  if (diff < 86400) return Math.floor(diff / 3600);
  return date.toLocaleDateString();
};

const formatTimeUnit = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return props.t('justNow');
  if (diff < 3600) return props.t('minutesAgo');
  if (diff < 86400) return props.t('hoursAgo');
  return '';
};

const openNews = (link) => {
  if (link) {
    window.open(link, '_blank');
  }
};

onMounted(() => {
  fetchNews();
  refreshInterval = setInterval(fetchNews, 5 * 60 * 1000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.news-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 16px;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.news-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1;
  padding-top: 7px;
}

.news-title i {
  color: var(--text-secondary);
  font-size: 12px;
}

.refresh-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.refresh-btn:hover:not(:disabled) {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.news-list::-webkit-scrollbar {
  width: 4px;
}

.news-list::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 2px;
}

.news-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.news-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.news-item:hover {
  border-color: var(--border-color);
  background: var(--bg-hover);
}

.news-time {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 10px;
  color: var(--text-muted);
  min-width: 50px;
  padding-top: 2px;
}

.time-value {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.time-unit {
  font-size: 9px;
  color: var(--text-muted);
}

.news-content {
  flex: 1;
  min-width: 0;
}

.news-headline {
  font-size: 12px;
  color: var(--text-primary);
  line-height: 1.4;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-source {
  font-size: 10px;
  color: var(--text-muted);
}

.news-link-icon {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.15s ease;
  padding-top: 2px;
}

.news-item:hover .news-link-icon {
  opacity: 1;
}

.news-loading,
.news-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-muted);
  gap: 8px;
}

.news-loading i,
.news-empty i {
  font-size: 24px;
  opacity: 0.5;
}

.news-loading span,
.news-empty span {
  font-size: 12px;
}
</style>
