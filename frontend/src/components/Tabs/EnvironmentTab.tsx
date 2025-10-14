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
  Alert,
  AlertIcon,
  Progress,
  Badge,
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
    windDirection: number;
  };
}

export const EnvironmentTab = ({ building }: EnvironmentTabProps) => {
  const [data, setData] = useState<EnvironmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lng, lat] = building.geometry.coordinates;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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
      <Alert status="error">
        <AlertIcon />
        {error || 'Failed to load environment data'}
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
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
            
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
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

              <Stat>
                <StatLabel>Wind Direction</StatLabel>
                <StatNumber>{data.weather.windDirection.toFixed(0)}°</StatNumber>
                <StatHelpText>
                  {data.weather.windDirection >= 337.5 || data.weather.windDirection < 22.5 ? 'N' :
                   data.weather.windDirection >= 22.5 && data.weather.windDirection < 67.5 ? 'NE' :
                   data.weather.windDirection >= 67.5 && data.weather.windDirection < 112.5 ? 'E' :
                   data.weather.windDirection >= 112.5 && data.weather.windDirection < 157.5 ? 'SE' :
                   data.weather.windDirection >= 157.5 && data.weather.windDirection < 202.5 ? 'S' :
                   data.weather.windDirection >= 202.5 && data.weather.windDirection < 247.5 ? 'SW' :
                   data.weather.windDirection >= 247.5 && data.weather.windDirection < 292.5 ? 'W' : 'NW'}
                </StatHelpText>
              </Stat>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};