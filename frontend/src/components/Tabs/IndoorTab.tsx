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
  Box,
} from '@chakra-ui/react';
import { 
  IconThermometer, 
  IconDroplet, 
  IconUsers,
  IconChartLine,
  IconAirConditioning
} from '@tabler/icons-react';

interface BuildingFeature {
  properties: {
    EGID: string;
  };
}

interface IndoorTabProps {
  building: BuildingFeature;
}

interface IndoorData {
  temperature: number;
  humidity: number;
  co2: number;
  occupancy: string;
  airQualityIndex: number;
  lastUpdated: string;
}

export const IndoorTab = ({ building }: IndoorTabProps) => {
  const [data, setData] = useState<IndoorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate API call - in real app, this would call the backend
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setData({
          temperature: Math.random() * 8 + 18, // 18-26°C
          humidity: Math.random() * 20 + 40, // 40-60%
          co2: Math.random() * 600 + 400, // 400-1000 ppm
          occupancy: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          airQualityIndex: Math.random() * 40 + 60, // 60-100
          lastUpdated: new Date().toISOString()
        });
      } catch (err) {
        setError('Failed to load indoor data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [building.properties.EGID]);

  const getCO2Color = (co2: number) => {
    if (co2 < 600) return 'green';
    if (co2 < 800) return 'yellow';
    if (co2 < 1000) return 'orange';
    return 'red';
  };

  const getCO2Status = (co2: number) => {
    if (co2 < 600) return 'Excellent';
    if (co2 < 800) return 'Good';
    if (co2 < 1000) return 'Moderate';
    return 'Poor';
  };

  const getOccupancyColor = (occupancy: string) => {
    switch (occupancy) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'orange';
      default: return 'gray';
    }
  };

  const getTemperatureStatus = (temp: number) => {
    if (temp >= 20 && temp <= 24) return { status: 'Optimal', color: 'green' };
    if (temp >= 18 && temp <= 26) return { status: 'Comfortable', color: 'blue' };
    return { status: 'Suboptimal', color: 'orange' };
  };

  if (loading) {
    return (
      <VStack spacing={4} py={8}>
        <Spinner size="lg" color="brand.500" />
        <Text>Loading indoor environment data...</Text>
      </VStack>
    );
  }

  if (error || !data) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error || 'Failed to load indoor data'}
      </Alert>
    );
  }

  const tempStatus = getTemperatureStatus(data.temperature);

  return (
    <VStack spacing={6} align="stretch">
      {/* Mockup Data Alert */}
      <Alert status="warning" variant="subtle">
        <AlertIcon />
        <Text fontSize="sm">
          <strong>Mockup Data:</strong> This indoor environmental data is simulated for demonstration purposes. 
          Real data would come from IoT sensors and building management systems.
        </Text>
      </Alert>

      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="semibold" color="brand.600">
              Indoor Climate (IoT Sensors)
            </Text>
            
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconThermometer} boxSize={4} color="red.400" />
                    <Text>Temperature</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data.temperature.toFixed(1)}°C</StatNumber>
                <StatHelpText>
                  <Badge size="sm" colorScheme={tempStatus.color}>
                    {tempStatus.status}
                  </Badge>
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconDroplet} boxSize={4} color="blue.400" />
                    <Text>Humidity</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data.humidity.toFixed(0)}%</StatNumber>
                <Progress value={data.humidity} colorScheme="blue" size="sm" mt={2} />
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconAirConditioning} boxSize={4} color="gray.500" />
                    <Text>CO₂ Level</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data.co2.toFixed(0)}</StatNumber>
                <StatHelpText>
                  <Badge size="sm" colorScheme={getCO2Color(data.co2)}>
                    {getCO2Status(data.co2)}
                  </Badge>
                  <Text fontSize="xs" color="gray.500">ppm</Text>
                </StatHelpText>
              </Stat>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="semibold" color="brand.600">
              Occupancy & Usage
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconUsers} boxSize={4} color="purple.400" />
                    <Text>Current Occupancy</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>
                  <Badge size="lg" colorScheme={getOccupancyColor(data.occupancy)}>
                    {data.occupancy.toUpperCase()}
                  </Badge>
                </StatNumber>
                <StatHelpText>Based on motion sensors</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconChartLine} boxSize={4} color="green.400" />
                    <Text>Air Quality Index</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data.airQualityIndex.toFixed(0)}</StatNumber>
                <StatHelpText>
                  <Progress value={data.airQualityIndex} colorScheme="green" size="sm" mt={1} />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
                  </Text>
                </StatHelpText>
              </Stat>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <VStack spacing={3} align="stretch">
            <Text fontSize="lg" fontWeight="semibold" color="brand.600">
              Recommendations
            </Text>
            
            <Box bg="blue.50" p={4} borderRadius="md" borderLeft="4px solid" borderLeftColor="blue.400">
              <Text fontSize="sm" fontWeight="medium" color="blue.800">
                💡 Indoor Climate Optimization
              </Text>
              <Text fontSize="sm" color="blue.700" mt={1}>
                {data.co2 > 800 
                  ? "Consider increasing ventilation to reduce CO₂ levels."
                  : data.humidity > 60 
                    ? "Humidity levels are slightly high. Consider improving air circulation."
                    : "Indoor climate conditions are within optimal ranges."
                }
              </Text>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};