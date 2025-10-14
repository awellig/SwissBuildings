import NodeCache from 'node-cache';

// Sample Swiss building data (GeoJSON format) with real-world EGIDs
const SAMPLE_BUILDINGS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        EGID: '190589206',
        GKODE: 2600000,
        GKODN: 1199000,
        GEXPDAT: '2023-01-01',
        name: 'Federal Palace of Switzerland',
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
        EGID: '190589207',
        GKODE: 2683000,
        GKODN: 1247000,
        GEXPDAT: '2023-01-01',
        name: 'Capgemini Switzerland Office',
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
        EGID: '190589208',
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
    },
    {
      type: 'Feature',
      properties: {
        EGID: '190589209',
        GKODE: 2532000,
        GKODN: 1152000,
        GEXPDAT: '2023-01-01',
        name: 'CERN Main Building',
        address: 'Route de Meyrin, 1211 Geneva',
        buildingType: 'Research',
        constructionYear: 1954,
        floors: 3,
        area: 8000
      },
      geometry: {
        type: 'Point',
        coordinates: [6.0515, 46.2333] // Geneva/CERN coordinates
      }
    },
    {
      type: 'Feature',
      properties: {
        EGID: '190589210',
        GKODE: 2485000,
        GKODN: 1109000,
        GEXPDAT: '2023-01-01',
        name: 'Rolex Learning Center',
        address: 'Station 20, 1015 Lausanne',
        buildingType: 'Educational',
        constructionYear: 2010,
        floors: 2,
        area: 20000
      },
      geometry: {
        type: 'Point',
        coordinates: [6.5668, 46.5187] // Lausanne coordinates
      }
    }
  ]
};

interface BoundingBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export class BuildingService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({ stdTTL: 600 }); // 10 minutes cache
  }

  async getAllBuildings() {
    const cacheKey = 'all_buildings';
    let buildings = this.cache.get(cacheKey);

    if (!buildings) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      buildings = SAMPLE_BUILDINGS;
      this.cache.set(cacheKey, buildings);
    }

    return buildings;
  }

  async getBuildingByEgid(egid: string) {
    const buildings = await this.getAllBuildings() as any;
    const building = buildings.features.find((building: any) => building.properties.EGID === egid);
    
    if (building) {
      return building;
    }
    
    // If not found in our sample data, create a placeholder with the EGID
    // In a real application, this would query the actual swissBUILDINGS3D API
    return {
      type: 'Feature',
      properties: {
        EGID: egid,
        GKODE: 0,
        GKODN: 0,
        GEXPDAT: new Date().toISOString().split('T')[0],
        name: `Building ${egid}`,
        address: 'Address lookup in progress...',
        buildingType: 'Unknown',
        constructionYear: 2000,
        floors: 1,
        area: 100
      },
      geometry: {
        type: 'Point',
        coordinates: [8.0, 47.0] // Default Swiss coordinates
      }
    };
  }

  async getBuildingsByBbox(bbox: BoundingBox) {
    const buildings = await this.getAllBuildings() as any;
    
    const filteredBuildings = buildings.features.filter((building: any) => {
      const [lng, lat] = building.geometry.coordinates;
      return lng >= bbox.minLng && lng <= bbox.maxLng && 
             lat >= bbox.minLat && lat <= bbox.maxLat;
    });

    return {
      ...buildings,
      features: filteredBuildings
    };
  }
}