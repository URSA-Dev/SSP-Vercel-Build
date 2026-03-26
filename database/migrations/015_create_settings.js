/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('scope', 20).notNullable().defaultTo('tenant');
    table.uuid('scope_id');
    table.string('key', 100).notNullable();
    table.jsonb('value').notNullable().defaultTo('{}');
    table.timestamps(true, true);
  });

  await knex.raw('CREATE UNIQUE INDEX idx_settings_scope_key ON settings (scope, COALESCE(scope_id, \'00000000-0000-0000-0000-000000000000\'::uuid), key)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('settings');
}
