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
  IconSun 
} from '@tabler/icons-react';
import { GeneralInfoTab } from '../Tabs/GeneralInfoTab';
import { EnvironmentTab } from '../Tabs/EnvironmentTab';
import { IndoorTab } from '../Tabs/IndoorTab';
import { EnergyTab } from '../Tabs/EnergyTab';
import { SolarTab } from '../Tabs/SolarTab';

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
  if (!building) return null;

  const { properties } = building;

  const getBuildingTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
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
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader pb={3}>
          <VStack align="start" spacing={2}>
            <HStack>
              <Icon as={IconBuilding} color="brand.500" boxSize={6} />
              <Text fontSize="xl" fontWeight="bold" color="brand.600">
                {properties.name}
              </Text>
              <Badge colorScheme={getBuildingTypeBadgeColor(properties.buildingType)}>
                {properties.buildingType}
              </Badge>
            </HStack>
            <Text fontSize="sm" color="gray.600">
              {properties.address} • EGID: {properties.EGID}
            </Text>
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