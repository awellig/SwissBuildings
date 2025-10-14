import express from 'express';
import { BuildingController } from '../controllers/buildingController';

const router = express.Router();
const buildingController = new BuildingController();

// Get all buildings (GeoJSON)
router.get('/', buildingController.getAllBuildings);

// Get building by EGID
router.get('/:egid', buildingController.getBuildingByEgid);

// Get buildings by bbox
router.get('/bbox/:bbox', buildingController.getBuildingsByBbox);

export default router;