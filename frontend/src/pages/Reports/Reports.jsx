import { useState } from 'react';
import Button from '../../components/Button/Button';
import { Card, CardHead, CardTitle, CardBody } from '../../components/Card/Card';
import Badge from '../../components/Badge/Badge';
import styles from './Reports.module.css';

const REPORT_TYPES = [
  {
    id: 'case_summary',
    title: 'Case Summary Report',
    description: 'Overview of all cases by status, priority, and type for a selected date range.',
    category: 'Cases',
    format: 'PDF',
  },
  {
    id: 'suspense_compliance',
    title: 'Suspense Compliance Report',
    description: '48-hour and 3-day suspense compliance rates with breakdown by analyst.',
    category: 'Compliance',
    format: 'PDF',
  },
  {
    id: 'analyst_workload',
    title: 'Analyst Workload Report',
    description: 'Case distribution, processing times, and overdue metrics per analyst.',
    category: 'Workload',
    format: 'Excel',
  },
  {
    id: 'qa_metrics',
    title: 'QA Metrics Report',
    description: 'QA pass/fail rates, revision counts, and review turnaround times.',
    category: 'Quality',
    format: 'PDF',
  },
  {
    id: 'violation_summary',
    title: 'Security Violations Summary',
    description: 'All security violations by type, severity, and resolution status.',
    category: 'Security',
    format: 'PDF',
  },
  {
    id: 'fcl_status',
    title: 'FCL Status Report',
    description: 'Facility clearance levels, expiration dates, and sponsoring agencies.',
    category: 'FCL',
    format: 'Excel',
  },
  {
    id: 'travel_log',
    title: 'Foreign Travel Log',
    description: 'Complete travel record including briefing/debrief status and risk levels.',
    category: 'Travel',
    format: 'Excel',
  },
  {
    id: 'audit_trail',
    title: 'Audit Trail Export',
    description: 'Full audit log of all system actions for compliance review.',
    category: 'Audit',
    format: 'CSV',
  },
];

const FORMAT_VARIANTS = {
  PDF: 'red',
  Excel: 'green',
  CSV: 'blue',
};

function Reports() {
  const [generating, setGenerating] = useState(null);

  function handleGenerate(reportId) {
    setGenerating(reportId);
    // Simulate report generation
    setTimeout(() => {
      setGenerating(null);
    }, 2000);
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className="page-title">Reports</div>
          <div className="page-sub">
            Generate and download compliance and operational reports
          </div>
        </div>
      </div>

      {/* Report Grid */}
      <div className={styles.reportGrid}>
        {REPORT_TYPES.map((report) => (
          <Card key={report.id} className={styles.reportCard}>
            <CardBody>
              <div className={styles.reportHeader}>
                <Badge variant="navy">{report.category}</Badge>
                <Badge variant={FORMAT_VARIANTS[report.format] || 'gray'}>
                  {report.format}
                </Badge>
              </div>
              <h3 className={styles.reportTitle}>{report.title}</h3>
              <p className={styles.reportDesc}>{report.description}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerate(report.id)}
                disabled={generating === report.id}
              >
                {generating === report.id ? 'Generating\u2026' : 'Generate Report'}
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Reports;
