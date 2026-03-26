/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('case_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('case_id').notNullable().references('id').inTable('cases').onDelete('CASCADE');
    table.string('user_name', 100);
    table.string('action', 100).notNullable();
    table.text('detail');
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_case_history_case_id ON case_history (case_id)');
  await knex.raw('CREATE INDEX idx_case_history_created_at ON case_history (created_at)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('case_history');
}
