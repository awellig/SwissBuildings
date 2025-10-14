import { useEffect, useRef, useState } from 'react';
import { Box, Button, HStack, Icon, useToast } from '@chakra-ui/react';
import { IconMap, IconMap2 } from '@tabler/icons-react';

interface SwissTopoMapProps {
  onBuildingClick: (building: any) => void;
  selectedBuilding: any;
  is3D: boolean;
  onToggle3D: (is3D: boolean) => void;
}

declare global {
  interface Window {
    ga: any;
  }
}

export const SwissTopoMap = ({ onBuildingClick, is3D, onToggle3D }: SwissTopoMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [currentIframe, setCurrentIframe] = useState<HTMLIFrameElement | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const toast = useToast();

  const base3DUrl = 'https://map.geo.admin.ch/embed.html';
  const mapParams = new URLSearchParams({
    lang: 'en',
    topic: 'ech',
    bgLayer: 'ch.swisstopo.pixelkarte-farbe',
    layers: 'ch.bfs.gebaeude_wohnungs_register,ch.swisstopo.swissimage-product',
    layers_visibility: 'true,false',
    layers_timestamp: '9999,current',
    E: '2683000',
    N: '1247000',
    zoom: '10',
    '3d': is3D ? 'true' : 'false',
    'admin_id': '10'
  });

  const mapUrl = `${base3DUrl}?${mapParams.toString()}`;

  useEffect(() => {
    const loadMap = () => {
      if (!mapContainerRef.current) return;

      // Clear previous content
      mapContainerRef.current.innerHTML = '';

      if (is3D) {
        // Create iframe for 3D view
        const iframe = document.createElement('iframe');
        iframe.src = mapUrl;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.allow = 'geolocation';
        
        iframe.onload = () => {
          setMapLoaded(true);
          setupMessageListener();
        };

        mapContainerRef.current.appendChild(iframe);
        iframeRef.current = iframe;
      } else {
        // Load 2D view (you can switch back to Leaflet here if needed)
        const iframe = document.createElement('iframe');
        iframe.src = mapUrl;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.allow = 'geolocation';
        
        iframe.onload = () => {
          setMapLoaded(true);
          setupMessageListener();
        };

        mapContainerRef.current.appendChild(iframe);
        iframeRef.current = iframe;
      }
    };

    const setupMessageListener = () => {
      const handleMessage = (event: MessageEvent) => {
        // Listen for click events from the embedded map
        if (event.origin !== 'https://map.geo.admin.ch') return;

        const data = event.data;
        
        if (data.type === 'click' && data.features && data.features.length > 0) {
          handleMapClick(data.features);
        }
      };

      window.addEventListener('message', handleMessage);
      
      // Cleanup listener
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    };

    loadMap();
  }, [is3D, mapUrl]);

  const handleMapClick = async (features: any[]) => {
    try {
      // Look for building features
      const buildingFeature = features.find(feature => 
        feature.layerBodId === 'ch.bfs.gebaeude_wohnungs_register' ||
        feature.properties?.EGID ||
        feature.attributes?.EGID
      );

      if (buildingFeature) {
        const egid = buildingFeature.properties?.EGID || 
                    buildingFeature.attributes?.EGID ||
                    buildingFeature.featureId;

        if (egid) {
          // Fetch building details from our backend
          const buildingData = await fetchBuildingByEGID(egid);
          if (buildingData) {
            onBuildingClick(buildingData);
          } else {
            // Create a minimal building object if not found in our data
            const mockBuilding = {
              type: 'Feature',
              properties: {
                EGID: egid,
                name: `Building ${egid}`,
                address: 'Address not available',
                buildingType: 'Unknown',
                constructionYear: 2000,
                floors: 1,
                area: 100
              },
              geometry: {
                type: 'Point',
                coordinates: [buildingFeature.geometry?.coordinates || [8.0, 47.0]]
              }
            };
            onBuildingClick(mockBuilding);
          }
        }
      } else {
        toast({
          title: 'No building selected',
          description: 'Please click on a building to view its details.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error handling map click:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch building information.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchBuildingByEGID = async (egid: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/buildings/${egid}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching building:', error);
      return null;
    }
  };

  const enableMapInteraction = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Send message to enable click events
      iframeRef.current.contentWindow.postMessage({
        type: 'enableClickEvents',
        layers: ['ch.bfs.gebaeude_wohnungs_register']
      }, 'https://map.geo.admin.ch');
    }
  };

  useEffect(() => {
    if (mapLoaded) {
      // Small delay to ensure iframe is fully loaded
      setTimeout(enableMapInteraction, 1000);
    }
  }, [mapLoaded]);

  return (
    <Box h="100%" w="100%" position="relative">
      {/* Map Toggle Controls */}
      <Box
        position="absolute"
        top={4}
        right={4}
        zIndex={1000}
        bg="white"
        borderRadius="md"
        shadow="md"
        border="1px solid"
        borderColor="gray.200"
      >
        <HStack spacing={0}>
          <Button
            size="sm"
            variant={!is3D ? "solid" : "ghost"}
            colorScheme={!is3D ? "brand" : "gray"}
            borderRadius="md 0 0 md"
            onClick={() => onToggle3D(false)}
          >
            <Icon as={IconMap2} boxSize={4} />
          </Button>
          <Button
            size="sm"
            variant={is3D ? "solid" : "ghost"}
            colorScheme={is3D ? "brand" : "gray"}
            borderRadius="0 md md 0"
            onClick={() => onToggle3D(true)}
          >
            <Icon as={IconMap} boxSize={4} />
          </Button>
        </HStack>
      </Box>

      {/* Map Container */}
      <Box
        ref={mapContainerRef}
        h="100%"
        w="100%"
        bg="gray.100"
        borderRadius="md"
        overflow="hidden"
      />

      {/* Loading indicator */}
      {!mapLoaded && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="white"
          p={4}
          borderRadius="md"
          shadow="md"
        >
          Loading {is3D ? '3D' : '2D'} map...
        </Box>
      )}

      {/* Instructions */}
      <Box
        position="absolute"
        bottom={4}
        left={4}
        bg="white"
        p={3}
        borderRadius="md"
        shadow="md"
        border="1px solid"
        borderColor="gray.200"
        maxW="300px"
        fontSize="sm"
      >
        <HStack spacing={2}>
          <Icon as={IconMap} boxSize={4} color="brand.500" />
          <Box>
            <Box fontWeight="medium" color="brand.600">
              Click on buildings
            </Box>
            <Box color="gray.600" fontSize="xs">
              {is3D ? '3D view: Click any building to see details' : '2D view: Click buildings on the map'}
            </Box>
          </Box>
        </HStack>
      </Box>
    </Box>
  );
};