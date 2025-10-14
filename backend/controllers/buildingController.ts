import { Request, Response } from 'express';
import { BuildingService } from '../services/buildingService';

export class BuildingController {
  private buildingService: BuildingService;

  constructor() {
    this.buildingService = new BuildingService();
  }

  getAllBuildings = async (req: Request, res: Response) => {
    try {
      const buildings = await this.buildingService.getAllBuildings();
      res.json(buildings);
    } catch (error) {
      console.error('Error getting buildings:', error);
      res.status(500).json({ error: 'Failed to fetch buildings' });
    }
  };

  getBuildingByEgid = async (req: Request, res: Response) => {
    try {
      const { egid } = req.params;
      const building = await this.buildingService.getBuildingByEgid(egid);
      
      if (!building) {
        return res.status(404).json({ error: 'Building not found' });
      }
      
      res.json(building);
    } catch (error) {
      console.error('Error getting building:', error);
      res.status(500).json({ error: 'Failed to fetch building' });
    }
  };

  getBuildingsByBbox = async (req: Request, res: Response) => {
    try {
      const { bbox } = req.params;
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      
      const buildings = await this.buildingService.getBuildingsByBbox({
        minLng, minLat, maxLng, maxLat
      });
      
      res.json(buildings);
    } catch (error) {
      console.error('Error getting buildings by bbox:', error);
      res.status(500).json({ error: 'Failed to fetch buildings' });
    }
  };
}