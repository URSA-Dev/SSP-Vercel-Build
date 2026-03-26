/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('fcl_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('fcl_id', 20).notNullable().unique();
    table.string('entity_name', 200).notNullable();
    table.string('cage_code', 20);
    table.string('clearance_level', 50).notNullable();
    table.string('status', 20).notNullable().defaultTo('Pending');
    table.string('sponsor', 200);
    table.date('expires_at');
    table.string('fso_name', 100);
    table.integer('employee_count');
    table.date('last_review');
    table.timestamp('deleted_at', { useTz: true });
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_fcl_records_status ON fcl_records (status)');
  await knex.raw('CREATE INDEX idx_fcl_records_clearance_level ON fcl_records (clearance_level)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('fcl_records');
}
