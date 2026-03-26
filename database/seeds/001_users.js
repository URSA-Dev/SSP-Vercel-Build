import bcrypt from 'bcryptjs';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex('users').del();

  const hash = await bcrypt.hash('demo123', 10);

  await knex('users').insert([
    {
      email: 'admin@ursamobile.com',
      password_hash: hash,
      last_name: 'Admin',
      first_initial: 'A',
      role: 'ADMIN',
      unit: 'URSA Mobile',
    },
    {
      email: 'smith@ursamobile.com',
      password_hash: hash,
      last_name: 'Smith',
      first_initial: 'A',
      role: 'ADJUDICATOR',
      unit: 'URSA Mobile',
    },
    {
      email: 'williams@ursamobile.com',
      password_hash: hash,
      last_name: 'Williams',
      first_initial: 'K',
      role: 'ADJUDICATOR',
      unit: 'URSA Mobile',
    },
    {
      email: 'chen@ursamobile.com',
      password_hash: hash,
      last_name: 'Chen',
      first_initial: 'D',
      role: 'ADJUDICATOR',
      unit: 'URSA Mobile',
    },
    {
      email: 'johnson@ursamobile.com',
      password_hash: hash,
      last_name: 'Johnson',
      first_initial: 'T',
      role: 'SUPERVISOR',
      unit: 'URSA Mobile',
    },
  ]);
}
