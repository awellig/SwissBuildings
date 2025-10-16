import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import route modules
import buildingRoutes from './routes/buildingRoutes';
import environmentRoutes from './routes/environmentRoutes';
import energyRoutes from './routes/energyRoutes';
import solarRoutes from './routes/solarRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/buildings', buildingRoutes);
app.use('/api/environment', environmentRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/solar', solarRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Swiss Buildings Explorer Backend`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('🇨🇭 Swiss Open Data Integration:');
  console.log('  ✅ NABEL Air Quality Monitoring');
  console.log('  ✅ MeteoSwiss Weather Data'); 
  console.log('  ✅ SFOE Sonnendach Solar Potential');
  console.log('  ✅ Federal Building Registry');
  console.log('');
});