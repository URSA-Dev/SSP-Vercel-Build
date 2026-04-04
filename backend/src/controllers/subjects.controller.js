import SubjectModel from '../models/subject.model.js';

/**
 * GET /api/v1/subjects/search?q=lastName&init=R&middleInit=J&dobYear=1990
 * Search for a subject match. Returns match + case count.
 */
export async function searchSubjects(req, res, next) {
  try {
    const { q, init, middleInit, dobYear } = req.query;

    // Try name composite match
    if (q && init) {
      const subject = await SubjectModel.findByName(
        q, init,
        middleInit || null,
        dobYear ? parseInt(dobYear, 10) : null,
      );
      if (subject) {
        const caseCount = await SubjectModel.getCaseCount(subject.id);
        return res.json({ data: [{ ...subject, case_count: caseCount }] });
      }
    }

    return res.json({ data: [] });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/subjects
 */
export async function listSubjects(req, res, next) {
  try {
    const { search } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const offset = parseInt(req.query.offset, 10) || 0;

    const { rows, total } = await SubjectModel.findAll(
      { search },
      { limit, offset },
    );

    res.json({ data: rows, total, limit, offset });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/subjects/:id
 */
export async function getSubject(req, res, next) {
  try {
    const subject = await SubjectModel.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        error: { code: 'SUBJECT_NOT_FOUND', message: 'Subject not found' },
      });
    }
    const caseCount = await SubjectModel.getCaseCount(subject.id);
    res.json({ data: { ...subject, case_count: caseCount } });
  } catch (err) {
    next(err);
  }
}
