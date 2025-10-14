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
  Badge,
  Box,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import { 
  IconSun, 
  IconChartLine,
  IconCurrencyDollar,
  IconLeaf,
  IconHome,
  IconBolt
} from '@tabler/icons-react';

interface BuildingFeature {
  properties: {
    EGID: string;
  };
}

interface SolarTabProps {
  building: BuildingFeature;
}

interface SolarData {
  roofArea: number;
  suitableArea: number;
  potentialKwp: number;
  annualProduction: number;
  co2Savings: number;
  economicViability: 'excellent' | 'good' | 'moderate' | 'poor';
  irradiation: number;
}

export const SolarTab = ({ building }: SolarTabProps) => {
  const [data, setData] = useState<SolarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate API call to SFOE Sonnendach
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        const roofArea = Math.random() * 500 + 100;
        const suitablePercentage = Math.random() * 0.4 + 0.4;
        const suitableArea = roofArea * suitablePercentage;
        const potentialKwp = suitableArea * 0.15;
        const irradiation = Math.random() * 300 + 900;
        const annualProduction = potentialKwp * irradiation;
        const co2Savings = annualProduction * 0.4;
        
        let economicViability: 'excellent' | 'good' | 'moderate' | 'poor';
        if (irradiation > 1100) economicViability = 'excellent';
        else if (irradiation > 1000) economicViability = 'good';
        else if (irradiation > 950) economicViability = 'moderate';
        else economicViability = 'poor';

        setData({
          roofArea,
          suitableArea,
          potentialKwp,
          annualProduction,
          co2Savings,
          economicViability,
          irradiation
        });
      } catch (err) {
        setError('Failed to load solar potential data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [building.properties.EGID]);

  const getViabilityColor = (viability: string) => {
    switch (viability) {
      case 'excellent': return 'green';
      case 'good': return 'blue';
      case 'moderate': return 'yellow';
      case 'poor': return 'red';
      default: return 'gray';
    }
  };

  const getIrradiationRating = (irradiation: number) => {
    if (irradiation > 1100) return 'Excellent';
    if (irradiation > 1000) return 'Very Good';
    if (irradiation > 950) return 'Good';
    if (irradiation > 900) return 'Moderate';
    return 'Limited';
  };

  if (loading) {
    return (
      <VStack spacing={4} py={8}>
        <Spinner size="lg" color="brand.500" />
        <Text>Loading solar potential data...</Text>
      </VStack>
    );
  }

  if (error || !data) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error || 'Failed to load solar potential data'}
      </Alert>
    );
  }

  const suitabilityPercentage = (data.suitableArea / data.roofArea) * 100;
  const annualSavings = data.annualProduction * 0.20; // CHF 0.20 per kWh
  const paybackPeriod = (data.potentialKwp * 1500) / annualSavings; // Estimate CHF 1500/kWp installation cost

  return (
    <VStack spacing={6} align="stretch">
      {/* Solar Potential Overview */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="semibold" color="brand.600">
                Solar Potential (SFOE Sonnendach)
              </Text>
              <Badge size="lg" colorScheme={getViabilityColor(data.economicViability)}>
                {data.economicViability.toUpperCase()}
              </Badge>
            </HStack>
            
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconHome} boxSize={4} color="brown.500" />
                    <Text>Total Roof Area</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data.roofArea.toFixed(0)}</StatNumber>
                <StatHelpText>m²</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconSun} boxSize={4} color="orange.500" />
                    <Text>Suitable Area</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data.suitableArea.toFixed(0)}</StatNumber>
                <StatHelpText>
                  m² ({suitabilityPercentage.toFixed(0)}%)
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconBolt} boxSize={4} color="yellow.500" />
                    <Text>Potential Power</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data.potentialKwp.toFixed(1)}</StatNumber>
                <StatHelpText>kWp</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Solar Irradiation</StatLabel>
                <StatNumber>{data.irradiation.toFixed(0)}</StatNumber>
                <StatHelpText>
                  <Badge size="sm" colorScheme={getViabilityColor(data.economicViability)}>
                    {getIrradiationRating(data.irradiation)}
                  </Badge>
                  <Text fontSize="xs" color="gray.500">kWh/m²/year</Text>
                </StatHelpText>
              </Stat>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      {/* Energy Production & Benefits */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="semibold" color="brand.600">
              Annual Energy Production & Benefits
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <VStack>
                <CircularProgress 
                  value={suitabilityPercentage} 
                  color="orange.400" 
                  size="120px"
                  thickness="8px"
                >
                  <CircularProgressLabel>
                    <VStack spacing={0}>
                      <Text fontSize="lg" fontWeight="bold" color="orange.600">
                        {suitabilityPercentage.toFixed(0)}%
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        Suitable
                      </Text>
                    </VStack>
                  </CircularProgressLabel>
                </CircularProgress>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Roof Suitability
                </Text>
              </VStack>

              <VStack spacing={3}>
                <Stat textAlign="center">
                  <StatLabel>
                    <HStack justify="center">
                      <Icon as={IconChartLine} boxSize={4} color="green.500" />
                      <Text>Annual Production</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber color="green.600">
                    {(data.annualProduction / 1000).toFixed(1)} MWh
                  </StatNumber>
                  <StatHelpText>
                    {data.annualProduction.toFixed(0)} kWh/year
                  </StatHelpText>
                </Stat>

                <Stat textAlign="center">
                  <StatLabel>
                    <HStack justify="center">
                      <Icon as={IconCurrencyDollar} boxSize={4} color="blue.500" />
                      <Text>Annual Savings</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber color="blue.600">
                    CHF {annualSavings.toFixed(0)}
                  </StatNumber>
                  <StatHelpText>
                    Payback: {paybackPeriod.toFixed(1)} years
                  </StatHelpText>
                </Stat>
              </VStack>

              <VStack spacing={3}>
                <Stat textAlign="center">
                  <StatLabel>
                    <HStack justify="center">
                      <Icon as={IconLeaf} boxSize={4} color="green.500" />
                      <Text>CO₂ Savings</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber color="green.600">
                    {(data.co2Savings / 1000).toFixed(1)}
                  </StatNumber>
                  <StatHelpText>tonnes CO₂/year</StatHelpText>
                </Stat>

                <Box textAlign="center">
                  <Text fontSize="sm" color="gray.600">
                    Equivalent to planting
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="green.600">
                    {Math.round(data.co2Savings / 22)} trees
                  </Text>
                </Box>
              </VStack>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      {/* Installation Potential */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="semibold" color="brand.600">
              Installation Recommendations
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontWeight="medium" color="gray.700" mb={2}>System Size Options</Text>
                <VStack spacing={2} align="stretch">
                  <Box bg="orange.50" p={3} borderRadius="md" border="1px solid" borderColor="orange.200">
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="medium">Optimal Size</Text>
                      <Text fontSize="sm" color="orange.600">{data.potentialKwp.toFixed(1)} kWp</Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.600">
                      Uses {suitabilityPercentage.toFixed(0)}% of suitable roof area
                    </Text>
                  </Box>
                  <Box bg="blue.50" p={3} borderRadius="md" border="1px solid" borderColor="blue.200">
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="medium">Conservative</Text>
                      <Text fontSize="sm" color="blue.600">{(data.potentialKwp * 0.7).toFixed(1)} kWp</Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.600">
                      Reduced risk, easier maintenance access
                    </Text>
                  </Box>
                </VStack>
              </Box>

              <Box>
                <Text fontWeight="medium" color="gray.700" mb={2}>Economic Outlook</Text>
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="sm">Installation Cost</Text>
                    <Text fontSize="sm" fontWeight="medium">
                      CHF {(data.potentialKwp * 1500).toFixed(0)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Annual Revenue</Text>
                    <Text fontSize="sm" fontWeight="medium" color="green.600">
                      CHF {annualSavings.toFixed(0)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Break-even</Text>
                    <Text fontSize="sm" fontWeight="medium" color="blue.600">
                      {paybackPeriod.toFixed(1)} years
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            </SimpleGrid>

            <Box bg="yellow.50" p={4} borderRadius="md" borderLeft="4px solid" borderLeftColor="yellow.400">
              <Text fontSize="sm" fontWeight="medium" color="yellow.800">
                ☀️ Solar Investment Outlook
              </Text>
              <Text fontSize="sm" color="yellow.700" mt={1}>
                {data.economicViability === 'excellent' 
                  ? "Excellent solar potential! This roof is ideal for solar installation with high returns."
                  : data.economicViability === 'good'
                    ? "Good solar potential. Installation would be profitable with reasonable payback period."
                    : data.economicViability === 'moderate'
                      ? "Moderate solar potential. Consider partial installation or wait for technology improvements."
                      : "Limited solar potential. Site may not be optimal for large-scale solar installation."
                }
              </Text>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};