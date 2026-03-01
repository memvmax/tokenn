import { ref } from 'vue'
import { supabase } from './supabase'

const user = ref(null)

export function useSupabase() {
  const getUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user.value = authUser
    return { user: authUser }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    user.value = null
  }

  const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
  }

  const isConfigured = true

  const saveUserData = async (userId, dataType, data) => {
    const { data: result, error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        data_type: dataType,
        data: JSON.stringify(data),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, data_type'
      })
    
    return { data: result, error }
  }

  const loadUserData = async (userId, dataType) => {
    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .eq('data_type', dataType)
      .maybeSingle()
    
    if (data?.data) {
      return { data: JSON.parse(data.data), error }
    }
    return { data: null, error }
  }

  return {
    user,
    getUser,
    signIn,
    signUp,
    signOut,
    onAuthStateChange,
    isConfigured,
    saveUserData,
    loadUserData
  }
}
