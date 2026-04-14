import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpeevhlvmqfmtezbnyfb.supabase.co';
const supabaseServiceKey = 'sbp_3ce1097a80c8728894644238a363fd1735646914';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setup() {
  try {
    console.log('🌱 Setting up PR Greens database...');

    // Create user
    console.log('Creating user jorge@prgreens.com...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'jorge@prgreens.com',
      password: 'PRGreens2026!',
      email_confirm: true,
      user_metadata: { full_name: 'Jorge Montalvo' }
    });

    if (userError) {
      if (userError.message.includes('already exists')) {
        console.log('✓ User already exists');
        // Get the user ID
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users?.users?.find(u => u.email === 'jorge@prgreens.com');
        if (user) {
          userData.user = user;
        } else {
          throw userError;
        }
      } else {
        throw userError;
      }
    } else {
      console.log('✓ User created:', userData.user.id);
    }

    // Create profile
    const orgId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    console.log('Creating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userData.user.id,
        org_id: orgId,
        role: 'manager',
        full_name: 'Jorge Montalvo'
      });

    if (profileError) {
      console.error('✗ Profile error:', profileError);
    } else {
      console.log('✓ Profile created/updated');
    }

    console.log('\n✅ Setup complete!');
    console.log('Demo credentials:');
    console.log('  Email: jorge@prgreens.com');
    console.log('  Password: PRGreens2026!');
  } catch (err) {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  }
}

setup();
