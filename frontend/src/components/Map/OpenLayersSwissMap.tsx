import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Button, 
  HStack, 
  VStack,
  Icon, 
  useToast, 
  Text,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Divider,
  IconButton,
  Collapse,
  useDisclosure,
  FormControl,
  FormLabel,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react';
import { 
  IconMap, 
  IconMap2, 
  IconLayersLinked, 
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconEyeOff,
  IconSettings 
} from '@tabler/icons-react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';

interface OpenLayersSwissMapProps {
  onBuildingClick: (building: any) => void;
  is3D: boolean;
  onToggle3D: (is3D: boolean) => void;
}

export const OpenLayersSwissMap: React.FC<OpenLayersSwissMapProps> = ({ 
  onBuildingClick, 
  is3D, 
  onToggle3D 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const layersRef = useRef<globalThis.Map<string, TileLayer<XYZ>>>(new globalThis.Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState('color');
  const [overlayLayers, setOverlayLayers] = useState({
    buildings: true,
    names: false,
    transport: false,
    boundaries: false
  });
  const { isOpen: isPanelOpen, onToggle: onTogglePanel } = useDisclosure({ defaultIsOpen: false });
  const toast = useToast();

  // Available background layers
  const backgroundLayers = {
    color: {
      name: 'Color Map',
      url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg'
    },
    gray: {
      name: 'Grayscale Map', 
      url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-grau/default/current/3857/{z}/{x}/{y}.jpeg'
    },
    aerial: {
      name: 'Aerial Imagery',
      url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg'
    },
    none: {
      name: 'No Background',
      url: ''
    }
  };

  // Available overlay layers
  const overlayLayerConfigs = {
    buildings: {
      name: 'Buildings & Constructions',
      url: 'https://wmts.geo.admin.ch/1.0.0/ch.bfs.gebaeude_wohnungs_register/default/current/3857/{z}/{x}/{y}.png'
    },
    names: {
      name: 'Geographic Names',
      url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissnames3d/default/current/3857/{z}/{x}/{y}.png'
    },
    transport: {
      name: 'Public Transport',
      url: 'https://wmts.geo.admin.ch/1.0.0/ch.bav.haltestellen-oev/default/current/3857/{z}/{x}/{y}.png'
    },
    boundaries: {
      name: 'Municipal Boundaries',
      url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill/default/current/3857/{z}/{x}/{y}.png'
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    try {
      // Create initial background layer (color map)
      const backgroundLayer = new TileLayer({
        source: new XYZ({
          url: backgroundLayers.color.url,
          maxZoom: 18,
        }),
      });

      // Create buildings layer (initially visible)
      const buildingsLayer = new TileLayer({
        opacity: 0.7,
        source: new XYZ({
          url: overlayLayerConfigs.buildings.url,
          maxZoom: 18,
        }),
        visible: overlayLayers.buildings,
      });

      // Create map instance centered on Switzerland
      const map = new Map({
        target: mapRef.current,
        layers: [backgroundLayer, buildingsLayer],
        view: new View({
          center: fromLonLat([7.4474, 46.9480]), // Bern coordinates in WGS84
          zoom: 12,
          minZoom: 6,
          maxZoom: 18,
        }),
      });

      // Store layer references for dynamic control
      layersRef.current.set('background', backgroundLayer);
      layersRef.current.set('buildings', buildingsLayer);

      // Add click handler for building identification
      map.on('singleclick', async (event) => {
        try {
          const coordinate = event.coordinate;
          const [x, y] = coordinate;
          
          // Get map view properties for API call
          const view = map.getView();
          const mapSize = map.getSize();
          if (!mapSize) return;
          
          const extent = view.calculateExtent(mapSize);
          
          // Call GeoAdmin identify API using Web Mercator coordinates
          const identifyUrl = `https://api3.geo.admin.ch/rest/services/api/MapServer/identify?` +
            `geometry=${x},${y}&` +
            `geometryType=esriGeometryPoint&` +
            `layers=all:ch.bfs.gebaeude_wohnungs_register&` +
            `mapExtent=${extent.join(',')}&` +
            `imageDisplay=${mapSize[0]},${mapSize[1]},96&` +
            `tolerance=5&` +
            `returnGeometry=true&` +
            `geometryFormat=geojson&` +
            `sr=3857&` +
            `lang=en`;

          console.log('Calling identify API:', identifyUrl);
          
          const response = await fetch(identifyUrl);
          const data = await response.json();
          
          console.log('Identify API response:', data);

          if (data.results && data.results.length > 0) {
            const feature = data.results[0];
            
            // Check multiple possible EGID attribute names
            const egid = feature.attributes?.egid || 
                        feature.attributes?.EGID || 
                        feature.attributes?.featureId ||
                        feature.featureId;
            
            console.log('Feature attributes:', feature.attributes);
            console.log('Looking for EGID, found:', egid);
            
            if (egid) {
              console.log('Building found - EGID:', egid);
              
              // Create building object compatible with existing interface
              const buildingData = {
                type: 'Feature',
                properties: {
                  EGID: egid,
                  name: `Building ${egid}`,
                  address: feature.attributes?.str_nr_obj || feature.attributes?.address || 'Address loading...',
                  buildingType: feature.attributes?.gkode || feature.attributes?.buildingType || 'Unknown',
                  constructionYear: feature.attributes?.gbauj || feature.attributes?.year || new Date().getFullYear(),
                  floors: feature.attributes?.gastw || feature.attributes?.floors || 1,
                  area: feature.attributes?.garea || feature.attributes?.area || 100,
                  municipality: feature.attributes?.ggdenr || feature.attributes?.municipality || '',
                  zipCode: feature.attributes?.gplz || feature.attributes?.zipCode || ''
                },
                geometry: feature.geometry || {
                  type: 'Point',
                  coordinates: [x, y]
                }
              };

              onBuildingClick(buildingData);
              
              toast({
                title: 'Building Selected',
                description: `EGID: ${egid} - ${buildingData.properties.address}`,
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
            } else {
              console.log('No EGID found in feature:', feature);
              console.log('Available attributes:', Object.keys(feature.attributes || {}));
              
              // Still show the feature was found, just without EGID
              const featureId = feature.featureId || 'Unknown';
              const buildingData = {
                type: 'Feature',
                properties: {
                  EGID: featureId,
                  name: `Building (${featureId})`,
                  address: feature.attributes?.str_nr_obj || 'Address not available',
                  buildingType: feature.layerName || 'Building',
                  constructionYear: new Date().getFullYear(),
                  floors: 1,
                  area: 100,
                  municipality: '',
                  zipCode: ''
                },
                geometry: feature.geometry || {
                  type: 'Point',
                  coordinates: [x, y]
                }
              };

              onBuildingClick(buildingData);
              
              toast({
                title: 'Building Selected',
                description: `Feature ID: ${featureId} (No EGID available)`,
                status: 'info',
                duration: 3000,
              });
            }
          } else {
            toast({
              title: 'No Building Found',
              description: 'No building found at this location. Try clicking directly on a building.',
              status: 'info',
              duration: 2000,
            });
          }
        } catch (error) {
          console.error('Error identifying building:', error);
          toast({
            title: 'Identification Error',
            description: 'Failed to identify building at this location.',
            status: 'error',
            duration: 3000,
          });
        }
      });

      // Change cursor on hover
      map.on('pointermove', (event) => {
        const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
        map.getTargetElement().style.cursor = feature ? 'pointer' : '';
      });

      mapInstanceRef.current = map;
      setIsLoaded(true);

      console.log('OpenLayers Swiss map initialized successfully');

    } catch (error) {
      console.error('Error initializing Swiss map:', error);
      toast({
        title: 'Map Loading Error',
        description: 'Failed to load the Swiss map. Please refresh the page.',
        status: 'error',
        duration: 5000,
      });
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, [onBuildingClick, toast]);

  // Handle background layer changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const backgroundLayer = layersRef.current.get('background');
    
    if (map && backgroundLayer) {
      if (selectedBackground === 'none') {
        backgroundLayer.setVisible(false);
      } else {
        backgroundLayer.setVisible(true);
        backgroundLayer.setSource(new XYZ({
          url: backgroundLayers[selectedBackground as keyof typeof backgroundLayers].url,
          maxZoom: 18,
        }));
      }
    }
  }, [selectedBackground, backgroundLayers]);

  // Handle overlay layer changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    
    if (map) {
      // Update buildings layer
      const buildingsLayer = layersRef.current.get('buildings');
      if (buildingsLayer) {
        buildingsLayer.setVisible(overlayLayers.buildings);
      }

      // Handle other overlay layers (add/remove dynamically)
      Object.entries(overlayLayers).forEach(([layerKey, isVisible]) => {
        if (layerKey === 'buildings') return; // Already handled above
        
        const existingLayer = layersRef.current.get(layerKey);
        
        if (isVisible && !existingLayer) {
          // Add new layer
          const newLayer = new TileLayer({
            opacity: 0.7,
            source: new XYZ({
              url: overlayLayerConfigs[layerKey as keyof typeof overlayLayerConfigs].url,
              maxZoom: 18,
            }),
            visible: true,
          });
          
          map.addLayer(newLayer);
          layersRef.current.set(layerKey, newLayer);
        } else if (!isVisible && existingLayer) {
          // Remove layer
          map.removeLayer(existingLayer);
          layersRef.current.delete(layerKey);
        }
      });
    }
  }, [overlayLayers, overlayLayerConfigs]);

  // Handle 3D toggle (for now just show info, later can integrate Cesium)
  const handle3DToggle = (enabled: boolean) => {
    if (enabled) {
      toast({
        title: '3D View',
        description: '3D building visualization will be available in a future update. Currently showing enhanced 2D view.',
        status: 'info',
        duration: 4000,
      });
    }
    onToggle3D(enabled);
  };

  return (
    <Box h="100%" w="100%" position="relative">
      {/* Layer Control Panel */}
      <Box
        position="absolute"
        top={4}
        left={4}
        zIndex={1000}
        bg="white"
        borderRadius="lg"
        shadow="lg"
        border="1px solid"
        borderColor="gray.200"
        minW="280px"
      >
        <Collapse in={isPanelOpen} animateOpacity>
          <VStack p={4} spacing={4} align="stretch">
            {/* Background Layers */}
            <Box>
              <Text fontWeight="bold" fontSize="sm" mb={2} color="gray.700">
                Background Layers
              </Text>
              <RadioGroup value={selectedBackground} onChange={setSelectedBackground}>
                <Stack spacing={2}>
                  {Object.entries(backgroundLayers).map(([key, layer]) => (
                    <Radio key={key} value={key} size="sm">
                      <Text fontSize="sm">{layer.name}</Text>
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>
            </Box>

            <Divider />

            {/* Overlay Layers */}
            <Box>
              <Text fontWeight="bold" fontSize="sm" mb={2} color="gray.700">
                Overlay Layers
              </Text>
              <Stack spacing={2}>
                {Object.entries(overlayLayerConfigs).map(([key, layer]) => (
                  <Checkbox
                    key={key}
                    isChecked={overlayLayers[key as keyof typeof overlayLayers]}
                    onChange={(e) => setOverlayLayers(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    size="sm"
                  >
                    <Text fontSize="sm">{layer.name}</Text>
                  </Checkbox>
                ))}
              </Stack>
            </Box>
          </VStack>
        </Collapse>

        {/* Panel Toggle Button */}
        <HStack justify="space-between" p={3} borderTop={isPanelOpen ? "1px solid" : "none"} borderColor="gray.200">
          <HStack spacing={2}>
            <Icon as={IconLayersLinked} boxSize={4} color="brand.500" />
            <Text fontWeight="semibold" fontSize="sm" color="brand.600">
              Map Layers
            </Text>
          </HStack>
          <IconButton
            aria-label={isPanelOpen ? "Close panel" : "Open panel"}
            icon={<Icon as={isPanelOpen ? IconChevronLeft : IconChevronRight} />}
            size="sm"
            variant="ghost"
            onClick={onTogglePanel}
          />
        </HStack>
      </Box>

      {/* 2D/3D Toggle */}
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
            onClick={() => handle3DToggle(false)}
            leftIcon={<Icon as={IconMap2} />}
          >
            2D
          </Button>
          <Button
            size="sm"
            variant={is3D ? "solid" : "ghost"}
            colorScheme={is3D ? "brand" : "gray"}
            borderRadius="0 md md 0"
            onClick={() => handle3DToggle(true)}
            leftIcon={<Icon as={IconMap} />}
          >
            3D
          </Button>
        </HStack>
      </Box>

      {/* Map Container */}
      <Box
        ref={mapRef}
        h="100%"
        w="100%"
        bg="gray.100"
        borderRadius="md"
        overflow="hidden"
        cursor="crosshair"
      />

      {/* Loading indicator */}
      {!isLoaded && (
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
            Loading Swiss Buildings Map...
          </Text>
        </VStack>
      )}
    </Box>
  );
};