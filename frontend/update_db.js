import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jaxrcenqibiqqbrqctyr.supabase.co';
const supabaseKey = 'sb_publishable_AswGmuyQFvPDaVeJqBcEjg_jLbll9fC'; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function update() {
  await supabase.from('members').update({ pattern_hash: '048526' }).eq('member_id', 'XC260001');
  await supabase.from('members').update({ pattern_hash: '0367852' }).eq('member_id', 'XC260002');
  console.log('Updated pattern hashes for XC260001 and XC260002');
}
update();
