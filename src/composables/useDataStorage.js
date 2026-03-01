import { ref } from 'vue';

export function useDataStorage(userId = null) {
  const currentUserId = ref(userId);

  const setUserId = (id) => {
    currentUserId.value = id;
  };

  const saveData = async (key, data) => {
    const dataStr = JSON.stringify(data);
    localStorage.setItem(key, dataStr);
  };

  const loadData = async (key, defaultValue = null) => {
    const localData = localStorage.getItem(key);
    return localData ? JSON.parse(localData) : defaultValue;
  };

  const deleteData = async (key) => {
    localStorage.removeItem(key);
  };

  const saveAllData = async (dataMap) => {
    const promises = Object.entries(dataMap).map(([key, value]) => 
      saveData(key, value)
    );
    await Promise.all(promises);
  };

  const loadAllData = async (keys, defaults = {}) => {
    const result = {};
    const promises = keys.map(async (key) => {
      result[key] = await loadData(key, defaults[key] || null);
    });
    await Promise.all(promises);
    return result;
  };

  return {
    setUserId,
    saveData,
    loadData,
    deleteData,
    saveAllData,
    loadAllData
  };
}
