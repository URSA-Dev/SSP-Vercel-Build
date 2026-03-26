/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('qa_reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('case_id').notNullable().references('id').inTable('cases').onDelete('CASCADE');
    table.string('submitted_by', 100);
    table.timestamp('submitted_at', { useTz: true }).defaultTo(knex.fn.now());
    table.string('reviewer', 100);
    table.timestamp('reviewed_at', { useTz: true });
    table.string('outcome', 30);
    table.jsonb('checklist').defaultTo('[]');
    table.text('comments');
    table.string('status', 20).defaultTo('Pending');
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_qa_reviews_case_id ON qa_reviews (case_id)');
  await knex.raw('CREATE INDEX idx_qa_reviews_status ON qa_reviews (status)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('qa_reviews');
}
