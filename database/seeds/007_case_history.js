/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex('case_history').del();

  const cases = await knex('cases').select('id', 'case_number');
  const rivera = cases.find((c) => c.case_number === 'DOW-2025-00141');

  const now = Date.now();
  const day = 86400000;

  await knex('case_history').insert([
    {
      case_id: rivera.id,
      user_name: 'System',
      action: 'Case Created',
      detail: 'Case DOW-2025-00141 received and entered into the system. Assigned priority: NORMAL. Type: T3.',
      created_at: new Date(now - 5 * day),
    },
    {
      case_id: rivera.id,
      user_name: 'Johnson, T.',
      action: 'Assigned',
      detail: 'Case assigned to Smith, A. by Supervisor Johnson, T.',
      created_at: new Date(now - 5 * day + 1800000),
    },
    {
      case_id: rivera.id,
      user_name: 'System',
      action: 'Document Uploaded',
      detail: 'Investigation_Report_Rivera.pdf uploaded (2.4 MB). AI extraction initiated.',
      created_at: new Date(now - 4.8 * day),
    },
    {
      case_id: rivera.id,
      user_name: 'System',
      action: 'Document Uploaded',
      detail: 'Credit_Report_Rivera.pdf uploaded (1.1 MB). AI extraction initiated.',
      created_at: new Date(now - 4.8 * day + 60000),
    },
    {
      case_id: rivera.id,
      user_name: 'Smith, A.',
      action: 'Extraction Confirmed',
      detail: 'AI-extracted fields for Investigation_Report_Rivera.pdf reviewed and confirmed. Confidence: 94%.',
      created_at: new Date(now - 4.5 * day),
    },
    {
      case_id: rivera.id,
      user_name: 'Smith, A.',
      action: 'Extraction Confirmed',
      detail: 'AI-extracted fields for Credit_Report_Rivera.pdf reviewed and confirmed. Confidence: 88%.',
      created_at: new Date(now - 4.5 * day + 300000),
    },
    {
      case_id: rivera.id,
      user_name: 'Smith, A.',
      action: 'Issues Identified',
      detail: 'Two adjudicative issues added: Financial (Guideline F, MODERATE), Alcohol (Guideline G, LOW).',
      created_at: new Date(now - 4 * day),
    },
    {
      case_id: rivera.id,
      user_name: 'Smith, A.',
      action: '48-Hour Notification Sent',
      detail: 'Initial 48-hour notification sent. 48-hr suspense clock stopped.',
      created_at: new Date(now - 4 * day + 3600000),
    },
    {
      case_id: rivera.id,
      user_name: 'Smith, A.',
      action: 'Memo Saved',
      detail: 'Case recommendation memo saved (version 2). Disposition: FAVORABLE.',
      created_at: new Date(now - 1.5 * day),
    },
    {
      case_id: rivera.id,
      user_name: 'Smith, A.',
      action: 'QA Submitted',
      detail: 'Case submitted for QA review. Status changed to QA_REVIEW.',
      created_at: new Date(now - 1 * day),
    },
  ]);
}
