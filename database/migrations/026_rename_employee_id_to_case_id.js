/**
 * Rename employee_id to case_id on subjects table.
 * case_id is system-generated in CID-XXXXX format.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_subjects_employee_id');

  await knex.schema.alterTable('subjects', (table) => {
    table.renameColumn('employee_id', 'case_id');
  });

  await knex.raw(`
    CREATE UNIQUE INDEX idx_subjects_case_id
    ON subjects (case_id)
    WHERE case_id IS NOT NULL AND deleted_at IS NULL
  `);

  // Backfill existing subjects that have no case_id
  const subjects = await knex('subjects')
    .whereNull('case_id')
    .whereNull('deleted_at')
    .select('id')
    .orderBy('created_at', 'asc');

  for (let i = 0; i < subjects.length; i++) {
    const cid = `CID-${String(i + 1).padStart(5, '0')}`;
    await knex('subjects').where({ id: subjects[i].id }).update({ case_id: cid });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_subjects_case_id');

  await knex.schema.alterTable('subjects', (table) => {
    table.renameColumn('case_id', 'employee_id');
  });

  await knex.raw(`
    CREATE UNIQUE INDEX idx_subjects_employee_id
    ON subjects (employee_id)
    WHERE employee_id IS NOT NULL AND deleted_at IS NULL
  `);
}
