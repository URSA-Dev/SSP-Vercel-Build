/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex('cases').del();

  // Look up Smith's ID for assignment
  const users = await knex('users').select('id', 'last_name');
  const smith = users.find((u) => u.last_name === 'Smith');
  const williams = users.find((u) => u.last_name === 'Williams');

  function addH(h) {
    return new Date(Date.now() + h * 3600000);
  }
  function addD(d) {
    return new Date(Date.now() + d * 86400000);
  }

  await knex('cases').insert([
    {
      case_number: 'DOW-2025-00147',
      subject_last: 'Anderson',
      subject_init: 'R',
      case_type: 'T3',
      status: 'IN_REVIEW',
      priority: 'HIGH',
      assigned_to: smith?.id || null,
      received_date: new Date(Date.now() - 36 * 3600000)
        .toISOString()
        .split('T')[0],
      suspense_48hr: addH(12),
      suspense_3day: addD(1.5),
      met_susp_48: null,
      met_susp_3d: null,
      surge: false,
      disposition: null,
      rec_status: 'Draft',
      notes: 'Intake from regional office. Expedited per supervisor request.',
    },
    {
      case_number: 'DOW-2025-00148',
      subject_last: 'Thompson',
      subject_init: 'K',
      case_type: 'T5',
      status: 'RECEIVED',
      priority: 'CRITICAL',
      assigned_to: smith?.id || null,
      received_date: new Date(Date.now() - 46 * 3600000)
        .toISOString()
        .split('T')[0],
      suspense_48hr: addH(2),
      suspense_3day: addD(1),
      met_susp_48: null,
      met_susp_3d: null,
      surge: true,
      disposition: null,
      rec_status: 'Not Started',
      notes: 'Surge assignment from DCSA. Top Secret / SCI.',
    },
    {
      case_number: 'DOW-2025-00141',
      subject_last: 'Rivera',
      subject_init: 'M',
      case_type: 'T3',
      status: 'QA_REVIEW',
      priority: 'NORMAL',
      assigned_to: smith?.id || null,
      received_date: new Date(Date.now() - 5 * 86400000)
        .toISOString()
        .split('T')[0],
      suspense_48hr: addD(-3),
      suspense_3day: addD(-2),
      met_susp_48: true,
      met_susp_3d: true,
      surge: false,
      disposition: 'FAVORABLE',
      rec_status: 'QA Review',
      notes: '',
    },
    {
      case_number: 'DOW-2025-00135',
      subject_last: 'Patel',
      subject_init: 'S',
      case_type: 'T5',
      status: 'CLOSED_FAVORABLE',
      priority: 'NORMAL',
      assigned_to: williams?.id || null,
      received_date: new Date(Date.now() - 14 * 86400000)
        .toISOString()
        .split('T')[0],
      suspense_48hr: addD(-12),
      suspense_3day: addD(-11),
      met_susp_48: true,
      met_susp_3d: true,
      surge: false,
      disposition: 'FAVORABLE',
      rec_status: 'Final',
      notes: 'Closed. No issues identified.',
    },
  ]);
}
