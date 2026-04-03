/**
 * Replace legacy tier-based case_type ENUM with DoW security domain types.
 *
 * Old: T1, T2, T3, T5, PPR, LBI
 * New: PVP, SEAD3, INDOC, FTRV, INTHR, SINC, SAP, TRAIN, VAR
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`ALTER TYPE case_type RENAME TO case_type_old`);

  await knex.raw(`
    CREATE TYPE case_type AS ENUM (
      'PVP', 'SEAD3', 'INDOC', 'FTRV', 'INTHR', 'SINC', 'SAP', 'TRAIN', 'VAR'
    )
  `);

  await knex.raw(`
    ALTER TABLE cases
      ALTER COLUMN case_type TYPE case_type
      USING case_type::text::case_type
  `);

  await knex.raw(`DROP TYPE case_type_old`);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw(`ALTER TYPE case_type RENAME TO case_type_new`);

  await knex.raw(`
    CREATE TYPE case_type AS ENUM (
      'T1', 'T2', 'T3', 'T5', 'PPR', 'LBI'
    )
  `);

  await knex.raw(`
    ALTER TABLE cases
      ALTER COLUMN case_type TYPE case_type
      USING case_type::text::case_type
  `);

  await knex.raw(`DROP TYPE case_type_new`);
}
