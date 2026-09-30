import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uozvvjuupkkvrphpuaos.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvenZ2anV1cGtrdnJwaHB1YW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NDEyNTgsImV4cCI6MjEwNjMxNzI1OH0.8J-aGYrnVfR07uPeIKjM5mrhkkG7-1_gndR6Wv8fJR0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

