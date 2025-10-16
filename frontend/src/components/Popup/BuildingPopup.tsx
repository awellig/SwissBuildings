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
  Box,
} from '@chakra-ui/react';
import { 
  IconBuilding, 
  IconLeaf, 
  IconHome, 
  IconBolt, 
  IconSun,
  IconGripHorizontal,
} from '@tabler/icons-react';
import { GeneralInfoTab } from '../Tabs/GeneralInfoTab';
import { EnvironmentTab } from '../Tabs/EnvironmentTab';
import { IndoorTab } from '../Tabs/IndoorTab';
import { EnergyTab } from '../Tabs/EnergyTab';
import { SolarTab } from '../Tabs/SolarTab';
import { useState, useEffect } from 'react';

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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle modal dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate new position with bounds checking
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Prevent dragging outside viewport
    const maxX = window.innerWidth - 200; // Leave more margin
    const maxY = window.innerHeight - 200;
    
    setPosition({
      x: Math.max(-50, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY)),
    });
  };

  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, dragStart.x, dragStart.y]);

  // Reset position when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen]);

  // Early return after all hooks have been called
  if (!building) {
    return null;
  }

  const { properties } = building;

  const getBuildingTypeBadgeColor = (type: any) => {
    // Convert to string and handle null/undefined values
    const typeStr = String(type || 'unknown').toLowerCase();
    switch (typeStr) {
      case 'office':
        return 'blue';
      case 'government':
        return 'purple';
      case 'educational':
        return 'green';
      case 'residential':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="4xl" 
      scrollBehavior="inside" 
      closeOnOverlayClick={!isDragging}
      closeOnEsc={!isDragging}
    >
      <ModalOverlay />
      <ModalContent 
        maxH="90vh"
        transform={`translate(${position.x}px, ${position.y}px)`}
        cursor={isDragging ? 'grabbing' : 'default'}
        position="relative"
        boxShadow="2xl"
        transition={isDragging ? 'none' : 'transform 0.2s ease'}
      >
        {/* Improved Drag Handle */}
        <Box
          position="absolute"
          top={2}
          left="50%"
          transform="translateX(-50%)"
          zIndex={1000}
          cursor="grab"
          _active={{ cursor: 'grabbing' }}
          _hover={{ bg: 'gray.100', boxShadow: 'md' }}
          onMouseDown={handleMouseDown}
          px={4}
          py={2}
          borderRadius="full"
          bg="white"
          boxShadow="lg"
          border="2px solid"
          borderColor="gray.300"
          transition="all 0.2s"
          userSelect="none"
        >
          <Icon as={IconGripHorizontal} color="gray.500" boxSize={5} />
        </Box>
        
        <ModalHeader pb={3} pt={8}>
          <VStack align="start" spacing={2} flex={1}>
            <HStack>
              <Icon as={IconBuilding} color="brand.500" boxSize={6} />
              <Text fontSize="xl" fontWeight="bold" color="brand.600">
                {properties.name}
              </Text>
              <Badge colorScheme={getBuildingTypeBadgeColor(properties.buildingType)}>
                {String(properties.buildingType || 'Unknown')}
              </Badge>
            </HStack>
            <Text fontSize="sm" color="gray.600">
              {(() => {
                // Clean up address to prevent duplication
                let displayAddress = 'Address not available';
                
                if (properties.address && properties.address !== 'Address lookup in progress...') {
                  // Remove duplicate parts (e.g., "Kirchstrasse 72 72" -> "Kirchstrasse 72")
                  const parts = properties.address.trim().split(' ');
                  const cleanParts = [];
                  let lastPart = '';
                  
                  for (const part of parts) {
                    if (part !== lastPart) {
                      cleanParts.push(part);
                    }
                    lastPart = part;
                  }
                  
                  displayAddress = cleanParts.join(' ');
                }
                
                return `${displayAddress} • EGID: ${properties.EGID}`;
              })()}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton top={6} right={4} />
        
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
                <GeneralInfoTab building={building} />
              </TabPanel>
              <TabPanel>
                <EnvironmentTab building={building} />
              </TabPanel>
              <TabPanel>
                <IndoorTab building={building} />
              </TabPanel>
              <TabPanel>
                <EnergyTab building={building} />
              </TabPanel>
              <TabPanel>
                <SolarTab building={building} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};