
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
  console.log('--- Debugging Data ---');
  
  // 1. Check Classes
  const { data: classes, error: classError } = await supabase.from('kelas').select('*');
  console.log('Classes:', classes?.length, classError || '');
  if (classes && classes.length > 0) {
      console.log('Sample Class:', classes[0]);
  }

  // 2. Check Subjects (Mata Pelajaran)
  const { data: mapel, error: mapelError } = await supabase.from('mata_pelajaran').select('*');
  console.log('Mata Pelajaran:', mapel?.length, mapelError || '');
  if (mapel && mapel.length > 0) {
      console.log('Sample Mapel:', mapel[0]);
  } else {
      console.log('No subjects found. Is the table empty?');
  }

  // 3. Check RLS on Mata Pelajaran? (Try inserting if empty? No, just read is enough)
}

debug();
