interface SolarPotential {
  roofArea: number; // m²
  suitableArea: number; // m²
  potentialKwp: number; // kWp installable
  annualProduction: number; // kWh/year
  co2Savings: number; // kg CO2/year
  economicViability: 'excellent' | 'good' | 'moderate' | 'poor';
  irradiation: number; // kWh/m²/year
}

export class SolarService {

  async getSolarPotential(egid: string): Promise<SolarPotential> {
    try {
      // Simulate SFOE Sonnendach data
      const roofArea = Math.random() * 500 + 100; // 100-600 m²
      const suitablePercentage = Math.random() * 0.4 + 0.4; // 40-80% suitable
      const suitableArea = roofArea * suitablePercentage;
      const potentialKwp = suitableArea * 0.15; // ~150W per m²
      const irradiation = Math.random() * 300 + 900; // 900-1200 kWh/m²/year
      const annualProduction = potentialKwp * irradiation;
      const co2Savings = annualProduction * 0.4; // ~400g CO2/kWh saved
      
      let economicViability: 'excellent' | 'good' | 'moderate' | 'poor';
      if (irradiation > 1100) economicViability = 'excellent';
      else if (irradiation > 1000) economicViability = 'good';
      else if (irradiation > 950) economicViability = 'moderate';
      else economicViability = 'poor';

      return {
        roofArea,
        suitableArea,
        potentialKwp,
        annualProduction,
        co2Savings,
        economicViability,
        irradiation
      };
    } catch (error) {
      console.error('Error getting solar potential:', error);
      throw new Error('Failed to fetch solar potential');
    }
  }
}