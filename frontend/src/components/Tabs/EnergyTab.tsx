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
  IconBolt, 
  IconChartLine,
  IconLamp,
  IconAirConditioning,
  IconDevices,
  IconFlame
} from '@tabler/icons-react';

interface BuildingFeature {
  properties: {
    EGID: string;
  };
}

interface EnergyTabProps {
  building: BuildingFeature;
}

interface EnergyData {
  consumption: {
    totalKwh: number;
    dailyAverage: number;
    monthlyTrend: number[];
  };
  breakdown: {
    lighting: number;
    hvac: number;
    appliances: number;
    heating: number;
    cooling: number;
    other: number;
    total: number;
  };
}

export const EnergyTab = ({ building }: EnergyTabProps) => {
  const [data, setData] = useState<EnergyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate API calls to backend
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const lighting = Math.random() * 500 + 100;
        const hvac = Math.random() * 800 + 200;
        const appliances = Math.random() * 400 + 150;
        const heating = Math.random() * 600 + 100;
        const cooling = Math.random() * 300 + 50;
        const other = Math.random() * 200 + 50;
        const total = lighting + hvac + appliances + heating + cooling + other;

        setData({
          consumption: {
            totalKwh: total,
            dailyAverage: total / 30,
            monthlyTrend: Array.from({ length: 12 }, () => Math.random() * 300 + 100)
          },
          breakdown: {
            lighting,
            hvac,
            appliances,
            heating,
            cooling,
            other,
            total
          }
        });
      } catch (err) {
        setError('Failed to load energy data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [building.properties.EGID]);

  const getEnergyEfficiencyRating = (dailyKwh: number) => {
    if (dailyKwh < 20) return { rating: 'A+', color: 'green' };
    if (dailyKwh < 40) return { rating: 'A', color: 'green' };
    if (dailyKwh < 60) return { rating: 'B', color: 'yellow' };
    if (dailyKwh < 80) return { rating: 'C', color: 'orange' };
    return { rating: 'D', color: 'red' };
  };

  if (loading) {
    return (
      <VStack spacing={4} py={8}>
        <Spinner size="lg" color="brand.500" />
        <Text>Loading energy consumption data...</Text>
      </VStack>
    );
  }

  if (error || !data) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error || 'Failed to load energy data'}
      </Alert>
    );
  }

  const efficiency = getEnergyEfficiencyRating(data.consumption.dailyAverage);
  const co2Emissions = data.consumption.totalKwh * 0.4; // Estimate: 400g CO2/kWh

  return (
    <VStack spacing={6} align="stretch">
      {/* Overall Consumption */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="semibold" color="brand.600">
                Energy Consumption Overview
              </Text>
              <Badge size="lg" colorScheme={efficiency.color}>
                Rating: {efficiency.rating}
              </Badge>
            </HStack>
            
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconBolt} boxSize={4} color="yellow.500" />
                    <Text>Monthly Total</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data.consumption.totalKwh.toFixed(0)}</StatNumber>
                <StatHelpText>kWh</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Daily Average</StatLabel>
                <StatNumber>{data.consumption.dailyAverage.toFixed(1)}</StatNumber>
                <StatHelpText>kWh/day</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconChartLine} boxSize={4} color="green.500" />
                    <Text>Cost Estimate</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>CHF {(data.consumption.totalKwh * 0.20).toFixed(0)}</StatNumber>
                <StatHelpText>@ 20 Rp/kWh</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>CO₂ Emissions</StatLabel>
                <StatNumber>{(co2Emissions / 1000).toFixed(1)}</StatNumber>
                <StatHelpText>tonnes CO₂</StatHelpText>
              </Stat>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      {/* NILM Breakdown */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="semibold" color="brand.600">
              Energy Breakdown (NILM Analysis)
            </Text>
            
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
              <Box>
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <Icon as={IconLamp} boxSize={4} color="yellow.500" />
                    <Text fontSize="sm" fontWeight="medium">Lighting</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {((data.breakdown.lighting / data.breakdown.total) * 100).toFixed(0)}%
                  </Text>
                </HStack>
                <Progress 
                  value={(data.breakdown.lighting / data.breakdown.total) * 100} 
                  colorScheme="yellow" 
                  size="sm" 
                />
                <Text fontSize="xs" color="gray.600" mt={1}>
                  {data.breakdown.lighting.toFixed(0)} kWh
                </Text>
              </Box>

              <Box>
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <Icon as={IconAirConditioning} boxSize={4} color="blue.500" />
                    <Text fontSize="sm" fontWeight="medium">HVAC</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {((data.breakdown.hvac / data.breakdown.total) * 100).toFixed(0)}%
                  </Text>
                </HStack>
                <Progress 
                  value={(data.breakdown.hvac / data.breakdown.total) * 100} 
                  colorScheme="blue" 
                  size="sm" 
                />
                <Text fontSize="xs" color="gray.600" mt={1}>
                  {data.breakdown.hvac.toFixed(0)} kWh
                </Text>
              </Box>

              <Box>
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <Icon as={IconDevices} boxSize={4} color="purple.500" />
                    <Text fontSize="sm" fontWeight="medium">Appliances</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {((data.breakdown.appliances / data.breakdown.total) * 100).toFixed(0)}%
                  </Text>
                </HStack>
                <Progress 
                  value={(data.breakdown.appliances / data.breakdown.total) * 100} 
                  colorScheme="purple" 
                  size="sm" 
                />
                <Text fontSize="xs" color="gray.600" mt={1}>
                  {data.breakdown.appliances.toFixed(0)} kWh
                </Text>
              </Box>

              <Box>
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <Icon as={IconFlame} boxSize={4} color="red.500" />
                    <Text fontSize="sm" fontWeight="medium">Heating</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {((data.breakdown.heating / data.breakdown.total) * 100).toFixed(0)}%
                  </Text>
                </HStack>
                <Progress 
                  value={(data.breakdown.heating / data.breakdown.total) * 100} 
                  colorScheme="red" 
                  size="sm" 
                />
                <Text fontSize="xs" color="gray.600" mt={1}>
                  {data.breakdown.heating.toFixed(0)} kWh
                </Text>
              </Box>

              <Box>
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <Icon as={IconAirConditioning} boxSize={4} color="cyan.500" />
                    <Text fontSize="sm" fontWeight="medium">Cooling</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {((data.breakdown.cooling / data.breakdown.total) * 100).toFixed(0)}%
                  </Text>
                </HStack>
                <Progress 
                  value={(data.breakdown.cooling / data.breakdown.total) * 100} 
                  colorScheme="cyan" 
                  size="sm" 
                />
                <Text fontSize="xs" color="gray.600" mt={1}>
                  {data.breakdown.cooling.toFixed(0)} kWh
                </Text>
              </Box>

              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">Other</Text>
                  <Text fontSize="sm" color="gray.600">
                    {((data.breakdown.other / data.breakdown.total) * 100).toFixed(0)}%
                  </Text>
                </HStack>
                <Progress 
                  value={(data.breakdown.other / data.breakdown.total) * 100} 
                  colorScheme="gray" 
                  size="sm" 
                />
                <Text fontSize="xs" color="gray.600" mt={1}>
                  {data.breakdown.other.toFixed(0)} kWh
                </Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      {/* Optimization Recommendations */}
      <Card>
        <CardBody>
          <VStack spacing={3} align="stretch">
            <Text fontSize="lg" fontWeight="semibold" color="brand.600">
              Energy Optimization
            </Text>
            
            <Box bg="green.50" p={4} borderRadius="md" borderLeft="4px solid" borderLeftColor="green.400">
              <Text fontSize="sm" fontWeight="medium" color="green.800">
                💡 Efficiency Recommendations
              </Text>
              <Text fontSize="sm" color="green.700" mt={1}>
                {data.breakdown.hvac > data.breakdown.total * 0.4
                  ? "HVAC system accounts for a large portion of consumption. Consider upgrading to more efficient equipment."
                  : data.breakdown.lighting > data.breakdown.total * 0.3
                    ? "Lighting consumption is high. LED upgrades could reduce energy usage by up to 60%."
                    : "Energy distribution looks balanced. Consider implementing smart controls for further optimization."
                }
              </Text>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};