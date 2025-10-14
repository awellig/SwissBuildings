import axios from 'axios';

interface AirQualityData {
  NO2: number;
  PM10: number;
  PM25: number;
  O3: number;
  timestamp: string;
  status: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  timestamp: string;
}

export class EnvironmentService {
  
  async getAirQuality(lat: number, lng: number): Promise<AirQualityData> {
    try {
      // For demo purposes, we'll simulate NABEL data
      // In real implementation, fetch from https://data.geo.admin.ch/ch.bafu.nabel/
      return {
        NO2: Math.random() * 50 + 10, // µg/m³
        PM10: Math.random() * 30 + 5, // µg/m³
        PM25: Math.random() * 20 + 3, // µg/m³
        O3: Math.random() * 100 + 20, // µg/m³
        timestamp: new Date().toISOString(),
        status: 'good'
      };
    } catch (error) {
      console.error('Error fetching air quality data:', error);
      throw new Error('Failed to fetch air quality data');
    }
  }

  async getWeatherData(lat: number, lng: number): Promise<WeatherData> {
    try {
      // For demo purposes, we'll simulate MeteoSwiss data
      // In real implementation, use MeteoSwiss STAC API
      return {
        temperature: Math.random() * 25 + 5, // °C
        humidity: Math.random() * 40 + 40, // %
        pressure: Math.random() * 50 + 950, // hPa
        windSpeed: Math.random() * 15 + 2, // km/h
        windDirection: Math.random() * 360, // degrees
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw new Error('Failed to fetch weather data');
    }
  }
}