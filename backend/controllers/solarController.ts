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
      const potential = await this.solarService.getSolarPotential(egid);
      res.json(potential);
    } catch (error) {
      console.error('Error getting solar potential:', error);
      res.status(500).json({ error: 'Failed to fetch solar potential' });
    }
  };
}