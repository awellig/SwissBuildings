import axios from 'axios';
import NodeCache from 'node-cache';
import { BuildingData } from '../interfaces/solar.interface';

/**
 * Swiss Building Data Service
 * Fetches building information from Swiss Federal Building Registry
 */
export class SwissBuildingDataService {
  private cache: NodeCache;
  private geoAdminApiUrl: string;
  
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
    this.geoAdminApiUrl = process.env.GEOADMIN_API_BASE_URL || 'https://api3.geo.admin.ch';
  }
  
  /**
   * Get comprehensive building data for solar estimation
   */
  async getBuildingData(egid: string): Promise<BuildingData | null> {
    console.log(`🏠 Fetching building data for EGID ${egid}...`);
    
    try {
      const cacheKey = `building_data_${egid}`;
      let cachedData = this.cache.get<BuildingData>(cacheKey);
      
      if (cachedData) {
        console.log(`📋 Using cached building data for EGID ${egid}`);
        return cachedData;
      }
      
      // Get building coordinates first
      const coordinates = await this.getBuildingCoordinates(egid);
      if (!coordinates) {
        console.log(`⚠️ No coordinates found for EGID ${egid}`);
        return null;
      }
      
      // Get detailed building information
      const buildingDetails = await this.getBuildingDetails(egid, coordinates);
      
      const buildingData: BuildingData = {
        egid,
        coordinates,
        ...buildingDetails
      };
      
      this.cache.set(cacheKey, buildingData, 3600);
      
      console.log(`✅ Building data retrieved for EGID ${egid}:`, {
        floorArea: buildingData.floorArea,
        floors: buildingData.floors,
        constructionYear: buildingData.constructionYear,
        buildingType: buildingData.buildingType
      });
      
      return buildingData;
      
    } catch (error) {
      console.error(`❌ Error fetching building data for EGID ${egid}:`, error);
      return null;
    }
  }
  
  /**
   * Get building coordinates from EGID
   */
  private async getBuildingCoordinates(egid: string): Promise<[number, number] | null> {
    try {
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
          return [result.geometry.x, result.geometry.y];
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting building coordinates:', error);
      return null;
    }
  }
  
  /**
   * Get detailed building information
   */
  private async getBuildingDetails(egid: string, coordinates: [number, number]): Promise<{
    floorArea?: number;
    floors?: number;
    constructionYear?: number;
    buildingType?: string;
  }> {
    try {
      // Query building register using identify API for detailed attributes
      const identifyUrl = `${this.geoAdminApiUrl}/rest/services/api/MapServer/identify`;
      const [x, y] = coordinates;
      
      const response = await axios.get(identifyUrl, {
        params: {
          geometry: `${x},${y}`,
          geometryType: 'esriGeometryPoint',
          layers: 'all:ch.bfs.gebaeude_wohnungs_register',
          mapExtent: `${x-50},${y-50},${x+50},${y+50}`,
          imageDisplay: '100,100,96',
          tolerance: '25',
          returnGeometry: false,
          sr: '2056',
          lang: 'en'
        },
        timeout: 10000
      });
      
      if (response.data?.results?.length > 0) {
        const result = response.data.results[0];
        const attrs = result.attributes || {};
        
        return {
          floorArea: this.parseFloorArea(attrs),
          floors: this.parseFloors(attrs),
          constructionYear: this.parseConstructionYear(attrs),
          buildingType: this.parseBuildingType(attrs)
        };
      }
      
      return {};
    } catch (error) {
      console.error('Error getting building details:', error);
      return {};
    }
  }
  
  /**
   * Parse floor area from building attributes
   */
  private parseFloorArea(attrs: any): number | undefined {
    const areaFields = ['garea', 'floor_area', 'flaeche', 'area'];
    
    for (const field of areaFields) {
      const value = Number(attrs[field]);
      if (!isNaN(value) && value > 0 && value < 50000) { // Reasonable bounds
        return value;
      }
    }
    
    return undefined;
  }
  
  /**
   * Parse number of floors from building attributes
   */
  private parseFloors(attrs: any): number | undefined {
    const floorFields = ['gastw', 'floors', 'number_of_floors', 'etagen'];
    
    for (const field of floorFields) {
      const value = Number(attrs[field]);
      if (!isNaN(value) && value > 0 && value <= 50) { // Reasonable bounds
        return value;
      }
    }
    
    return undefined;
  }
  
  /**
   * Parse construction year from building attributes
   */
  private parseConstructionYear(attrs: any): number | undefined {
    const yearFields = ['gbauj', 'construction_year', 'baujahr', 'year'];
    
    for (const field of yearFields) {
      const value = Number(attrs[field]);
      if (!isNaN(value) && value >= 1800 && value <= new Date().getFullYear()) {
        return value;
      }
    }
    
    return undefined;
  }
  
  /**
   * Parse building type from building attributes
   */
  private parseBuildingType(attrs: any): string | undefined {
    const typeFields = ['gklas', 'gkode', 'building_class', 'category', 'type'];
    
    for (const field of typeFields) {
      const value = attrs[field];
      if (value && typeof value === 'string') {
        return this.normalizeBuildingType(value);
      } else if (typeof value === 'number') {
        return this.mapBuildingTypeCode(value);
      }
    }
    
    return undefined;
  }
  
  /**
   * Normalize building type to standard categories
   */
  private normalizeBuildingType(type: string): string {
    const normalizedType = type.toLowerCase();
    
    if (normalizedType.includes('residential') || normalizedType.includes('wohn')) {
      return 'residential';
    } else if (normalizedType.includes('commercial') || normalizedType.includes('office') || normalizedType.includes('büro')) {
      return 'commercial';
    } else if (normalizedType.includes('industrial') || normalizedType.includes('industrie')) {
      return 'industrial';
    } else if (normalizedType.includes('educational') || normalizedType.includes('school') || normalizedType.includes('schule')) {
      return 'educational';
    } else if (normalizedType.includes('public') || normalizedType.includes('government') || normalizedType.includes('öffentlich')) {
      return 'public';
    }
    
    return 'other';
  }
  
  /**
   * Map numeric building type codes to categories
   */
  private mapBuildingTypeCode(code: number): string {
    // Swiss building classification codes (simplified)
    if (code >= 1000 && code < 2000) return 'residential';
    if (code >= 2000 && code < 3000) return 'commercial';
    if (code >= 3000 && code < 4000) return 'industrial';
    if (code >= 4000 && code < 5000) return 'educational';
    if (code >= 5000 && code < 6000) return 'public';
    
    return 'other';
  }
}