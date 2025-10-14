import { Request, Response } from 'express';
import { EnergyService } from '../services/energyService';

export class EnergyController {
  private energyService: EnergyService;

  constructor() {
    this.energyService = new EnergyService();
  }

  getEnergyConsumption = async (req: Request, res: Response) => {
    try {
      const { egid } = req.params;
      const consumption = await this.energyService.getEnergyConsumption(egid);
      res.json(consumption);
    } catch (error) {
      console.error('Error getting energy consumption:', error);
      res.status(500).json({ error: 'Failed to fetch energy consumption' });
    }
  };

  getEnergyBreakdown = async (req: Request, res: Response) => {
    try {
      const { egid } = req.params;
      const breakdown = await this.energyService.getEnergyBreakdown(egid);
      res.json(breakdown);
    } catch (error) {
      console.error('Error getting energy breakdown:', error);
      res.status(500).json({ error: 'Failed to fetch energy breakdown' });
    }
  };
}