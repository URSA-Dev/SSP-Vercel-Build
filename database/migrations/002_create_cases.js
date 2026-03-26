/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`
    CREATE TYPE case_type AS ENUM (
      'T1', 'T2', 'T3', 'T5', 'PPR', 'LBI'
    )
  `);

  await knex.raw(`
    CREATE TYPE case_status AS ENUM (
      'RECEIVED', 'ASSIGNED', 'IN_REVIEW', 'ISSUES_IDENTIFIED',
      'MEMO_DRAFT', 'QA_REVIEW', 'QA_REVISION', 'FINAL_REVIEW',
      'SUBMITTED', 'ON_HOLD', 'CLOSED_FAVORABLE', 'CLOSED_UNFAVORABLE',
      'CANCELLED'
    )
  `);

  await knex.raw(`
    CREATE TYPE case_priority AS ENUM (
      'CRITICAL', 'HIGH', 'NORMAL', 'LOW', 'SURGE'
    )
  `);

  await knex.raw(`
    CREATE TYPE case_disposition AS ENUM (
      'FAVORABLE', 'UNFAVORABLE', 'DEFERRED', 'REFERRED'
    )
  `);

  await knex.schema.createTable('cases', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('case_number', 20).notNullable().unique();
    table.string('subject_last', 100).notNullable();
    table.specificType('subject_init', 'CHAR(1)').notNullable();
    table.specificType('case_type', 'case_type').notNullable();
    table.specificType('status', 'case_status').notNullable().defaultTo('RECEIVED');
    table.specificType('priority', 'case_priority').notNullable().defaultTo('NORMAL');
    table.date('received_date').notNullable();
    table.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('suspense_48hr', { useTz: true });
    table.timestamp('suspense_3day', { useTz: true });
    table.boolean('met_susp_48').defaultTo(null);
    table.boolean('met_susp_3d').defaultTo(null);
    table.boolean('surge').defaultTo(false);
    table.specificType('disposition', 'case_disposition');
    table.string('rec_status', 50).defaultTo('Not Started');
    table.text('notes');
    table.timestamp('deleted_at', { useTz: true });
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_cases_status ON cases (status)');
  await knex.raw('CREATE INDEX idx_cases_priority ON cases (priority)');
  await knex.raw('CREATE INDEX idx_cases_assigned_to ON cases (assigned_to)');
  await knex.raw('CREATE INDEX idx_cases_received_date ON cases (received_date)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('cases');
  await knex.raw('DROP TYPE IF EXISTS case_disposition');
  await knex.raw('DROP TYPE IF EXISTS case_priority');
  await knex.raw('DROP TYPE IF EXISTS case_status');
  await knex.raw('DROP TYPE IF EXISTS case_type');
}
