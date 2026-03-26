/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex('case_documents').del();

  const cases = await knex('cases').select('id', 'case_number');
  const rivera = cases.find((c) => c.case_number === 'DOW-2025-00141');
  const anderson = cases.find((c) => c.case_number === 'DOW-2025-00147');

  await knex('case_documents').insert([
    // Rivera documents
    {
      case_id: rivera.id,
      doc_type: 'Investigation Report (ROI)',
      filename: 'Investigation_Report_Rivera.pdf',
      file_path: '/uploads/cases/DOW-2025-00141/Investigation_Report_Rivera.pdf',
      file_size: '2.4 MB',
      status: 'confirmed',
      confidence: 0.94,
      extracted_fields: JSON.stringify({
        subject_name: 'Rivera, Maria C.',
        ssn_last4: '7821',
        dob: '1988-03-15',
        investigation_type: 'T3 — Secret',
        opened_date: '2024-11-02',
        agency: 'DCSA',
      }),
    },
    {
      case_id: rivera.id,
      doc_type: 'Credit Report Summary',
      filename: 'Credit_Report_Rivera.pdf',
      file_path: '/uploads/cases/DOW-2025-00141/Credit_Report_Rivera.pdf',
      file_size: '1.1 MB',
      status: 'confirmed',
      confidence: 0.88,
      extracted_fields: JSON.stringify({
        total_accounts: 14,
        delinquent: 2,
        collections: 1,
        bankruptcies: 0,
        credit_score: 648,
      }),
    },
    // Anderson documents
    {
      case_id: anderson.id,
      doc_type: 'Investigation Report (ROI)',
      filename: 'Anderson_ROI.pdf',
      file_path: '/uploads/cases/DOW-2025-00147/Anderson_ROI.pdf',
      file_size: '3.2 MB',
      status: 'awaiting',
      confidence: 0.91,
      extracted_fields: JSON.stringify({
        subject_name: 'Anderson, Robert J.',
        ssn_last4: '4519',
        dob: '1992-07-22',
        investigation_type: 'T3 — Secret',
        opened_date: '2025-01-10',
        agency: 'DCSA',
      }),
    },
    {
      case_id: anderson.id,
      doc_type: 'Credit Report Summary',
      filename: 'Anderson_Credit.pdf',
      file_path: '/uploads/cases/DOW-2025-00147/Anderson_Credit.pdf',
      file_size: '0.8 MB',
      status: 'awaiting',
      confidence: 0.85,
      extracted_fields: JSON.stringify({
        total_accounts: 9,
        delinquent: 0,
        collections: 0,
        bankruptcies: 0,
        credit_score: 721,
      }),
    },
  ]);
}
