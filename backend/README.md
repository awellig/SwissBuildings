# SwissBuildings Backend API

A modular Node.js backend service for Swiss building data integration, featuring real-time data from Swiss government APIs and intelligent solar potential estimation.

## Architecture Overview

### Core Services

#### 1. NABEL Air Quality Service (`nabelService.ts`)
- **Purpose**: Real-time air quality data from Swiss NABEL monitoring stations
- **Data Source**: Federal Office for the Environment (FOEN) - NABEL API
- **Features**: 
  - Caching with NodeCache (5-minute TTL)
  - Coordinate transformation (WGS84 ↔ LV95)
  - Multiple pollutant monitoring (NO2, O3, PM10, PM2.5)
  - Nearest station lookup

#### 2. MeteoSwiss Weather Service (`meteoSwissService.ts`)
- **Purpose**: Official Swiss weather data and forecasts
- **Data Source**: MeteoSwiss federal weather service
- **Features**:
  - Current conditions and forecasts
  - Temperature, humidity, precipitation, wind
  - Swiss coordinate system support
  - Weather station proximity matching

#### 3. Solar Services Architecture

**Main Solar Service** (`solarService.ts`)
- Orchestrates official data retrieval and estimation fallbacks
- Implements dependency injection pattern
- Handles service coordination and error management

**Swiss Sonnendach Service** (`sonnendachService.ts`)
- Official solar potential data from SFOE (Swiss Federal Office of Energy)
- Real roof suitability assessments
- Government-validated solar radiation data

**Swiss Solar Estimation Service** (`swissSolarEstimation.service.ts`)
- Comprehensive fallback when official data unavailable
- Swiss-specific solar algorithms using:
  - Regional irradiation models
  - Building type analysis
  - Economic viability calculations
  - Meteorological data integration

**Swiss Building Data Service** (`swissBuildingData.service.ts`)
- Building registry integration
- Floor area and characteristic extraction
- Swiss building code normalization

### TypeScript Interfaces (`interfaces/`)

**Solar Interface** (`solar.interface.ts`)
```typescript
interface SolarPotential {
  annualProduction: number;
  roofSuitability: string;
  economicViability: number;
  // Metadata for transparency
  isEstimated: boolean;
  estimationMethod?: string;
  dataSource: string;
}
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- TypeScript
- Swiss GeoAdmin API access

### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Required environment variables
PORT=3001
NODE_ENV=development

# Swiss API endpoints (configured automatically)
NABEL_API_URL=https://www.bafu.admin.ch/bafu/de/home/themen/luft/zustand/daten/...
METEOSWISS_API_URL=https://data.geo.admin.ch/ch.meteoschweiz...
SONNENDACH_API_URL=https://api3.geo.admin.ch/rest/services/api/MapServer/...
```

### Installation
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start development server
npm run dev

# Start production server
npm start
```

## API Endpoints

### Building Information
```
GET /api/building-info?lat={lat}&lng={lng}
```
Returns comprehensive building data including:
- Building ID (EGID)
- Construction details
- Floor area information
- Address and location data

### Environmental Data
```
GET /api/nabel-data?lat={lat}&lng={lng}
```
Air quality data from nearest NABEL station

```
GET /api/meteoswiss-data?lat={lat}&lng={lng}
```
Weather data from MeteoSwiss network

### Solar Potential
```
GET /api/solar-potential?lat={lat}&lng={lng}
```
Solar installation potential with automatic fallback:
1. Official Sonnendach data (if available)
2. Swiss solar estimation algorithm (fallback)

## Data Source Transparency

All services implement data source indicators:
- `dataSource`: Origin of the data (official API vs estimation)
- `isEstimated`: Boolean flag for estimated vs real data
- `estimationMethod`: Algorithm used for estimations

## Coordinate System Support

The backend automatically handles Swiss coordinate transformations:
- **Input**: WGS84 (lat/lng from frontend)
- **Internal**: LV95 (Swiss national grid)
- **APIs**: Various (WGS84, LV95, Web Mercator)

## Caching Strategy

- **NodeCache**: 5-minute TTL for real-time data
- **Memory-based**: Suitable for development/small-scale deployment
- **Logging**: Comprehensive cache hit/miss tracking

## Error Handling

### Graceful Degradation
1. **Primary**: Official Swiss government APIs
2. **Fallback**: Estimation algorithms
3. **Error**: Structured error responses with context

### Example Error Response
```json
{
  "error": "Service temporarily unavailable",
  "fallback": "Using estimation algorithm",
  "dataSource": "Swiss Solar Estimation v1.0",
  "isEstimated": true
}
```

## Development Guidelines

### Adding New Services
1. Create service file in `/services/`
2. Implement caching with NodeCache
3. Add TypeScript interfaces in `/interfaces/`
4. Include data source metadata
5. Add coordinate transformation if needed

### Service Pattern
```typescript
export class SwissService {
  private cache = new NodeCache({ stdTTL: 300 });
  
  async getData(coordinates: Coordinates): Promise<ServiceResponse> {
    // 1. Check cache
    // 2. Transform coordinates if needed
    // 3. Call external API
    // 4. Process and cache response
    // 5. Return with metadata
  }
}
```

## Testing

```bash
# Run tests
npm test

# Test specific service
npm test -- --grep "Solar Service"

# Integration tests
npm run test:integration
```

## Monitoring & Logging

- Structured logging with Winston
- Cache performance metrics
- API response time tracking
- Error rate monitoring

## Production Deployment

### Environment Scaling
- Set `NODE_ENV=production`
- Configure cache TTL based on data freshness requirements
- Implement rate limiting for external APIs
- Add health check endpoints

### Performance Optimization
- Enable gzip compression
- Implement request batching for multiple coordinates
- Add Redis for distributed caching (optional)

## Contributing

1. Follow TypeScript strict mode
2. Implement comprehensive error handling
3. Add data source transparency
4. Include unit tests for new services
5. Update this README for new features

## License

This project integrates with Swiss government open data APIs. Ensure compliance with their terms of service and data usage policies.