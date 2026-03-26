/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('foreign_travel', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('travel_id', 20).notNullable().unique();
    table.string('subject_name', 200).notNullable();
    table.string('clearance', 50);
    table.text('countries').notNullable();
    table.date('depart_date');
    table.date('return_date');
    table.string('purpose', 200);
    table.boolean('briefed').defaultTo(false);
    table.boolean('debriefed').defaultTo(false);
    table.string('risk_level', 20).defaultTo('LOW');
    table.string('status', 20).defaultTo('PLANNED');
    table.text('referral_notes');
    table.timestamp('deleted_at', { useTz: true });
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_foreign_travel_status ON foreign_travel (status)');
  await knex.raw('CREATE INDEX idx_foreign_travel_risk_level ON foreign_travel (risk_level)');
  await knex.raw('CREATE INDEX idx_foreign_travel_depart_date ON foreign_travel (depart_date)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('foreign_travel');
}
