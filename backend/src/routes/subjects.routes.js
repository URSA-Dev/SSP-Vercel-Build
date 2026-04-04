import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { searchSubjects, listSubjects, getSubject } from '../controllers/subjects.controller.js';

const router = Router();
router.use(authenticate);

router.get('/search', searchSubjects);
router.get('/', listSubjects);
router.get('/:id', getSubject);

export default router;
