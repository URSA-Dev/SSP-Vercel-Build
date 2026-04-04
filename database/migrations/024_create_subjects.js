/**
 * Create subjects table — canonical source of truth for persons.
 * Cases link to subjects via subject_id FK for 100% accurate multi-case tracking.
 *
 * Identifiers (minimal PII):
 *   - subject_last + subject_init (required)
 *   - middle_init + dob_year (optional, disambiguation)
 *   - employee_id (optional, strongest unique match)
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. Create subjects table
  await knex.schema.createTable('subjects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('subject_last', 100).notNullable();
    table.specificType('subject_init', 'CHAR(1)').notNullable();
    table.specificType('middle_init', 'CHAR(1)');
    table.smallint('dob_year');
    table.string('employee_id', 50);
    table.timestamp('deleted_at', { useTz: true });
    table.timestamps(true, true);
  });

  // 2. Unique index on employee_id (strongest match, partial — excludes soft-deleted)
  await knex.raw(`
    CREATE UNIQUE INDEX idx_subjects_employee_id
    ON subjects (employee_id)
    WHERE employee_id IS NOT NULL AND deleted_at IS NULL
  `);

  // 3. Composite unique index for name-based disambiguation (case-insensitive, partial)
  await knex.raw(`
    CREATE UNIQUE INDEX idx_subjects_unique_name
    ON subjects (
      LOWER(subject_last),
      UPPER(subject_init),
      COALESCE(UPPER(middle_init), ''),
      COALESCE(dob_year, 0)
    )
    WHERE deleted_at IS NULL
  `);

  // 4. Add subject_id FK to cases (nullable for backfill safety)
  await knex.schema.alterTable('cases', (table) => {
    table.uuid('subject_id').references('id').inTable('subjects').onDelete('RESTRICT');
  });

  await knex.raw('CREATE INDEX idx_cases_subject_id ON cases (subject_id)');

  // 5. Backfill: create subjects from existing cases and link them
  const existingCases = await knex('cases')
    .select('id', 'subject_last', 'subject_init')
    .whereNull('deleted_at');

  const subjectMap = new Map();

  for (const c of existingCases) {
    const key = `${(c.subject_last || '').toLowerCase()}|${(c.subject_init || '').toUpperCase()}`;

    if (!subjectMap.has(key)) {
      const [subject] = await knex('subjects').insert({
        subject_last: c.subject_last,
        subject_init: (c.subject_init || '').toUpperCase(),
      }).returning('id');
      subjectMap.set(key, subject.id);
    }

    await knex('cases')
      .where({ id: c.id })
      .update({ subject_id: subjectMap.get(key) });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_cases_subject_id');
  await knex.schema.alterTable('cases', (table) => {
    table.dropColumn('subject_id');
  });
  await knex.schema.dropTableIfExists('subjects');
}
