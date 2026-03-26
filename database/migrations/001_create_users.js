/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Create role enum
  await knex.raw(`
    CREATE TYPE user_role AS ENUM (
      'ADJUDICATOR',
      'SUPERVISOR',
      'QUALITY_REVIEWER',
      'ADMIN',
      'READ_ONLY'
    )
  `);

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('first_initial', 1).notNullable();
    table.specificType('role', 'user_role').notNullable().defaultTo('ADJUDICATOR');
    table.string('unit', 200).defaultTo('URSA Mobile');
    table.jsonb('preferences').defaultTo('{}');
    table.timestamp('last_login_at', { useTz: true });
    table.timestamp('deleted_at', { useTz: true });
    table.timestamps(true, true);
  });

  // Index for login lookup
  await knex.raw('CREATE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('users');
  await knex.raw('DROP TYPE IF EXISTS user_role');
}
