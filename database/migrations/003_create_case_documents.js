/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`
    CREATE TYPE document_status AS ENUM (
      'processing', 'awaiting', 'confirmed', 'failed'
    )
  `);

  await knex.schema.createTable('case_documents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('case_id').notNullable().references('id').inTable('cases').onDelete('CASCADE');
    table.string('doc_type', 100);
    table.string('filename', 255).notNullable();
    table.string('file_path', 500);
    table.string('file_size', 20);
    table.specificType('status', 'document_status').defaultTo('processing');
    table.decimal('confidence', 5, 4);
    table.jsonb('extracted_fields').defaultTo('{}');
    table.timestamp('uploaded_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true });
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_case_documents_case_id ON case_documents (case_id)');
  await knex.raw('CREATE INDEX idx_case_documents_status ON case_documents (status)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('case_documents');
  await knex.raw('DROP TYPE IF EXISTS document_status');
}
