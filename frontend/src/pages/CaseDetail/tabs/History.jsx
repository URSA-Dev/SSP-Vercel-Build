import { fmtDT } from '../../../utils/dates';

function buildHistory(caseData) {
  const entries = [];

  /* Case created */
  entries.push({
    timestamp: caseData.createdAt,
    user: 'System',
    action: 'Case Created',
    detail: `${caseData.caseType} case created for ${caseData.subjectName}`,
  });

  /* Docs uploaded */
  (caseData.docs || []).forEach((doc) => {
    entries.push({
      timestamp: doc.uploadedAt,
      user: 'Smith, A.',
      action: 'Document Uploaded',
      detail: doc.name,
    });
    if (doc.status === 'confirmed') {
      entries.push({
        timestamp: doc.uploadedAt,
        user: 'Smith, A.',
        action: 'Extraction Confirmed',
        detail: `${doc.name} \u2014 ${doc.extractedFields?.length || 0} fields extracted`,
      });
    }
  });

  /* Issues added */
  (caseData.issues || []).forEach((issue) => {
    entries.push({
      timestamp: issue.createdAt,
      user: 'Smith, A.',
      action: 'Issue Added',
      detail: `Guideline ${issue.category} \u2014 ${issue.categoryLabel || issue.categoryName} (${issue.severity})`,
    });
  });

  /* Communications */
  (caseData.comms || []).forEach((comm) => {
    entries.push({
      timestamp: comm.timestamp,
      user: comm.author,
      action: 'Communication Logged',
      detail: `${comm.direction} \u2014 ${comm.subject}`,
    });
  });

  /* Memo events */
  if (caseData.memo) {
    entries.push({
      timestamp: caseData.memo.createdAt,
      user: caseData.memo.author || 'Smith, A.',
      action: 'Memo Created',
      detail: caseData.memo.title,
    });
    if (caseData.memo.updatedAt !== caseData.memo.createdAt) {
      entries.push({
        timestamp: caseData.memo.updatedAt,
        user: caseData.memo.author || 'Smith, A.',
        action: 'Memo Updated',
        detail: `Status: ${caseData.memo.status} \u2014 Disposition: ${caseData.memo.disposition}`,
      });
    }
  }

  /* Status update */
  entries.push({
    timestamp: caseData.updatedAt,
    user: 'System',
    action: 'Status Updated',
    detail: `Current status: ${caseData.status}`,
  });

  /* Sort newest first */
  entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return entries;
}

function History({ caseData }) {
  const entries = buildHistory(caseData);

  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-2)', marginBottom: 12 }}>
        Audit History
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '2px solid var(--bdr)',
                textAlign: 'left',
              }}
            >
              <th style={{ padding: '8px 12px', color: 'var(--ink-4)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Timestamp
              </th>
              <th style={{ padding: '8px 12px', color: 'var(--ink-4)', fontWeight: 600 }}>
                User
              </th>
              <th style={{ padding: '8px 12px', color: 'var(--ink-4)', fontWeight: 600 }}>
                Action
              </th>
              <th style={{ padding: '8px 12px', color: 'var(--ink-4)', fontWeight: 600 }}>
                Detail
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: '1px solid var(--surface-4)',
                }}
              >
                <td
                  style={{
                    padding: '8px 12px',
                    fontFamily: 'var(--mono)',
                    fontSize: '12px',
                    color: 'var(--ink-4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmtDT(entry.timestamp)}
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--ink-3)' }}>
                  {entry.user}
                </td>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ink-2)' }}>
                  {entry.action}
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--ink-3)' }}>
                  {entry.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default History;
