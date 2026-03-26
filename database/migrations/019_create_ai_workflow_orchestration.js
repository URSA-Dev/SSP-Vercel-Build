/**
 * Migration 019 — AI Workflow Orchestration (DAG)
 * Multi-step AI pipelines with conditional branching, parallel gates,
 * and human-in-the-loop wait steps.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`
    CREATE TYPE ai_workflow_status AS ENUM (
      'PENDING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED'
    )
  `);

  await knex.raw(`
    CREATE TYPE ai_step_status AS ENUM (
      'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED', 'WAITING'
    )
  `);

  await knex.raw(`
    CREATE TYPE ai_condition_operator AS ENUM (
      'EQUALS', 'GT', 'LT', 'GTE', 'LTE', 'IN', 'NOT_NULL', 'ALWAYS'
    )
  `);

  // -----------------------------------------------------------
  // ai_workflows — Pipeline definitions
  // -----------------------------------------------------------
  await knex.schema.createTable('ai_workflows', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 200).notNullable();
    table.text('description');
    table.integer('version').notNullable().defaultTo(1);
    table.string('trigger_event', 100); // "DOCUMENT_UPLOADED", "CASE_CREATED", "STATUS_CHANGED"
    table.jsonb('trigger_conditions').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.integer('max_duration_seconds').defaultTo(3600);
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('deleted_at', { useTz: true });
    table.timestamps(true, true);

    table.unique(['name', 'version']);
  });

  await knex.raw("CREATE INDEX idx_ai_workflows_active ON ai_workflows (is_active, trigger_event) WHERE is_active = true");

  // -----------------------------------------------------------
  // ai_workflow_steps — Steps in the DAG
  // -----------------------------------------------------------
  await knex.schema.createTable('ai_workflow_steps', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('workflow_id').notNullable().references('id').inTable('ai_workflows').onDelete('CASCADE');
    table.string('step_name', 200).notNullable();
    table.integer('step_order').notNullable(); // parallel steps share same order
    table.specificType('agent_type', 'ai_agent_type'); // which agent executes
    table.string('step_type', 50).notNullable(); // 'AGENT_TASK', 'CONDITION', 'WAIT_FOR_HUMAN', 'NOTIFICATION', 'PARALLEL_GATE'
    table.jsonb('config').defaultTo('{}');
    table.integer('timeout_seconds').defaultTo(300);
    table.boolean('is_optional').defaultTo(false);
    table.string('on_failure', 50).defaultTo('ABORT'); // 'ABORT', 'SKIP', 'RETRY', 'FALLBACK'
    table.uuid('fallback_step_id').references('id').inTable('ai_workflow_steps').onDelete('SET NULL');
    table.timestamps(true, true);

    table.unique(['workflow_id', 'step_name']);
  });

  await knex.raw('CREATE INDEX idx_ai_wf_steps_workflow ON ai_workflow_steps (workflow_id, step_order)');

  // -----------------------------------------------------------
  // ai_workflow_edges — Conditional branching between steps
  // -----------------------------------------------------------
  await knex.schema.createTable('ai_workflow_edges', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('workflow_id').notNullable().references('id').inTable('ai_workflows').onDelete('CASCADE');
    table.uuid('from_step_id').notNullable().references('id').inTable('ai_workflow_steps').onDelete('CASCADE');
    table.uuid('to_step_id').notNullable().references('id').inTable('ai_workflow_steps').onDelete('CASCADE');
    table.string('condition_field', 200); // "output.confidence_score"
    table.specificType('condition_operator', 'ai_condition_operator');
    table.string('condition_value', 500); // "0.85" or '["FAVORABLE","DEFERRED"]'
    table.integer('priority').defaultTo(0); // higher = evaluated first
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());

    table.unique(['from_step_id', 'to_step_id']);
  });

  await knex.raw('CREATE INDEX idx_ai_wf_edges_from ON ai_workflow_edges (from_step_id)');
  await knex.raw('CREATE INDEX idx_ai_wf_edges_workflow ON ai_workflow_edges (workflow_id)');

  // -----------------------------------------------------------
  // ai_workflow_runs — Runtime instances of a workflow
  // -----------------------------------------------------------
  await knex.schema.createTable('ai_workflow_runs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('workflow_id').notNullable().references('id').inTable('ai_workflows').onDelete('RESTRICT');
    table.uuid('case_id').references('id').inTable('cases').onDelete('SET NULL');
    table.uuid('document_id').references('id').inTable('case_documents').onDelete('SET NULL');
    table.specificType('status', 'ai_workflow_status').notNullable().defaultTo('PENDING');
    table.uuid('current_step_id').references('id').inTable('ai_workflow_steps').onDelete('SET NULL');
    table.jsonb('context').defaultTo('{}'); // accumulated data flowing through pipeline
    table.jsonb('error_payload');
    table.timestamp('started_at', { useTz: true });
    table.timestamp('completed_at', { useTz: true });
    table.integer('duration_ms');
    table.uuid('initiated_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
  });

  await knex.raw("CREATE INDEX idx_ai_wf_runs_active ON ai_workflow_runs (status) WHERE status IN ('PENDING', 'RUNNING', 'PAUSED')");
  await knex.raw('CREATE INDEX idx_ai_wf_runs_case ON ai_workflow_runs (case_id, status)');
  await knex.raw('CREATE INDEX idx_ai_wf_runs_workflow ON ai_workflow_runs (workflow_id)');

  // -----------------------------------------------------------
  // ai_workflow_step_runs — Per-step execution records
  // -----------------------------------------------------------
  await knex.schema.createTable('ai_workflow_step_runs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('run_id').notNullable().references('id').inTable('ai_workflow_runs').onDelete('CASCADE');
    table.uuid('step_id').notNullable().references('id').inTable('ai_workflow_steps').onDelete('RESTRICT');
    table.uuid('task_id').references('id').inTable('ai_tasks').onDelete('SET NULL');
    table.specificType('status', 'ai_step_status').notNullable().defaultTo('PENDING');
    table.jsonb('input_data').defaultTo('{}');
    table.jsonb('output_data');
    table.jsonb('error_payload');
    table.integer('attempt_number').defaultTo(1);
    table.timestamp('started_at', { useTz: true });
    table.timestamp('completed_at', { useTz: true });
    table.integer('duration_ms');
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_ai_wf_step_runs_run ON ai_workflow_step_runs (run_id, status)');
  await knex.raw('CREATE INDEX idx_ai_wf_step_runs_task ON ai_workflow_step_runs (task_id) WHERE task_id IS NOT NULL');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('ai_workflow_step_runs');
  await knex.schema.dropTableIfExists('ai_workflow_runs');
  await knex.schema.dropTableIfExists('ai_workflow_edges');
  await knex.schema.dropTableIfExists('ai_workflow_steps');
  await knex.schema.dropTableIfExists('ai_workflows');
  await knex.raw('DROP TYPE IF EXISTS ai_condition_operator');
  await knex.raw('DROP TYPE IF EXISTS ai_step_status');
  await knex.raw('DROP TYPE IF EXISTS ai_workflow_status');
}
