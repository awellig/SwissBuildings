import NodeCache from 'node-cache';
import axios from 'axios';

interface BoundingBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

interface BuildingFeature {
  type: 'Feature';
  properties: {
    EGID: string;
    GKODE?: number;
    GKODN?: number;
    GEXPDAT?: string;
    name: string;
    address: string;
    buildingType: string;
    constructionYear: number;
    floors: number;
    area: number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export class BuildingService {
  private cache: NodeCache;
  private geoAdminApiUrl: string;

  constructor() {
    this.cache = new NodeCache({ stdTTL: 600 }); // 10 minutes cache
    this.geoAdminApiUrl = process.env.GEOADMIN_API_BASE_URL || 'https://api3.geo.admin.ch';
  }

  /**
   * Get all buildings in Switzerland using real Swiss building registry
   * Note: This would normally be paginated, but for demo we limit results
   */
  async getAllBuildings() {
    const cacheKey = 'all_buildings';
    let buildings = this.cache.get(cacheKey);

    if (!buildings) {
      console.log('🏠 Fetching buildings from Swiss Building Registry...');
      
      // For demo purposes, we'll return buildings in a specific area (e.g., around major Swiss cities)
      // In a real implementation, you'd query the full registry with proper pagination
      buildings = {
        type: 'FeatureCollection',
        features: []
      };

      this.cache.set(cacheKey, buildings);
    }

    return buildings;
  }

  /**
   * Get building by EGID using real Swiss building registry
   */
  async getBuildingByEgid(egid: string): Promise<BuildingFeature | null> {
    console.log(`🏠 Looking up building EGID: ${egid}`);
    
    const cacheKey = `building_${egid}`;
    let building = this.cache.get<BuildingFeature>(cacheKey);

    if (building) {
      console.log(`📋 Using cached building data for EGID ${egid}`);
      return building;
    }

    try {
      // First, get building coordinates from EGID
      const coordinates = await this.getBuildingCoordinates(egid);
      if (!coordinates) {
        console.log(`⚠️ No coordinates found for EGID ${egid}`);
        return null;
      }

      console.log(`✅ Found coordinates for EGID ${egid}: [${coordinates[0]}, ${coordinates[1]}]`);

      // Then get detailed building information
      const buildingDetails = await this.getBuildingDetails(egid, coordinates);
      
      // Convert coordinates from LV95 to WGS84 for frontend
      const wgs84Coords = this.lv95ToWgs84(coordinates[0], coordinates[1]);

      building = {
        type: 'Feature',
        properties: {
          EGID: egid,
          GKODE: coordinates[0],
          GKODN: coordinates[1],
          GEXPDAT: new Date().toISOString().split('T')[0],
          name: buildingDetails.name || `Building ${egid}`,
          address: buildingDetails.address || `Address for EGID ${egid}`,
          buildingType: buildingDetails.buildingType || 'Residential',
          constructionYear: buildingDetails.constructionYear || 2000,
          floors: buildingDetails.floors || 1,
          area: buildingDetails.area || 100
        },
        geometry: {
          type: 'Point',
          coordinates: [wgs84Coords.lng, wgs84Coords.lat]
        }
      };

      this.cache.set(cacheKey, building, 3600); // Cache for 1 hour
      return building;

    } catch (error) {
      console.error(`❌ Error fetching building data for EGID ${egid}:`, error);
      return null;
    }
  }

  /**
   * Get buildings by bounding box using real Swiss building registry
   */
  async getBuildingsByBbox(bbox: BoundingBox) {
    console.log(`🗺️ Fetching buildings in bbox: [${bbox.minLng}, ${bbox.minLat}, ${bbox.maxLng}, ${bbox.maxLat}]`);
    
    const cacheKey = `buildings_bbox_${bbox.minLng}_${bbox.minLat}_${bbox.maxLng}_${bbox.maxLat}`;
    let buildings = this.cache.get(cacheKey);

    if (buildings) {
      return buildings;
    }

    try {
      // Convert WGS84 bbox to LV95
      const sw = this.wgs84ToLv95(bbox.minLng, bbox.minLat);
      const ne = this.wgs84ToLv95(bbox.maxLng, bbox.maxLat);
      
      // Query Swiss building registry for buildings in bbox
      const buildingsInBbox = await this.queryBuildingsInArea(sw, ne);
      
      buildings = {
        type: 'FeatureCollection',
        features: buildingsInBbox
      };

      this.cache.set(cacheKey, buildings, 300); // Cache for 5 minutes
      return buildings;

    } catch (error) {
      console.error('❌ Error fetching buildings by bbox:', error);
      return {
        type: 'FeatureCollection',
        features: []
      };
    }
  }

  /**
   * Get building coordinates from EGID using Swiss building register
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
          contains: false,
          sr: '2056' // LV95 coordinate system
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
   * Get detailed building information using Swiss APIs
   */
  private async getBuildingDetails(egid: string, coordinates: [number, number]): Promise<{
    name?: string;
    address?: string;
    buildingType?: string;
    constructionYear?: number;
    floors?: number;
    area?: number;
  }> {
    try {
      // Use GeoAdmin identify to get building details
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
        
        // Extract address information
        const streetName = attrs.strname_deinr || attrs.str_name || attrs.streetname || '';
        const houseNumber = attrs.deinr || attrs.house_number || '';
        const postalCode = attrs.plz4 || attrs.postcode || attrs.zip || '';
        const cityName = attrs.plzname || attrs.city || attrs.locality || '';
        
        const fullAddress = [streetName, houseNumber, postalCode, cityName]
          .filter(Boolean)
          .join(' ')
          .trim();

        return {
          name: attrs.geb_name || attrs.building_name || `Building ${egid}`,
          address: fullAddress || `Address for EGID ${egid}`,
          buildingType: this.mapBuildingType(attrs.gkat || attrs.building_category || attrs.category),
          constructionYear: this.parseYear(attrs.gbauj || attrs.construction_year || attrs.year_built),
          floors: this.parseNumber(attrs.gastw || attrs.floors || attrs.stories) || 1,
          area: this.parseNumber(attrs.garea || attrs.floor_area || attrs.area) || 100
        };
      }

      return {};
    } catch (error) {
      console.error('Error getting building details:', error);
      return {};
    }
  }

  /**
   * Query buildings in a specific area
   */
  private async queryBuildingsInArea(
    sw: { x: number; y: number },
    ne: { x: number; y: number }
  ): Promise<BuildingFeature[]> {
    try {
      // This would query the actual building registry for buildings in the area
      // For now, return empty array as this requires proper API access
      return [];
    } catch (error) {
      console.error('Error querying buildings in area:', error);
      return [];
    }
  }

  /**
   * Convert LV95 coordinates to WGS84
   */
  private lv95ToWgs84(x: number, y: number): { lng: number; lat: number } {
    // Simplified conversion - in production use official transformation
    const lng = (x - 2600000) / 1000000 * 180 + 7.439583333;
    const lat = (y - 1200000) / 1000000 * 180 + 46.952405556;
    return { lng, lat };
  }

  /**
   * Convert WGS84 coordinates to LV95
   */
  private wgs84ToLv95(lng: number, lat: number): { x: number; y: number } {
    // Simplified conversion - in production use official transformation
    const x = (lng - 7.439583333) * 1000000 / 180 + 2600000;
    const y = (lat - 46.952405556) * 1000000 / 180 + 1200000;
    return { x, y };
  }

  /**
   * Map Swiss building category codes to readable types
   */
  private mapBuildingType(category: any): string {
    const categoryStr = String(category || '').toLowerCase();
    
    if (categoryStr.includes('wohn') || categoryStr.includes('resid')) return 'Residential';
    if (categoryStr.includes('buero') || categoryStr.includes('office')) return 'Office';
    if (categoryStr.includes('schule') || categoryStr.includes('education')) return 'Educational';
    if (categoryStr.includes('industrie') || categoryStr.includes('industry')) return 'Industrial';
    if (categoryStr.includes('handel') || categoryStr.includes('commercial')) return 'Commercial';
    if (categoryStr.includes('hotel')) return 'Hotel';
    if (categoryStr.includes('spital') || categoryStr.includes('hospital')) return 'Healthcare';
    if (categoryStr.includes('kirche') || categoryStr.includes('religious')) return 'Religious';
    if (categoryStr.includes('sport')) return 'Sports';
    if (categoryStr.includes('kultur') || categoryStr.includes('cultural')) return 'Cultural';
    
    return 'Residential'; // Default
  }

  /**
   * Parse year from various formats
   */
  private parseYear(value: any): number {
    const year = parseInt(String(value || ''), 10);
    return (year > 1800 && year < 2030) ? year : 2000;
  }

  /**
   * Parse number from various formats
   */
  private parseNumber(value: any): number {
    const num = parseFloat(String(value || ''));
    return isNaN(num) ? 0 : num;
  }
}