import { useEffect, useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Icon,
  Spinner,
  Progress,
  Badge,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { 
  IconWind, 
  IconDroplet, 
  IconThermometer, 
  IconGauge,
  IconCloud
} from '@tabler/icons-react';
import { environmentService } from '../../services/api';

interface BuildingFeature {
  properties: {
    EGID: string;
    swissCoordinates?: [number, number] | null;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface EnvironmentTabProps {
  building: BuildingFeature;
}

interface EnvironmentData {
  airQuality: {
    NO2: number;
    PM10: number;
    PM25: number;
    O3: number;
    status: string;
  };
  weather: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
  };
}

export const EnvironmentTab = ({ building }: EnvironmentTabProps) => {
  const [data, setData] = useState<EnvironmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract coordinates correctly - geometry.coordinates should be [longitude, latitude] in WGS84
  const [lng, lat] = building.geometry.coordinates;

  // Debug coordinates being used
  console.log('🌍 EnvironmentTab coordinates debug:', {
    rawCoordinates: building.geometry.coordinates,
    extractedLng: lng,
    extractedLat: lat,
    expectedBernLng: 7.4474,
    expectedBernLat: 46.9481,
    swissCoordinates: building.properties.swissCoordinates
  });

  // Validate that coordinates are in expected WGS84 range for Switzerland
  const isValidWGS84 = (lat >= 45.8 && lat <= 47.9 && lng >= 5.9 && lng <= 10.6);
  
  if (!isValidWGS84) {
    console.error('❌ Invalid WGS84 coordinates for Switzerland:', { lat, lng });
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Debug: Log the coordinates we're working with
        console.log(`🌍 EnvironmentTab: Starting fetch with coordinates:`, {
          lat,
          lng,
          rawCoordinates: building.geometry.coordinates,
          isValidRange: lat >= 45.8 && lat <= 47.9 && lng >= 5.9 && lng <= 10.6,
          looksLikeWebMercator: Math.abs(lat) > 1000 || Math.abs(lng) > 1000
        });
        
        // Check if coordinates look like Web Mercator (large numbers)
        if (Math.abs(lat) > 1000 || Math.abs(lng) > 1000) {
          console.error('❌ Coordinates appear to be Web Mercator, not WGS84:', { lat, lng });
          setError('Coordinate conversion error - coordinates not in WGS84 format');
          setLoading(false);
          return;
        }
        
        // Check if coordinates are in valid WGS84 range for Switzerland
        if (lat < 45.8 || lat > 47.9 || lng < 5.9 || lng > 10.6) {
          console.warn(`⚠️ Coordinates outside Switzerland bounds:`, { lat, lng });
          setError('Location appears to be outside Switzerland');
          setLoading(false);
          return;
        }
        
        console.log(`🌍 Making environment API calls with coordinates: lat=${lat}, lng=${lng}`);
        
        const [airQualityResponse, weatherResponse] = await Promise.all([
          environmentService.getAirQuality(lat, lng),
          environmentService.getWeatherData(lat, lng)
        ]);

        setData({
          airQuality: airQualityResponse,
          weather: weatherResponse
        });
      } catch (err) {
        setError('Failed to load environment data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lat, lng]);

  const getAirQualityColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent': return 'green';
      case 'good': return 'blue';
      case 'moderate': return 'yellow';
      case 'poor': return 'orange';
      case 'very poor': return 'red';
      default: return 'gray';
    }
  };

  const getPollutantLevel = (value: number, pollutant: string) => {
    // Simplified EU air quality thresholds
    const thresholds = {
      NO2: [40, 90, 120], // µg/m³
      PM10: [20, 40, 50], // µg/m³
      PM25: [10, 20, 25], // µg/m³
      O3: [100, 140, 180] // µg/m³
    };

    const limits = thresholds[pollutant as keyof typeof thresholds] || [0, 0, 0];
    if (value <= limits[0]) return { level: 'Good', color: 'green' };
    if (value <= limits[1]) return { level: 'Moderate', color: 'yellow' };
    if (value <= limits[2]) return { level: 'Unhealthy', color: 'orange' };
    return { level: 'Very Unhealthy', color: 'red' };
  };

  if (loading) {
    return (
      <VStack spacing={4} py={8}>
        <Spinner size="lg" color="brand.500" />
        <Text>Loading environment data...</Text>
      </VStack>
    );
  }

  if (error || !data) {
    return (
      <VStack spacing={6} align="stretch">
        <Card>
          <CardBody>
            <VStack spacing={4} align="center" py={8}>
              <Icon as={IconWind} boxSize={16} color="gray.300" />
              <VStack spacing={2} textAlign="center">
                <Text fontSize="lg" fontWeight="semibold" color="gray.600">
                  Environment Data Unavailable
                </Text>
                <Text fontSize="sm" color="gray.500" maxW="md">
                  {error || 'Unable to load air quality and weather data for this location. This might be due to invalid coordinates or temporary service unavailability.'}
                </Text>
              </VStack>
              <Box
                bg="green.50"
                p={4}
                borderRadius="md"
                border="1px solid"
                borderColor="green.200"
                maxW="md"
              >
                <VStack spacing={2} align="start">
                  <Text fontSize="sm" fontWeight="medium" color="green.800">
                    🌍 About Swiss Environment Data
                  </Text>
                  <Text fontSize="xs" color="green.700">
                    Environmental data comes from NABEL (National Air Pollution Monitoring Network) and MeteoSwiss stations across Switzerland.
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Data Source Alert */}
      <Alert status="success" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>Real Environmental Data</AlertTitle>
          <AlertDescription fontSize="sm">
            Air quality data from NABEL (National Air Pollution Monitoring Network) and weather data from MeteoSwiss - Official Swiss environmental monitoring services.
          </AlertDescription>
        </Box>
      </Alert>

      {/* Air Quality Section */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="semibold" color="brand.600">
                Air Quality (NABEL Data)
              </Text>
              <Badge colorScheme={getAirQualityColor(data.airQuality.status)}>
                {data.airQuality.status.toUpperCase()}
              </Badge>
            </HStack>
            
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconCloud} boxSize={4} color="gray.500" />
                    <Text>NO₂</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data.airQuality.NO2.toFixed(1)}</StatNumber>
                <StatHelpText>
                  <Badge size="sm" colorScheme={getPollutantLevel(data.airQuality.NO2, 'NO2').color}>
                    {getPollutantLevel(data.airQuality.NO2, 'NO2').level}
                  </Badge>
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>PM10</StatLabel>
                <StatNumber>{data.airQuality.PM10.toFixed(1)}</StatNumber>
                <StatHelpText>
                  <Badge size="sm" colorScheme={getPollutantLevel(data.airQuality.PM10, 'PM10').color}>
                    {getPollutantLevel(data.airQuality.PM10, 'PM10').level}
                  </Badge>
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>PM2.5</StatLabel>
                <StatNumber>{data.airQuality.PM25.toFixed(1)}</StatNumber>
                <StatHelpText>
                  <Badge size="sm" colorScheme={getPollutantLevel(data.airQuality.PM25, 'PM25').color}>
                    {getPollutantLevel(data.airQuality.PM25, 'PM25').level}
                  </Badge>
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>O₃</StatLabel>
                <StatNumber>{data.airQuality.O3.toFixed(1)}</StatNumber>
                <StatHelpText>
                  <Badge size="sm" colorScheme={getPollutantLevel(data.airQuality.O3, 'O3').color}>
                    {getPollutantLevel(data.airQuality.O3, 'O3').level}
                  </Badge>
                </StatHelpText>
              </Stat>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      {/* Weather Section */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="semibold" color="brand.600">
              Weather Data (MeteoSwiss)
            </Text>
            
            <SimpleGrid columns={{ base: 2, md: 2 }} spacing={4}>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconThermometer} boxSize={4} color="red.400" />
                    <Text>Temperature</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data.weather.temperature.toFixed(1)}°C</StatNumber>
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconDroplet} boxSize={4} color="blue.400" />
                    <Text>Humidity</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data.weather.humidity.toFixed(0)}%</StatNumber>
                <Progress value={data.weather.humidity} colorScheme="blue" size="sm" mt={2} />
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconGauge} boxSize={4} color="purple.400" />
                    <Text>Pressure</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data.weather.pressure.toFixed(0)}</StatNumber>
                <StatHelpText>hPa</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconWind} boxSize={4} color="green.400" />
                    <Text>Wind Speed</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data.weather.windSpeed.toFixed(1)}</StatNumber>
                <StatHelpText>km/h</StatHelpText>
              </Stat>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};