import express from 'express';
import { SolarController } from '../controllers/solarController';

const router = express.Router();
const solarController = new SolarController();

// Get solar potential for building by EGID
router.get('/potential/:egid', solarController.getSolarPotential);

// Get solar potential for building by EGID with building data
router.post('/potential/:egid', solarController.getSolarPotential);

// Get solar potential by coordinates
router.get('/potential', solarController.getSolarPotentialByCoordinates);

export default router;