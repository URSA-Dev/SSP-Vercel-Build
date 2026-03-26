/**
 * Migration 022 — Bridge case_documents to MongoDB
 * Adds MongoDB document/GridFS references and extraction status
 * to the existing case_documents table for hybrid PG + MongoDB storage.
 *
 * NOTE: file_path column is retained for backward compatibility during
 * migration from local disk to MongoDB GridFS. New uploads should use
 * mongo_gridfs_id exclusively.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('case_documents', (table) => {
    table.string('mongo_document_id', 24); // MongoDB ObjectId as hex string
    table.string('mongo_gridfs_id', 24); // GridFS file reference
    table.string('content_hash', 64); // SHA-256 integrity check
    table.integer('version').defaultTo(1); // document version number
    table.string('extraction_status', 20).defaultTo('PENDING');
    // Values: 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'VALIDATED'
  });

  // Lookup by MongoDB document ID
  await knex.raw('CREATE INDEX idx_case_documents_mongo ON case_documents (mongo_document_id) WHERE mongo_document_id IS NOT NULL');
  // Filter by extraction pipeline status
  await knex.raw('CREATE INDEX idx_case_documents_extraction ON case_documents (extraction_status)');
  // Version lookup per case
  await knex.raw('CREATE INDEX idx_case_documents_version ON case_documents (case_id, version DESC)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_case_documents_version');
  await knex.raw('DROP INDEX IF EXISTS idx_case_documents_extraction');
  await knex.raw('DROP INDEX IF EXISTS idx_case_documents_mongo');

  await knex.schema.alterTable('case_documents', (table) => {
    table.dropColumn('extraction_status');
    table.dropColumn('version');
    table.dropColumn('content_hash');
    table.dropColumn('mongo_gridfs_id');
    table.dropColumn('mongo_document_id');
  });
}
