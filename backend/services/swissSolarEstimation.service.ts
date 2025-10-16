import { SolarPotential } from '../interfaces/solar.interface';

/**
 * Swiss Solar Estimation Service
 * Provides solar potential calculations when official Sonnendach data is unavailable
 * Based on Swiss meteorological data and industry standards
 */
export class SwissSolarEstimationService {
  
  /**
   * Estimate solar potential for a Swiss building using geographical and building data
   */
  public estimateSolarPotential(
    coordinates: [number, number], 
    buildingData: {
      egid: string;
      floorArea?: number;
      floors?: number;
      constructionYear?: number;
      buildingType?: string;
    }
  ): SolarPotential {
    
    console.log(`📊 Estimating solar potential for EGID ${buildingData.egid} at coordinates [${coordinates[0]}, ${coordinates[1]}]`);
    
    // 1. Calculate solar irradiation based on Swiss location
    const irradiation = this.calculateSwissIrradiation(coordinates);
    
    // 2. Estimate roof area from building data
    const roofArea = this.estimateRoofArea(buildingData);
    
    // 3. Calculate roof suitability based on building characteristics
    const suitability = this.estimateRoofSuitability(buildingData);
    
    // 4. Calculate suitable area for solar panels
    const suitableArea = roofArea * this.getSuitableAreaRatio(suitability);
    
    // 5. Calculate solar installation potential
    const potentialKwp = this.calculatePotentialKwp(suitableArea);
    
    // 6. Calculate annual production
    const annualProduction = this.calculateAnnualProduction(potentialKwp, irradiation);
    
    // 7. Calculate environmental and economic metrics
    const co2Savings = this.calculateCO2Savings(annualProduction);
    const economicViability = this.assessEconomicViability(irradiation, potentialKwp);
    const installationCost = this.estimateInstallationCost(potentialKwp);
    const paybackPeriod = this.calculatePaybackPeriod(installationCost, annualProduction);
    
    const result: SolarPotential = {
      roofArea,
      suitableArea,
      potentialKwp,
      annualProduction,
      co2Savings,
      economicViability,
      irradiation,
      suitabilityClass: this.getSuitabilityClass(suitability),
      installationCost,
      paybackPeriod,
      // Add metadata to indicate this is estimated data
      isEstimated: true,
      estimationMethod: 'Swiss Building + Geographic Model',
      dataSource: 'Estimated from building registry and meteorological data'
    };
    
    console.log(`✅ Solar estimation complete:`, {
      roofArea: `${roofArea.toFixed(0)}m²`,
      suitableArea: `${suitableArea.toFixed(0)}m²`,
      potentialKwp: `${potentialKwp.toFixed(1)}kWp`,
      annualProduction: `${annualProduction.toFixed(0)}kWh/year`,
      irradiation: `${irradiation}kWh/m²/year`,
      economicViability
    });
    
    return result;
  }
  
  /**
   * Calculate solar irradiation for Swiss coordinates using regional data
   */
  private calculateSwissIrradiation(coordinates: [number, number]): number {
    const [x, y] = coordinates;
    
    // Swiss solar irradiation map (simplified model)
    // Based on MeteoSwiss data: https://www.meteoswiss.admin.ch/
    
    // Default fallback for invalid coordinates
    if (!x || !y || x < 485000 || x > 840000 || y < 75000 || y > 300000) {
      return 1100; // Swiss average
    }
    
    // Regional irradiation values (kWh/m²/year)
    const regions = [
      // Valais (high altitude, southern exposure) - highest irradiation
      { bounds: { xMin: 570000, xMax: 645000, yMin: 85000, yMax: 130000 }, irradiation: 1350 },
      
      // Ticino (southern Switzerland) - high irradiation
      { bounds: { xMin: 680000, xMax: 735000, yMin: 75000, yMax: 125000 }, irradiation: 1280 },
      
      // Graubünden (eastern alpine) - good irradiation
      { bounds: { xMin: 735000, xMax: 840000, yMin: 125000, yMax: 200000 }, irradiation: 1180 },
      
      // Central Plateau (Bern, Zurich area) - moderate irradiation
      { bounds: { xMin: 570000, xMax: 710000, yMin: 200000, yMax: 270000 }, irradiation: 1080 },
      
      // Northern Switzerland (Basel area) - moderate irradiation
      { bounds: { xMin: 570000, xMax: 650000, yMin: 250000, yMax: 300000 }, irradiation: 1050 },
      
      // Jura region - lower irradiation due to climate
      { bounds: { xMin: 485000, xMax: 570000, yMin: 200000, yMax: 270000 }, irradiation: 1000 }
    ];
    
    // Find matching region
    for (const region of regions) {
      if (x >= region.bounds.xMin && x <= region.bounds.xMax &&
          y >= region.bounds.yMin && y <= region.bounds.yMax) {
        return region.irradiation;
      }
    }
    
    // Altitude adjustment (simplified)
    const altitude = this.estimateAltitude(coordinates);
    const altitudeBonus = Math.max(0, (altitude - 500) * 0.5); // +0.5 kWh/m²/year per 100m above 500m
    
    return 1100 + altitudeBonus; // Swiss average with altitude adjustment
  }
  
  /**
   * Estimate building roof area from floor area and building characteristics
   */
  private estimateRoofArea(buildingData: {
    floorArea?: number;
    floors?: number;
    buildingType?: string;
  }): number {
    const floorArea = buildingData.floorArea || 100; // Default 100m² if not provided
    const floors = buildingData.floors || 2; // Default 2 floors
    const buildingType = buildingData.buildingType?.toLowerCase() || 'residential';
    
    // Estimate roof area based on building type and floors
    let roofAreaRatio = 1.0; // Default: roof area = ground floor area
    
    // Adjust based on building type
    switch (buildingType) {
      case 'residential':
      case 'apartment':
        roofAreaRatio = 0.9; // Slightly smaller due to courtyards, balconies
        break;
      case 'commercial':
      case 'office':
        roofAreaRatio = 0.95; // Usually more regular shape
        break;
      case 'industrial':
      case 'warehouse':
        roofAreaRatio = 1.1; // Often larger roof areas
        break;
      case 'educational':
      case 'public':
        roofAreaRatio = 0.85; // Complex shapes, courtyards
        break;
    }
    
    // Calculate ground floor area (total floor area / number of floors)
    const groundFloorArea = floorArea / Math.max(1, floors);
    
    // Apply building type ratio
    const estimatedRoofArea = groundFloorArea * roofAreaRatio;
    
    // Ensure reasonable bounds (20m² to 2000m²)
    return Math.max(20, Math.min(2000, estimatedRoofArea));
  }
  
  /**
   * Estimate roof suitability based on building characteristics
   */
  private estimateRoofSuitability(buildingData: {
    constructionYear?: number;
    buildingType?: string;
    floors?: number;
  }): number {
    let suitability = 2; // Default: good suitability (1=excellent, 4=poor)
    
    const constructionYear = buildingData.constructionYear || 1980;
    const buildingType = buildingData.buildingType?.toLowerCase() || 'residential';
    const floors = buildingData.floors || 2;
    
    // Age factor: newer buildings often have better roof conditions
    if (constructionYear >= 2000) {
      suitability -= 0.3; // Better suitability
    } else if (constructionYear < 1960) {
      suitability += 0.5; // Potentially worse suitability
    }
    
    // Building type factor
    switch (buildingType) {
      case 'industrial':
      case 'warehouse':
        suitability -= 0.4; // Large, flat roofs are ideal
        break;
      case 'residential':
        suitability += 0.1; // Varied roof shapes
        break;
      case 'historical':
      case 'heritage':
        suitability += 1.0; // Often protected, poor suitability
        break;
    }
    
    // Height factor: taller buildings may have better sun exposure
    if (floors >= 5) {
      suitability -= 0.2;
    }
    
    // Ensure bounds (1-4)
    return Math.max(1, Math.min(4, Math.round(suitability)));
  }
  
  /**
   * Get suitable area ratio based on suitability class
   */
  private getSuitableAreaRatio(suitability: number): number {
    switch (suitability) {
      case 1: return 0.80; // Excellent: 80% of roof suitable
      case 2: return 0.65; // Good: 65% of roof suitable
      case 3: return 0.45; // Moderate: 45% of roof suitable
      case 4: return 0.15; // Poor: 15% of roof suitable
      default: return 0.50; // Default
    }
  }
  
  /**
   * Calculate potential solar panel capacity in kWp
   */
  private calculatePotentialKwp(suitableArea: number): number {
    // Modern solar panels: ~300-400W per panel, ~2m² per panel
    // System efficiency: considering spacing, inverters, etc.
    const panelEfficiencyKwPerM2 = 0.20; // 200W/m² (conservative estimate)
    return suitableArea * panelEfficiencyKwPerM2;
  }
  
  /**
   * Calculate annual solar energy production
   */
  private calculateAnnualProduction(potentialKwp: number, irradiation: number): number {
    // System performance ratio (accounts for inverter efficiency, temperature, shading, etc.)
    const performanceRatio = 0.80; // 80% (typical for well-designed systems)
    return potentialKwp * irradiation * performanceRatio;
  }
  
  /**
   * Calculate CO2 savings per year
   */
  private calculateCO2Savings(annualProduction: number): number {
    // Swiss electricity grid CO2 factor: ~0.1 kg CO2/kWh (one of the cleanest in the world)
    const co2FactorKgPerKwh = 0.12;
    return annualProduction * co2FactorKgPerKwh;
  }
  
  /**
   * Assess economic viability
   */
  private assessEconomicViability(
    irradiation: number, 
    potentialKwp: number
  ): 'excellent' | 'good' | 'moderate' | 'poor' {
    const installationCost = potentialKwp * 1800; // CHF per kWp
    const annualProduction = potentialKwp * irradiation * 0.80;
    const annualRevenue = annualProduction * 0.12; // CHF per kWh (Swiss electricity price)
    const paybackYears = installationCost / annualRevenue;
    
    if (irradiation > 1200 && paybackYears < 8) return 'excellent';
    if (irradiation > 1100 && paybackYears < 12) return 'good';
    if (irradiation > 1000 && paybackYears < 15) return 'moderate';
    return 'poor';
  }
  
  /**
   * Estimate installation cost in CHF
   */
  private estimateInstallationCost(potentialKwp: number): number {
    // Swiss solar installation costs (2024): 1500-2200 CHF/kWp
    const costPerKwp = 1800; // Middle estimate
    return potentialKwp * costPerKwp;
  }
  
  /**
   * Calculate payback period in years
   */
  private calculatePaybackPeriod(installationCost: number, annualProduction: number): number {
    const electricityPrice = 0.12; // CHF/kWh (Swiss average)
    const annualSavings = annualProduction * electricityPrice;
    return annualSavings > 0 ? installationCost / annualSavings : 99;
  }
  
  /**
   * Get suitability class description
   */
  private getSuitabilityClass(suitability: number): string {
    switch (suitability) {
      case 1: return 'Excellent';
      case 2: return 'Good';
      case 3: return 'Moderate';
      case 4: return 'Poor';
      default: return 'Moderate';
    }
  }
  
  /**
   * Estimate altitude from coordinates (simplified)
   */
  private estimateAltitude(coordinates: [number, number]): number {
    const [x, y] = coordinates;
    
    // Simplified altitude estimation for Switzerland
    // Based on major geographical features
    
    // Alpine regions (high altitude)
    if ((x > 570000 && x < 645000 && y > 85000 && y < 130000) || // Valais
        (x > 735000 && x < 840000 && y > 125000 && y < 200000)) { // Graubünden
      return 1200; // Average alpine altitude
    }
    
    // Jura region (moderate altitude)
    if (x < 570000 && y > 200000) {
      return 700;
    }
    
    // Central Plateau
    return 450; // Average plateau altitude
  }
}