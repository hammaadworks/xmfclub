import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client
const supabaseUrl = 'https://jaxrcenqibiqqbrqctyr.supabase.co';
const supabaseKey = 'sb_publishable_AswGmuyQFvPDaVeJqBcEjg_jLbll9fC'; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding root admins...');
  
  const admins = [
    {
      name: 'Mohammed Hammaad',
      phone: '9663527755',
      member_id: 'XC260002',
      pattern: '0-3-6-7-8-5-2', // pattern: 0367852
      role: 'admin'
    },
    {
      name: 'Master Farhan',
      phone: '8884503703',
      member_id: 'XC260001',
      pattern: '0-4-8-5-2-6', // default X pattern
      role: 'admin'
    }
  ];

  for (const admin of admins) {
    const pseudoEmail = `${admin.phone}@xmfclub.com`;
    
    // 1. Sign up user in Auth
    console.log(`Creating Auth user for ${admin.name}...`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: pseudoEmail,
      password: admin.pattern,
    });

    if (authError) {
      console.error(`❌ Error creating auth user for ${admin.name}:`, authError.message);
      continue;
    }

    if (!authData.user) {
      console.error(`❌ No user returned for ${admin.name}. Ensure email confirmations are turned OFF in Supabase Auth settings.`);
      continue;
    }

    const userId = authData.user.id;

    // 2. Insert into members table
    const { error: dbError } = await supabase.from('members').insert({
      id: userId,
      member_id: admin.member_id,
      role: admin.role,
      name: admin.name,
      phone: admin.phone,
      email: pseudoEmail,
    });

    if (dbError) {
      console.error(`❌ Error inserting member record for ${admin.name}:`, dbError.message);
    } else {
      console.log(`✅ Successfully seeded: ${admin.name}`);
    }
  }
}

seed();
