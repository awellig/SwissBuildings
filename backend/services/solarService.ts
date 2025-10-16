import axios from 'axios';
import NodeCache from 'node-cache';
import { SolarPotential, SonnendachData } from '../interfaces/solar.interface';
import { EnhancedSwissSolarEstimationService } from './enhancedSwissSolarEstimation.service';
import { SwissBuildingDataService } from './swissBuildingData.service';

export class SolarService {
  private cache: NodeCache;
  private geoAdminApiUrl: string;
  private sonnendachApiUrl: string;
  private solarEstimationService: EnhancedSwissSolarEstimationService;
  private buildingDataService: SwissBuildingDataService;
  
  constructor() {
    // Cache solar data for 24 hours (it doesn't change frequently)
    this.cache = new NodeCache({ stdTTL: 86400 });
    this.geoAdminApiUrl = process.env.GEOADMIN_API_BASE_URL || 'https://api3.geo.admin.ch';
    this.sonnendachApiUrl = process.env.SONNENDACH_API_BASE_URL || 'https://www.uvek-gis.admin.ch/BFE/sonnendach';
    
    // Initialize services
    this.solarEstimationService = new EnhancedSwissSolarEstimationService();
    this.buildingDataService = new SwissBuildingDataService();
  }

  /**
   * Fetch solar potential data from SFOE Sonnendach using building coordinates
   */
  private async fetchSonnendachData(coordinates: [number, number]): Promise<SonnendachData | null> {
    try {
      // Use Swiss GeoAdmin API to query official Sonnendach layer
      const [x, y] = coordinates;
      const identifyUrl = `${this.geoAdminApiUrl}/rest/services/api/MapServer/identify`;
      
      console.log(`🌞 Querying Sonnendach layer at coordinates: [${x}, ${y}]`);
      
      const response = await axios.get(identifyUrl, {
        params: {
          geometry: `${x},${y}`,
          geometryType: 'esriGeometryPoint',
          layers: 'all:ch.bfe.solarenergie-eignung-daecher', // Official solar roof suitability layer
          mapExtent: `${x-1000},${y-1000},${x+1000},${y+1000}`, // Larger search area
          imageDisplay: '500,500,96',
          tolerance: 200, // Much larger tolerance
          returnGeometry: true,
          geometryFormat: 'geojson',
          sr: '2056', // LV95 Swiss coordinate system (as string)
          lang: 'en'
        },
        timeout: 15000
      });

      console.log(`🔍 Sonnendach API response:`, response.data);

      if (response.data?.results?.length > 0) {
        const result = response.data.results[0];
        const attrs = result.attributes || {};
        
        console.log(`✅ Sonnendach attributes found:`, attrs);
        
        // Map SFOE attributes to our interface
        return {
          egid: attrs.egid || 'unknown',
          roofId: attrs.roof_id || attrs.id || 'unknown',
          suitability: attrs.klasse || attrs.class || attrs.suitability || 2, // 1=excellent, 4=poor
          irradiation: attrs.gstrahlung || attrs.irradiation || 1100, // kWh/m²/year
          area: attrs.flaeche || attrs.area || 100, // m²
          coordinates: coordinates
        };
      }
      
      console.log(`⚠️ No Sonnendach data found for coordinates [${x}, ${y}]`);
      return null;
    } catch (error) {
      console.error('❌ Error fetching Sonnendach data:', error);
      return null;
    }
  }

  /**
   * Get building coordinates from EGID using Swiss building register
   */
  private async getBuildingCoordinates(egid: string): Promise<[number, number] | null> {
    try {
      const cacheKey = `building_coords_${egid}`;
      let coords = this.cache.get<[number, number]>(cacheKey);
      
      if (coords) {
        return coords;
      }
      
      // Use GeoAdmin Find API to get building by EGID
      const findUrl = `${this.geoAdminApiUrl}/rest/services/api/MapServer/find`;
      
      const response = await axios.get(findUrl, {
        params: {
          layer: 'ch.bfs.gebaeude_wohnungs_register',
          searchText: egid,
          searchField: 'egid',
          returnGeometry: true,
          contains: false
        },
        timeout: 10000
      });
      
      if (response.data?.results?.length > 0) {
        const result = response.data.results[0];
        if (result.geometry && result.geometry.x && result.geometry.y) {
          coords = [result.geometry.x, result.geometry.y];
          this.cache.set(cacheKey, coords, 3600); // Cache for 1 hour
          return coords;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting building coordinates:', error);
      return null;
    }
  }

  async getSolarPotential(egid: string): Promise<SolarPotential> {
    console.log(`☀️  SFOE Sonnendach Solar Request - EGID: ${egid}`);
    
    try {
      const cacheKey = `solar_potential_${egid}`;
      let cachedData = this.cache.get<SolarPotential>(cacheKey);
      
      if (cachedData) {
        console.log(`📋 Using cached solar data for EGID ${egid}:`, {
          roofArea: `${cachedData.roofArea.toFixed(0)}m²`,
          potentialKwp: `${cachedData.potentialKwp.toFixed(1)}kWp`,
          annualProduction: `${cachedData.annualProduction.toFixed(0)}kWh/year`,
          economicViability: cachedData.economicViability
        });
        return cachedData;
      }

      console.log(`🔍 Getting building coordinates for EGID ${egid}...`);

      // Get building coordinates
      const coordinates = await this.getBuildingCoordinates(egid);
      
      if (coordinates) {
        console.log(`✅ Found building coordinates: [${coordinates[0]}, ${coordinates[1]}]`);
        console.log(`🔍 Fetching Sonnendach data for coordinates...`);
        
        // Fetch real Sonnendach data
        const sonnendachData = await this.fetchSonnendachData(coordinates);
        
        if (sonnendachData) {
          console.log(`✅ Sonnendach data retrieved - using hybrid approach with NASA irradiance:`, {
            egid: sonnendachData.egid,
            roofId: sonnendachData.roofId,
            suitability: sonnendachData.suitability,
            area: `${sonnendachData.area}m²`
          });
          
          // Convert LV95 coordinates back to WGS84 for NASA/PVGIS APIs
          const wgs84 = this.lv95ToWgs84(coordinates[0], coordinates[1]);
          const wgs84Coords: [number, number] = [wgs84.lng, wgs84.lat];
          
          // Use enhanced estimation with NASA/PVGIS but override with Sonnendach roof data
          const enhancedSolar = await this.solarEstimationService.estimateSolarPotential(
            wgs84Coords,
            {
              egid: sonnendachData.egid,
              floorArea: sonnendachData.area, // Use Sonnendach roof area
              buildingType: 'residential' // Default
            }
          );
          
          // Override with Sonnendach roof characteristics but keep NASA irradiance
          const roofArea = sonnendachData.area;
          const suitabilityClass = this.getSuitabilityClass(sonnendachData.suitability);
          const suitablePercentage = this.getSuitablePercentage(sonnendachData.suitability);
          const suitableArea = roofArea * suitablePercentage;
          
          const result: SolarPotential = {
            ...enhancedSolar,
            roofArea,
            suitableArea,
            suitabilityClass,
            isEstimated: false, // Hybrid: official roof data + satellite irradiance
            dataSource: 'SFOE Sonnendach (roof) + NASA POWER (irradiance) + PVGIS (methodology)',
            estimationMethod: 'Hybrid: Official roof analysis + Satellite irradiance'
          };
          
          this.cache.set(cacheKey, result, 86400); // Cache for 24 hours
          return result;
        }
      }
      
      // No official Sonnendach data found - use enhanced estimation algorithm
      console.log(`📊 No official solar data found, using enhanced estimation algorithm for EGID ${egid}`);
      
      // Get comprehensive building data for estimation
      const buildingData = await this.buildingDataService.getBuildingData(egid);
      
      if (buildingData) {
        const estimatedSolar = await this.solarEstimationService.estimateSolarPotential(
          buildingData.coordinates || coordinates || [600000, 200000], // Swiss default coordinates
          buildingData
        );
        
        // Cache the estimated result
        this.cache.set(cacheKey, estimatedSolar, 86400);
        return estimatedSolar;
      } else {
        // Fallback with minimal data
        const fallbackEstimate = await this.solarEstimationService.estimateSolarPotential(
          coordinates || [600000, 200000], // Swiss default coordinates
          { egid }
        );
        
        this.cache.set(cacheKey, fallbackEstimate, 86400);
        return fallbackEstimate;
      }
      
    } catch (error) {
      console.error('Error getting solar potential:', error);
      
      // Fallback to estimation even on API errors
      console.log(`📊 API error occurred, falling back to enhanced solar estimation for EGID ${egid}`);
      
      try {
        const buildingData = await this.buildingDataService.getBuildingData(egid);
        const fallbackEstimate = await this.solarEstimationService.estimateSolarPotential(
          buildingData?.coordinates || [600000, 200000], // Swiss default coordinates
          buildingData || { egid }
        );
        
        return fallbackEstimate;
      } catch (fallbackError) {
        console.error('Even fallback estimation failed:', fallbackError);
        throw new Error('Unable to provide solar data or estimation');
      }
    }
  }

  private getSuitabilityClass(suitability: number): string {
    switch (suitability) {
      case 1: return 'Very good';
      case 2: return 'Good';
      case 3: return 'Moderate';
      case 4: return 'Not suitable';
      default: return 'Moderate';
    }
  }

  private getSuitablePercentage(suitability: number): number {
    switch (suitability) {
      case 1: return 0.80; // 80% of roof suitable
      case 2: return 0.65; // 65% of roof suitable
      case 3: return 0.45; // 45% of roof suitable
      case 4: return 0.15; // 15% of roof suitable
      default: return 0.45;
    }
  }

  private getEconomicViability(irradiation: number, paybackPeriod: number): 'excellent' | 'good' | 'moderate' | 'poor' {
    if (irradiation > 1200 && paybackPeriod < 8) return 'excellent';
    if (irradiation > 1100 && paybackPeriod < 12) return 'good';
    if (irradiation > 1000 && paybackPeriod < 15) return 'moderate';
    return 'poor';
  }

  private generateSimulatedSolarData(egid: string): SolarPotential {
    // Generate consistent simulated data based on EGID
    const seed = parseInt(egid.slice(-6)) || 123456;
    const random = (seed * 9301 + 49297) % 233280 / 233280; // Simple seeded random
    
    const roofArea = 80 + random * 400; // 80-480 m²
    const suitability = Math.floor(random * 3) + 1; // 1-3 (exclude 4 = not suitable)
    const suitablePercentage = this.getSuitablePercentage(suitability);
    const suitableArea = roofArea * suitablePercentage;
    const potentialKwp = suitableArea * 0.17; // ~170W per m²
    const irradiation = 950 + random * 300; // 950-1250 kWh/m²/year
    const annualProduction = potentialKwp * irradiation;
    const co2Savings = annualProduction * 0.1;
    const installationCost = potentialKwp * 1800;
    const paybackPeriod = installationCost / (annualProduction * 0.12);
    
    return {
      roofArea,
      suitableArea,
      potentialKwp,
      annualProduction,
      co2Savings,
      economicViability: this.getEconomicViability(irradiation, paybackPeriod),
      irradiation,
      suitabilityClass: this.getSuitabilityClass(suitability),
      installationCost,
      paybackPeriod
    };
  }

  /**
   * Get solar potential by coordinates - uses modular services with fallback
   */
  async getSolarPotentialByCoordinates(coordinates: { lat: number; lng: number }): Promise<SolarPotential> {
    console.log(`☀️ Solar Request by Coordinates - Lat: ${coordinates.lat}, Lng: ${coordinates.lng}`);
    
    try {
      const cacheKey = `solar_coords_${coordinates.lat}_${coordinates.lng}`;
      let cachedData = this.cache.get<SolarPotential>(cacheKey);
      
      if (cachedData) {
        console.log(`📋 Using cached solar data for coordinates [${coordinates.lat}, ${coordinates.lng}]`);
        return cachedData;
      }

      // Convert WGS84 to LV95 for Swiss APIs
      const lv95Coords = this.wgs84ToLv95(coordinates.lat, coordinates.lng);
      console.log(`🗺️ Converted coordinates: WGS84 [${coordinates.lat}, ${coordinates.lng}] → LV95 [${lv95Coords[0]}, ${lv95Coords[1]}]`);

      // Try to get official Sonnendach data first
      const sonnendachData = await this.fetchSonnendachData(lv95Coords);
      
      if (sonnendachData) {
        console.log(`✅ Official Sonnendach data found - using for roof analysis, NASA/PVGIS for irradiance!`);
        
        // Use Sonnendach for roof characteristics but NASA/PVGIS for irradiance
        const roofArea = sonnendachData.area;
        const suitabilityClass = this.getSuitabilityClass(sonnendachData.suitability);
        const suitablePercentage = this.getSuitablePercentage(sonnendachData.suitability);
        const suitableArea = roofArea * suitablePercentage;
        
        // Enhanced calculation: Use NASA/PVGIS for accurate irradiance + Sonnendach roof data
        const buildingData = await this.buildingDataService.getBuildingData(`${coordinates.lat},${coordinates.lng}`);
        const wgs84Coords: [number, number] = [coordinates.lng, coordinates.lat];
        
        const enhancedSolar = await this.solarEstimationService.estimateSolarPotential(
          wgs84Coords,
          {
            egid: sonnendachData.egid,
            floorArea: roofArea, // Use Sonnendach roof area
            buildingType: 'residential' // Default, could be enhanced
          }
        );
        
        // Override roof data with Sonnendach precision, keep NASA irradiance
        const result: SolarPotential = {
          ...enhancedSolar,
          roofArea,
          suitableArea,
          suitabilityClass,
          isEstimated: false, // Hybrid: official roof data + satellite irradiance
          dataSource: 'SFOE Sonnendach (roof) + NASA POWER (irradiance) + PVGIS (methodology)',
          estimationMethod: 'Hybrid: Official roof analysis + Satellite irradiance'
        };
        
        this.cache.set(cacheKey, result, 86400); // Cache for 24 hours
        return result;
      }

      // Fallback to estimation using modular services
      console.log(`⚠️ No official Sonnendach data - using enhanced estimation algorithm`);
      
      // Get building data for better estimation (pass coordinates as tuple)
      const buildingData = await this.buildingDataService.getBuildingData(`${coordinates.lat},${coordinates.lng}`);
      
      // Use enhanced estimation algorithm with WGS84 coordinates (not LV95!)
      const wgs84Coords: [number, number] = [coordinates.lng, coordinates.lat]; // [longitude, latitude]
      const estimatedSolar = await this.solarEstimationService.estimateSolarPotential(
        wgs84Coords, 
        buildingData || { egid: 'unknown', floorArea: 100 } // Fallback building data
      );
      
      // Cache the estimated result
      this.cache.set(cacheKey, estimatedSolar, 86400); // Cache for 24 hours
      
      return estimatedSolar;
      
    } catch (error) {
      console.error('❌ Error getting solar potential by coordinates:', error);
      throw new Error('Failed to fetch solar potential');
    }
  }

  /**
   * Convert WGS84 (lat/lng) to Swiss LV95 coordinates
   */
  private wgs84ToLv95(lat: number, lng: number): [number, number] {
    // Swiss coordinate transformation (approximate)
    // For production, use official Swiss transformation library
    const phi = lat * Math.PI / 180;
    const lambda = lng * Math.PI / 180;
    const phi0 = 46.95240555555556 * Math.PI / 180; // Bern latitude
    const lambda0 = 7.439583333333333 * Math.PI / 180; // Bern longitude
    
    const R = 6378137; // Earth radius in meters
    const k0 = 1.0; // Scale factor
    
    const x = 2600000 + R * k0 * (lambda - lambda0) * Math.cos(phi0);
    const y = 1200000 + R * k0 * (phi - phi0);
    
    return [Math.round(x), Math.round(y)];
  }

  /**
   * Convert Swiss LV95 coordinates to WGS84 (lat/lng)
   */
  private lv95ToWgs84(x: number, y: number): { lat: number; lng: number } {
    // Swiss coordinate transformation (approximate reverse)
    const phi0 = 46.95240555555556 * Math.PI / 180; // Bern latitude
    const lambda0 = 7.439583333333333 * Math.PI / 180; // Bern longitude
    
    const R = 6378137; // Earth radius in meters
    const k0 = 1.0; // Scale factor
    
    const phi = ((y - 1200000) / (R * k0)) + phi0;
    const lambda = ((x - 2600000) / (R * k0 * Math.cos(phi0))) + lambda0;
    
    return {
      lat: phi * 180 / Math.PI,
      lng: lambda * 180 / Math.PI
    };
  }
}