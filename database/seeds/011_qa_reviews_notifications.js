/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex('notifications').del();
  await knex('qa_reviews').del();

  const cases = await knex('cases').select('id', 'case_number');
  const rivera = cases.find((c) => c.case_number === 'DOW-2025-00141');

  const users = await knex('users').select('id', 'last_name');
  const smith = users.find((u) => u.last_name === 'Smith');

  // QA review for Rivera case
  await knex('qa_reviews').insert([
    {
      case_id: rivera.id,
      submitted_by: 'Smith, A.',
      submitted_at: new Date(Date.now() - 1 * 86400000),
      reviewer: null,
      reviewed_at: null,
      outcome: null,
      status: 'Pending',
      checklist: JSON.stringify([
        { label: 'Case number and subject correctly identified', checked: true },
        { label: 'All investigative documents reviewed and confirmed', checked: true },
        { label: 'All adjudicative issues documented with guideline references', checked: true },
        { label: 'Mitigating conditions cited with AG paragraph numbers', checked: true },
        { label: 'Whole-person analysis included', checked: true },
        { label: 'Recommendation clearly stated', checked: true },
        { label: 'Suspense deadlines met', checked: true },
        { label: 'Memo formatting meets standards', checked: true },
      ]),
      comments: null,
    },
  ]);

  // Notifications
  await knex('notifications').insert([
    {
      user_id: smith?.id || null,
      message:
        'DOW-2025-00148 assigned — T5 SURGE. Critical priority case requires immediate attention.',
      notification_type: 'warning',
      read: false,
      link: '/cases/DOW-2025-00148',
    },
    {
      user_id: smith?.id || null,
      message:
        'QA review complete for DOW-2025-00141. Review passed.',
      notification_type: 'info',
      read: false,
      link: '/cases/DOW-2025-00141',
    },
  ]);
}
