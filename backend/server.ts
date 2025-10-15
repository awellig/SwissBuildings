import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Sample building data
const SAMPLE_BUILDINGS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        EGID: '123456789',
        GKODE: 2685000,
        GKODN: 1249000,
        GEXPDAT: '2023-01-01',
        name: 'Capgemini Office Building',
        address: 'Baarerstrasse 10, 6300 Zug',
        buildingType: 'Office',
        constructionYear: 2018,
        floors: 8,
        area: 2500
      },
      geometry: {
        type: 'Point',
        coordinates: [8.5151, 47.1712] // Zug coordinates
      }
    },
    {
      type: 'Feature',
      properties: {
        EGID: '987654321',
        GKODE: 2683000,
        GKODN: 1247000,
        GEXPDAT: '2023-01-01',
        name: 'Swiss Parliament Building',
        address: 'Bundesplatz 3, 3003 Bern',
        buildingType: 'Government',
        constructionYear: 1902,
        floors: 4,
        area: 15000
      },
      geometry: {
        type: 'Point',
        coordinates: [7.4445, 46.9466] // Bern coordinates
      }
    },
    {
      type: 'Feature',
      properties: {
        EGID: '456789123',
        GKODE: 2679000,
        GKODN: 1245000,
        GEXPDAT: '2023-01-01',
        name: 'ETH Zurich Main Building',
        address: 'Rämistrasse 101, 8092 Zürich',
        buildingType: 'Educational',
        constructionYear: 1864,
        floors: 5,
        area: 25000
      },
      geometry: {
        type: 'Point',
        coordinates: [8.5478, 47.3769] // Zurich coordinates
      }
    }
  ]
};

// Building routes
app.get('/api/buildings', (req, res) => {
  res.json(SAMPLE_BUILDINGS);
});

app.get('/api/buildings/:egid', (req, res) => {
  const { egid } = req.params;
  const building = SAMPLE_BUILDINGS.features.find(
    (b: any) => b.properties.EGID === egid
  );
  
  if (building) {
    res.json(building);
  } else {
    res.status(404).json({ error: 'Building not found' });
  }
});

// Environment routes
app.get('/api/environment/air-quality/:location', (req, res) => {
  res.json({
    NO2: Math.random() * 50 + 10,
    PM10: Math.random() * 30 + 5,
    PM25: Math.random() * 20 + 3,
    O3: Math.random() * 100 + 20,
    timestamp: new Date().toISOString(),
    status: 'good'
  });
});

app.get('/api/environment/weather/:location', (req, res) => {
  res.json({
    temperature: Math.random() * 25 + 5,
    humidity: Math.random() * 40 + 40,
    pressure: Math.random() * 50 + 950,
    windSpeed: Math.random() * 15 + 2,
    windDirection: Math.random() * 360,
    timestamp: new Date().toISOString()
  });
});

// Energy routes
app.get('/api/energy/consumption/:egid', (req, res) => {
  const baseConsumption = Math.random() * 2000 + 500;
  res.json({
    totalKwh: baseConsumption,
    dailyAverage: baseConsumption / 30,
    monthlyTrend: Array.from({ length: 12 }, () => Math.random() * 300 + 100),
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/energy/breakdown/:egid', (req, res) => {
  const lighting = Math.random() * 500 + 100;
  const hvac = Math.random() * 800 + 200;
  const appliances = Math.random() * 400 + 150;
  const heating = Math.random() * 600 + 100;
  const cooling = Math.random() * 300 + 50;
  const other = Math.random() * 200 + 50;
  
  res.json({
    lighting,
    hvac,
    appliances,
    heating,
    cooling,
    other,
    total: lighting + hvac + appliances + heating + cooling + other
  });
});

// Solar routes
app.get('/api/solar/potential/:egid', (req, res) => {
  const roofArea = Math.random() * 500 + 100;
  const suitablePercentage = Math.random() * 0.4 + 0.4;
  const suitableArea = roofArea * suitablePercentage;
  const potentialKwp = suitableArea * 0.15;
  const irradiation = Math.random() * 300 + 900;
  const annualProduction = potentialKwp * irradiation;
  const co2Savings = annualProduction * 0.4;
  
  let economicViability: string;
  if (irradiation > 1100) economicViability = 'excellent';
  else if (irradiation > 1000) economicViability = 'good';
  else if (irradiation > 950) economicViability = 'moderate';
  else economicViability = 'poor';

  res.json({
    roofArea,
    suitableArea,
    potentialKwp,
    annualProduction,
    co2Savings,
    economicViability,
    irradiation
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Swiss Buildings API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🏢 Buildings API: http://localhost:${PORT}/api/buildings`);
});