import { ref } from 'vue'
import { supabase } from './supabase'

const user = ref(null)

export function useSupabase() {
  const getUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user.value = authUser
      return { user: authUser }
    } catch (e) {
      console.error('getUser error:', e)
      return { user: null, error: e }
    }
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
    try {
      console.log('Saving to Supabase:', { userId, dataType, dataLength: data?.length })
      
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
      
      if (error) {
        console.error('Supabase save error:', error)
      } else {
        console.log('Supabase save success:', { dataType })
      }
      
      return { data: result, error }
    } catch (e) {
      console.error('Supabase save exception:', e)
      return { data: null, error: e }
    }
  }

  const loadUserData = async (userId, dataType) => {
    try {
      console.log('Loading from Supabase:', { userId, dataType })
      
      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', dataType)
        .maybeSingle()
      
      if (error) {
        console.error('Supabase load error:', error)
        return { data: null, error }
      }
      
      if (data?.data) {
        const parsed = JSON.parse(data.data)
        console.log('Supabase load success:', { dataType, dataLength: parsed?.length })
        return { data: parsed, error }
      }
      
      console.log('Supabase no data found:', { dataType })
      return { data: null, error }
    } catch (e) {
      console.error('Supabase load exception:', e)
      return { data: null, error: e }
    }
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
