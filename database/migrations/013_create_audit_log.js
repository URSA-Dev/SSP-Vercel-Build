/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('audit_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('user_name', 100);
    table.string('action', 100).notNullable();
    table.text('detail');
    table.string('entity_type', 50);
    table.uuid('entity_id');
    table.string('ip_address', 45);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id)');
  await knex.raw('CREATE INDEX idx_audit_log_action ON audit_log (action)');
  await knex.raw('CREATE INDEX idx_audit_log_created_at ON audit_log (created_at DESC)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('audit_log');
}
