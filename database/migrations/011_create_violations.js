/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`
    CREATE TYPE violation_severity AS ENUM (
      'MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL'
    )
  `);

  await knex.schema.createTable('violations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('violation_number', 20).notNullable().unique();
    table.date('violation_date').notNullable();
    table.string('category', 50).notNullable();
    table.string('subcategory', 200);
    table.string('subject_name', 200).notNullable();
    table.string('clearance', 50);
    table.string('location', 200);
    table.specificType('severity', 'violation_severity').notNullable();
    table.string('status', 30).notNullable().defaultTo('OPEN');
    table.boolean('sso_notified').defaultTo(false);
    table.date('sso_date');
    table.boolean('adj_impact').defaultTo(false);
    table.text('description').notNullable();
    table.text('actions_taken');
    table.string('reported_by', 100);
    table.date('closed_date');
    table.boolean('ci_referral').defaultTo(false);
    table.text('ci_note');
    table.timestamp('deleted_at', { useTz: true });
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_violations_status ON violations (status)');
  await knex.raw('CREATE INDEX idx_violations_category ON violations (category)');
  await knex.raw('CREATE INDEX idx_violations_severity ON violations (severity)');
  await knex.raw('CREATE INDEX idx_violations_violation_date ON violations (violation_date)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('violations');
  await knex.raw('DROP TYPE IF EXISTS violation_severity');
}
