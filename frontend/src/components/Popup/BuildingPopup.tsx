import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { 
  IconBuilding, 
  IconLeaf, 
  IconHome, 
  IconBolt, 
  IconSun,
} from '@tabler/icons-react';
import { GeneralInfoTab } from '../Tabs/GeneralInfoTab';
import { EnvironmentTab } from '../Tabs/EnvironmentTab';
import { IndoorTab } from '../Tabs/IndoorTab';
import { EnergyTab } from '../Tabs/EnergyTab';
import { SolarTab } from '../Tabs/SolarTab';
import { useState, useEffect } from 'react';
import { getSwissBuildingType, getBuildingTypeBadgeColor, getFullCantonName } from '../../utils/swissBuildingTypes';

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

interface BuildingPopupProps {
  building: BuildingFeature | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BuildingPopup = ({ building, isOpen, onClose }: BuildingPopupProps) => {
  const [locationInfo, setLocationInfo] = useState({ city: '', canton: '', postalCode: '' });

  // Swiss reverse geocoding function to get city/canton from coordinates
  const getSwissLocationFromCoordinates = async (coordinates: [number, number]) => {
    try {
      const [lng, lat] = coordinates;
      console.log('Reverse geocoding for coordinates:', lng, lat);
      
      // Try the Swiss geo.admin.ch reverse geocoding service first
      const reverseGeoUrl = `https://api3.geo.admin.ch/rest/services/api/MapServer/identify?` +
        `geometryType=esriGeometryPoint&` +
        `geometry=${lng},${lat}&` +
        `mapExtent=0,0,1000000,1000000&` +
        `imageDisplay=1,1,96&` +
        `sr=4326&` +
        `layers=all:ch.bfs.gebaeude_wohnungs_register&` +
        `returnGeometry=false`;
      
      const reverseResponse = await fetch(reverseGeoUrl);
      
      if (reverseResponse.ok) {
        const reverseData = await reverseResponse.json();
        console.log('Reverse geocoding response:', reverseData);
        
        if (reverseData.results && reverseData.results.length > 0) {
          const result = reverseData.results[0];
          const attrs = result.attributes;
          
          if (attrs) {
            return {
              city: attrs.ggdename || attrs.plzname || attrs.city || '',
              canton: attrs.gkanton || attrs.canton || '',
              postalCode: attrs.plz4 || attrs.zip || attrs.postalcode || '',
            };
          }
        }
      }
      
      // Fallback: Try the search server approach
      const searchUrl = `https://api3.geo.admin.ch/rest/services/api/SearchServer?` +
        `searchText=${lng},${lat}&` +
        `type=locations&` +
        `limit=1&` +
        `origins=address&` +
        `sr=4326`;
      
      const searchResponse = await fetch(searchUrl);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('Search server response:', searchData);
        
        if (searchData.results && searchData.results.length > 0) {
          const result = searchData.results[0];
          const attrs = result.attrs;
          
          return {
            city: attrs.city || attrs.municipality || attrs.plzname || '',
            canton: attrs.canton || attrs.gkanton || '',
            postalCode: attrs.zip || attrs.postalcode || attrs.plz4 || '',
          };
        }
      }
      
    } catch (error) {
      console.error('Error getting Swiss location:', error);
    }
    
    return { city: '', canton: '', postalCode: '' };
  };

  // Clean address function
  const cleanAddress = (address: string) => {
    if (!address || address === 'Address lookup in progress...') {
      return 'Address not available';
    }

    let cleaned = address.trim();
    
    // Handle formats like "Hotelgasse 4  2600704.126" - remove coordinates
    cleaned = cleaned.replace(/\s+\d{7}\.\d+/, '');
    
    // Remove duplicate parts (e.g., "Kirchstrasse 72 72" -> "Kirchstrasse 72")
    const parts = cleaned.split(/\s+/);
    const uniqueParts = [];
    let lastPart = '';
    for (const part of parts) {
      if (part !== lastPart && part.length > 0) {
        uniqueParts.push(part);
      }
      lastPart = part;
    }
    
    return uniqueParts.join(' ') || address;
  };



  // Fetch location information when building changes
  useEffect(() => {
    const fetchLocationInfo = async () => {
      if (building?.geometry?.coordinates) {
        const locationData = await getSwissLocationFromCoordinates(building.geometry.coordinates);
        setLocationInfo(locationData);
      }
    };

    if (building) {
      fetchLocationInfo();
    }
  }, [building]);

  // Early return after all hooks have been called
  if (!building) {
    return null;
  }

  const { properties } = building;

  // Combine location info with clean address
  const addressInfo = {
    city: locationInfo.city,
    canton: locationInfo.canton,
    cleanAddress: cleanAddress(properties.address),
    postalCode: locationInfo.postalCode
  };

  // Create a cleaned building object to pass to tabs
  const cleanedBuilding: BuildingFeature = {
    ...building,
    properties: {
      ...building.properties,
      address: addressInfo.cleanAddress
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="4xl" 
      scrollBehavior="inside"
      isCentered
    >
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader pb={3} pt={6}>
          <VStack align="start" spacing={2} flex={1}>
            <HStack>
              <Icon as={IconBuilding} color="brand.500" boxSize={6} />
              <VStack align="start" spacing={1} flex={1}>
                {/* Main title: Address */}
                <HStack>
                  <Text fontSize="xl" fontWeight="bold" color="brand.600">
                    {addressInfo.cleanAddress || properties.name || 'Building Information'}
                  </Text>
                  <Badge colorScheme={getBuildingTypeBadgeColor(properties.buildingType)}>
                    {getSwissBuildingType(properties.buildingType)}
                  </Badge>
                </HStack>
                
                {/* Subtitle: City, Canton (if available) and EGID */}
                <Text fontSize="sm" color="gray.600">
                  {(() => {
                    const locationParts = [];
                    
                    // Add city if available
                    if (addressInfo.city && addressInfo.city !== 'Loading...') {
                      locationParts.push(addressInfo.city);
                    }
                    
                    // Add canton if available (with full name mapping)
                    if (addressInfo.canton && addressInfo.canton !== 'Loading...') {
                      const fullCantonName = getFullCantonName(addressInfo.canton);
                      locationParts.push(fullCantonName);
                    }
                    
                    const locationText = locationParts.length > 0 ? locationParts.join(', ') : '';
                    const egidText = `EGID: ${properties.EGID}`;
                    
                    return locationText ? `${locationText} • ${egidText}` : egidText;
                  })()}
                </Text>
                
              </VStack>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody px={0}>
          <Tabs variant="enclosed" colorScheme="brand">
            <TabList px={6}>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={IconBuilding} boxSize={4} />
                  <Text>General</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={IconLeaf} boxSize={4} />
                  <Text>Environment</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={IconHome} boxSize={4} />
                  <Text>Indoor</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={IconBolt} boxSize={4} />
                  <Text>Energy</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={IconSun} boxSize={4} />
                  <Text>Solar</Text>
                </HStack>
              </Tab>
            </TabList>

            <Divider />

            <TabPanels>
              <TabPanel>
                <GeneralInfoTab building={cleanedBuilding} />
              </TabPanel>
              <TabPanel>
                <EnvironmentTab building={cleanedBuilding} />
              </TabPanel>
              <TabPanel>
                <IndoorTab building={cleanedBuilding} />
              </TabPanel>
              <TabPanel>
                <EnergyTab building={cleanedBuilding} />
              </TabPanel>
              <TabPanel>
                <SolarTab building={cleanedBuilding} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};