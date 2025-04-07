#!/usr/bin/env node

/**
 * This script updates a user's role in Supabase.
 * 
 * Usage:
 * node update-user-role.js <email> <role>
 * 
 * Example:
 * node update-user-role.js admin@example.com manager
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get command line arguments
const email = process.argv[2];
const role = process.argv[3];

// Validate arguments
if (!email || !role) {
  console.error('Usage: node update-user-role.js <email> <role>');
  process.exit(1);
}

// Validate role
const validRoles = ['client', 'equipment_inspector', 'financial_inspector', 'manager'];
if (!validRoles.includes(role)) {
  console.error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  process.exit(1);
}

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateUserRole() {
  try {
    // Find the user by email
    const { data: users, error: userError } = await supabase
      .from('users_view')
      .select('id, email, role')
      .eq('email', email)
      .limit(1);

    if (userError) {
      throw userError;
    }

    if (!users || users.length === 0) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    const userId = users[0].id;
    const currentRole = users[0].role;

    console.log(`Found user: ${email} (${userId})`);
    console.log(`Current role: ${currentRole}`);
    console.log(`New role: ${role}`);

    // Update the user's role
    const { error: updateError } = await supabase.rpc('update_user_role', {
      user_id: userId,
      new_role: role
    });

    if (updateError) {
      throw updateError;
    }

    console.log(`Successfully updated user role to ${role}.`);
  } catch (error) {
    console.error('Error updating user role:', error.message);
    process.exit(1);
  }
}

updateUserRole();
