/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('policies', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.string('policy_type', 100).notNullable();
    table.string('status', 20).defaultTo('Draft');
    table.string('version', 20).defaultTo('0.1');
    table.text('content');
    table.string('author', 100);
    table.timestamp('last_revised', { useTz: true });
    table.timestamp('deleted_at', { useTz: true });
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_policies_status ON policies (status)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('policies');
}
