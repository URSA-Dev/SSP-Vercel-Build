/**
 * Migration 018 — RAG Knowledge Base
 * Chunked policy/regulation content with vector embeddings for
 * retrieval-augmented generation across AI agents.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Check if pgvector is available (enabled in migration 017)
  let hasVector = false;
  try {
    await knex.raw("SELECT 1 FROM pg_extension WHERE extname = 'vector'");
    const result = await knex.raw("SELECT count(*)::int as cnt FROM pg_extension WHERE extname = 'vector'");
    hasVector = result.rows[0].cnt > 0;
  } catch {
    hasVector = false;
  }

  await knex.raw(`
    CREATE TYPE ai_embedding_status AS ENUM (
      'PENDING', 'COMPLETED', 'FAILED', 'STALE'
    )
  `);

  await knex.raw(`
    CREATE TYPE ai_knowledge_source_type AS ENUM (
      'POLICY', 'REGULATION', 'PRECEDENT', 'GUIDELINE', 'SOP', 'TRAINING'
    )
  `);

  // -----------------------------------------------------------
  // ai_knowledge_sources — Source documents for RAG retrieval
  // -----------------------------------------------------------
  await knex.schema.createTable('ai_knowledge_sources', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.specificType('source_type', 'ai_knowledge_source_type').notNullable();
    table.string('title', 500).notNullable();
    table.text('description');
    table.string('source_reference', 500); // "SEAD-4", "EO 12968"
    table.string('version', 50);
    table.string('content_hash', 64); // SHA-256 for change detection
    table.integer('total_chunks').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.uuid('policy_id').references('id').inTable('policies').onDelete('SET NULL');
    table.string('mongo_document_id', 24); // Link to MongoDB document
    table.date('effective_date');
    table.date('expiration_date');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('deleted_at', { useTz: true });
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_ai_knowledge_sources_type ON ai_knowledge_sources (source_type, is_active)');
  await knex.raw('CREATE INDEX idx_ai_knowledge_sources_policy ON ai_knowledge_sources (policy_id) WHERE policy_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_ai_knowledge_sources_active ON ai_knowledge_sources (is_active) WHERE is_active = true AND deleted_at IS NULL');

  // -----------------------------------------------------------
  // ai_knowledge_chunks — Chunked content with vector embeddings
  // -----------------------------------------------------------
  await knex.schema.createTable('ai_knowledge_chunks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('source_id').notNullable().references('id').inTable('ai_knowledge_sources').onDelete('CASCADE');
    table.integer('chunk_index').notNullable();
    table.text('content').notNullable();
    if (hasVector) {
      table.specificType('content_embedding', 'vector(1536)').notNullable();
    }
    table.integer('token_count');
    table.jsonb('metadata').defaultTo('{}'); // page, section, heading
    table.string('embedding_model', 100).notNullable();
    table.specificType('embedding_status', 'ai_embedding_status').defaultTo('PENDING');
    table.timestamps(true, true);

    table.unique(['source_id', 'chunk_index']);
  });

  // Main RAG search index — IVFFlat for cosine similarity (only if pgvector available)
  if (hasVector) {
    await knex.raw('CREATE INDEX idx_ai_knowledge_chunks_embedding ON ai_knowledge_chunks USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 200)');
  }
  await knex.raw('CREATE INDEX idx_ai_knowledge_chunks_source ON ai_knowledge_chunks (source_id, chunk_index)');
  await knex.raw("CREATE INDEX idx_ai_knowledge_chunks_stale ON ai_knowledge_chunks (embedding_status) WHERE embedding_status != 'COMPLETED'");

  // -----------------------------------------------------------
  // ai_rag_query_log — Append-only audit of RAG retrievals
  // -----------------------------------------------------------
  await knex.schema.createTable('ai_rag_query_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').references('id').inTable('ai_tasks').onDelete('SET NULL');
    table.specificType('agent_type', 'ai_agent_type').notNullable();
    table.text('query_text').notNullable();
    if (hasVector) {
      table.specificType('query_embedding', 'vector(1536)');
    }
    table.specificType('retrieved_chunk_ids', 'uuid[]');
    table.specificType('retrieved_scores', 'decimal(5,4)[]');
    table.integer('top_k');
    table.decimal('similarity_threshold', 5, 4);
    table.integer('total_results');
    table.integer('latency_ms');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    // No updated_at — append-only for compliance
  });

  await knex.raw('CREATE INDEX idx_ai_rag_query_log_task ON ai_rag_query_log (task_id)');
  await knex.raw('CREATE INDEX idx_ai_rag_query_log_time ON ai_rag_query_log (created_at DESC)');
  await knex.raw('CREATE INDEX idx_ai_rag_query_log_agent ON ai_rag_query_log (agent_type)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('ai_rag_query_log');
  await knex.schema.dropTableIfExists('ai_knowledge_chunks');
  await knex.schema.dropTableIfExists('ai_knowledge_sources');
  await knex.raw('DROP TYPE IF EXISTS ai_knowledge_source_type');
  await knex.raw('DROP TYPE IF EXISTS ai_embedding_status');
}
