/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex('case_issues').del();

  const cases = await knex('cases').select('id', 'case_number');
  const rivera = cases.find((c) => c.case_number === 'DOW-2025-00141');

  await knex('case_issues').insert([
    {
      case_id: rivera.id,
      category: 'Financial',
      subcategory: 'Guideline F — Financial Considerations',
      severity: 'MODERATE',
      guideline: 'F',
      in_memo: true,
      description:
        'Subject has two delinquent accounts totaling $4,200 and one collection account of $1,800. Credit score of 648 is below threshold. Delinquencies began approximately 18 months ago following a period of unemployment.',
      mitigation:
        'Subject has entered a structured payment plan with creditors. Three consecutive on-time payments documented. Collection account is under active dispute with credit bureau. Subject provided documentation of involuntary job loss and subsequent re-employment.',
      mitigation_type: 'FINANCIAL_REMEDIATION',
    },
    {
      case_id: rivera.id,
      category: 'Alcohol',
      subcategory: 'Guideline G — Alcohol Consumption',
      severity: 'LOW',
      guideline: 'G',
      in_memo: true,
      description:
        'Subject disclosed a 2021 alcohol-related incident (DUI, charges reduced to reckless driving). No other alcohol-related incidents in record.',
      mitigation:
        'Subject completed a court-ordered alcohol education program (12 weeks) and six months of voluntary counseling. No subsequent incidents in over three years. Subject maintains compliance with all court requirements.',
      mitigation_type: 'TREATMENT_REHABILITATION',
    },
  ]);
}
