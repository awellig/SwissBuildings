import { SolarPotential } from '../interfaces/solar.interface';
import axios from 'axios';

/**
 * Enhanced Swiss Solar Estimation Service
 * Uses NASA POWER satellite data and PVGIS methodologies for accurate solar potential calculations
 * Implements state-of-the-art algorithms when official Sonnendach data is unavailable
 */
export class EnhancedSwissSolarEstimationService {
  
  /**
   * Estimate solar potential using satellite data and proven algorithms
   */
  public async estimateSolarPotential(
    coordinates: [number, number], 
    buildingData: {
      egid: string;
      floorArea?: number;
      floors?: number;
      constructionYear?: number;
      buildingType?: string;
    }
  ): Promise<SolarPotential> {
    
    console.log(`🛰️ Enhanced solar estimation for EGID ${buildingData.egid} using satellite data`);
    
    try {
      // 1. Get accurate solar irradiance from NASA POWER satellite data
      const irradianceData = await this.getNASAIrradianceData(coordinates);
      
      // 2. Get PVGIS-based solar potential calculation
      const pvgisData = await this.getPVGISPotentialData(coordinates);
      
      // 3. Estimate roof characteristics from building data
      const roofAnalysis = this.analyzeRoofCharacteristics(buildingData);
      
      // 4. Calculate optimized solar installation potential
      const solarCalculation = this.calculateOptimizedSolarPotential(
        irradianceData,
        pvgisData,
        roofAnalysis
      );
      
      // 5. Economic and environmental assessment
      const economics = this.calculateEconomics(solarCalculation, coordinates);
      
      const result: SolarPotential = {
        ...solarCalculation,
        ...economics,
        irradiation: irradianceData.annualIrradiation,
        suitabilityClass: roofAnalysis.suitabilityClass,
        
        // Enhanced metadata
        isEstimated: true,
        estimationMethod: 'NASA POWER + PVGIS Enhanced Model',
        dataSource: 'Satellite-based irradiance (NASA) + EU photovoltaic methodology (PVGIS)'
      };
      
      console.log(`✅ Enhanced estimation complete:`, {
        irradiation: `${irradianceData.annualIrradiation} kWh/m²/year`,
        roofArea: `${roofAnalysis.estimatedRoofArea}m²`,
        suitableArea: `${solarCalculation.suitableArea}m²`,
        potentialKwp: `${solarCalculation.potentialKwp}kWp`,
        annualProduction: `${solarCalculation.annualProduction} kWh/year`,
        dataQuality: 'Satellite-based'
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Enhanced estimation failed, falling back to basic model:', error);
      // Fallback to basic estimation if APIs fail
      return this.basicEstimationFallback(coordinates, buildingData);
    }
  }
  
  /**
   * Get accurate solar irradiance data from NASA POWER satellite database
   * Uses multi-year average for reliable estimates
   */
  private async getNASAIrradianceData(coordinates: [number, number]): Promise<{
    annualIrradiation: number;
    monthlyProfile: number[];
    dataQuality: string;
  }> {
    const [lon, lat] = coordinates;
    
    // NASA POWER API for solar irradiance (4-year average for reliability)
    const nasaUrl = `https://power.larc.nasa.gov/api/temporal/monthly/point` +
      `?parameters=ALLSKY_SFC_SW_DWN&community=RE` +
      `&longitude=${lon}&latitude=${lat}` +
      `&start=2020&end=2023&format=JSON`;
    
    const response = await axios.get(nasaUrl, { timeout: 10000 });
    const data = response.data;
    
    // Extract monthly irradiance values (kWh/m²/day)
    const irradianceValues = data.properties.parameter.ALLSKY_SFC_SW_DWN;
    
    // Calculate monthly averages across years
    const monthlyProfile: number[] = [];
    for (let month = 1; month <= 12; month++) {
      const monthKey = month.toString().padStart(2, '0');
      let monthTotal = 0;
      let yearCount = 0;
      
      // Average across all years for this month
      for (let year = 2020; year <= 2023; year++) {
        const key = `${year}${monthKey}`;
        if (irradianceValues[key] && irradianceValues[key] > 0) {
          monthTotal += irradianceValues[key];
          yearCount++;
        }
      }
      
      const monthAverage = yearCount > 0 ? monthTotal / yearCount : 0;
      monthlyProfile.push(monthAverage);
    }
    
    // Calculate annual irradiation (kWh/m²/year)
    const daysInMonth = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Average for leap years
    const annualIrradiation = monthlyProfile.reduce((total, daily, index) => {
      return total + (daily * daysInMonth[index]);
    }, 0);
    
    return {
      annualIrradiation: Math.round(annualIrradiation),
      monthlyProfile,
      dataQuality: 'NASA satellite-based'
    };
  }
  
  /**
   * Get photovoltaic potential data from PVGIS (European Commission)
   * Provides accurate solar calculations for European locations
   */
  private async getPVGISPotentialData(coordinates: [number, number]): Promise<{
    specificProduction: number; // kWh/kWp/year
    performanceRatio: number;
    systemLosses: number;
    elevation: number;
  }> {
    const [lon, lat] = coordinates;
    
    // PVGIS API for 1kWp system calculation
    const pvgisUrl = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc` +
      `?lat=${lat}&lon=${lon}` +
      `&peakpower=1&loss=14&outputformat=json`;
    
    const response = await axios.get(pvgisUrl, { timeout: 10000 });
    const data = response.data;
    
    const totals = data.outputs.totals.fixed;
    const location = data.inputs.location;
    
    return {
      specificProduction: Math.round(totals.E_y), // kWh/kWp/year
      performanceRatio: Math.round((1 + totals.l_total / 100) * 100) / 100,
      systemLosses: Math.abs(totals.l_total),
      elevation: location.elevation
    };
  }
  
  /**
   * Advanced roof analysis using building characteristics
   */
  private analyzeRoofCharacteristics(buildingData: {
    floorArea?: number;
    floors?: number;
    constructionYear?: number;
    buildingType?: string;
  }): {
    estimatedRoofArea: number;
    suitabilityScore: number;
    suitabilityClass: string;
    usableRatio: number;
  } {
    const floorArea = buildingData.floorArea || 100;
    const floors = buildingData.floors || 2;
    const constructionYear = buildingData.constructionYear || 1980;
    const buildingType = buildingData.buildingType?.toLowerCase() || 'residential';
    
    // Advanced roof area estimation
    const groundFloorArea = floorArea / Math.max(1, floors);
    let roofAreaMultiplier = 1.0;
    
    // Building type adjustments based on Swiss architecture
    const typeMultipliers: { [key: string]: number } = {
      'residential': 0.9,     // Pitched roofs, dormers
      'apartment': 0.85,      // Complex layouts, courtyards
      'commercial': 0.95,     // Regular shapes
      'office': 0.95,         // Regular shapes
      'industrial': 1.15,     // Large flat roofs
      'warehouse': 1.2,       // Very large flat roofs
      'educational': 0.8,     // Complex shapes, courtyards
      'public': 0.8,          // Complex shapes
      'agricultural': 1.1     // Simple large structures
    };
    
    roofAreaMultiplier = typeMultipliers[buildingType] || 1.0;
    const estimatedRoofArea = Math.max(20, Math.min(3000, groundFloorArea * roofAreaMultiplier));
    
    // Advanced suitability scoring (0-100)
    let suitabilityScore = 70; // Base score
    
    // Age factor (newer = better roof condition)
    if (constructionYear >= 2010) suitabilityScore += 15;
    else if (constructionYear >= 2000) suitabilityScore += 10;
    else if (constructionYear >= 1990) suitabilityScore += 5;
    else if (constructionYear < 1960) suitabilityScore -= 15;
    
    // Building type suitability
    const typeSuitability: { [key: string]: number } = {
      'industrial': 20,       // Excellent: large flat roofs
      'warehouse': 20,        // Excellent: large flat roofs
      'commercial': 10,       // Good: regular shapes
      'office': 10,           // Good: regular shapes
      'residential': 0,       // Average: varied roof types
      'apartment': -5,        // Slightly below average
      'educational': -10,     // Below average: complex
      'public': -10,          // Below average: complex
      'historical': -30       // Poor: protected buildings
    };
    
    suitabilityScore += typeSuitability[buildingType] || 0;
    
    // Height factor (taller = less shading)
    if (floors >= 8) suitabilityScore += 10;
    else if (floors >= 5) suitabilityScore += 5;
    else if (floors <= 1) suitabilityScore -= 5;
    
    // Ensure bounds
    suitabilityScore = Math.max(10, Math.min(100, suitabilityScore));
    
    // Convert to classes and usable ratios
    let suitabilityClass: string;
    let usableRatio: number;
    
    if (suitabilityScore >= 85) {
      suitabilityClass = 'Excellent';
      usableRatio = 0.85;
    } else if (suitabilityScore >= 70) {
      suitabilityClass = 'Good';
      usableRatio = 0.70;
    } else if (suitabilityScore >= 50) {
      suitabilityClass = 'Moderate';
      usableRatio = 0.50;
    } else if (suitabilityScore >= 30) {
      suitabilityClass = 'Limited';
      usableRatio = 0.25;
    } else {
      suitabilityClass = 'Poor';
      usableRatio = 0.10;
    }
    
    return {
      estimatedRoofArea,
      suitabilityScore,
      suitabilityClass,
      usableRatio
    };
  }
  
  /**
   * Calculate optimized solar potential using satellite data and proven methodologies
   */
  private calculateOptimizedSolarPotential(
    irradianceData: any,
    pvgisData: any,
    roofAnalysis: any
  ): {
    roofArea: number;
    suitableArea: number;
    potentialKwp: number;
    annualProduction: number;
    co2Savings: number;
  } {
    const roofArea = roofAnalysis.estimatedRoofArea;
    const suitableArea = roofArea * roofAnalysis.usableRatio;
    
    // Modern panel efficiency: 400W panels, ~2.2m² each = ~180W/m²
    const panelEfficiencyWpPerM2 = 180; // Conservative estimate for real-world conditions
    const potentialKwp = (suitableArea * panelEfficiencyWpPerM2) / 1000;
    
    // Use PVGIS-calculated specific yield for accurate production estimate
    const annualProduction = potentialKwp * pvgisData.specificProduction;
    
    // CO2 savings using Swiss electricity grid factor
    const swissGridEmissionFactor = 0.105; // kg CO2/kWh (Swiss electricity mix)
    const co2Savings = annualProduction * swissGridEmissionFactor;
    
    return {
      roofArea: Math.round(roofArea),
      suitableArea: Math.round(suitableArea),
      potentialKwp: Math.round(potentialKwp * 10) / 10,
      annualProduction: Math.round(annualProduction),
      co2Savings: Math.round(co2Savings)
    };
  }
  
  /**
   * Calculate economic viability and costs
   */
  private calculateEconomics(solarCalculation: any, coordinates: [number, number]): {
    economicViability: 'excellent' | 'good' | 'moderate' | 'poor';
    installationCost: number;
    paybackPeriod: number;
  } {
    // Swiss solar installation costs (2024)
    const costPerKwp = 1800; // CHF/kWp (including VAT, typical for residential)
    const installationCost = solarCalculation.potentialKwp * costPerKwp;
    
    // Swiss feed-in tariff and electricity prices
    const electricityPrice = 0.25; // CHF/kWh (average Swiss household rate)
    const feedInTariff = 0.07; // CHF/kWh (typical Swiss rate)
    
    // Annual savings (assuming 30% self-consumption)
    const selfConsumptionRate = 0.30;
    const selfConsumedEnergy = solarCalculation.annualProduction * selfConsumptionRate;
    const feedInEnergy = solarCalculation.annualProduction * (1 - selfConsumptionRate);
    
    const annualSavings = (selfConsumedEnergy * electricityPrice) + (feedInEnergy * feedInTariff);
    
    // Payback period
    const paybackPeriod = installationCost / Math.max(annualSavings, 1);
    
    // Economic viability assessment
    let economicViability: 'excellent' | 'good' | 'moderate' | 'poor';
    if (paybackPeriod <= 8) economicViability = 'excellent';
    else if (paybackPeriod <= 12) economicViability = 'good';
    else if (paybackPeriod <= 18) economicViability = 'moderate';
    else economicViability = 'poor';
    
    return {
      economicViability,
      installationCost: Math.round(installationCost),
      paybackPeriod: Math.round(paybackPeriod * 10) / 10
    };
  }
  
  /**
   * Basic fallback estimation if APIs fail
   */
  private basicEstimationFallback(
    coordinates: [number, number],
    buildingData: any
  ): SolarPotential {
    console.log('⚠️ Using basic fallback estimation due to API unavailability');
    
    const roofArea = (buildingData.floorArea || 100) / Math.max(1, buildingData.floors || 2);
    const suitableArea = roofArea * 0.6;
    const potentialKwp = suitableArea * 0.15;
    const annualProduction = potentialKwp * 1000; // Conservative estimate
    
    return {
      roofArea: Math.round(roofArea),
      suitableArea: Math.round(suitableArea),
      potentialKwp: Math.round(potentialKwp * 10) / 10,
      annualProduction: Math.round(annualProduction),
      co2Savings: Math.round(annualProduction * 0.105),
      economicViability: 'moderate' as const,
      irradiation: 1100, // Swiss average
      suitabilityClass: 'Moderate',
      installationCost: Math.round(potentialKwp * 1800),
      paybackPeriod: 12,
      isEstimated: true,
      estimationMethod: 'Basic Swiss Model (Fallback)',
      dataSource: 'Regional estimates (APIs unavailable)'
    };
  }
}