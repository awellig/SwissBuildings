import express from 'express';
import { EnergyController } from '../controllers/energyController';

const router = express.Router();
const energyController = new EnergyController();

// Get building energy consumption
router.get('/consumption/:egid', energyController.getEnergyConsumption);

// Get NILM breakdown
router.get('/breakdown/:egid', energyController.getEnergyBreakdown);

export default router;