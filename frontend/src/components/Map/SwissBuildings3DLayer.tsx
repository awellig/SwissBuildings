import React, { useEffect, useRef } from 'react';
import { Box } from '@chakra-ui/react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke } from 'ol/style';

interface SwissBuildings3DLayerProps {
  onBuildingClick: (building: any) => void;
}

export const SwissBuildings3DLayer: React.FC<SwissBuildings3DLayerProps> = ({ onBuildingClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorLayerRef = useRef<VectorLayer<VectorSource>>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Create background layer (aerial imagery)
    const backgroundLayer = new TileLayer({
      source: new XYZ({
        url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg',
        maxZoom: 18,
      }),
    });

    // Create vector layer for buildings
    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(0, 128, 0, 0.3)' }),
        stroke: new Stroke({ color: '#008000', width: 1 }),
      }),
    });

    // Create map instance
    const map = new Map({
      target: mapRef.current,
      layers: [backgroundLayer, vectorLayer],
      view: new View({
        center: fromLonLat([7.4474, 46.9480]), // Bern
        zoom: 14,
        minZoom: 6,
        maxZoom: 18,
      }),
    });
    mapInstanceRef.current = map;

    // Fetch buildings for current view
    const fetchBuildings = async () => {
      const view = map.getView();
      const extent = view.calculateExtent(map.getSize());
      // Convert extent to LV95 (EPSG:2056) for API
      // For simplicity, use Web Mercator for now
      const bbox = extent.join(',');
      const url = `https://api3.geo.admin.ch/rest/services/api/MapServer/identify?geometryType=esriGeometryEnvelope&geometry=${bbox}&imageDisplay=800,600,96&mapExtent=${bbox}&tolerance=0&layers=all:ch.swisstopo.swissbuildings3d&geometryFormat=geojson&returnGeometry=true&sr=3857&lang=en`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const features = new GeoJSON().readFeatures({
          type: 'FeatureCollection',
          features: data.results.map((r: any) => r.geometry)
        }, {
          featureProjection: 'EPSG:3857'
        });
        vectorSource.clear();
        vectorSource.addFeatures(features);
      } else {
        vectorSource.clear();
      }
    };

    fetchBuildings();
    map.on('moveend', fetchBuildings);

    // Click handler for building selection
    map.on('singleclick', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (f) => f);
      if (feature) {
        const props = feature.getProperties();
        onBuildingClick(props);
      }
    });

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, [onBuildingClick]);

  return (
    <Box ref={mapRef} h="100%" w="100%" borderRadius="md" overflow="hidden" />
  );
}
