import {
  VStack,
  HStack,
  Text,
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Icon,
} from '@chakra-ui/react';
import { 
  IconCalendar, 
  IconRuler, 
  IconStairs, 
  IconMapPin 
} from '@tabler/icons-react';

interface BuildingFeature {
  type: 'Feature';
  properties: {
    EGID: string;
    name: string;
    address: string;
    buildingType: string;
    constructionYear: number;
    floors: number;
    area: number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

interface GeneralInfoTabProps {
  building: BuildingFeature;
}

export const GeneralInfoTab = ({ building }: GeneralInfoTabProps) => {
  const { properties, geometry } = building;
  const [lng, lat] = geometry.coordinates;

  const buildingAge = new Date().getFullYear() - properties.constructionYear;

  return (
    <VStack spacing={6} align="stretch">
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="semibold" color="brand.600">
              Building Information
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconCalendar} boxSize={4} color="gray.500" />
                    <Text>Construction Year</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{properties.constructionYear}</StatNumber>
                <StatHelpText>{buildingAge} years old</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconStairs} boxSize={4} color="gray.500" />
                    <Text>Floors</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{properties.floors}</StatNumber>
                <StatHelpText>levels</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconRuler} boxSize={4} color="gray.500" />
                    <Text>Floor Area</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{properties.area.toLocaleString()}</StatNumber>
                <StatHelpText>m²</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={IconMapPin} boxSize={4} color="gray.500" />
                    <Text>Location</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="md">
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </StatNumber>
                <StatHelpText>WGS84 coordinates</StatHelpText>
              </Stat>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <VStack spacing={3} align="stretch">
            <Text fontSize="lg" fontWeight="semibold" color="brand.600">
              Technical Details
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontWeight="medium" color="gray.700">EGID</Text>
                <Text color="gray.600">{properties.EGID}</Text>
              </Box>
              <Box>
                <Text fontWeight="medium" color="gray.700">Building Type</Text>
                <Text color="gray.600">{properties.buildingType}</Text>
              </Box>
              <Box>
                <Text fontWeight="medium" color="gray.700">Address</Text>
                <Text color="gray.600">{properties.address}</Text>
              </Box>
              <Box>
                <Text fontWeight="medium" color="gray.700">Data Source</Text>
                <Text color="gray.600">swissBUILDINGS3D 3.0 beta</Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};