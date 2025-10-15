import axios from 'axios';
import NodeCache from 'node-cache';

interface AirQualityData {
  NO2: number;
  PM10: number;
  PM25: number;
  O3: number;
  timestamp: string;
  status: string;
  station?: string;
  distance?: number;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  timestamp: string;
  station?: string;
}

interface NABELStation {
  name: string;
  lat: number;
  lng: number;
  measurements: any;
}

interface MeteoStation {
  name: string;
  lat: number;
  lng: number;
  data: any;
}

export class EnvironmentService {
  private cache: NodeCache;
  private geoAdminApiUrl: string;
  
  constructor() {
    // Cache for 30 minutes for air quality, 1 hour for weather
    this.cache = new NodeCache({ stdTTL: 1800 });
    this.geoAdminApiUrl = process.env.GEOADMIN_API_BASE_URL || 'https://api3.geo.admin.ch';
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Find the nearest NABEL air quality monitoring station
   */
  private async findNearestNABELStation(lat: number, lng: number): Promise<NABELStation | null> {
    try {
      const cacheKey = `nabel_stations`;
      let stations = this.cache.get<NABELStation[]>(cacheKey);
      
      if (!stations) {
        // Fetch NABEL stations using Swiss GeoAdmin API
        const response = await axios.get(
          `${this.geoAdminApiUrl}/rest/services/api/MapServer/ch.bafu.nabelstationen`,
          { timeout: 10000 }
        );
        
        // Get actual station data (this is a simplified example)
        // In reality, you'd need to parse the complex NABEL data structure
        stations = [
          { name: 'Bern-Bollwerk', lat: 46.9489, lng: 7.4396, measurements: {} },
          { name: 'Zürich-Kaserne', lat: 47.3768, lng: 8.5417, measurements: {} },
          { name: 'Basel-Binningen', lat: 47.5404, lng: 7.5825, measurements: {} },
          { name: 'Lugano', lat: 46.0037, lng: 8.9511, measurements: {} },
          { name: 'Tänikon', lat: 47.4825, lng: 8.9046, measurements: {} },
          { name: 'Payerne', lat: 46.8131, lng: 6.9447, measurements: {} }
        ];
        
        this.cache.set(cacheKey, stations, 3600); // Cache for 1 hour
      }
      
      // Find nearest station
      let nearestStation: NABELStation | null = null;
      let minDistance = Infinity;
      
      for (const station of stations) {
        const distance = this.calculateDistance(lat, lng, station.lat, station.lng);
        if (distance < minDistance) {
          minDistance = distance;
          nearestStation = { ...station, measurements: { distance: minDistance } };
        }
      }
      
      return nearestStation;
    } catch (error) {
      console.error('Error finding NABEL station:', error);
      return null;
    }
  }

  async getAirQuality(lat: number, lng: number): Promise<AirQualityData> {
    try {
      const cacheKey = `air_quality_${lat}_${lng}`;
      let cachedData = this.cache.get<AirQualityData>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      // Find nearest NABEL station
      const station = await this.findNearestNABELStation(lat, lng);
      
      if (station) {
        // In a real implementation, you would fetch actual NABEL data here
        // For now, we simulate realistic data based on Swiss air quality standards
        const data: AirQualityData = {
          NO2: Math.random() * 40 + 15, // µg/m³ (Swiss limit: 30 µg/m³ annual mean)
          PM10: Math.random() * 25 + 10, // µg/m³ (Swiss limit: 20 µg/m³ annual mean)
          PM25: Math.random() * 15 + 8, // µg/m³ (Swiss limit: 10 µg/m³ annual mean)
          O3: Math.random() * 80 + 40, // µg/m³ (Swiss limit: 100 µg/m³ daily max)
          timestamp: new Date().toISOString(),
          status: 'good',
          station: station.name,
          distance: station.measurements?.distance || 0
        };
        
        // Determine air quality status based on Swiss standards
        if (data.PM25 > 15 || data.PM10 > 30 || data.NO2 > 40) {
          data.status = 'moderate';
        }
        if (data.PM25 > 25 || data.PM10 > 50 || data.NO2 > 80) {
          data.status = 'poor';
        }
        
        this.cache.set(cacheKey, data, 1800); // Cache for 30 minutes
        return data;
      } else {
        // Fallback to simulated data if no station found
        const fallbackData: AirQualityData = {
          NO2: Math.random() * 30 + 10,
          PM10: Math.random() * 20 + 5,
          PM25: Math.random() * 12 + 3,
          O3: Math.random() * 60 + 30,
          timestamp: new Date().toISOString(),
          status: 'good'
        };
        
        this.cache.set(cacheKey, fallbackData, 1800);
        return fallbackData;
      }
    } catch (error) {
      console.error('Error fetching air quality data:', error);
      throw new Error('Failed to fetch air quality data');
    }
  }

  /**
   * Find the nearest MeteoSwiss weather station
   */
  private async findNearestMeteoStation(lat: number, lng: number): Promise<MeteoStation | null> {
    try {
      const cacheKey = `meteo_stations`;
      let stations = this.cache.get<MeteoStation[]>(cacheKey);
      
      if (!stations) {
        // Major MeteoSwiss stations across Switzerland
        stations = [
          { name: 'Zürich/Flughafen', lat: 47.4647, lng: 8.5492, data: {} },
          { name: 'Basel/Binningen', lat: 47.5404, lng: 7.5825, data: {} },
          { name: 'Bern/Zollikofen', lat: 46.9911, lng: 7.4665, data: {} },
          { name: 'Genève-Cointrin', lat: 46.2381, lng: 6.1090, data: {} },
          { name: 'Lugano', lat: 46.0037, lng: 8.9606, data: {} },
          { name: 'Sion', lat: 46.2192, lng: 7.3266, data: {} },
          { name: 'St. Gallen', lat: 47.4275, lng: 9.3987, data: {} },
          { name: 'Chur', lat: 46.8774, lng: 9.5215, data: {} },
          { name: 'Davos', lat: 46.8133, lng: 9.8434, data: {} },
          { name: 'Engelberg', lat: 46.8203, lng: 8.4073, data: {} }
        ];
        
        this.cache.set(cacheKey, stations, 3600); // Cache for 1 hour
      }
      
      // Find nearest station
      let nearestStation: MeteoStation | null = null;
      let minDistance = Infinity;
      
      for (const station of stations) {
        const distance = this.calculateDistance(lat, lng, station.lat, station.lng);
        if (distance < minDistance) {
          minDistance = distance;
          nearestStation = { ...station, data: { distance: minDistance } };
        }
      }
      
      return nearestStation;
    } catch (error) {
      console.error('Error finding MeteoSwiss station:', error);
      return null;
    }
  }

  async getWeatherData(lat: number, lng: number): Promise<WeatherData> {
    try {
      const cacheKey = `weather_${lat}_${lng}`;
      let cachedData = this.cache.get<WeatherData>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      // Find nearest MeteoSwiss station
      const station = await this.findNearestMeteoStation(lat, lng);
      
      if (station) {
        // In a real implementation, you would use MeteoSwiss STAC API
        // https://data.geo.admin.ch/api/stac/v0.9/collections/ch.meteoschweiz.messwerte-aktuell
        
        // Simulate realistic Swiss weather data based on season and location
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const isWinter = month < 4 || month > 10;
        const isSummer = month >= 6 && month <= 8;
        
        // Adjust temperature based on elevation (simplified)
        const elevationFactor = Math.max(0, (1000 - 400) / 1000); // Assume 400m average elevation
        let baseTemp = isWinter ? 2 : (isSummer ? 22 : 12);
        baseTemp -= elevationFactor * 6; // -6°C per 1000m
        
        const data: WeatherData = {
          temperature: baseTemp + (Math.random() * 10 - 5), // ±5°C variation
          humidity: Math.random() * 30 + (isWinter ? 70 : 50), // 50-80% in winter, 50-80% summer
          pressure: Math.random() * 30 + 1000, // 1000-1030 hPa
          windSpeed: Math.random() * 15 + 3, // 3-18 km/h
          windDirection: Math.random() * 360, // 0-360 degrees
          timestamp: new Date().toISOString(),
          station: station.name
        };
        
        this.cache.set(cacheKey, data, 3600); // Cache for 1 hour
        return data;
      } else {
        // Fallback to simulated data
        const fallbackData: WeatherData = {
          temperature: Math.random() * 20 + 10,
          humidity: Math.random() * 30 + 50,
          pressure: Math.random() * 40 + 1000,
          windSpeed: Math.random() * 12 + 2,
          windDirection: Math.random() * 360,
          timestamp: new Date().toISOString()
        };
        
        this.cache.set(cacheKey, fallbackData, 3600);
        return fallbackData;
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw new Error('Failed to fetch weather data');
    }
  }
}