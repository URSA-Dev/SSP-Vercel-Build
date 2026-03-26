import db from '../config/database.js';

const CLOSED_STATUSES = ['CLOSED_FAVORABLE', 'CLOSED_UNFAVORABLE', 'CANCELLED'];

/**
 * GET /api/v1/metrics/dashboard
 * Dashboard KPIs: active cases, at-risk, AI extractions, QA pending.
 */
export async function dashboardMetrics(req, res, next) {
  try {
    const [activeCases, atRisk, aiExtractions, qaPending] = await Promise.all([
      // Active cases: not closed/cancelled and not deleted
      db('cases')
        .whereNotIn('status', CLOSED_STATUSES)
        .whereNull('deleted_at')
        .count('* as count')
        .first(),

      // At risk: suspense_48hr is within 25% of now and not yet met
      db('cases')
        .whereNull('met_susp_48')
        .whereNull('deleted_at')
        .whereNotIn('status', CLOSED_STATUSES)
        .whereRaw(`suspense_48hr IS NOT NULL AND suspense_48hr <= NOW() + (suspense_48hr - created_at) * 0.25`)
        .count('* as count')
        .first(),

      // AI extractions awaiting processing
      db('case_documents')
        .where('status', 'awaiting')
        .count('* as count')
        .first(),

      // QA reviews pending
      db('qa_reviews')
        .where('status', 'Pending')
        .count('* as count')
        .first(),
    ]);

    res.json({
      activeCases: parseInt(activeCases.count, 10),
      atRisk: parseInt(atRisk.count, 10),
      aiExtractions: parseInt(aiExtractions.count, 10),
      qaPending: parseInt(qaPending.count, 10),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/metrics/workload
 * Workload distribution per analyst.
 */
export async function workloadMetrics(req, res, next) {
  try {
    const rows = await db('cases')
      .select(
        'cases.assigned_to',
        'users.first_initial',
        'users.last_name',
      )
      .count('cases.id as total_cases')
      .countDistinct(db.raw(`CASE WHEN cases.met_susp_48 IS NULL AND cases.suspense_48hr < NOW() THEN cases.id END AS overdue_48hr`))
      .countDistinct(db.raw(`CASE WHEN cases.met_susp_3d IS NULL AND cases.suspense_3day < NOW() THEN cases.id END AS overdue_3day`))
      .leftJoin('users', 'cases.assigned_to', 'users.id')
      .whereNotIn('cases.status', CLOSED_STATUSES)
      .whereNull('cases.deleted_at')
      .whereNotNull('cases.assigned_to')
      .groupBy('cases.assigned_to', 'users.first_initial', 'users.last_name')
      .orderBy('total_cases', 'desc');

    const data = rows.map((row) => ({
      analyst_id: row.assigned_to,
      analyst_name: `${row.last_name}, ${row.first_initial}.`,
      total_cases: parseInt(row.total_cases, 10),
      overdue_48hr: parseInt(row.overdue_48hr, 10),
      overdue_3day: parseInt(row.overdue_3day, 10),
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/metrics/suspense
 * Suspense compliance statistics (48-hr and 3-day percentages).
 */
export async function suspenseMetrics(req, res, next) {
  try {
    // Calculate compliance from cases that have suspense dates set
    const [stats48, stats3day] = await Promise.all([
      db('cases')
        .whereNotNull('suspense_48hr')
        .whereNull('deleted_at')
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('COUNT(met_susp_48) as met'),
          db.raw(`COUNT(CASE WHEN met_susp_48 IS NULL AND suspense_48hr < NOW() THEN 1 END) as overdue`),
        )
        .first(),

      db('cases')
        .whereNotNull('suspense_3day')
        .whereNull('deleted_at')
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('COUNT(met_susp_3d) as met'),
          db.raw(`COUNT(CASE WHEN met_susp_3d IS NULL AND suspense_3day < NOW() THEN 1 END) as overdue`),
        )
        .first(),
    ]);

    const total48 = parseInt(stats48.total, 10);
    const total3day = parseInt(stats3day.total, 10);

    res.json({
      suspense_48hr: {
        total: total48,
        met: parseInt(stats48.met, 10),
        overdue: parseInt(stats48.overdue, 10),
        compliance_pct: total48 > 0
          ? Math.round((parseInt(stats48.met, 10) / total48) * 100)
          : 100,
      },
      suspense_3day: {
        total: total3day,
        met: parseInt(stats3day.met, 10),
        overdue: parseInt(stats3day.overdue, 10),
        compliance_pct: total3day > 0
          ? Math.round((parseInt(stats3day.met, 10) / total3day) * 100)
          : 100,
      },
    });
  } catch (err) {
    next(err);
  }
}

export default { dashboardMetrics, workloadMetrics, suspenseMetrics };
