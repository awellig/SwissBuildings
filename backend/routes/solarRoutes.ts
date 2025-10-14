import express from 'express';
import { SolarController } from '../controllers/solarController';

const router = express.Router();
const solarController = new SolarController();

// Get solar potential for building
router.get('/potential/:egid', solarController.getSolarPotential);

export default router;