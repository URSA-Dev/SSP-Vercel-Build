/**
 * Add case_subtypes column to cases table.
 * Stored as JSONB array — subtypes are dynamic per case_type.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('cases', (table) => {
    table.jsonb('case_subtypes').defaultTo('[]');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('cases', (table) => {
    table.dropColumn('case_subtypes');
  });
}
