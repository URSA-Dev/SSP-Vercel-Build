/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`
    CREATE TYPE issue_severity AS ENUM (
      'CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'ADMINISTRATIVE'
    )
  `);

  await knex.schema.createTable('case_issues', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('case_id').notNullable().references('id').inTable('cases').onDelete('CASCADE');
    table.string('category', 50).notNullable();
    table.string('subcategory', 200);
    table.specificType('severity', 'issue_severity').notNullable();
    table.specificType('guideline', 'CHAR(1)');
    table.boolean('in_memo').defaultTo(false);
    table.text('description').notNullable();
    table.text('mitigation');
    table.string('mitigation_type', 50);
    table.timestamp('deleted_at', { useTz: true });
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_case_issues_case_id ON case_issues (case_id)');
  await knex.raw('CREATE INDEX idx_case_issues_severity ON case_issues (severity)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('case_issues');
  await knex.raw('DROP TYPE IF EXISTS issue_severity');
}
