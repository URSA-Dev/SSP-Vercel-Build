/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex('case_memos').del();

  const cases = await knex('cases').select('id', 'case_number');
  const rivera = cases.find((c) => c.case_number === 'DOW-2025-00141');

  const memoText = `DEPARTMENT OF WAR
PERSONNEL SECURITY CASE RECOMMENDATION

FROM:       SSP Adjudication Division
DATE:       ${new Date().toISOString().split('T')[0]}
CASE NO:    DOW-2025-00141
SUBJECT:    Rivera, Maria C.
INV TYPE:   T3 — Secret Clearance
AGENCY:     Defense Counterintelligence and Security Agency (DCSA)

═══════════════════════════════════════════════════════════════

PURPOSE

To provide an adjudicative recommendation regarding the personnel security eligibility of the above-named individual based upon a completed background investigation and review of all pertinent materials.

═══════════════════════════════════════════════════════════════

BACKGROUND

Subject is a 37-year-old civilian employee of the Department of War, currently assigned to the Maritime Logistics Support Division. Subject has held a Secret clearance since 2019 with no prior security incidents. This review is a periodic reinvestigation (T3) initiated per standard reinvestigation schedule.

The investigation was completed by DCSA and transmitted to this office on ${new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]}. All required documents, including the Report of Investigation (ROI) and credit report summary, have been received and reviewed.

═══════════════════════════════════════════════════════════════

ADJUDICATIVE ISSUES

ISSUE 1: Financial Considerations (Guideline F)
Severity: MODERATE

Finding: Subject has two delinquent accounts totaling $4,200 and one collection account of $1,800. Credit score of 648 is below the adjudicative threshold of 660. Delinquencies began approximately 18 months ago following a documented period of involuntary unemployment lasting four months.

Mitigation: Subject has entered a structured payment plan with creditors and has made three consecutive on-time payments as documented in bank records provided. The collection account is under active dispute with the credit bureau. Subject provided documentation of involuntary job loss (employer layoff notice) and subsequent re-employment within the Department of War.

Mitigating Conditions Applied:
  - AG ¶ 20(a): The behavior happened under circumstances unlikely to recur
  - AG ¶ 20(b): Conditions largely beyond the person's control (involuntary unemployment)
  - AG ¶ 20(d): Individual initiated good-faith effort to repay overdue creditors

Assessment: Mitigated. Financial difficulties were caused by circumstances beyond Subject's control, and Subject has demonstrated a proactive and sustained effort to resolve outstanding debts.

───────────────────────────────────────────────────────────────

ISSUE 2: Alcohol Consumption (Guideline G)
Severity: LOW

Finding: Subject disclosed a 2021 alcohol-related incident (DUI, charges subsequently reduced to reckless driving). No other alcohol-related incidents appear in the investigative record or law enforcement databases.

Mitigation: Subject completed a court-ordered alcohol education program (12 weeks) and voluntarily attended six months of additional counseling. No subsequent incidents in over three years. Subject remains in full compliance with all court requirements. Supervisor and co-worker references confirm no concerns regarding alcohol use.

Mitigating Conditions Applied:
  - AG ¶ 23(a): So much time has passed that it is unlikely to recur
  - AG ¶ 23(b): Individual acknowledges pattern, provides evidence of actions taken

Assessment: Mitigated. The incident is isolated, occurred over three years ago, and Subject has taken substantial steps to address the underlying behavior.

═══════════════════════════════════════════════════════════════

WHOLE-PERSON ANALYSIS

Consideration of the whole-person factors set forth in the Adjudicative Guidelines supports a favorable determination. Subject has over six years of service with no prior security violations. Both identified issues have been adequately mitigated through documented remedial actions. Subject demonstrates reliability, trustworthiness, and good judgment in the professional environment as confirmed by supervisory and peer references. There are no indicators of ongoing risk to national security.

═══════════════════════════════════════════════════════════════

RECOMMENDATION

Based upon a thorough review of the completed investigation, application of the Adjudicative Guidelines, and whole-person analysis, it is recommended that Subject's eligibility for access to classified information at the SECRET level be determined:

  >>> FAVORABLE <<<

Prepared by:  Smith, A. — Adjudicator, SSP Adjudication Division
Reviewed by:  [Pending QA Review]`;

  await knex('case_memos').insert([
    {
      case_id: rivera.id,
      memo_text: memoText,
      version: 2,
      qa_result: JSON.stringify({
        overall: 'PASS',
        summary: 'Meets all requirements.',
        items: [
          { label: 'Case number present', status: 'PASS' },
          { label: 'Subject identified', status: 'PASS' },
          { label: 'Investigation type stated', status: 'PASS' },
          { label: 'All issues addressed', status: 'PASS' },
          { label: 'Mitigating conditions cited', status: 'PASS' },
          { label: 'Whole-person analysis included', status: 'PASS' },
          { label: 'Recommendation stated', status: 'PASS' },
          { label: 'Adjudicator signature block', status: 'PASS' },
        ],
      }),
      saved_at: new Date(Date.now() - 1 * 86400000),
    },
  ]);
}
