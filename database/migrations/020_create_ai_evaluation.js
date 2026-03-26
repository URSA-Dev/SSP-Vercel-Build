/**
 * Migration 020 — AI Evaluation & A/B Testing
 * Dataset management, experiment tracking, and per-sample evaluation
 * results for continuous AI quality improvement.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`
    CREATE TYPE ai_dataset_type AS ENUM (
      'TRAINING', 'VALIDATION', 'TEST', 'GOLDEN'
    )
  `);

  await knex.raw(`
    CREATE TYPE ai_experiment_status AS ENUM (
      'DRAFT', 'RUNNING', 'COMPLETED', 'CANCELLED'
    )
  `);

  // -----------------------------------------------------------
  // ai_eval_datasets — Curated datasets for evaluation
  // -----------------------------------------------------------
  await knex.schema.createTable('ai_eval_datasets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 200).notNullable();
    table.text('description');
    table.specificType('dataset_type', 'ai_dataset_type').notNullable();
    table.specificType('agent_type', 'ai_agent_type').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.integer('sample_count').defaultTo(0);
    table.jsonb('metadata').defaultTo('{}'); // label distribution, class balance
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('deleted_at', { useTz: true });
    table.timestamps(true, true);

    table.unique(['name', 'version']);
  });

  await knex.raw('CREATE INDEX idx_ai_eval_datasets_type ON ai_eval_datasets (agent_type, dataset_type)');
  await knex.raw('CREATE INDEX idx_ai_eval_datasets_active ON ai_eval_datasets (is_active) WHERE is_active = true');

  // -----------------------------------------------------------
  // ai_eval_samples — Individual data samples in a dataset
  // -----------------------------------------------------------
  await knex.schema.createTable('ai_eval_samples', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('dataset_id').notNullable().references('id').inTable('ai_eval_datasets').onDelete('CASCADE');
    table.jsonb('input_data').notNullable(); // input prompt/data
    table.jsonb('expected_output').notNullable(); // ground truth
    table.jsonb('metadata').defaultTo('{}'); // source case, annotator, difficulty
    table.uuid('case_id').references('id').inTable('cases').onDelete('SET NULL');
    table.uuid('annotated_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_ai_eval_samples_dataset ON ai_eval_samples (dataset_id)');
  await knex.raw('CREATE INDEX idx_ai_eval_samples_case ON ai_eval_samples (case_id) WHERE case_id IS NOT NULL');

  // -----------------------------------------------------------
  // ai_experiments — A/B test runs
  // -----------------------------------------------------------
  await knex.schema.createTable('ai_experiments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 200).notNullable();
    table.text('description');
    table.specificType('agent_type', 'ai_agent_type').notNullable();
    table.uuid('dataset_id').notNullable().references('id').inTable('ai_eval_datasets').onDelete('RESTRICT');
    table.specificType('status', 'ai_experiment_status').defaultTo('DRAFT');
    table.jsonb('config_a').notNullable(); // model/prompt config variant A
    table.jsonb('config_b'); // variant B (null = single-arm evaluation)
    table.jsonb('results_summary'); // aggregated metrics after completion
    table.string('winner', 1); // 'A' or 'B' or null
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('started_at', { useTz: true });
    table.timestamp('completed_at', { useTz: true });
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_ai_experiments_status ON ai_experiments (status, agent_type)');
  await knex.raw('CREATE INDEX idx_ai_experiments_dataset ON ai_experiments (dataset_id)');

  // -----------------------------------------------------------
  // ai_eval_results — Per-sample evaluation results
  // -----------------------------------------------------------
  await knex.schema.createTable('ai_eval_results', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('experiment_id').notNullable().references('id').inTable('ai_experiments').onDelete('CASCADE');
    table.uuid('sample_id').notNullable().references('id').inTable('ai_eval_samples').onDelete('CASCADE');
    table.string('variant', 1).notNullable(); // 'A' or 'B'
    table.uuid('model_id').references('id').inTable('ai_models').onDelete('RESTRICT');
    table.uuid('prompt_template_id').references('id').inTable('ai_prompt_templates').onDelete('SET NULL');
    table.jsonb('actual_output').notNullable();
    table.jsonb('scores').notNullable(); // {"accuracy": 0.95, "f1": 0.88, "latency_ms": 1200}
    table.integer('tokens_used');
    table.decimal('cost_usd', 10, 6);
    table.integer('latency_ms');
    table.integer('human_rating'); // 1-5 optional quality rating
    table.text('human_notes');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    // No updated_at — results are immutable once recorded
  });

  await knex.raw('CREATE INDEX idx_ai_eval_results_experiment ON ai_eval_results (experiment_id, variant)');
  await knex.raw('CREATE INDEX idx_ai_eval_results_sample ON ai_eval_results (sample_id)');
  await knex.raw('CREATE INDEX idx_ai_eval_results_model ON ai_eval_results (model_id)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('ai_eval_results');
  await knex.schema.dropTableIfExists('ai_experiments');
  await knex.schema.dropTableIfExists('ai_eval_samples');
  await knex.schema.dropTableIfExists('ai_eval_datasets');
  await knex.raw('DROP TYPE IF EXISTS ai_experiment_status');
  await knex.raw('DROP TYPE IF EXISTS ai_dataset_type');
}
