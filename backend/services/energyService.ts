interface EnergyConsumption {
  totalKwh: number;
  dailyAverage: number;
  monthlyTrend: number[];
  lastUpdated: string;
}

interface EnergyBreakdown {
  lighting: number;
  hvac: number;
  appliances: number;
  heating: number;
  cooling: number;
  other: number;
  total: number;
}

export class EnergyService {

  async getEnergyConsumption(egid: string): Promise<EnergyConsumption> {
    try {
      // Simulate NILM-based energy data
      const baseConsumption = Math.random() * 2000 + 500; // 500-2500 kWh
      
      return {
        totalKwh: baseConsumption,
        dailyAverage: baseConsumption / 30,
        monthlyTrend: Array.from({ length: 12 }, () => Math.random() * 300 + 100),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting energy consumption:', error);
      throw new Error('Failed to fetch energy consumption');
    }
  }

  async getEnergyBreakdown(egid: string): Promise<EnergyBreakdown> {
    try {
      // Simulate NILM appliance detection
      const lighting = Math.random() * 500 + 100;
      const hvac = Math.random() * 800 + 200;
      const appliances = Math.random() * 400 + 150;
      const heating = Math.random() * 600 + 100;
      const cooling = Math.random() * 300 + 50;
      const other = Math.random() * 200 + 50;
      
      return {
        lighting,
        hvac,
        appliances,
        heating,
        cooling,
        other,
        total: lighting + hvac + appliances + heating + cooling + other
      };
    } catch (error) {
      console.error('Error getting energy breakdown:', error);
      throw new Error('Failed to fetch energy breakdown');
    }
  }
}