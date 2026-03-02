import { ref, watch } from 'vue';

const currentView = ref('wallet');

const viewOptions = [
  { id: 'wallet', name: '钱包', nameEn: 'Wallet' },
  { id: 'invest', name: '投资', nameEn: 'Invest' },
  { id: 'notes', name: '笔记', nameEn: 'Notes' },
  { id: 'pixel', name: '像素助手', nameEn: 'Pixel Agent' }
];

export function useViewState() {
  const setView = (viewId) => {
    currentView.value = viewId;
    localStorage.setItem('currentView', viewId);
  };

  const getView = () => {
    const saved = localStorage.getItem('currentView');
    if (saved && ['wallet', 'invest', 'notes', 'pixel'].includes(saved)) {
      currentView.value = saved;
    }
    return currentView.value;
  };

  const getCurrentView = () => currentView.value;

  const getViewOptions = () => viewOptions;

  watch(currentView, (newVal) => {
    localStorage.setItem('currentView', newVal);
  });

  return {
    currentView,
    viewOptions,
    setView,
    getView,
    getCurrentView,
    getViewOptions
  };
}
