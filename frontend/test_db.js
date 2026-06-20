import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jaxrcenqibiqqbrqctyr.supabase.co';
const supabaseKey = 'sb_publishable_AswGmuyQFvPDaVeJqBcEjg_jLbll9fC'; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('members').select('*');
  console.log('Members:', data);
  if (error) console.error(error);
}
check();
