# Swiss Buildings Explorer

A professional React application for visualizing Swiss buildings with 3D mapping capabilities, built with Capgemini branding.

## Architecture

- **Frontend**: React + TypeScript + Chakra UI + Vite
- **Backend**: Node.js + Express + TypeScript
- **3D Map**: swisstopo map.geo.admin.ch integration
- **Data Sources**: swissBUILDINGS3D, NABEL, MeteoSwiss, SFOE

## Project Structure

```
SwissBuildings/
├── frontend/          # React frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Node.js backend API
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── package.json
│   └── server.ts
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Development

1. **Install dependencies for both projects:**
   ```bash
   npm run install:all
   ```

2. **Start both frontend and backend:**
   ```bash
   npm run dev
   ```

3. **Or start individually:**
   ```bash
   # Backend only (port 5001)
   npm run dev:backend
   
   # Frontend only (port 3000)
   npm run dev:frontend
   ```

### Production Build

```bash
npm run build
```

## Features

### 🗺️ Interactive 3D Building Visualization
- **swisstopo Integration**: Official Swiss 3D map viewer
- **Building Selection**: Click any building to get EGID and detailed info
- **2D/3D Toggle**: Seamless switching between map views

### 🏢 Building Analytics (5 Data Categories)
1. **General Info**: Construction details, address, EGID
2. **Environment**: NABEL air quality + MeteoSwiss weather
3. **Indoor**: IoT sensor data (temperature, humidity, CO₂)
4. **Energy**: NILM consumption analysis + breakdown
5. **Solar**: SFOE Sonnendach potential assessment

### 🎨 Professional UI/UX
- **Capgemini Branding**: Corporate colors and styling
- **Responsive Design**: Mobile-first approach
- **Accessible**: WCAG compliant interface
- **Real-time Data**: Live environmental and energy metrics

## API Endpoints

### Buildings
- `GET /api/buildings` - All buildings (GeoJSON)
- `GET /api/buildings/:egid` - Specific building by EGID

### Environment
- `GET /api/environment/air-quality/:location` - NABEL air quality
- `GET /api/environment/weather/:location` - MeteoSwiss weather

### Energy
- `GET /api/energy/consumption/:egid` - Building energy consumption
- `GET /api/energy/breakdown/:egid` - NILM appliance breakdown

### Solar
- `GET /api/solar/potential/:egid` - SFOE solar potential

## Data Sources & Integration

### Swiss Government APIs
- **swissBUILDINGS3D 3.0 beta**: Building geometry and metadata
- **NABEL**: Real-time air quality monitoring
- **MeteoSwiss STAC API**: Weather and climate data
- **SFOE Sonnendach**: Solar roof potential mapping

### Simulated Data
- **Indoor IoT**: Temperature, humidity, CO₂, occupancy
- **NILM Energy**: Smart meter disaggregation simulation

## Technology Stack

### Frontend
- React 18 + TypeScript
- Chakra UI component library
- React Leaflet (2D maps)
- swisstopo 3D viewer integration
- Vite build tool
- Axios HTTP client

### Backend  
- Node.js + Express
- TypeScript
- CORS enabled
- RESTful API design
- Sample data simulation

## Development

### Code Structure
- **Modular Components**: Reusable UI components
- **Service Layer**: Clean API abstraction
- **Custom Hooks**: Shared state logic
- **TypeScript**: Full type safety
- **Error Boundaries**: Graceful error handling

### Environment Configuration
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5001`
- API Base: `http://localhost:5001/api`

## License

© 2024 Capgemini - Professional Building Analytics Platform