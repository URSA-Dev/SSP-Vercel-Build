/**
 * Migration 017 — AI Conversation Memory + pgvector
 * Enables semantic memory retrieval for AI agents across cases.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Check if pgvector is available without causing a transaction abort
  const extCheck = await knex.raw(
    "SELECT count(*)::int as cnt FROM pg_available_extensions WHERE name = 'vector'"
  );
  const hasVector = extCheck.rows[0].cnt > 0;
  if (hasVector) {
    await knex.raw('CREATE EXTENSION IF NOT EXISTS vector');
  } else {
    console.warn('pgvector extension not available — vector columns and indexes will be skipped');
  }

  // Memory type enum
  await knex.raw(`
    CREATE TYPE ai_memory_type AS ENUM (
      'FACT', 'PREFERENCE', 'DECISION', 'CONTEXT', 'SUMMARY'
    )
  `);

  // Memory scope enum
  await knex.raw(`
    CREATE TYPE ai_memory_scope AS ENUM (
      'CASE', 'USER', 'AGENT_GLOBAL', 'SYSTEM'
    )
  `);

  await knex.schema.createTable('ai_conversation_memories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('agent_id').notNullable().references('id').inTable('ai_agents').onDelete('CASCADE');
    table.uuid('case_id').references('id').inTable('cases').onDelete('SET NULL');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.specificType('memory_type', 'ai_memory_type').notNullable();
    table.specificType('memory_scope', 'ai_memory_scope').notNullable().defaultTo('CASE');
    table.string('key', 200).notNullable();
    table.text('content').notNullable();
    if (hasVector) {
      table.specificType('content_embedding', 'vector(1536)');
    }
    table.decimal('relevance_score', 5, 4).defaultTo(1.0);
    table.uuid('source_task_id').references('id').inTable('ai_tasks').onDelete('SET NULL');
    table.timestamp('expires_at', { useTz: true });
    table.timestamp('last_accessed_at', { useTz: true });
    table.integer('access_count').defaultTo(0);
    table.timestamp('deleted_at', { useTz: true });
    table.timestamps(true, true);
  });

  // Primary lookup: agent memories for a case
  await knex.raw('CREATE INDEX idx_ai_conv_mem_agent_case ON ai_conversation_memories (agent_id, case_id)');
  // Scope-based filtering
  await knex.raw('CREATE INDEX idx_ai_conv_mem_scope ON ai_conversation_memories (memory_scope, memory_type)');
  // Key lookup per agent
  await knex.raw('CREATE INDEX idx_ai_conv_mem_key ON ai_conversation_memories (agent_id, key)');
  // Vector similarity search (IVFFlat) — only if pgvector is available
  if (hasVector) {
    await knex.raw('CREATE INDEX idx_ai_conv_mem_embedding ON ai_conversation_memories USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100)');
  }
  // TTL expiry cleanup
  await knex.raw('CREATE INDEX idx_ai_conv_mem_expires ON ai_conversation_memories (expires_at) WHERE expires_at IS NOT NULL');
  // Active-only queries
  await knex.raw('CREATE INDEX idx_ai_conv_mem_active ON ai_conversation_memories (agent_id, case_id) WHERE deleted_at IS NULL');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('ai_conversation_memories');
  await knex.raw('DROP TYPE IF EXISTS ai_memory_scope');
  await knex.raw('DROP TYPE IF EXISTS ai_memory_type');
  await knex.raw('DROP EXTENSION IF EXISTS vector');
}
