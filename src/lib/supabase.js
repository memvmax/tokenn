import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wwuabvijrauvyfvscxcu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3dWFidmlqcmF1dnlmdnNjeGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MTkzNjgsImV4cCI6MjA4NzQ5NTM2OH0.YQ175y8Js97T2K8ipFxBN_SMwrCzWbnaYIgAjqSKX8c'

export const supabase = createClient(supabaseUrl, supabaseKey)
