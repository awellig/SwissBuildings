import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

interface BuildingMapProps {
  buildings: {
    type: 'FeatureCollection';
    features: BuildingFeature[];
  } | null;
  onBuildingClick: (building: BuildingFeature) => void;
  selectedBuilding: BuildingFeature | null;
}

const customMarkerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#259CE5"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const selectedMarkerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#E53E3E"/>
    </svg>
  `),
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

export const BuildingMap = ({ buildings, onBuildingClick, selectedBuilding }: BuildingMapProps) => {
  const [geoJsonKey, setGeoJsonKey] = useState(0);

  useEffect(() => {
    setGeoJsonKey(prev => prev + 1);
  }, [buildings, selectedBuilding]);

  const pointToLayer = (feature: any, latlng: L.LatLng) => {
    const isSelected = selectedBuilding?.properties.EGID === feature.properties.EGID;
    const icon = isSelected ? selectedMarkerIcon : customMarkerIcon;
    return L.marker(latlng, { icon });
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on('click', () => {
      onBuildingClick(feature);
    });

    // Add hover effects
    layer.on('mouseover', () => {
      layer.bindTooltip(
        `<strong>${feature.properties.name}</strong><br/>
         ${feature.properties.address}<br/>
         Type: ${feature.properties.buildingType}<br/>
         Year: ${feature.properties.constructionYear}`,
        {
          permanent: false,
          direction: 'top',
          className: 'custom-tooltip'
        }
      ).openTooltip();
    });
  };

  return (
    <Box h="100%" w="100%" position="relative">
      <MapContainer
        center={[46.8182, 8.2275]} // Center of Switzerland
        zoom={8}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Swiss Topo Base Map Alternative */}
        {/* <TileLayer
          attribution='&copy; <a href="https://www.swisstopo.admin.ch/">swisstopo</a>'
          url="https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg"
        /> */}

        {buildings && (
          <GeoJSON
            key={geoJsonKey}
            data={buildings}
            pointToLayer={pointToLayer}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      <style>
        {`
          .custom-tooltip {
            background: white !important;
            border: 1px solid #259CE5 !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            font-size: 12px !important;
            padding: 8px !important;
          }
          .custom-tooltip::before {
            border-top-color: #259CE5 !important;
          }
        `}
      </style>
    </Box>
  );
};