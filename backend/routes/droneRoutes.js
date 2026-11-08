import express from 'express';
import { getAllDrones, getDroneDetails } from '../controllers/droneController.js';

const router = express.Router();

router.get('/', getAllDrones);
router.get('/:droneId', getDroneDetails);

export default router;
