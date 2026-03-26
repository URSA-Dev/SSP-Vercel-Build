/**
 * Migration 016 — Agentic AI Database Layer
 *
 * Creates 8 ENUM types and 10 tables to support:
 * - Agentic AI (multi-step autonomous agents)
 * - Analytical AI (feature store, risk scoring)
 * - Generative AI (prompt templates, LLM conversations)
 *
 * All AI outputs require human-in-the-loop review (DoW compliance).
 * Agent events are append-only for audit compliance.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {

  // ─── 1. ENUM Types ────────────────────────────────────────────────

  await knex.raw(`
    CREATE TYPE ai_agent_type AS ENUM (
      'DOCUMENT_INTAKE', 'EXTRACTION', 'ISSUE_IDENTIFICATION',
      'MEMO_DRAFTING', 'QA_VALIDATION', 'SUSPENSE_MONITOR', 'RISK_SCORING'
    )
  `);

  await knex.raw(`
    CREATE TYPE ai_agent_status AS ENUM (
      'ACTIVE', 'DEPRECATED', 'TESTING', 'DISABLED'
    )
  `);

  await knex.raw(`
    CREATE TYPE ai_task_status AS ENUM (
      'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED',
      'AWAITING_HUMAN_REVIEW', 'CANCELLED', 'RETRYING'
    )
  `);

  await knex.raw(`
    CREATE TYPE ai_task_trigger AS ENUM (
      'AUTOMATIC', 'MANUAL', 'SCHEDULED', 'CHAINED'
    )
  `);

  await knex.raw(`
    CREATE TYPE ai_review_status AS ENUM (
      'PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'
    )
  `);

  await knex.raw(`
    CREATE TYPE ai_review_decision AS ENUM (
      'ACCEPT', 'ACCEPT_WITH_EDITS', 'REJECT', 'ESCALATE'
    )
  `);

  await knex.raw(`
    CREATE TYPE ai_message_role AS ENUM (
      'system', 'user', 'assistant', 'tool'
    )
  `);

  await knex.raw(`
    CREATE TYPE ai_model_provider AS ENUM (
      'ANTHROPIC', 'GCP_VERTEX', 'GCP_DOCUMENT_AI', 'CUSTOM'
    )
  `);

  // ─── 2. ai_models — Model Registry ───────────────────────────────

  await knex.schema.createTable('ai_models', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.specificType('provider', 'ai_model_provider').notNullable();
    table.string('model_name', 100).notNullable();
    table.string('model_version', 50).notNullable();
    table.string('display_name', 200).notNullable();
    table.jsonb('capabilities').defaultTo('[]');
    table.jsonb('config').defaultTo('{}');
    table.decimal('cost_per_input_token', 12, 8);
    table.decimal('cost_per_output_token', 12, 8);
    table.boolean('is_active').defaultTo(true);
    table.jsonb('performance_metrics').defaultTo('{}');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.unique(['provider', 'model_name', 'model_version']);
  });

  await knex.raw(`
    CREATE INDEX idx_ai_models_active ON ai_models (is_active) WHERE is_active = true
  `);

  // ─── 3. ai_agents — Agent Registry ───────────────────────────────

  await knex.schema.createTable('ai_agents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.specificType('agent_type', 'ai_agent_type').notNullable().unique();
    table.string('name', 100).notNullable();
    table.text('description');
    table.uuid('model_id').references('id').inTable('ai_models').onDelete('RESTRICT');
    table.specificType('status', 'ai_agent_status').notNullable().defaultTo('TESTING');
    table.string('version', 20).notNullable().defaultTo('1.0.0');
    table.jsonb('config').defaultTo('{}');
    table.jsonb('capabilities').defaultTo('[]');
    table.integer('max_retries').defaultTo(3);
    table.integer('timeout_seconds').defaultTo(300);
    table.boolean('requires_human_review').defaultTo(true);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_ai_agents_status ON ai_agents (status)');
  await knex.raw('CREATE INDEX idx_ai_agents_model_id ON ai_agents (model_id)');

  // ─── 4. ai_prompt_templates — Versioned Prompts ──────────────────

  await knex.schema.createTable('ai_prompt_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.specificType('agent_type', 'ai_agent_type').notNullable();
    table.string('name', 200).notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.text('system_prompt').notNullable();
    table.text('user_prompt_template').notNullable();
    table.jsonb('variables').defaultTo('[]');
    table.boolean('is_active').defaultTo(true);
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.unique(['agent_type', 'name', 'version']);
  });

  await knex.raw(`
    CREATE INDEX idx_ai_prompt_templates_active
    ON ai_prompt_templates (agent_type, is_active) WHERE is_active = true
  `);

  // ─── 5. ai_tasks — Orchestration ─────────────────────────────────

  await knex.schema.createTable('ai_tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('case_id').references('id').inTable('cases').onDelete('CASCADE');
    table.uuid('agent_id').notNullable().references('id').inTable('ai_agents').onDelete('RESTRICT');
    table.uuid('parent_task_id').references('id').inTable('ai_tasks').onDelete('SET NULL');
    table.specificType('status', 'ai_task_status').notNullable().defaultTo('QUEUED');
    table.specificType('trigger_type', 'ai_task_trigger').notNullable().defaultTo('AUTOMATIC');
    table.integer('priority').defaultTo(0);
    table.jsonb('input_payload').defaultTo('{}');
    table.jsonb('output_payload');
    table.jsonb('error_payload');
    table.uuid('model_id').references('id').inTable('ai_models').onDelete('RESTRICT');
    table.uuid('prompt_template_id').references('id').inTable('ai_prompt_templates').onDelete('SET NULL');
    table.integer('attempt_number').defaultTo(1);
    table.timestamp('started_at', { useTz: true });
    table.timestamp('completed_at', { useTz: true });
    table.integer('duration_ms');
    table.uuid('initiated_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_ai_tasks_case_id ON ai_tasks (case_id)');
  await knex.raw('CREATE INDEX idx_ai_tasks_agent_id ON ai_tasks (agent_id)');
  await knex.raw('CREATE INDEX idx_ai_tasks_parent_task_id ON ai_tasks (parent_task_id)');
  await knex.raw('CREATE INDEX idx_ai_tasks_status ON ai_tasks (status)');
  await knex.raw(`
    CREATE INDEX idx_ai_tasks_queue ON ai_tasks (status, priority DESC)
    WHERE status = 'QUEUED'
  `);
  await knex.raw('CREATE INDEX idx_ai_tasks_case_agent ON ai_tasks (case_id, agent_id, status)');

  // ─── 6. ai_task_messages — LLM Conversations (append-only) ───────

  await knex.schema.createTable('ai_task_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').notNullable().references('id').inTable('ai_tasks').onDelete('CASCADE');
    table.specificType('role', 'ai_message_role').notNullable();
    table.text('content').notNullable();
    table.jsonb('tool_calls');
    table.string('tool_call_id', 100);
    table.integer('token_count_input');
    table.integer('token_count_output');
    table.integer('sequence_number').notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    // No updated_at — append-only

    table.unique(['task_id', 'sequence_number']);
  });

  await knex.raw('CREATE INDEX idx_ai_task_messages_task_id ON ai_task_messages (task_id)');

  // ─── 7. ai_outputs — Agent-Generated Artifacts ────────────────────

  await knex.schema.createTable('ai_outputs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').notNullable().references('id').inTable('ai_tasks').onDelete('CASCADE');
    table.uuid('case_id').notNullable().references('id').inTable('cases').onDelete('CASCADE');
    table.specificType('agent_type', 'ai_agent_type').notNullable();
    table.string('output_type', 100).notNullable();
    table.jsonb('content').notNullable();
    table.text('content_text');
    table.decimal('confidence_score', 5, 4);
    table.specificType('review_status', 'ai_review_status').notNullable().defaultTo('PENDING');
    table.string('target_entity_type', 50);
    table.uuid('target_entity_id');
    table.uuid('superseded_by').references('id').inTable('ai_outputs').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_ai_outputs_task_id ON ai_outputs (task_id)');
  await knex.raw('CREATE INDEX idx_ai_outputs_case_id ON ai_outputs (case_id)');
  await knex.raw('CREATE INDEX idx_ai_outputs_review_status ON ai_outputs (review_status)');
  await knex.raw(`
    CREATE INDEX idx_ai_outputs_pending ON ai_outputs (case_id, review_status)
    WHERE review_status = 'PENDING'
  `);
  await knex.raw('CREATE INDEX idx_ai_outputs_target ON ai_outputs (target_entity_type, target_entity_id)');

  // ─── 8. ai_human_reviews — Human-in-the-Loop (append-only) ───────

  await knex.schema.createTable('ai_human_reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('output_id').notNullable().references('id').inTable('ai_outputs').onDelete('CASCADE');
    table.uuid('reviewer_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.specificType('decision', 'ai_review_decision').notNullable();
    table.text('comments');
    table.jsonb('edits_applied');
    table.integer('review_duration_seconds');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    // No updated_at — review decisions are final
  });

  await knex.raw('CREATE INDEX idx_ai_human_reviews_output_id ON ai_human_reviews (output_id)');
  await knex.raw('CREATE INDEX idx_ai_human_reviews_reviewer_id ON ai_human_reviews (reviewer_id)');

  // ─── 9. ai_metrics — Token Usage & Cost ──────────────────────────

  await knex.schema.createTable('ai_metrics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').notNullable().unique().references('id').inTable('ai_tasks').onDelete('CASCADE');
    table.uuid('model_id').notNullable().references('id').inTable('ai_models').onDelete('RESTRICT');
    table.specificType('agent_type', 'ai_agent_type').notNullable();
    table.integer('tokens_input').notNullable().defaultTo(0);
    table.integer('tokens_output').notNullable().defaultTo(0);
    table.integer('latency_ms');
    table.decimal('cost_usd', 10, 6);
    table.integer('api_calls').defaultTo(1);
    table.boolean('cache_hit').defaultTo(false);
    table.integer('error_count').defaultTo(0);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Generated column for tokens_total
  await knex.raw(`
    ALTER TABLE ai_metrics
    ADD COLUMN tokens_total INTEGER GENERATED ALWAYS AS (tokens_input + tokens_output) STORED
  `);

  await knex.raw('CREATE INDEX idx_ai_metrics_model_id ON ai_metrics (model_id)');
  await knex.raw('CREATE INDEX idx_ai_metrics_agent_type ON ai_metrics (agent_type)');
  await knex.raw('CREATE INDEX idx_ai_metrics_created_at ON ai_metrics (created_at DESC)');

  // ─── 10. ai_feature_store — Analytical AI Features ────────────────

  await knex.schema.createTable('ai_feature_store', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('case_id').notNullable().references('id').inTable('cases').onDelete('CASCADE');
    table.string('feature_name', 100).notNullable();
    table.decimal('feature_value', 10, 4);
    table.jsonb('feature_metadata').defaultTo('{}');
    table.string('model_version', 50);
    table.timestamp('computed_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('expires_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.unique(['case_id', 'feature_name', 'model_version']);
  });

  await knex.raw('CREATE INDEX idx_ai_feature_store_case_id ON ai_feature_store (case_id)');
  await knex.raw('CREATE INDEX idx_ai_feature_store_feature_name ON ai_feature_store (feature_name)');
  await knex.raw(`
    CREATE INDEX idx_ai_feature_store_expires ON ai_feature_store (expires_at)
    WHERE expires_at IS NOT NULL
  `);

  // ─── 11. ai_agent_events — Compliance Audit Trail (append-only) ──

  await knex.schema.createTable('ai_agent_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').references('id').inTable('ai_tasks').onDelete('SET NULL');
    table.specificType('agent_type', 'ai_agent_type').notNullable();
    table.uuid('case_id').references('id').inTable('cases').onDelete('SET NULL');
    table.string('event_type', 100).notNullable();
    table.jsonb('event_data').defaultTo('{}');
    table.decimal('confidence_score', 5, 4);
    table.uuid('model_id').references('id').inTable('ai_models').onDelete('SET NULL');
    table.uuid('initiated_by').references('id').inTable('users').onDelete('SET NULL');
    table.string('ip_address', 45);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    // No updated_at, no deleted_at — append-only for compliance
  });

  await knex.raw('CREATE INDEX idx_ai_agent_events_task_id ON ai_agent_events (task_id)');
  await knex.raw('CREATE INDEX idx_ai_agent_events_case_id ON ai_agent_events (case_id)');
  await knex.raw('CREATE INDEX idx_ai_agent_events_agent_type ON ai_agent_events (agent_type)');
  await knex.raw('CREATE INDEX idx_ai_agent_events_event_type ON ai_agent_events (event_type)');
  await knex.raw('CREATE INDEX idx_ai_agent_events_created_at ON ai_agent_events (created_at DESC)');
  await knex.raw('CREATE INDEX idx_ai_agent_events_case_time ON ai_agent_events (case_id, created_at DESC)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Drop tables in reverse dependency order
  await knex.schema.dropTableIfExists('ai_agent_events');
  await knex.schema.dropTableIfExists('ai_feature_store');
  await knex.schema.dropTableIfExists('ai_metrics');
  await knex.schema.dropTableIfExists('ai_human_reviews');
  await knex.schema.dropTableIfExists('ai_outputs');
  await knex.schema.dropTableIfExists('ai_task_messages');
  await knex.schema.dropTableIfExists('ai_tasks');
  await knex.schema.dropTableIfExists('ai_prompt_templates');
  await knex.schema.dropTableIfExists('ai_agents');
  await knex.schema.dropTableIfExists('ai_models');

  // Drop ENUM types
  await knex.raw('DROP TYPE IF EXISTS ai_model_provider');
  await knex.raw('DROP TYPE IF EXISTS ai_message_role');
  await knex.raw('DROP TYPE IF EXISTS ai_review_decision');
  await knex.raw('DROP TYPE IF EXISTS ai_review_status');
  await knex.raw('DROP TYPE IF EXISTS ai_task_trigger');
  await knex.raw('DROP TYPE IF EXISTS ai_task_status');
  await knex.raw('DROP TYPE IF EXISTS ai_agent_status');
  await knex.raw('DROP TYPE IF EXISTS ai_agent_type');
}
