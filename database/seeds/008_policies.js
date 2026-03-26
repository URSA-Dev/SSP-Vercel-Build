/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex('policies').del();

  await knex('policies').insert([
    {
      title: 'Suspense Compliance and Case Management Procedures',
      policy_type: 'SOP',
      status: 'Active',
      version: '1.4',
      author: 'Johnson, T.',
      last_revised: new Date(Date.now() - 30 * 86400000),
      content: `STANDARD OPERATING PROCEDURE
SUSPENSE COMPLIANCE AND CASE MANAGEMENT PROCEDURES
Version 1.4 — Effective Date: See Last Revised

1. PURPOSE
This SOP establishes procedures for managing case suspense timelines, ensuring compliance with the 48-hour initial acknowledgment requirement and the 3-business-day preliminary review requirement for all personnel security cases processed through the Security Support Platform (SSP).

2. SCOPE
Applies to all adjudicators, supervisors, and quality reviewers within the SSP Adjudication Division.

3. PROCEDURES
3.1 Upon receipt of a new case, the system will automatically calculate the 48-hour and 3-business-day suspense deadlines based on the received_date timestamp.
3.2 Adjudicators must send the 48-hour initial notification within the calculated suspense window. Sending this notification stops the 48-hour clock.
3.3 Cases approaching suspense deadlines (within 4 hours) will trigger automatic alerts to the assigned adjudicator and their supervisor.
3.4 Overdue cases will be flagged in the dashboard and escalated to the supervisor for reassignment consideration.
3.5 Surge-designated cases follow accelerated timelines as directed by the originating agency.

4. METRICS AND REPORTING
4.1 Suspense compliance rates are tracked on the SSP Dashboard and reported monthly.
4.2 Target compliance rate: 95% or higher for both 48-hour and 3-day suspense windows.

5. RESPONSIBILITIES
5.1 Adjudicators: Monitor assigned cases, meet suspense deadlines, escalate blockers promptly.
5.2 Supervisors: Review overdue cases daily, reassign as needed, approve extensions.
5.3 QA Reviewers: Verify suspense compliance as part of the QA checklist.`,
    },
    {
      title: 'AI-Assisted Document Extraction — Human Review Requirements',
      policy_type: 'Policy',
      status: 'Active',
      version: '1.1',
      author: 'Admin, A.',
      last_revised: new Date(Date.now() - 60 * 86400000),
      content: `POLICY DIRECTIVE
AI-ASSISTED DOCUMENT EXTRACTION — HUMAN REVIEW REQUIREMENTS
Version 1.1

1. PURPOSE
To establish mandatory human-in-the-loop review requirements for all AI-assisted document extraction performed within the SSP platform. This policy ensures accuracy, accountability, and compliance with DoW information handling standards.

2. POLICY
2.1 All fields extracted by the AI document processing module must be reviewed and confirmed by an authorized adjudicator before being used in any adjudicative action or official memorandum.
2.2 Extraction results with a confidence score below 0.80 must be manually verified against the source document and corrected as necessary.
2.3 Extraction results with a confidence score of 0.80 or above may be confirmed without full re-verification, but the adjudicator remains responsible for accuracy.
2.4 No extracted data shall be incorporated into a case recommendation memo without a confirmed status on the associated document record.
2.5 The system shall log all confirmation actions, including the confirming user, timestamp, and any field modifications made during review.

3. EXCEPTIONS
3.1 No exceptions to the human review requirement are authorized at this time.
3.2 Future automated confirmation thresholds may be established pending validation study results.

4. COMPLIANCE
Failure to review AI-extracted data before use in adjudicative actions constitutes a procedural violation and shall be documented per the Adjudicative Issue Documentation Standards.`,
    },
    {
      title: 'Adjudicative Issue Documentation Standards',
      policy_type: 'Desk Reference',
      status: 'Draft',
      version: '0.8',
      author: 'Smith, A.',
      last_revised: new Date(Date.now() - 7 * 86400000),
      content: `DESK REFERENCE — DRAFT
ADJUDICATIVE ISSUE DOCUMENTATION STANDARDS
Version 0.8

1. PURPOSE
To provide standardized guidance for documenting adjudicative issues, mitigating factors, and whole-person considerations in personnel security case recommendation memoranda.

2. ISSUE DOCUMENTATION FORMAT
2.1 Each adjudicative issue must include:
    a. Guideline reference (A through M per the Adjudicative Guidelines)
    b. Severity classification (CRITICAL, HIGH, MODERATE, LOW, ADMINISTRATIVE)
    c. Factual description of the concern
    d. Applicable mitigating conditions with AG paragraph citations
    e. Assessment of whether mitigation is sufficient

2.2 Issues should be ordered by severity (highest first) within the memo.

3. MITIGATION TYPES
The following standardized mitigation types shall be used:
    - FINANCIAL_REMEDIATION: Payment plans, debt resolution, financial counseling
    - TREATMENT_REHABILITATION: Substance abuse treatment, counseling programs
    - BEHAVIORAL_MODIFICATION: Demonstrated pattern of changed behavior
    - CIRCUMSTANTIAL: Conditions beyond individual's control
    - TEMPORAL: Passage of time since the conduct
    - VOLUNTARY_DISCLOSURE: Self-reporting of the concern

4. QUALITY ASSURANCE
4.1 All documented issues must pass the 8-point QA checklist before memo finalization.
4.2 Draft status indicates this standard is under review and subject to revision.`,
    },
  ]);
}
