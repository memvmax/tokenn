import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Using localStorage fallback.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const useSupabase = () => {
  const isConfigured = !!supabase;

  const signUp = async (email, password) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  const signIn = async (email, password) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    if (!supabase) return { error: { message: 'Supabase not configured' } };
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const getUser = async () => {
    if (!supabase) return { user: null };
    const { data: { user } } = await supabase.auth.getUser();
    return { user };
  };

  const getSession = async () => {
    if (!supabase) return { session: null };
    const { data: { session } } = await supabase.auth.getSession();
    return { session };
  };

  const onAuthStateChange = (callback) => {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  };

  const saveUserData = async (userId, dataType, data) => {
    if (!supabase || !userId) return { error: { message: 'Supabase not configured or not logged in' } };
    
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        data_type: dataType,
        data: data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,data_type'
      });
    
    return { error };
  };

  const loadUserData = async (userId, dataType) => {
    if (!supabase || !userId) return { data: null, error: null };
    
    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .eq('data_type', dataType)
      .single();
    
    return { data: data?.data || null, error };
  };

  return {
    supabase,
    isConfigured,
    signUp,
    signIn,
    signOut,
    getUser,
    getSession,
    onAuthStateChange,
    saveUserData,
    loadUserData
  };
};
