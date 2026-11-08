import express from 'express';
import { injectFault, clearFault, getFaultHistory } from '../controllers/faultController.js';

const router = express.Router();

router.post('/inject', injectFault);
router.post('/clear', clearFault);
router.get('/history', getFaultHistory);

export default router;
