import { ref, watch } from 'vue';
import { supabase, useSupabase } from '../lib/supabase';

export function useDataStorage(userId = null) {
  const { isConfigured } = useSupabase();
  
  const currentUserId = ref(userId);

  const setUserId = (id) => {
    currentUserId.value = id;
  };

  const saveData = async (key, data) => {
    const dataStr = JSON.stringify(data);
    
    if (isConfigured && currentUserId.value) {
      try {
        const { error } = await supabase
          .from('user_data')
          .upsert({
            user_id: currentUserId.value,
            data_key: key,
            data_value: dataStr,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,data_key'
          });
        
        if (error) {
          console.error('Supabase save error:', error);
          localStorage.setItem(key, dataStr);
        }
      } catch (e) {
        console.error('Save error:', e);
        localStorage.setItem(key, dataStr);
      }
    } else {
      localStorage.setItem(key, dataStr);
    }
  };

  const loadData = async (key, defaultValue = null) => {
    if (isConfigured && currentUserId.value) {
      try {
        const { data, error } = await supabase
          .from('user_data')
          .select('data_value')
          .eq('user_id', currentUserId.value)
          .eq('data_key', key)
          .single();
        
        if (error || !data) {
          const localData = localStorage.getItem(key);
          return localData ? JSON.parse(localData) : defaultValue;
        }
        
        return JSON.parse(data.data_value);
      } catch (e) {
        console.error('Load error:', e);
        const localData = localStorage.getItem(key);
        return localData ? JSON.parse(localData) : defaultValue;
      }
    } else {
      const localData = localStorage.getItem(key);
      return localData ? JSON.parse(localData) : defaultValue;
    }
  };

  const deleteData = async (key) => {
    if (isConfigured && currentUserId.value) {
      try {
        await supabase
          .from('user_data')
          .delete()
          .eq('user_id', currentUserId.value)
          .eq('data_key', key);
      } catch (e) {
        console.error('Delete error:', e);
      }
    }
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
