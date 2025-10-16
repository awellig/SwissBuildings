/**
 * Solar potential data interface
 */
export interface SolarPotential {
  roofArea: number; // m²
  suitableArea: number; // m²
  potentialKwp: number; // kWp installable
  annualProduction: number; // kWh/year
  co2Savings: number; // kg CO2/year
  economicViability: 'excellent' | 'good' | 'moderate' | 'poor';
  irradiation: number; // kWh/m²/year
  suitabilityClass?: string;
  installationCost?: number; // CHF
  paybackPeriod?: number; // years
  
  // Data source metadata
  isEstimated?: boolean; // true for estimated data, false for official data
  estimationMethod?: string; // description of estimation method used
  dataSource?: string; // source of the data (e.g., "SFOE Sonnendach", "Swiss Building Registry Estimation")
}

/**
 * Raw Sonnendach data from Swiss Federal Office of Energy
 */
export interface SonnendachData {
  egid: string;
  roofId: string;
  suitability: number; // 1-4 scale
  irradiation: number;
  area: number;
  coordinates: [number, number];
}

/**
 * Building data for solar estimation
 */
export interface BuildingData {
  egid: string;
  floorArea?: number;
  floors?: number;
  constructionYear?: number;
  buildingType?: string;
  coordinates?: [number, number];
}