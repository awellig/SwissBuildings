import { Request, Response } from 'express';
import { SolarService } from '../services/solarService';

export class SolarController {
  private solarService: SolarService;

  constructor() {
    this.solarService = new SolarService();
  }

  getSolarPotential = async (req: Request, res: Response) => {
    try {
      const { egid } = req.params;
      const buildingData = req.body; // Optional building data from frontend
      
      console.log(`☀️ Solar Request for EGID ${egid} with building data:`, buildingData);
      
      const potential = await this.solarService.getSolarPotential(egid, buildingData);
      res.json(potential);
    } catch (error) {
      console.error('Error getting solar potential:', error);
      
      // Check if it's a "no data" error vs actual API error
      if (error instanceof Error && error.message.includes('No solar data available')) {
        res.status(404).json({ 
          error: 'No solar data available', 
          message: 'This building is not found in the SFOE Sonnendach database' 
        });
      } else {
        res.status(500).json({ error: 'Failed to fetch solar potential' });
      }
    }
  };

  getSolarPotentialByCoordinates = async (req: Request, res: Response) => {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ 
          error: 'Missing coordinates', 
          message: 'Please provide lat and lng query parameters' 
        });
      }

      const coordinates = {
        lat: parseFloat(lat as string),
        lng: parseFloat(lng as string)
      };

      const potential = await this.solarService.getSolarPotentialByCoordinates(coordinates);
      res.json(potential);
    } catch (error) {
      console.error('Error getting solar potential by coordinates:', error);
      res.status(500).json({ error: 'Failed to fetch solar potential' });
    }
  };
}