
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
