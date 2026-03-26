/**
 * Migration 021 — AI Guardrails
 * Content filtering, PII detection, output validation, and cost/token
 * limits for AI agent safety and DoW compliance.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`
    CREATE TYPE ai_guardrail_type AS ENUM (
      'CONTENT_FILTER', 'PII_DETECTION', 'OUTPUT_VALIDATION',
      'INPUT_VALIDATION', 'TOKEN_LIMIT', 'COST_LIMIT', 'BIAS_CHECK'
    )
  `);

  await knex.raw(`
    CREATE TYPE ai_guardrail_action AS ENUM (
      'LOG', 'WARN', 'BLOCK', 'REDACT', 'ESCALATE'
    )
  `);

  await knex.raw(`
    CREATE TYPE ai_guardrail_severity AS ENUM (
      'INFO', 'WARNING', 'BLOCK', 'CRITICAL'
    )
  `);

  // -----------------------------------------------------------
  // ai_guardrails — Rule definitions
  // -----------------------------------------------------------
  await knex.schema.createTable('ai_guardrails', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 200).notNullable();
    table.text('description');
    table.specificType('guardrail_type', 'ai_guardrail_type').notNullable();
    table.specificType('agent_type', 'ai_agent_type'); // null = applies to all agents
    table.specificType('severity', 'ai_guardrail_severity').defaultTo('WARNING');
    table.specificType('action', 'ai_guardrail_action').notNullable();
    table.jsonb('config').notNullable(); // rule-specific config
    // PII: {"patterns": ["SSN", "DOB", "ADDRESS"], "redaction_format": "[REDACTED-{type}]"}
    // CONTENT: {"blocked_topics": [...], "regex_patterns": [...]}
    // TOKEN_LIMIT: {"max_input": 100000, "max_output": 4000}
    // OUTPUT_VALIDATION: {"required_fields": [...], "json_schema": {...}}
    table.boolean('is_active').defaultTo(true);
    table.integer('priority').defaultTo(0); // higher = evaluated first
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('deleted_at', { useTz: true });
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_ai_guardrails_active ON ai_guardrails (is_active, guardrail_type) WHERE is_active = true');
  await knex.raw('CREATE INDEX idx_ai_guardrails_agent ON ai_guardrails (agent_type) WHERE agent_type IS NOT NULL');
  await knex.raw('CREATE INDEX idx_ai_guardrails_priority ON ai_guardrails (priority DESC) WHERE is_active = true');

  // -----------------------------------------------------------
  // ai_guardrail_violations — Append-only violation log
  // -----------------------------------------------------------
  await knex.schema.createTable('ai_guardrail_violations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('guardrail_id').notNullable().references('id').inTable('ai_guardrails').onDelete('RESTRICT');
    table.uuid('task_id').references('id').inTable('ai_tasks').onDelete('SET NULL');
    table.specificType('agent_type', 'ai_agent_type').notNullable();
    table.uuid('case_id').references('id').inTable('cases').onDelete('SET NULL');
    table.string('violation_type', 100).notNullable(); // "PII_DETECTED", "BLOCKED_CONTENT", "SCHEMA_INVALID"
    table.specificType('severity', 'ai_guardrail_severity').notNullable();
    table.specificType('action_taken', 'ai_guardrail_action').notNullable();
    table.jsonb('details').notNullable(); // {"detected_pii": ["SSN"], "location": "output.content", "was_redacted": true}
    table.text('input_snippet'); // truncated input for debugging
    table.boolean('resolved').defaultTo(false);
    table.uuid('resolved_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('resolved_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    // No general updated_at — append-only for DoW compliance
    // Only resolved_* fields can be set post-creation
  });

  await knex.raw('CREATE INDEX idx_ai_guardrail_violations_guardrail ON ai_guardrail_violations (guardrail_id, created_at DESC)');
  await knex.raw('CREATE INDEX idx_ai_guardrail_violations_task ON ai_guardrail_violations (task_id)');
  await knex.raw('CREATE INDEX idx_ai_guardrail_violations_unresolved ON ai_guardrail_violations (severity, resolved) WHERE resolved = false');
  await knex.raw('CREATE INDEX idx_ai_guardrail_violations_case ON ai_guardrail_violations (case_id, created_at DESC)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('ai_guardrail_violations');
  await knex.schema.dropTableIfExists('ai_guardrails');
  await knex.raw('DROP TYPE IF EXISTS ai_guardrail_severity');
  await knex.raw('DROP TYPE IF EXISTS ai_guardrail_action');
  await knex.raw('DROP TYPE IF EXISTS ai_guardrail_type');
}
