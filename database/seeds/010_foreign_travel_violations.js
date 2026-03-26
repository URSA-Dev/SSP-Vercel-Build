/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  await knex('violations').del();
  await knex('foreign_travel').del();

  const day = 86400000;
  const now = Date.now();

  // Foreign travel records
  await knex('foreign_travel').insert([
    {
      travel_id: 'FT-2025-001',
      subject_name: 'Williams, K.',
      clearance: 'SECRET',
      countries: 'Canada, United Kingdom',
      depart_date: new Date(now - 30 * day).toISOString().split('T')[0],
      return_date: new Date(now - 16 * day).toISOString().split('T')[0],
      purpose: 'Conference attendance — NATO interoperability workshop',
      briefed: true,
      debriefed: true,
      risk_level: 'LOW',
      status: 'CLOSED',
      referral_notes: null,
    },
    {
      travel_id: 'FT-2025-002',
      subject_name: 'Chen, D.',
      clearance: 'TOP SECRET',
      countries: 'Germany, France',
      depart_date: new Date(now - 14 * day).toISOString().split('T')[0],
      return_date: new Date(now - 3 * day).toISOString().split('T')[0],
      purpose: 'Official liaison visit — Allied intelligence coordination',
      briefed: true,
      debriefed: false,
      risk_level: 'MODERATE',
      status: 'DEBRIEF PENDING',
      referral_notes: null,
    },
    {
      travel_id: 'FT-2025-003',
      subject_name: 'Okonkwo, R.',
      clearance: 'SECRET',
      countries: 'Philippines',
      depart_date: new Date(now - 5 * day).toISOString().split('T')[0],
      return_date: new Date(now + 9 * day).toISOString().split('T')[0],
      purpose: 'Personal travel — family visit',
      briefed: true,
      debriefed: false,
      risk_level: 'LOW',
      status: 'IN TRAVEL',
      referral_notes: null,
    },
    {
      travel_id: 'FT-2025-004',
      subject_name: 'Torres, A.',
      clearance: 'TOP SECRET',
      countries: 'Mexico',
      depart_date: new Date(now - 21 * day).toISOString().split('T')[0],
      return_date: new Date(now - 14 * day).toISOString().split('T')[0],
      purpose: 'Personal travel — vacation',
      briefed: true,
      debriefed: true,
      risk_level: 'HIGH',
      status: 'REFERRED',
      referral_notes:
        'Debrief revealed undisclosed contact with foreign national during travel. Subject met with individual not listed on pre-travel foreign contact declaration. Referred to CI for further review per SEAD 3 requirements.',
    },
    {
      travel_id: 'FT-2025-005',
      subject_name: 'Nakamura, S.',
      clearance: 'TOP SECRET/SCI',
      countries: 'Russia',
      depart_date: new Date(now + 30 * day).toISOString().split('T')[0],
      return_date: new Date(now + 37 * day).toISOString().split('T')[0],
      purpose: 'Personal travel — cultural exchange program',
      briefed: false,
      debriefed: false,
      risk_level: 'HIGH',
      status: 'REFERRED',
      referral_notes:
        'CI referral initiated prior to travel. Subject reported planned contact with PRC national residing in Moscow. Travel to Russia by TS/SCI-cleared personnel requires enhanced CI review. Pre-travel briefing withheld pending CI determination.',
    },
  ]);

  // Security violations
  await knex('violations').insert([
    {
      violation_number: 'SV-2025-001',
      violation_date: new Date(now - 10 * day).toISOString().split('T')[0],
      category: 'Physical Security',
      subcategory: 'Unauthorized electronic device in SCIF',
      subject_name: 'Martinez, R.',
      clearance: 'TOP SECRET/SCI',
      location: 'Building 4, Room 212 (SCIF)',
      severity: 'SERIOUS',
      status: 'OPEN',
      sso_notified: true,
      sso_date: new Date(now - 10 * day).toISOString().split('T')[0],
      adj_impact: false,
      description:
        'Subject was observed entering the SCIF with a personal cell phone in their jacket pocket. Device was not transmitting but was powered on. Security officer confiscated the device at the entry checkpoint after secondary screening detected the electronic signature.',
      actions_taken:
        'Device confiscated and held by SSO. Subject provided written statement. Incident reported to FSO. Subject temporarily restricted from SCIF access pending investigation.',
      reported_by: 'SSO Davis, M.',
      closed_date: null,
      ci_referral: false,
      ci_note: null,
    },
    {
      violation_number: 'SV-2025-002',
      violation_date: new Date(now - 45 * day).toISOString().split('T')[0],
      category: 'Personnel Security',
      subcategory: 'Late submission of SF-86 update',
      subject_name: 'Park, J.',
      clearance: 'SECRET',
      location: 'Administrative Office',
      severity: 'MINOR',
      status: 'CLOSED',
      sso_notified: true,
      sso_date: new Date(now - 44 * day).toISOString().split('T')[0],
      adj_impact: false,
      description:
        'Subject failed to submit required SF-86 update within 10 business days of reportable life event (marriage). Update was filed 22 days after the event.',
      actions_taken:
        'SF-86 update completed and submitted. Subject counseled on reporting requirements. Documented in personnel file. No further action required.',
      reported_by: 'FSO Bradley, J.',
      closed_date: new Date(now - 30 * day).toISOString().split('T')[0],
      ci_referral: false,
      ci_note: null,
    },
    {
      violation_number: 'SV-2025-003',
      violation_date: new Date(now - 7 * day).toISOString().split('T')[0],
      category: 'Information Security',
      subcategory: 'Classified spillage on unclassified system',
      subject_name: 'Foster, L.',
      clearance: 'TOP SECRET',
      location: 'Building 2, Workstation 14-B',
      severity: 'CRITICAL',
      status: 'UNDER REVIEW',
      sso_notified: true,
      sso_date: new Date(now - 7 * day).toISOString().split('T')[0],
      adj_impact: true,
      description:
        'Subject sent an email containing SECRET-level information via the unclassified NIPRNet email system. The email contained operational details from a classified briefing and was sent to three recipients within the organization. IT Security detected the spillage through automated content scanning.',
      actions_taken:
        'Email quarantined by IT Security. All recipient workstations isolated for sanitization. Subject\'s NIPRNet access suspended. Formal investigation initiated. ISSM notified and coordinating with DCSA for damage assessment.',
      reported_by: 'ISSM Thompson, R.',
      closed_date: null,
      ci_referral: false,
      ci_note: null,
    },
    {
      violation_number: 'SV-2025-004',
      violation_date: new Date(now - 60 * day).toISOString().split('T')[0],
      category: 'Physical Security',
      subcategory: 'Unauthorized entry — tailgating',
      subject_name: 'Grant, W.',
      clearance: 'SECRET',
      location: 'Building 4, Main Entrance',
      severity: 'MODERATE',
      status: 'CLOSED',
      sso_notified: true,
      sso_date: new Date(now - 59 * day).toISOString().split('T')[0],
      adj_impact: false,
      description:
        'Subject entered the secure facility by following an authorized badge holder through the controlled entrance without individually badging in. Captured on CCTV. Subject stated they forgot their badge in their vehicle.',
      actions_taken:
        'Subject counseled on physical security procedures. Written warning issued. Security awareness refresher training completed. Badge access log updated.',
      reported_by: 'Guard Force, Post 1',
      closed_date: new Date(now - 50 * day).toISOString().split('T')[0],
      ci_referral: false,
      ci_note: null,
    },
    {
      violation_number: 'SV-2025-005',
      violation_date: new Date(now - 5 * day).toISOString().split('T')[0],
      category: 'Cybersecurity',
      subcategory: 'Unauthorized removable media',
      subject_name: 'Hughes, C.',
      clearance: 'TOP SECRET',
      location: 'Building 3, Lab 7',
      severity: 'SERIOUS',
      status: 'OPEN',
      sso_notified: true,
      sso_date: new Date(now - 5 * day).toISOString().split('T')[0],
      adj_impact: false,
      description:
        'Subject connected an unauthorized personal USB flash drive to a classified workstation in Lab 7. The endpoint detection system flagged the device immediately and locked the workstation. No data transfer was detected by the DLP system.',
      actions_taken:
        'USB device confiscated and submitted for forensic analysis. Workstation quarantined. Subject\'s classified network access suspended. Incident referred to CI for assessment of potential data exfiltration intent.',
      reported_by: 'ISSO Crawford, A.',
      closed_date: null,
      ci_referral: true,
      ci_note:
        'Referred to Counterintelligence Division for assessment. Subject has recent foreign travel to countries of concern. CI review to determine if USB insertion was intentional data collection attempt.',
    },
    {
      violation_number: 'SV-2025-006',
      violation_date: new Date(now - 15 * day).toISOString().split('T')[0],
      category: 'Personnel Security',
      subcategory: 'Failure to report foreign contact',
      subject_name: 'Bell, N.',
      clearance: 'TOP SECRET',
      location: 'N/A — Reported via tip line',
      severity: 'SERIOUS',
      status: 'PRELIMINARY INQUIRY',
      sso_notified: true,
      sso_date: new Date(now - 14 * day).toISOString().split('T')[0],
      adj_impact: true,
      description:
        'Subject failed to report ongoing personal contact with a foreign national from a sensitive country, as required by SEAD 3 and organizational reporting requirements. Contact was discovered through a co-worker report to the security office.',
      actions_taken:
        'Subject interviewed by SSO. Subject acknowledged the contact but claimed ignorance of reporting requirements. Preliminary inquiry opened. Subject\'s access under review pending CI assessment.',
      reported_by: 'SSO Davis, M.',
      closed_date: null,
      ci_referral: false,
      ci_note: null,
    },
  ]);
}
