/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex('case_communications').del();

  const cases = await knex('cases').select('id', 'case_number');
  const rivera = cases.find((c) => c.case_number === 'DOW-2025-00141');

  await knex('case_communications').insert([
    {
      case_id: rivera.id,
      comm_type: 'INITIAL_NOTIFICATION',
      direction: 'Outbound',
      subject: '48-Hour Initial Notification — DOW-2025-00141',
      body: 'This communication serves as official notification that case DOW-2025-00141 (Rivera, M.) has been received and acknowledged within the 48-hour suspense window. The case has been assigned to Adjudicator Smith, A. for review. Initial document extraction is complete and all required materials are on file. This notification has been logged per SOP 2024-04 Section 3.2.',
      suspense_effect: 'Stops 48-hr Clock',
      logged_by: 'Smith, A.',
      logged_at: new Date(Date.now() - 4 * 86400000),
    },
  ]);
}
