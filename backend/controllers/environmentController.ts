import { Request, Response } from 'express';
import { EnvironmentService } from '../services/environmentService';

export class EnvironmentController {
  private environmentService: EnvironmentService;

  constructor() {
    this.environmentService = new EnvironmentService();
  }

  getAirQuality = async (req: Request, res: Response) => {
    try {
      const { location } = req.params;
      const [lat, lng] = location.split(',').map(Number);
      
      const airQuality = await this.environmentService.getAirQuality(lat, lng);
      res.json(airQuality);
    } catch (error) {
      console.error('Error getting air quality:', error);
      res.status(500).json({ error: 'Failed to fetch air quality data' });
    }
  };

  getWeatherData = async (req: Request, res: Response) => {
    try {
      const { location } = req.params;
      const [lat, lng] = location.split(',').map(Number);
      
      const weather = await this.environmentService.getWeatherData(lat, lng);
      res.json(weather);
    } catch (error) {
      console.error('Error getting weather data:', error);
      res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  };
}