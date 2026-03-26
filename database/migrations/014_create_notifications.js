/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.text('message').notNullable();
    table.string('notification_type', 50).defaultTo('info');
    table.boolean('read').defaultTo(false);
    table.string('link', 255);
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_notifications_user_id ON notifications (user_id)');
  await knex.raw('CREATE INDEX idx_notifications_read ON notifications (read)');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('notifications');
}
