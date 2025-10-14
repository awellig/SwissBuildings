import express from 'express';
import { EnvironmentController } from '../controllers/environmentController';

const router = express.Router();
const environmentController = new EnvironmentController();

// Get NABEL air quality data
router.get('/air-quality/:location', environmentController.getAirQuality);

// Get MeteoSwiss weather data
router.get('/weather/:location', environmentController.getWeatherData);

export default router;