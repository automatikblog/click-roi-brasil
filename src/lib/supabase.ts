import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)