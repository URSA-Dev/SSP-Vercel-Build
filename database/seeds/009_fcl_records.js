/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex('fcl_records').del();

  await knex('fcl_records').insert([
    {
      fcl_id: 'FCL-001',
      entity_name: 'MarineTech Systems',
      cage_code: '3K7P2',
      clearance_level: 'SECRET',
      status: 'Active',
      sponsor: 'DCSA',
      expires_at: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      fso_name: 'Bradley, J.',
      employee_count: 85,
      last_review: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
    },
    {
      fcl_id: 'FCL-002',
      entity_name: 'Coastal Defense Corp',
      cage_code: '5R2M8',
      clearance_level: 'TOP SECRET',
      status: 'Active',
      sponsor: 'DLA',
      expires_at: new Date(Date.now() + 200 * 86400000).toISOString().split('T')[0],
      fso_name: 'Harmon, L.',
      employee_count: 240,
      last_review: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0],
    },
    {
      fcl_id: 'FCL-003',
      entity_name: 'Harbor Analytics',
      cage_code: '9N4L1',
      clearance_level: 'SECRET',
      status: 'Pending',
      sponsor: 'NAVFAC',
      expires_at: null,
      fso_name: 'Nguyen, P.',
      employee_count: 45,
      last_review: null,
    },
    {
      fcl_id: 'FCL-004',
      entity_name: 'Apex Maritime',
      cage_code: '7T8K3',
      clearance_level: 'TOP SECRET/SCI',
      status: 'Suspended',
      sponsor: null,
      expires_at: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      fso_name: 'Wallace, D.',
      employee_count: 120,
      last_review: new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0],
    },
    {
      fcl_id: 'FCL-005',
      entity_name: 'Nautilus Cyber',
      cage_code: '2F6J9',
      clearance_level: 'SECRET',
      status: 'Active',
      sponsor: 'DCSA',
      expires_at: new Date(Date.now() + 500 * 86400000).toISOString().split('T')[0],
      fso_name: 'Kim, S.',
      employee_count: 65,
      last_review: new Date(Date.now() - 120 * 86400000).toISOString().split('T')[0],
    },
  ]);
}
