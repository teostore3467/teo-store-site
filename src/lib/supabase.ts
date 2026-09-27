import {
  createClient,
} from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env
    .VITE_SUPABASE_URL

const supabaseKey =
  import.meta.env
    .VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env
    .VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    'VITE_SUPABASE_URL is missing.',
  )
}

if (!supabaseKey) {
  throw new Error(
    'Supabase public key is missing.',
  )
}

export const supabase =
  createClient(
    supabaseUrl,
    supabaseKey,
  )