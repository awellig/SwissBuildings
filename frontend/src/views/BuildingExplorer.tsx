import { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Image,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Container,
  Flex,
} from '@chakra-ui/react';
import { OpenLayersSwissMap } from '../components/Map/OpenLayersSwissMap';
import { BuildingPopup } from '../components/Popup/BuildingPopup';
import { buildingService } from '../services/api';

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

interface BuildingCollection {
  type: 'FeatureCollection';
  features: BuildingFeature[];
}

const BuildingExplorer = () => {
  const [buildings, setBuildings] = useState<BuildingCollection | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [use3D, setUse3D] = useState(true); // Default to 3D view
  const [isMounted, setIsMounted] = useState(true);
  const toast = useToast();

  useEffect(() => {
    // Cleanup function to prevent memory leaks
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    const fetchBuildings = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        const data = await buildingService.getAllBuildings();
        
        if (isMounted) {
          setBuildings(data);
        }
      } catch (err) {
        console.error('Error fetching buildings:', err);
        
        if (isMounted) {
          setError('Failed to load building data');
          try {
            toast({
              title: 'Error',
              description: 'Failed to load building data. Please try again.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          } catch (toastError) {
            console.error('Error showing toast:', toastError);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBuildings();
  }, []); // Remove toast dependency to prevent re-renders

  const handleBuildingClick = (building: BuildingFeature) => {
    if (!isMounted) return;
    
    setSelectedBuilding(building);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    if (!isMounted) return;
    
    setIsPopupOpen(false);
    // Keep selected building for map highlighting
    // setSelectedBuilding(null);
  };

  if (loading) {
    return (
      <Flex h="100vh" align="center" justify="center" bg="gray.50">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text fontSize="lg" color="gray.600">
            Loading Swiss Buildings Explorer...
          </Text>
        </VStack>
      </Flex>
    );
  }

  if (error) {
    return (
      <Container maxW="container.md" centerContent py={20}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold">Failed to load application</Text>
            <Text>{error}</Text>
          </VStack>
        </Alert>
      </Container>
    );
  }

  return (
    <Box h="100vh" position="relative" overflow="hidden">
      {/* Header */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={1000}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        px={6}
        py={3}
        shadow="sm"
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={4}>
            <Image
              src="/capgeminiLogo.png"
              alt="Capgemini Logo"
              h="40px"
              objectFit="contain"
            />
            <VStack align="start" spacing={0}>
              <Text fontSize="xl" fontWeight="bold" color="brand.600">
                Swiss Buildings Explorer
              </Text>
              <Text fontSize="sm" color="gray.600">
                Powered by swissBUILDINGS3D 3.0 beta
              </Text>
            </VStack>
          </HStack>
          
          <HStack spacing={4}>
            {buildings && (
              <Badge colorScheme="brand" fontSize="sm" px={3} py={1}>
                {buildings.features.length} Buildings
              </Badge>
            )}
            {selectedBuilding && (
              <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                {selectedBuilding.properties.name}
              </Badge>
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Map Container */}
      <Box 
        position="absolute" 
        top="70px" 
        left={0} 
        right={0} 
        bottom={0}
        overflow="hidden"
      >
        <OpenLayersSwissMap
          onBuildingClick={handleBuildingClick}
          is3D={use3D}
          onToggle3D={setUse3D}
        />
      </Box>

      {/* Building Details Popup */}
      <BuildingPopup
        building={selectedBuilding}
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
      />

      {/* Footer */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        borderTop="1px solid"
        borderColor="gray.200"
        px={6}
        py={2}
        shadow="sm"
        zIndex={1000}
      >
        <HStack justify="space-between" fontSize="xs" color="gray.600">
          <Text>
            © 2024 Capgemini - Swiss Buildings Data Visualization
          </Text>
          <HStack spacing={4}>
            <Text>Data Sources:</Text>
            <Text>swissBUILDINGS3D</Text>
            <Text>NABEL</Text>
            <Text>MeteoSwiss</Text>
            <Text>SFOE Sonnendach</Text>
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
};

export default BuildingExplorer;