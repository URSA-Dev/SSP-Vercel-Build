import db from '../config/database.js';
import CaseModel from '../models/case.model.js';
import { createError } from '../middleware/error-handler.js';
import { parsePagination, paginationMeta } from '../middleware/pagination.js';

// ---------- helpers ----------

/**
 * Add N business days (Mon-Fri) to a date.
 */
function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

/**
 * Valid status transitions map.
 */
const STATUS_TRANSITIONS = {
  RECEIVED: ['ASSIGNED', 'ON_HOLD', 'CANCELLED'],
  ASSIGNED: ['IN_REVIEW', 'ON_HOLD', 'CANCELLED'],
  IN_REVIEW: ['ISSUES_IDENTIFIED', 'MEMO_DRAFT', 'ON_HOLD', 'CANCELLED'],
  ISSUES_IDENTIFIED: ['MEMO_DRAFT', 'IN_REVIEW', 'ON_HOLD'],
  MEMO_DRAFT: ['QA_REVIEW', 'IN_REVIEW', 'ON_HOLD'],
  QA_REVIEW: ['QA_REVISION', 'FINAL_REVIEW'],
  QA_REVISION: ['QA_REVIEW', 'MEMO_DRAFT'],
  FINAL_REVIEW: ['SUBMITTED', 'QA_REVISION'],
  SUBMITTED: ['CLOSED_FAVORABLE', 'CLOSED_UNFAVORABLE'],
  ON_HOLD: ['RECEIVED', 'ASSIGNED', 'IN_REVIEW'],
  CLOSED_FAVORABLE: [],
  CLOSED_UNFAVORABLE: [],
  CANCELLED: ['RECEIVED'],     // re-open
};

/**
 * Insert a case_history row.
 */
/**
 * Format a user object as "LastName, I." string for history/comms.
 */
function formatUserName(user) {
  if (user.last_name) {
    const initial = user.first_name ? user.first_name.charAt(0).toUpperCase() + '.' : '';
    return initial ? `${user.last_name}, ${initial}` : user.last_name;
  }
  return user.display_name || user.email || 'Unknown';
}

async function addHistory(caseId, action, detail, user, trx = db) {
  const userName = typeof user === 'string' ? user : formatUserName(user);
  await trx('case_history').insert({
    case_id: caseId,
    action,
    detail,
    user_name: userName,
  });
}

// ---------- controllers ----------

/**
 * GET /api/v1/cases
 */
export async function listCases(req, res, next) {
  try {
    const pagination = parsePagination(req.query);
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      assigned_to: req.query.assigned_to,
      case_type: req.query.case_type,
      search: req.query.search,
    };

    const { rows, total } = await CaseModel.findAll(filters, pagination);

    // Attach basic suspense calculations
    const now = new Date();
    const data = rows.map((c) => {
      const susp48 = c.received_date
        ? new Date(new Date(c.received_date).getTime() + 48 * 60 * 60 * 1000)
        : null;
      const susp3d = c.received_date
        ? addBusinessDays(new Date(c.received_date), 3)
        : null;
      return {
        ...c,
        suspense_48hr: susp48,
        suspense_3day: susp3d,
        is_overdue_48hr: susp48 ? now > susp48 && !c.met_susp_48 : false,
        is_overdue_3day: susp3d ? now > susp3d && !c.met_susp_3d : false,
      };
    });

    res.json({
      data,
      pagination: paginationMeta(total, pagination.page, pagination.limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/cases/:id
 */
export async function getCase(req, res, next) {
  try {
    const caseData = await CaseModel.findById(req.params.id);

    if (!caseData) {
      throw createError(404, 'Case not found', 'CASE_NOT_FOUND');
    }

    res.json(caseData);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/cases
 */
export async function createCase(req, res, next) {
  try {
    const {
      case_type, subject_last, subject_init,
      priority, received_date,
    } = req.body;

    if (!case_type || !subject_last) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'case_type and subject_last are required',
        },
      });
    }

    const caseNumber = await CaseModel.getNextCaseNumber();
    const recvDate = received_date ? new Date(received_date) : new Date();
    const suspense48hr = new Date(recvDate.getTime() + 48 * 60 * 60 * 1000);
    const suspense3day = addBusinessDays(recvDate, 3);

    const caseData = {
      case_number: caseNumber,
      case_type,
      subject_last,
      subject_init: subject_init || null,
      priority: priority || 'NORMAL',
      received_date: recvDate,
      suspense_48hr: suspense48hr,
      suspense_3day: suspense3day,
      status: 'RECEIVED',
      assigned_to: req.user.id,
    };

    const created = await CaseModel.create(caseData);

    await addHistory(
      created.id,
      'CASE_CREATED',
      `Case ${caseNumber} created`,
      req.user,
    );

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/cases/:id
 */
export async function updateCase(req, res, next) {
  try {
    const existing = await CaseModel.findById(req.params.id);
    if (!existing) {
      throw createError(404, 'Case not found', 'CASE_NOT_FOUND');
    }

    const allowed = [
      'subject_last', 'subject_init', 'priority',
      'assigned_to', 'case_type', 'notes', 'surge', 'disposition', 'rec_status',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'No valid fields to update' },
      });
    }

    const updated = await CaseModel.update(req.params.id, updates);

    await addHistory(
      req.params.id,
      'CASE_UPDATED',
      `Updated fields: ${Object.keys(updates).join(', ')}`,
      req.user,
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/cases/:id/status
 */
export async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'status is required' },
      });
    }

    const existing = await CaseModel.findById(req.params.id);
    if (!existing) {
      throw createError(404, 'Case not found', 'CASE_NOT_FOUND');
    }

    const validTransitions = STATUS_TRANSITIONS[existing.status];
    if (!validTransitions || !validTransitions.includes(status)) {
      return res.status(422).json({
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition from ${existing.status} to ${status}`,
          details: { allowed: validTransitions || [] },
        },
      });
    }

    const updated = await CaseModel.update(req.params.id, { status });

    await addHistory(
      req.params.id,
      'STATUS_CHANGED',
      `Status changed from ${existing.status} to ${status}`,
      req.user,
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/cases/:id
 */
export async function deleteCase(req, res, next) {
  try {
    const existing = await CaseModel.findById(req.params.id);
    if (!existing) {
      throw createError(404, 'Case not found', 'CASE_NOT_FOUND');
    }

    await CaseModel.softDelete(req.params.id);

    await addHistory(
      req.params.id,
      'CASE_DELETED',
      `Case ${existing.case_number} soft-deleted`,
      req.user,
    );

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// ---------- sub-resources ----------

/**
 * POST /api/v1/cases/:id/issues
 */
export async function addIssue(req, res, next) {
  try {
    const existing = await CaseModel.findById(req.params.id);
    if (!existing) {
      throw createError(404, 'Case not found', 'CASE_NOT_FOUND');
    }

    const { category, description, severity } = req.body;

    if (!category || !description || !severity) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'category, description, and severity are required' },
      });
    }

    const [issue] = await db('case_issues').insert({
      case_id: req.params.id,
      category,
      description,
      severity,
    }).returning('*');

    await addHistory(req.params.id, 'ISSUE_ADDED', `Issue added: ${category}`, req.user);

    res.status(201).json(issue);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/cases/:id/issues/:issueId
 */
export async function updateIssue(req, res, next) {
  try {
    const issue = await db('case_issues')
      .where({ id: req.params.issueId, case_id: req.params.id })
      .whereNull('deleted_at')
      .first();

    if (!issue) {
      throw createError(404, 'Issue not found', 'ISSUE_NOT_FOUND');
    }

    const allowed = ['category', 'subcategory', 'severity', 'guideline', 'in_memo', 'description', 'mitigation', 'mitigation_type'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updated_at = new Date();

    const [updated] = await db('case_issues')
      .where({ id: req.params.issueId })
      .update(updates)
      .returning('*');

    await addHistory(req.params.id, 'ISSUE_UPDATED', `Issue ${req.params.issueId} updated`, req.user);

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/cases/:id/issues/:issueId
 */
export async function deleteIssue(req, res, next) {
  try {
    const issue = await db('case_issues')
      .where({ id: req.params.issueId, case_id: req.params.id })
      .whereNull('deleted_at')
      .first();

    if (!issue) {
      throw createError(404, 'Issue not found', 'ISSUE_NOT_FOUND');
    }

    await db('case_issues')
      .where({ id: req.params.issueId })
      .update({ deleted_at: new Date(), updated_at: new Date() });

    await addHistory(req.params.id, 'ISSUE_DELETED', `Issue ${req.params.issueId} deleted`, req.user);

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/cases/:id/communications
 */
export async function addCommunication(req, res, next) {
  try {
    const existing = await CaseModel.findById(req.params.id);
    if (!existing) {
      throw createError(404, 'Case not found', 'CASE_NOT_FOUND');
    }

    const { comm_type, direction, subject, body, suspense_effect } = req.body;

    if (!comm_type || !direction || !subject) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'comm_type, direction, and subject are required',
        },
      });
    }

    const loggedBy = formatUserName(req.user);

    const [comm] = await db('case_communications').insert({
      case_id: req.params.id,
      comm_type,
      direction,
      subject,
      body: body || null,
      suspense_effect: suspense_effect || null,
      logged_by: loggedBy,
      logged_at: new Date(),
    }).returning('*');

    // Check if this communication satisfies the 48-hour suspense
    if (!existing.met_susp_48) {
      const susp48 = existing.suspense_48hr
        ? new Date(existing.suspense_48hr)
        : (existing.received_date
            ? new Date(new Date(existing.received_date).getTime() + 48 * 60 * 60 * 1000)
            : null);

      if (susp48 && new Date() <= susp48) {
        await CaseModel.update(req.params.id, { met_susp_48: true });
      }
    }

    await addHistory(
      req.params.id,
      'COMMUNICATION_ADDED',
      `${direction} ${comm_type}: ${subject}`,
      req.user,
    );

    res.status(201).json(comm);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/cases/:id/history
 */
export async function getHistory(req, res, next) {
  try {
    const existing = await db('cases').where({ id: req.params.id }).whereNull('deleted_at').first();
    if (!existing) {
      throw createError(404, 'Case not found', 'CASE_NOT_FOUND');
    }

    const pagination = parsePagination(req.query);

    const countResult = await db('case_history')
      .where({ case_id: req.params.id })
      .count('* as count')
      .first();

    const rows = await db('case_history')
      .where({ case_id: req.params.id })
      .orderBy('created_at', 'desc')
      .limit(pagination.limit)
      .offset(pagination.offset);

    res.json({
      data: rows,
      pagination: paginationMeta(parseInt(countResult.count, 10), pagination.page, pagination.limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/cases/:id/memo
 */
export async function saveMemo(req, res, next) {
  try {
    const existing = await db('cases').where({ id: req.params.id }).whereNull('deleted_at').first();
    if (!existing) {
      throw createError(404, 'Case not found', 'CASE_NOT_FOUND');
    }

    const { memo_text } = req.body;

    if (!memo_text) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'memo_text is required' },
      });
    }

    // Upsert: check if a memo already exists for this case
    const existingMemo = await db('case_memos')
      .where({ case_id: req.params.id })
      .orderBy('version', 'desc')
      .first();

    let memo;
    if (existingMemo) {
      // Update existing memo, increment version
      const [updated] = await db('case_memos')
        .where({ id: existingMemo.id })
        .update({
          memo_text,
          version: existingMemo.version + 1,
          saved_at: new Date(),
        })
        .returning('*');
      memo = updated;
    } else {
      // Create new memo
      const [created] = await db('case_memos').insert({
        case_id: req.params.id,
        memo_text,
        version: 1,
        saved_at: new Date(),
      }).returning('*');
      memo = created;
    }

    await addHistory(
      req.params.id,
      'MEMO_SAVED',
      `Memo version ${memo.version} saved`,
      req.user,
    );

    res.json(memo);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/cases/:id/memo/qa-check
 * Server-side QA validation (8 checks matching template's localQACheck).
 */
export async function qaCheck(req, res, next) {
  try {
    const caseData = await CaseModel.findById(req.params.id);
    if (!caseData) {
      throw createError(404, 'Case not found', 'CASE_NOT_FOUND');
    }

    const checks = [
      {
        id: 'subject_info',
        label: 'Subject information is complete',
        passed: !!caseData.subject_last,
      },
      {
        id: 'case_type',
        label: 'Case type is specified',
        passed: !!caseData.case_type,
      },
      {
        id: 'issues_present',
        label: 'At least one issue is documented',
        passed: caseData.issues && caseData.issues.length > 0,
      },
      {
        id: 'issues_resolved',
        label: 'All issues have severity and description',
        passed: caseData.issues && caseData.issues.length > 0
          && caseData.issues.every((i) => i.severity && i.description),
      },
      {
        id: 'communication_logged',
        label: 'At least one communication is logged',
        passed: caseData.communications && caseData.communications.length > 0,
      },
      {
        id: 'memo_exists',
        label: 'Case memo is written',
        passed: !!caseData.memo,
      },
      {
        id: 'memo_content',
        label: 'Memo has substantive content (100+ chars)',
        passed: caseData.memo && caseData.memo.memo_text && caseData.memo.memo_text.length >= 100,
      },
      {
        id: 'documents_confirmed',
        label: 'All documents are confirmed',
        passed: !caseData.documents || caseData.documents.length === 0
          || caseData.documents.every((d) => d.status === 'confirmed'),
      },
    ];

    const allPassed = checks.every((c) => c.passed);

    res.json({ checks, allPassed });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/cases/:id/submit-qa
 * Submit case to QA queue.
 */
export async function submitQa(req, res, next) {
  try {
    const caseData = await CaseModel.findById(req.params.id);
    if (!caseData) {
      throw createError(404, 'Case not found', 'CASE_NOT_FOUND');
    }

    if (caseData.status !== 'MEMO_DRAFT') {
      return res.status(422).json({
        error: {
          code: 'INVALID_TRANSITION',
          message: 'Case must be in MEMO_DRAFT to submit for QA',
        },
      });
    }

    const submittedBy = formatUserName(req.user);

    // Create QA review entry
    const [review] = await db('qa_reviews').insert({
      case_id: req.params.id,
      submitted_by: submittedBy,
      submitted_at: new Date(),
      status: 'Pending',
    }).returning('*');

    // Update case status
    await CaseModel.update(req.params.id, { status: 'QA_REVIEW' });

    // Check 3-day suspense
    if (!caseData.met_susp_3d && caseData.received_date) {
      const susp3d = addBusinessDays(new Date(caseData.received_date), 3);
      if (new Date() <= susp3d) {
        await CaseModel.update(req.params.id, { met_susp_3d: true });
      }
    }

    await addHistory(
      req.params.id,
      'SUBMITTED_QA',
      'Case submitted to QA queue',
      req.user,
    );

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

export default {
  listCases, getCase, createCase, updateCase, updateStatus, deleteCase,
  addIssue, updateIssue, deleteIssue,
  addCommunication, getHistory, saveMemo, qaCheck, submitQa,
};
