import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
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
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Spinner,
  List,
  ListItem,
} from '@chakra-ui/react';
import { 
  IconLayersLinked, 
  IconChevronLeft,
  IconChevronRight,
  IconGripVertical,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import { GeoJSON } from 'ol/format';
import { Style, Fill, Stroke } from 'ol/style';
import { Control } from 'ol/control';

interface OpenLayersSwissMapProps {
  onBuildingClick: (building: any) => void;
}

export const OpenLayersSwissMap: React.FC<OpenLayersSwissMapProps> = ({ 
  onBuildingClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const layersRef = useRef<globalThis.Map<string, TileLayer<XYZ>>>(new globalThis.Map());
  const vectorLayersRef = useRef<globalThis.Map<string, VectorLayer<VectorSource>>>(new globalThis.Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState('color');
  const [overlayLayers, setOverlayLayers] = useState({
    buildings: true,
    names: false,
    transport: false,
    boundaries: false
  });
  const [panelPosition, setPanelPosition] = useState({ x: 80, y: 20 }); // Moved right to avoid zoom controls
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { isOpen: isPanelOpen, onToggle: onTogglePanel } = useDisclosure({ defaultIsOpen: false });
  const toast = useToast();

  // Handle panel dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panelPosition.x,
      y: e.clientY - panelPosition.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    setPanelPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Address search functionality
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api3.geo.admin.ch/rest/services/api/SearchServer?` +
        `searchText=${encodeURIComponent(query)}&` +
        `type=locations&` +
        `origins=address,zipcode,gg25&` +
        `limit=10&` +
        `sr=3857&` +
        `lang=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        setShowResults(true);
      } else {
        console.error('Search API error:', response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddressSelect = (result: any) => {
    const { x, y } = result.attrs;
    if (mapInstanceRef.current && x && y) {
      const view = mapInstanceRef.current.getView();
      view.setCenter([x, y]);
      view.setZoom(16); // Zoom in to show the selected location
      
      setSearchQuery(result.attrs.label.replace(/<[^>]*>/g, '')); // Remove HTML tags
      setShowResults(false);
      
      toast({
        title: 'Location found',
        description: `Zoomed to: ${result.attrs.label.replace(/<[^>]*>/g, '')}`,
        status: 'success',
        duration: 3000,
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  // Handle search input changes with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchAddresses(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.vec25-gebaeude/default/current/3857/{z}/{x}/{y}.png'
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
        opacity: 1.0, // Full opacity for building footprints
        source: new XYZ({
          url: overlayLayerConfigs.buildings.url,
          maxZoom: 18,
          minZoom: 10, // Buildings only visible at zoom 10 and higher
        }),
        visible: overlayLayers.buildings,
        minZoom: 10, // Enforce minimum zoom for building visibility
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

      // Create custom home control
      const homeControl = new Control({
        element: (() => {
          const button = document.createElement('button');
          button.innerHTML = '🏠'; // Home icon
          button.className = 'ol-control ol-unselectable';
          button.title = 'Zoom to Switzerland';
          button.style.cssText = `
            position: absolute;
            top: 65px;
            left: 0.5em;
            background: rgba(255,255,255,.8);
            border: none;
            border-radius: 2px;
            font-size: 14px;
            cursor: pointer;
            padding: 5px;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
          `;
          
          button.addEventListener('click', () => {
            const view = map.getView();
            view.animate({
              center: fromLonLat([7.4474, 46.9480]), // Bern coordinates
              zoom: 8, // Zoom level to see all of Switzerland
              duration: 1000,
            });
          });
          
          const controlDiv = document.createElement('div');
          controlDiv.appendChild(button);
          return controlDiv;
        })(),
      });

      // Add the home control to the map
      map.addControl(homeControl);

      // Store layer references for dynamic control
      layersRef.current.set('background', backgroundLayer);
      layersRef.current.set('buildings', buildingsLayer);

      // Add click handler for building identification
      map.on('singleclick', async (event) => {
        try {
          const coordinate = event.coordinate;
          const [x, y] = coordinate;
          
          // Get current zoom level for debugging
          const currentZoom = map.getView().getZoom();
          console.log('Map clicked at coordinate:', coordinate, 'Zoom level:', currentZoom);
          
          // Get map view properties for API call
          const view = map.getView();
          const mapSize = map.getSize();
          if (!mapSize) return;
          
          const extent = view.calculateExtent(mapSize);
          
          // Call Swiss GeoAdmin identify API using Web Mercator coordinates
          const identifyUrl = `https://api3.geo.admin.ch/rest/services/api/MapServer/identify?` +
            `geometry=${x},${y}&` +
            `geometryType=esriGeometryPoint&` +
            `layers=all:ch.bfs.gebaeude_wohnungs_register&` +
            `mapExtent=${extent.join(',')}&` +
            `imageDisplay=${mapSize[0]},${mapSize[1]},96&` +
            `tolerance=25&` +
            `returnGeometry=true&` +
            `geometryFormat=geojson&` +
            `sr=3857&` +
            `lang=en`;

          console.log('Calling identify API:', identifyUrl);
          
          const response = await fetch(identifyUrl);
          
          if (!response.ok) {
            console.error('API response not OK:', response.status, response.statusText);
            toast({
              title: 'Error',
              description: `API request failed: ${response.status}`,
              status: 'error',
              duration: 3000,
            });
            return;
          }
          
          const data = await response.json();
          
          console.log('Identify API response:', data);

          if (data.results && data.results.length > 0) {
            const feature = data.results[0];
            
            // Highlight the building polygon if geometry is available
            if (feature.geometry) {
              try {
                const geoJsonFormat = new GeoJSON();
                const olFeature = geoJsonFormat.readFeature(feature.geometry, {
                  dataProjection: 'EPSG:3857',
                  featureProjection: 'EPSG:3857'
                });
                
                // Create highlight layer if it doesn't exist
                let highlightLayer = vectorLayersRef.current.get('highlight');
                if (!highlightLayer) {
                  const highlightSource = new VectorSource();
                  highlightLayer = new VectorLayer({
                    source: highlightSource,
                    style: new Style({
                      fill: new Fill({
                        color: 'rgba(255, 0, 0, 0.3)' // Red with transparency
                      }),
                      stroke: new Stroke({
                        color: '#ff0000',
                        width: 2
                      })
                    }),
                    zIndex: 1000
                  });
                  map.addLayer(highlightLayer);
                  vectorLayersRef.current.set('highlight', highlightLayer);
                }
                
                // Clear previous highlights and add new one
                const highlightSource = highlightLayer.getSource();
                if (highlightSource) {
                  highlightSource.clear();
                  
                  // Handle both single feature and feature array
                  if (Array.isArray(olFeature)) {
                    olFeature.forEach(f => highlightSource.addFeature(f));
                    if (olFeature.length > 0) {
                      const geometry = olFeature[0].getGeometry();
                      if (geometry) {
                        const extent = geometry.getExtent();
                        map.getView().fit(extent, {
                          padding: [50, 50, 50, 50],
                          maxZoom: 18,
                          duration: 500
                        });
                      }
                    }
                  } else {
                    highlightSource.addFeature(olFeature);
                    const geometry = olFeature.getGeometry();
                    if (geometry) {
                      const extent = geometry.getExtent();
                      map.getView().fit(extent, {
                        padding: [50, 50, 50, 50],
                        maxZoom: 18,
                        duration: 500
                      });
                    }
                  }
                }
              } catch (geoError) {
                console.warn('Failed to highlight building geometry:', geoError);
              }
            }
            
            // Extract building data from Swiss Federal Building Registry
            const attrs = feature.attributes || feature.properties || {};
            const featureId = feature.featureId || feature.id;
            
            console.log('Building found - Feature:', feature);
            console.log('Building attributes:', attrs);
            console.log('Feature ID:', featureId);
            
            // Try to extract EGID from different possible locations
            const egid = attrs.egid || attrs.EGID || featureId || feature.layerBodId || 'Unknown';
            
            // Create enhanced building object with available data
            // Since Swiss building API might have different attribute names, we'll use fallbacks
            const buildingData = {
              type: 'Feature',
              properties: {
                EGID: egid,
                name: attrs.strname_deinr ? 
                  `${attrs.strname_deinr} ${attrs.deinr || ''}`.trim() : 
                  attrs.str_name || attrs.streetname || `Building ${egid}`,
                address: [
                  attrs.strname_deinr || attrs.str_name || attrs.streetname,
                  attrs.deinr || attrs.house_number,
                  attrs.plz4 || attrs.postcode || attrs.zip,
                  attrs.plzname || attrs.city || attrs.locality
                ].filter(Boolean).join(' ') || 'Address not available',
                buildingType: String(attrs.gklas || attrs.gkode || attrs.building_class || attrs.category || 'Building'),
                constructionYear: Number(attrs.gbauj || attrs.construction_year) || new Date().getFullYear(),
                floors: Number(attrs.gastw || attrs.floors || attrs.number_of_floors) || 1,
                area: Number(attrs.garea || attrs.floor_area || attrs.area) || 100,
                municipality: String(attrs.ggdenr || attrs.plzname || attrs.municipality || ''),
                zipCode: String(attrs.plz4 || attrs.postcode || attrs.zip || ''),
                // Store all available attributes for debugging
                rawAttributes: attrs,
                // Additional Swiss building register fields with fallbacks
                coordinates: attrs.gkoor_e && attrs.gkoor_n ? [attrs.gkoor_e, attrs.gkoor_n] : [x, y],
                status: attrs.gstat || attrs.status || 'Active',
                category: attrs.gkat || attrs.category || 'Building'
              },
              geometry: feature.geometry || {
                type: 'Point',
                coordinates: [x, y]
              }
            };

            console.log('Processed building data:', buildingData);

            onBuildingClick(buildingData);
            
            toast({
              title: 'Swiss Building Selected',
              description: `EGID: ${egid} - ${buildingData.properties.name}`,
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
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

  return (
    <Box h="100%" w="100%" position="relative">
      {/* Address Search Bar */}
      <Box
        position="absolute"
        top={4}
        right={4}
        zIndex={1001}
        w={{ base: "280px", md: "350px" }}
        ref={searchRef}
      >
        <InputGroup size="md">
          <InputLeftElement pointerEvents="none">
            <Icon as={IconSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search for addresses, places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg="white"
            borderRadius="lg"
            shadow="lg"
            border="1px solid"
            borderColor="gray.200"
            _focus={{
              borderColor: "brand.500",
              boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
            }}
          />
          <InputRightElement>
            {isSearching ? (
              <Spinner size="sm" color="brand.500" />
            ) : searchQuery ? (
              <IconButton
                aria-label="Clear search"
                icon={<Icon as={IconX} />}
                size="sm"
                variant="ghost"
                onClick={clearSearch}
              />
            ) : null}
          </InputRightElement>
        </InputGroup>

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <List
            position="absolute"
            top="100%"
            left={0}
            right={0}
            bg="white"
            borderRadius="lg"
            shadow="lg"
            border="1px solid"
            borderColor="gray.200"
            mt={2}
            maxH="300px"
            overflowY="auto"
            zIndex={1002}
          >
            {searchResults.map((result, index) => (
              <ListItem
                key={index}
                p={3}
                cursor="pointer"
                _hover={{ bg: "gray.50" }}
                borderBottom={index < searchResults.length - 1 ? "1px solid" : "none"}
                borderColor="gray.100"
                onClick={() => handleAddressSelect(result)}
              >
                <Text
                  fontSize="sm"
                  dangerouslySetInnerHTML={{ __html: result.attrs.label }}
                />
                {result.attrs.detail && (
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    {result.attrs.detail}
                  </Text>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Layer Control Panel */}
      <Box
        position="absolute"
        top={`${panelPosition.y}px`}
        left={`${panelPosition.x}px`}
        zIndex={1000}
        bg="white"
        borderRadius="lg"
        shadow="lg"
        border="1px solid"
        borderColor="gray.200"
        minW="280px"
        cursor={isDragging ? 'grabbing' : 'default'}
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

        {/* Panel Toggle Button with Drag Handle */}
        <HStack 
          justify="space-between" 
          p={3} 
          borderTop={isPanelOpen ? "1px solid" : "none"} 
          borderColor="gray.200"
          onMouseDown={handleMouseDown}
          cursor="grab"
          _active={{ cursor: 'grabbing' }}
        >
          <HStack spacing={2}>
            <Icon as={IconGripVertical} boxSize={4} color="gray.400" />
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
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking toggle
          />
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