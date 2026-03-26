/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('case_communications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('case_id').notNullable().references('id').inTable('cases').onDelete('CASCADE');
    table.string('comm_type', 50).notNullable();
    table.string('direction', 20).notNullable();
    table.string('subject', 255).notNullable();
    table.text('body').notNullable();
    table.string('suspense_effect', 50).defaultTo('No Effect');
    table.string('logged_by', 100);
    table.timestamp('logged_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_case_communications_case_id ON case_communications (case_id)');
  await knex.raw('CREATE INDEX idx_case_communications_comm_type ON case_communications (comm_type)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('case_communications');
}
