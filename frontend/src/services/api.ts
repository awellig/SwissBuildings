import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Building API
export const buildingService = {
  getAllBuildings: async () => {
    const response = await apiClient.get('/buildings');
    return response.data;
  },

  getBuildingByEgid: async (egid: string) => {
    const response = await apiClient.get(`/buildings/${egid}`);
    return response.data;
  },

  getBuildingsByBbox: async (bbox: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  }) => {
    const bboxString = `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`;
    const response = await apiClient.get(`/buildings/bbox/${bboxString}`);
    return response.data;
  }
};

// Environment API
export const environmentService = {
  getAirQuality: async (lat: number, lng: number) => {
    const response = await apiClient.get(`/environment/air-quality/${lat},${lng}`);
    return response.data;
  },

  getWeatherData: async (lat: number, lng: number) => {
    const response = await apiClient.get(`/environment/weather/${lat},${lng}`);
    return response.data;
  }
};

// Energy API
export const energyService = {
  getEnergyConsumption: async (egid: string) => {
    const response = await apiClient.get(`/energy/consumption/${egid}`);
    return response.data;
  },

  getEnergyBreakdown: async (egid: string) => {
    const response = await apiClient.get(`/energy/breakdown/${egid}`);
    return response.data;
  }
};

// Solar API
export const solarService = {
  getSolarPotential: async (egid: string) => {
    const response = await apiClient.get(`/solar/potential/${egid}`);
    return response.data;
  }
};

// Indoor API (simulated for demo)
export const indoorService = {
  getIndoorData: async (_egid: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      temperature: Math.random() * 8 + 18, // 18-26°C
      humidity: Math.random() * 20 + 40, // 40-60%
      co2: Math.random() * 600 + 400, // 400-1000 ppm
      occupancy: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      airQualityIndex: Math.random() * 40 + 60, // 60-100
      lastUpdated: new Date().toISOString()
    };
  }
};