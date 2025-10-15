import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

// Building API
export const buildingService = {
  getAllBuildings: async () => {
    const response = await axios.get(`${API_BASE_URL}/buildings`);
    return response.data;
  },

  getBuildingByEgid: async (egid: string) => {
    const response = await axios.get(`${API_BASE_URL}/buildings/${egid}`);
    return response.data;
  },

  getBuildingsByBbox: async (bbox: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  }) => {
    const bboxString = `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`;
    const response = await axios.get(`${API_BASE_URL}/buildings/bbox/${bboxString}`);
    return response.data;
  }
};

// Environment API
export const environmentService = {
  getAirQuality: async (lat: number, lng: number) => {
    const response = await axios.get(`${API_BASE_URL}/environment/air-quality/${lat},${lng}`);
    return response.data;
  },

  getWeatherData: async (lat: number, lng: number) => {
    const response = await axios.get(`${API_BASE_URL}/environment/weather/${lat},${lng}`);
    return response.data;
  }
};

// Energy API
export const energyService = {
  getEnergyConsumption: async (egid: string) => {
    const response = await axios.get(`${API_BASE_URL}/energy/consumption/${egid}`);
    return response.data;
  },

  getEnergyBreakdown: async (egid: string) => {
    const response = await axios.get(`${API_BASE_URL}/energy/breakdown/${egid}`);
    return response.data;
  }
};

// Solar API
export const solarService = {
  getSolarPotential: async (egid: string) => {
    const response = await axios.get(`${API_BASE_URL}/solar/potential/${egid}`);
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