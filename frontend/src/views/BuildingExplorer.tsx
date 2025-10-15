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
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  Code,
} from '@chakra-ui/react';
import { 
  IconInfoCircle,
  IconCode,
  IconMap,
  IconDatabase,
} from '@tabler/icons-react';
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

const BuildingExplorer = () => {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const { isOpen: isInfoOpen, onOpen: onInfoOpen, onClose: onInfoClose } = useDisclosure();
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
          // Buildings data loaded successfully
          console.log('Buildings data loaded:', data?.features?.length || 0, 'buildings');
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
                Powered by{' '}
                <a 
                  href="https://www.bfs.admin.ch/bfs/en/home/services/ogd/portal.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#3182ce', textDecoration: 'underline' }}
                >
                  opendata.swiss
                </a>
              </Text>
            </VStack>
          </HStack>
          
          <HStack spacing={4}>
            <IconButton
              aria-label="Platform Information"
              icon={<IconInfoCircle />}
              size="sm"
              variant="ghost"
              color="black"
              _hover={{ bg: "gray.100" }}
              onClick={onInfoOpen}
            />
            {selectedBuilding && (
              <Badge 
                colorScheme="blackAlpha" 
                fontSize="sm" 
                px={3} 
                py={1}
                bg="black"
                color="white"
              >
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
        />
      </Box>

      {/* Building Details Popup */}
      <BuildingPopup
        building={selectedBuilding}
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
      />

      {/* Platform Information Modal */}
      <Modal isOpen={isInfoOpen} onClose={onInfoClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            <HStack>
              <IconInfoCircle color="var(--chakra-colors-brand-500)" />
              <Text>Swiss Buildings Explorer - Platform Information</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <Tabs variant="enclosed" colorScheme="brand">
              <TabList>
                <Tab><HStack><IconInfoCircle size={16} /><Text>Overview</Text></HStack></Tab>
                <Tab><HStack><IconMap size={16} /><Text>Features</Text></HStack></Tab>
                <Tab><HStack><IconCode size={16} /><Text>Technology</Text></HStack></Tab>
                <Tab><HStack><IconDatabase size={16} /><Text>Data Sources</Text></HStack></Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <VStack align="start" spacing={4}>
                    <Text fontSize="lg" fontWeight="bold" color="brand.600">
                      Professional Swiss Building Data Visualization Platform
                    </Text>
                    <Text color="gray.700">
                      The Swiss Buildings Explorer is a comprehensive geospatial application designed to visualize and interact with 
                      Swiss building data. Built with modern web technologies and professional-grade mapping capabilities, this platform 
                      provides real-time access to building information across Switzerland.
                    </Text>
                    
                    <Text fontWeight="semibold" color="brand.600">Key Capabilities:</Text>
                    <List spacing={2} ml={4}>
                      <ListItem>• Interactive 2D mapping with Swiss coordinate systems</ListItem>
                      <ListItem>• Real-time building identification and information retrieval</ListItem>
                      <ListItem>• Address search with autocomplete functionality</ListItem>
                      <ListItem>• Comprehensive building analytics and environmental data</ListItem>
                      <ListItem>• Professional data visualization and export capabilities</ListItem>
                    </List>
                  </VStack>
                </TabPanel>

                <TabPanel>
                  <VStack align="start" spacing={4}>
                    <Text fontSize="lg" fontWeight="bold" color="brand.600">
                      Platform Features
                    </Text>
                    
                    <Box>
                      <Text fontWeight="semibold" color="brand.600">Mapping & Navigation:</Text>
                      <List spacing={1} ml={4} mt={2}>
                        <ListItem>• Swiss national map layers (color, grayscale, aerial imagery)</ListItem>
                        <ListItem>• Building visualization with red roof rendering</ListItem>
                        <ListItem>• Zoom-dependent layer visibility and scale optimization</ListItem>
                        <ListItem>• Draggable layer controls and UI components</ListItem>
                      </List>
                    </Box>

                    <Box>
                      <Text fontWeight="semibold" color="brand.600">Data Integration:</Text>
                      <List spacing={1} ml={4} mt={2}>
                        <ListItem>• Swiss Federal Building Registry (ch.bfs.gebaeude_wohnungs_register)</ListItem>
                        <ListItem>• Real-time building identification with Swiss GeoAdmin API</ListItem>
                        <ListItem>• Environmental data from NABEL monitoring stations</ListItem>
                        <ListItem>• Solar potential data from SFOE Sonnendach</ListItem>
                      </List>
                    </Box>

                    <Box>
                      <Text fontWeight="semibold" color="brand.600">User Experience:</Text>
                      <List spacing={1} ml={4} mt={2}>
                        <ListItem>• Address search with Swiss geocoding service</ListItem>
                        <ListItem>• Draggable popups and control panels</ListItem>
                        <ListItem>• Responsive design for desktop and mobile</ListItem>
                        <ListItem>• Professional Capgemini branding and styling</ListItem>
                      </List>
                    </Box>
                  </VStack>
                </TabPanel>

                <TabPanel>
                  <VStack align="start" spacing={4}>
                    <Text fontSize="lg" fontWeight="bold" color="brand.600">
                      Technology Stack
                    </Text>
                    
                    <Box>
                      <Text fontWeight="semibold" color="brand.600">Frontend Technologies:</Text>
                      <List spacing={1} ml={4} mt={2}>
                        <ListItem>• <Code>React 18</Code> with TypeScript for type-safe development</ListItem>
                        <ListItem>• <Code>Chakra UI</Code> for professional component library</ListItem>
                        <ListItem>• <Code>OpenLayers</Code> for advanced 2D mapping capabilities</ListItem>
                        <ListItem>• <Code>Vite</Code> for optimized build and development</ListItem>
                      </List>
                    </Box>

                    <Box>
                      <Text fontWeight="semibold" color="brand.600">Mapping & GIS:</Text>
                      <List spacing={1} ml={4} mt={2}>
                        <ListItem>• Swiss coordinate systems (LV03, LV95, Web Mercator)</ListItem>
                        <ListItem>• WMTS tile services for optimal performance</ListItem>
                        <ListItem>• GeoJSON for feature data exchange</ListItem>
                        <ListItem>• Professional cartographic rendering</ListItem>
                      </List>
                    </Box>

                    <Box>
                      <Text fontWeight="semibold" color="brand.600">API Integration:</Text>
                      <List spacing={1} ml={4} mt={2}>
                        <ListItem>• Swiss GeoAdmin REST API services</ListItem>
                        <ListItem>• Federal Statistical Office building registry</ListItem>
                        <ListItem>• RESTful architecture with proper error handling</ListItem>
                        <ListItem>• Real-time data synchronization</ListItem>
                      </List>
                    </Box>
                  </VStack>
                </TabPanel>

                <TabPanel>
                  <VStack align="start" spacing={4}>
                    <Text fontSize="lg" fontWeight="bold" color="brand.600">
                      Official Data Sources
                    </Text>
                    
                    <Box>
                      <Text fontWeight="semibold" color="brand.600">Primary Data Sources:</Text>
                      <List spacing={2} ml={4} mt={2}>
                        <ListItem>
                          • <a href="https://www.bfs.admin.ch/bfs/en/home/services/ogd/portal.html" 
                               target="_blank" rel="noopener noreferrer" 
                               style={{ color: 'var(--chakra-colors-brand-500)', textDecoration: 'underline' }}>
                              opendata.swiss
                            </a> - Swiss Federal Statistical Office
                        </ListItem>
                        <ListItem>• Swiss Federal Building and Dwelling Register (GWR)</ListItem>
                        <ListItem>• NABEL - National Air Pollution Monitoring Network</ListItem>
                        <ListItem>• MeteoSwiss - Federal Office of Meteorology and Climatology</ListItem>
                        <ListItem>• SFOE Sonnendach - Solar Potential Database</ListItem>
                      </List>
                    </Box>

                    <Box>
                      <Text fontWeight="semibold" color="brand.600">Technical Services:</Text>
                      <List spacing={2} ml={4} mt={2}>
                        <ListItem>• <Code>api3.geo.admin.ch</Code> - Swiss GeoAdmin API</ListItem>
                        <ListItem>• <Code>wmts.geo.admin.ch</Code> - Web Map Tile Service</ListItem>
                        <ListItem>• Swiss national coordinate reference systems</ListItem>
                        <ListItem>• Real-time building identification services</ListItem>
                      </List>
                    </Box>

                    <Box>
                      <Text fontWeight="semibold" color="brand.600">Data Compliance:</Text>
                      <List spacing={1} ml={4} mt={2}>
                        <ListItem>• Official Swiss government data sources</ListItem>
                        <ListItem>• GDPR and Swiss data protection compliance</ListItem>
                        <ListItem>• Proper attribution and licensing</ListItem>
                        <ListItem>• Real-time data synchronization with federal systems</ListItem>
                      </List>
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>

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
            <Text>opendata.swiss</Text>
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