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
    console.log(`🌬️  NABEL Air Quality Request - Coordinates: ${lat}, ${lng}`);
    
    // Validate coordinates are reasonable (less strict validation)
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      console.warn(`⚠️  Coordinates outside world bounds: lat=${lat}, lng=${lng}`);
      console.warn(`📍 These look like Web Mercator coordinates, not WGS84`);
    }
    
    // Warn but don't block if outside Switzerland
    if (lat < 45.8 || lat > 47.9 || lng < 5.9 || lng > 10.6) {
      console.warn(`⚠️  Coordinates outside Switzerland bounds: lat=${lat}, lng=${lng}`);
      console.warn(`📍 Expected Swiss coordinates: lat ≈ 46.9, lng ≈ 7.4 for Bern`);
      console.warn(`🔧 Will proceed but results may be inaccurate`);
    }
    
    try {
      const cacheKey = `air_quality_${lat}_${lng}`;
      let cachedData = this.cache.get<AirQualityData>(cacheKey);
      
      if (cachedData) {
        console.log(`📋 Using cached air quality data for ${lat}, ${lng}:`, {
          station: cachedData.station,
          NO2: cachedData.NO2,
          PM25: cachedData.PM25,
          status: cachedData.status
        });
        return cachedData;
      }

      console.log(`🔍 Finding nearest NABEL station for coordinates ${lat}, ${lng}...`);
      
      // Find nearest NABEL station
      const station = await this.findNearestNABELStation(lat, lng);
      
      if (station) {
        console.log(`✅ Found nearest NABEL station: ${station.name} (distance: ${station.measurements?.distance?.toFixed(2)}km)`);
        
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
        
        console.log(`📊 NABEL Air Quality Data Generated:`, {
          station: data.station,
          distance: `${data.distance?.toFixed(2)}km`,
          NO2: `${data.NO2.toFixed(1)} µg/m³`,
          PM10: `${data.PM10.toFixed(1)} µg/m³`,
          PM25: `${data.PM25.toFixed(1)} µg/m³`,
          O3: `${data.O3.toFixed(1)} µg/m³`,
          status: data.status,
          timestamp: data.timestamp
        });
        
        this.cache.set(cacheKey, data, 1800); // Cache for 30 minutes
        return data;
      } else {
        console.log(`⚠️  No NABEL station found, using fallback data for ${lat}, ${lng}`);
        
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
    console.log(`🌤️  MeteoSwiss Weather Request - Coordinates: ${lat}, ${lng}`);
    
    // Validate coordinates are reasonable (less strict validation)
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      console.warn(`⚠️  Coordinates outside world bounds: lat=${lat}, lng=${lng}`);
      console.warn(`📍 These look like Web Mercator coordinates, not WGS84`);
    }
    
    // Warn but don't block if outside Switzerland
    if (lat < 45.8 || lat > 47.9 || lng < 5.9 || lng > 10.6) {
      console.warn(`⚠️  Coordinates outside Switzerland bounds: lat=${lat}, lng=${lng}`);
      console.warn(`📍 Expected Swiss coordinates: lat ≈ 46.9, lng ≈ 7.4 for Bern`);
      console.warn(`🔧 Will proceed but results may be inaccurate`);
    }
    
    try {
      const cacheKey = `weather_${lat}_${lng}`;
      let cachedData = this.cache.get<WeatherData>(cacheKey);
      
      if (cachedData) {
        console.log(`📋 Using cached weather data for ${lat}, ${lng}:`, {
          station: cachedData.station,
          temperature: `${cachedData.temperature.toFixed(1)}°C`,
          humidity: `${cachedData.humidity.toFixed(0)}%`,
          timestamp: cachedData.timestamp
        });
        return cachedData;
      }

      console.log(`🔍 Finding nearest MeteoSwiss station for coordinates ${lat}, ${lng}...`);

      // Find nearest MeteoSwiss station
      const station = await this.findNearestMeteoStation(lat, lng);
      
      if (station) {
        console.log(`✅ Found nearest MeteoSwiss station: ${station.name} (distance: ${station.data?.distance?.toFixed(2)}km)`);
        
        // In a real implementation, you would use MeteoSwiss STAC API
        // https://data.geo.admin.ch/api/stac/v0.9/collections/ch.meteoschweiz.messwerte-aktuell
        
        // Generate realistic Swiss weather data based on season and location
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12 (October = 10)
        const isWinter = month >= 11 || month <= 3; // Nov-Mar
        const isSummer = month >= 6 && month <= 8; // Jun-Aug
        const isAutumn = month >= 9 && month <= 11; // Sep-Nov
        
        console.log(`📅 Current season analysis: Month ${month}, isWinter: ${isWinter}, isSummer: ${isSummer}, isAutumn: ${isAutumn}`);
        
        // Base temperature for different seasons (°C)
        let baseTemp: number;
        if (isWinter) {
          baseTemp = 3; // Winter base temp
        } else if (isSummer) {
          baseTemp = 22; // Summer base temp
        } else if (isAutumn) {
          baseTemp = 15; // Autumn - nice sunny October day
        } else {
          baseTemp = 12; // Spring
        }
        
        // For sunny conditions, add 3-5°C
        const sunnyBonus = 4; // Sunny day bonus
        baseTemp += sunnyBonus;
        
        // Slight elevation adjustment (Swiss plateau ~400-600m)
        const elevationAdjustment = -1; // Small adjustment for elevation
        
        // Final temperature with some variation
        const finalTemp = baseTemp + elevationAdjustment + (Math.random() * 4 - 2); // ±2°C variation
        
        const data: WeatherData = {
          temperature: finalTemp,
          humidity: Math.random() * 20 + (isWinter ? 70 : 50), // 50-70% variation
          pressure: Math.random() * 20 + 1015, // 1015-1035 hPa (typical for fair weather)
          windSpeed: Math.random() * 10 + 2, // 2-12 km/h (light winds for sunny day)
          windDirection: Math.random() * 360, // 0-360 degrees
          timestamp: new Date().toISOString(),
          station: station.name
        };
        
        console.log(`🌡️  MeteoSwiss Weather Data Generated:`, {
          station: data.station,
          distance: `${station.data?.distance?.toFixed(2)}km`,
          temperature: `${data.temperature.toFixed(1)}°C`,
          humidity: `${data.humidity.toFixed(0)}%`,
          pressure: `${data.pressure.toFixed(1)} hPa`,
          windSpeed: `${data.windSpeed.toFixed(1)} km/h`,
          conditions: 'Sunny October day',
          timestamp: data.timestamp
        });
        
        this.cache.set(cacheKey, data, 3600); // Cache for 1 hour
        return data;
      } else {
        console.log(`⚠️  No MeteoSwiss station found, using fallback data for ${lat}, ${lng}`);
        
        // Fallback to realistic sunny October data
        const fallbackData: WeatherData = {
          temperature: 16 + (Math.random() * 4 - 2), // 14-18°C for sunny October
          humidity: Math.random() * 20 + 45, // 45-65%
          pressure: Math.random() * 15 + 1020, // 1020-1035 hPa
          windSpeed: Math.random() * 8 + 3, // 3-11 km/h
          windDirection: Math.random() * 360,
          timestamp: new Date().toISOString()
        };
        
        console.log(`📊 Fallback Weather Data:`, {
          temperature: `${fallbackData.temperature.toFixed(1)}°C`,
          humidity: `${fallbackData.humidity.toFixed(0)}%`,
          conditions: 'Sunny October fallback'
        });
        
        this.cache.set(cacheKey, fallbackData, 3600);
        return fallbackData;
      }
    } catch (error) {
      console.error('❌ Error fetching weather data:', error);
      throw new Error('Failed to fetch weather data');
    }
  }
}