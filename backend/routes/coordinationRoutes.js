import express from 'express';
import { getCoordinationTopology, getCoordinationEvents } from '../controllers/coordinationController.js';

const router = express.Router();

router.get('/topology', getCoordinationTopology);
router.get('/events', getCoordinationEvents);

export default router;
