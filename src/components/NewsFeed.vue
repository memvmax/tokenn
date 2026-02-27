<template>
  <div class="news-section">
    <div class="news-header">
      <div class="news-title">
        <i class="fas fa-newspaper"></i>
        <span>{{ t('financialNews') }}</span>
      </div>
      <div class="header-actions">
        <button class="source-btn" @click="toggleSourceDropdown">
          <i class="fas fa-globe"></i>
        </button>
        <button class="refresh-btn" @click="fetchNews" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        </button>
      </div>
      <div class="source-dropdown" v-if="showSourceDropdown" @click.stop>
        <div class="dropdown-header">{{ t('selectSource') }}</div>
        <button 
          v-for="feed in RSS_FEEDS" 
          :key="feed.source"
          class="dropdown-item"
          :class="{ 'active': activeSource === feed.source }"
          @click="selectSource(feed)"
        >
          <i class="fas fa-rss"></i>
          <span>{{ feed.source }}</span>
        </button>
      </div>
    </div>

    <div class="news-list" v-if="news.length > 0">
      <div 
        v-for="(item, index) in news" 
        :key="index" 
        class="news-item"
        :class="{ 'is-link': item.isLink }"
        @click="item.isLink ? openNews(item.link) : null"
      >
        <div class="news-time" v-if="!item.isLink">
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
const showSourceDropdown = ref(false);
const activeSource = ref('Yahoo Finance');
let refreshInterval = null;

const RSS_FEEDS = [
  {
    url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^DJI,^IXIC&region=US&lang=en-US',
    source: 'Yahoo Finance'
  },
  {
    url: 'https://www.investing.com/rss/news.rss',
    source: 'Investing.com'
  },
  {
    url: 'https://q.futunn.com/profile/34125173/post/original',
    source: 'Futu User',
    type: 'web'
  }
];

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

const fetchNews = async () => {
  loading.value = true;
  const allNews = [];

  try {
    const activeFeed = RSS_FEEDS.find(f => f.source === activeSource.value);
    if (!activeFeed) {
      loading.value = false;
      return;
    }

    if (activeFeed.type === 'web') {
      news.value = [{
        title: 'Futu User Feed',
        link: activeFeed.url,
        pubDate: new Date().toISOString(),
        source: activeFeed.source,
        isLink: true
      }];
      loading.value = false;
      return;
    }

    try {
      const response = await fetch(CORS_PROXY + encodeURIComponent(activeFeed.url));
      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      const items = xml.querySelectorAll('item');

      items.forEach((item, index) => {
        if (index < 15) {
          const title = item.querySelector('title')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || '';

          allNews.push({
            title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
            link,
            pubDate,
            source: activeFeed.source
          });
        }
      });
    } catch (error) {
      console.error(`Failed to fetch ${activeFeed.source}:`, error);
    }

    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    news.value = allNews;
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

const toggleSourceDropdown = () => {
  showSourceDropdown.value = !showSourceDropdown.value;
};

const selectSource = (feed) => {
  activeSource.value = feed.source;
  showSourceDropdown.value = false;
  fetchNews();
};

onMounted(() => {
  fetchNews();
  refreshInterval = setInterval(fetchNews, 5 * 60 * 1000);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  document.removeEventListener('click', handleClickOutside);
});

const handleClickOutside = (e) => {
  if (!e.target.closest('.source-dropdown') && !e.target.closest('.source-btn')) {
    showSourceDropdown.value = false;
  }
};
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
  position: relative;
}

.news-header .header-actions {
  display: flex;
  gap: 8px;
}

.source-btn {
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

.source-btn:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.source-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  min-width: 160px;
  overflow: hidden;
}

.dropdown-header {
  padding: 8px 12px;
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  border-bottom: 1px solid var(--border-light);
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.dropdown-item.active {
  background: rgba(8, 145, 178, 0.15);
  color: var(--accent-blue);
}

.dropdown-item i {
  font-size: 10px;
  width: 14px;
}

.news-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
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
