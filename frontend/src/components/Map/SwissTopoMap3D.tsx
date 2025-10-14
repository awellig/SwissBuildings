import { useEffect, useRef, useState } from 'react';
import { Box, Button, HStack, Icon, useToast, VStack, Text } from '@chakra-ui/react';
import { IconMap, IconMap2, IconPointer } from '@tabler/icons-react';

interface SwissTopoMapProps {
  onBuildingClick: (building: any) => void;
  is3D: boolean;
  onToggle3D: (is3D: boolean) => void;
}

export const SwissTopoMap = ({ onBuildingClick, is3D, onToggle3D }: SwissTopoMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const toast = useToast();

  // swisstopo map configuration
  const getMapUrl = (is3DMode: boolean) => {
    const baseUrl = 'https://map.geo.admin.ch/embed.html';
    const params = new URLSearchParams({
      lang: 'en',
      topic: 'ech',
      bgLayer: 'ch.swisstopo.pixelkarte-farbe',
      layers: 'ch.bfs.gebaeude_wohnungs_register',
      layers_visibility: 'true',
      layers_timestamp: '9999',
      E: '2683000', // Bern coordinates
      N: '1247000',
      zoom: '12',
      clickable: 'true' // Enable click events
    });

    if (is3DMode) {
      params.set('3d', 'true');
      params.set('pitch', '-45');
      params.set('heading', '90');
    }

    return `${baseUrl}?${params.toString()}`;
  };

  useEffect(() => {
    loadMap();
    
    // Cleanup when component unmounts or dependencies change
    return () => {
      cleanupMap();
    };
  }, [is3D]);

  useEffect(() => {
    // Cleanup when component unmounts
    return () => {
      setIsDestroyed(true);
      cleanupMap();
    };
  }, []);

  const cleanupMap = () => {
    if (iframeRef.current) {
      // Remove event listeners and clean up iframe
      window.removeEventListener('message', handleMessage);
      if (mapContainerRef.current && mapContainerRef.current.contains(iframeRef.current)) {
        mapContainerRef.current.removeChild(iframeRef.current);
      }
      iframeRef.current = null;
    }
    setMapLoaded(false);
  };

  const loadMap = () => {
    if (!mapContainerRef.current || isDestroyed) return;

    // Clear previous content
    cleanupMap();
    mapContainerRef.current.innerHTML = '';

    // Create iframe for swisstopo map
    const iframe = document.createElement('iframe');
    iframe.src = getMapUrl(is3D);
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.allow = 'geolocation';
    iframe.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-forms');

    iframe.onload = () => {
      if (!isDestroyed) {
        setMapLoaded(true);
        iframeRef.current = iframe;
        setupClickHandling(iframe);
      }
    };

    iframeRef.current = iframe;
    mapContainerRef.current.appendChild(iframe);
  };

  const handleMessage = (event: MessageEvent) => {
    try {
      if (event.origin !== 'https://map.geo.admin.ch' || isDestroyed) return;

      const data = event.data;
      
      // Handle different types of map events
      if (data && (data.type === 'click' || data.type === 'feature-click')) {
        handleMapClick(data);
      }
    } catch (error) {
      console.error('Error handling message from iframe:', error);
    }
  };

  const setupClickHandling = (iframe: HTMLIFrameElement) => {
    // Listen for messages from the embedded map
    window.addEventListener('message', handleMessage);

    // Send configuration to enable click events
    setTimeout(() => {
      if (iframe.contentWindow && !isDestroyed) {
        iframe.contentWindow.postMessage({
          type: 'configure',
          enableFeatureClick: true,
          layers: ['ch.bfs.gebaeude_wohnungs_register']
        }, 'https://map.geo.admin.ch');
      }
    }, 2000);
  };

  const handleMapClick = async (data: any) => {
    if (isDestroyed) return;
    
    try {
      let egid = null;
      let coordinates = null;

      // Extract EGID from different possible data structures
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        egid = feature.properties?.EGID || feature.attributes?.EGID || feature.featureId;
        coordinates = feature.geometry?.coordinates;
      } else if (data.feature) {
        egid = data.feature.properties?.EGID || data.feature.attributes?.EGID;
        coordinates = data.feature.geometry?.coordinates;
      } else if (data.EGID) {
        egid = data.EGID;
      }

      if (egid && !isDestroyed) {
        console.log('Building clicked - EGID:', egid);
        
        // Try to fetch building from our backend first
        let buildingData = await fetchBuildingByEGID(egid);
        
        if (!buildingData) {
          // If not found, create a placeholder with the EGID
          buildingData = {
            type: 'Feature',
            properties: {
              EGID: egid,
              name: `Building ${egid}`,
              address: 'Loading address...',
              buildingType: 'Unknown',
              constructionYear: new Date().getFullYear(),
              floors: 1,
              area: 100
            },
            geometry: {
              type: 'Point',
              coordinates: coordinates || [8.0, 47.0]
            }
          };
        }

        onBuildingClick(buildingData);
        
        if (!isDestroyed) {
          try {
            toast({
              title: 'Building Selected',
              description: `EGID: ${egid}`,
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
          } catch (error) {
            console.error('Error showing toast:', error);
          }
        }
      } else if (!isDestroyed) {
        console.log('Map clicked but no building EGID found:', data);
        try {
          toast({
            title: 'No building selected',
            description: 'Please click directly on a building to view its details.',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          console.error('Error showing toast:', error);
        }
      }
    } catch (error) {
      console.error('Error handling map click:', error);
      if (!isDestroyed) {
        try {
          toast({
            title: 'Error',
            description: 'Failed to process building selection.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } catch (toastError) {
          console.error('Error showing error toast:', toastError);
        }
      }
    }
  };

  const fetchBuildingByEGID = async (egid: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/buildings/${egid}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching building by EGID:', error);
      return null;
    }
  };

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
        shadow="lg"
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
            leftIcon={<Icon as={IconMap2} />}
          >
            2D
          </Button>
          <Button
            size="sm"
            variant={is3D ? "solid" : "ghost"}
            colorScheme={is3D ? "brand" : "gray"}
            borderRadius="0 md md 0"
            onClick={() => onToggle3D(true)}
            leftIcon={<Icon as={IconMap} />}
          >
            3D
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
        <VStack
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="white"
          p={6}
          borderRadius="lg"
          shadow="lg"
          spacing={3}
        >
          <Box
            w={8}
            h={8}
            border="2px solid"
            borderColor="brand.200"
            borderTopColor="brand.500"
            borderRadius="full"
            animation="spin 1s linear infinite"
          />
          <Text color="gray.700">
            Loading {is3D ? '3D' : '2D'} Swiss Buildings Map...
          </Text>
        </VStack>
      )}

      {/* Instructions */}
      <Box
        position="absolute"
        bottom={4}
        left={4}
        bg="white"
        p={4}
        borderRadius="lg"
        shadow="lg"
        border="1px solid"
        borderColor="gray.200"
        maxW="320px"
      >
        <VStack align="start" spacing={2}>
          <HStack spacing={2}>
            <Icon as={IconPointer} boxSize={5} color="brand.500" />
            <Text fontWeight="semibold" color="brand.600" fontSize="sm">
              Interactive Building Selection
            </Text>
          </HStack>
          <Text color="gray.600" fontSize="xs" lineHeight="1.4">
            {is3D 
              ? '🏢 Click on any building in the 3D view to access detailed information including energy data, environmental metrics, and solar potential.'
              : '🗺️ Click on buildings in the 2D map to view comprehensive building analytics powered by swissBUILDINGS3D data.'
            }
          </Text>
          <HStack spacing={4} fontSize="xs" color="gray.500">
            <Text>• Real-time data</Text>
            <Text>• EGID integration</Text>
            <Text>• Multi-source analytics</Text>
          </HStack>
        </VStack>
      </Box>

      {/* Attribution */}
      <Box
        position="absolute"
        bottom={4}
        right={4}
        bg="white"
        px={3}
        py={1}
        borderRadius="md"
        shadow="sm"
        border="1px solid"
        borderColor="gray.200"
        fontSize="xs"
        color="gray.600"
      >
        © swisstopo
      </Box>
    </Box>
  );
};