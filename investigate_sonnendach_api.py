#!/usr/bin/env python3
"""
Enhanced Swiss Sonnendach API Investigation
Deep dive into finding the correct SFOE Sonnendach API endpoints and layer names.
"""

import requests
import json
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional
import urllib.parse

class SonnendachAPIInvestigator:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
    def investigate_geoadmin_layers(self):
        """Investigate available layers in the GeoAdmin API."""
        print("🔍 Investigating GeoAdmin API layers...")
        
        try:
            # Get layer information from GeoAdmin REST API
            url = "https://api3.geo.admin.ch/rest/services/api/MapServer"
            response = self.session.get(url, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ GeoAdmin API accessible. Found {len(data.get('layers', []))} layers")
                
                # Look for solar/sonnendach related layers
                solar_layers = []
                for layer in data.get('layers', []):
                    layer_id = layer.get('layerId', '')
                    layer_name = layer.get('name', '')
                    if any(keyword in layer_id.lower() for keyword in ['solar', 'sonnendach', 'bfe', 'energie']):
                        solar_layers.append({
                            'id': layer_id,
                            'name': layer_name,
                            'type': layer.get('type', 'unknown')
                        })
                
                print(f"\n🌞 Found {len(solar_layers)} potential solar-related layers:")
                for layer in solar_layers:
                    print(f"   📋 {layer['id']} - {layer['name']} ({layer['type']})")
                
                return solar_layers
            else:
                print(f"❌ GeoAdmin API failed: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ Error investigating layers: {e}")
            return []
    
    def test_layer_capabilities(self, layer_id: str):
        """Test specific layer capabilities and data availability."""
        print(f"\n🧪 Testing layer: {layer_id}")
        
        try:
            # Test layer info endpoint
            url = f"https://api3.geo.admin.ch/rest/services/api/MapServer/{layer_id}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Layer info accessible")
                print(f"   📄 Description: {data.get('description', 'N/A')}")
                print(f"   🗂️  Type: {data.get('type', 'N/A')}")
                print(f"   📐 Geometry Type: {data.get('geometryType', 'N/A')}")
                
                # Test with sample coordinates (Bern area)
                test_coords = [605075.4, 197225.3]  # Same as your logs
                self.test_layer_identify(layer_id, test_coords)
                
            else:
                print(f"   ❌ Layer info failed: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error testing layer: {e}")
    
    def test_layer_identify(self, layer_id: str, coords: List[float]):
        """Test identify API with specific layer and coordinates."""
        print(f"   🎯 Testing identify at coordinates {coords}")
        
        try:
            url = "https://api3.geo.admin.ch/rest/services/api/MapServer/identify"
            params = {
                'geometry': f"{coords[0]},{coords[1]}",
                'geometryType': 'esriGeometryPoint',
                'layers': f"all:{layer_id}",
                'mapExtent': f"{coords[0]-500},{coords[1]-500},{coords[0]+500},{coords[1]+500}",
                'imageDisplay': '500,500,96',
                'tolerance': '100',
                'returnGeometry': 'true',
                'geometryFormat': 'geojson',
                'sr': '2056',  # LV95
                'lang': 'en'
            }
            
            response = self.session.get(url, params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                print(f"   ✅ Identify successful: {len(results)} results")
                
                if results:
                    # Show first result details
                    result = results[0]
                    attrs = result.get('attributes', {})
                    print(f"   📋 Sample result attributes:")
                    for key, value in list(attrs.items())[:5]:  # Show first 5 attributes
                        print(f"      • {key}: {value}")
                    if len(attrs) > 5:
                        print(f"      ... and {len(attrs) - 5} more attributes")
                else:
                    print(f"   ⚠️  No data found at test coordinates")
            else:
                print(f"   ❌ Identify failed: {response.status_code}")
                if response.text:
                    print(f"   📝 Response: {response.text[:200]}...")
                    
        except Exception as e:
            print(f"   ❌ Identify error: {e}")
    
    def investigate_wms_layers(self):
        """Investigate WMS capabilities for solar layers."""
        print("\n🗺️  Investigating WMS capabilities...")
        
        try:
            url = "https://wms.geo.admin.ch/"
            params = {
                'SERVICE': 'WMS',
                'REQUEST': 'GetCapabilities',
                'VERSION': '1.3.0'
            }
            
            response = self.session.get(url, params=params, timeout=15)
            
            if response.status_code == 200:
                # Parse XML response
                root = ET.fromstring(response.content)
                
                # Find layer elements
                layers = []
                for layer in root.iter():
                    if 'Layer' in layer.tag:
                        name_elem = layer.find('.//{http://www.opengis.net/wms}Name')
                        title_elem = layer.find('.//{http://www.opengis.net/wms}Title')
                        
                        if name_elem is not None and name_elem.text:
                            name = name_elem.text
                            title = title_elem.text if title_elem is not None else ''
                            
                            # Look for solar/energy related layers
                            if any(keyword in name.lower() for keyword in ['solar', 'sonnendach', 'bfe', 'energie']):
                                layers.append({'name': name, 'title': title})
                
                print(f"✅ WMS capabilities parsed. Found {len(layers)} solar-related layers:")
                for layer in layers:
                    print(f"   🌞 {layer['name']} - {layer['title']}")
                
                return layers
            else:
                print(f"❌ WMS GetCapabilities failed: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ WMS investigation error: {e}")
            return []
    
    def test_alternative_endpoints(self):
        """Test alternative API endpoints that might have solar data."""
        print("\n🔄 Testing alternative API endpoints...")
        
        # Test different base URLs
        endpoints = [
            "https://api3.geo.admin.ch/rest/services/ech/MapServer",
            "https://api3.geo.admin.ch/rest/services/all/MapServer", 
            "https://www.uvek-gis.admin.ch/BFE/sonnendach",
            "https://map.geo.admin.ch/services/solarkataster",
        ]
        
        for endpoint in endpoints:
            print(f"\n🧪 Testing: {endpoint}")
            try:
                response = self.session.get(endpoint, timeout=10)
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    # Try to detect if it's JSON or HTML
                    content_type = response.headers.get('content-type', '').lower()
                    if 'json' in content_type:
                        try:
                            data = response.json()
                            print(f"   ✅ JSON response with {len(str(data))} characters")
                        except:
                            print(f"   📄 Response length: {len(response.text)} characters")
                    else:
                        print(f"   📄 Content-Type: {content_type}")
                        print(f"   📄 Response length: {len(response.text)} characters")
                
            except Exception as e:
                print(f"   ❌ Error: {e}")
    
    def search_for_correct_layer_name(self):
        """Search through known Swiss solar data layer names."""
        print("\n🔍 Testing known solar layer variations...")
        
        # Common variations of Sonnendach layer names
        layer_variations = [
            "ch.bfe.sonnendach",
            "ch.bfe.sonnendach-potentiale", 
            "ch.bfe.sonnendach-eigenverbrauch",
            "ch.bfe.solar-potentiale",
            "ch.bfe.solar",
            "ch.sfoe.sonnendach",
            "ch.uvek.sonnendach",
            "ch.admin.sonnendach",
            "ch.energie.sonnendach",
            "ch.bfe.solarkataster"
        ]
        
        test_coords = [605075.4, 197225.3]  # Same coordinates as your backend
        
        for layer_name in layer_variations:
            print(f"\n🧪 Testing layer: {layer_name}")
            self.test_layer_identify_simple(layer_name, test_coords)
    
    def test_layer_identify_simple(self, layer_id: str, coords: List[float]):
        """Simple identify test for a layer."""
        try:
            url = "https://api3.geo.admin.ch/rest/services/api/MapServer/identify"
            params = {
                'geometry': f"{coords[0]},{coords[1]}",
                'geometryType': 'esriGeometryPoint',
                'layers': f"all:{layer_id}",
                'mapExtent': f"{coords[0]-100},{coords[1]-100},{coords[0]+100},{coords[1]+100}",
                'imageDisplay': '200,200,96',
                'tolerance': '50',
                'returnGeometry': 'true',
                'sr': '2056',
                'lang': 'en'
            }
            
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                if results:
                    print(f"   ✅ SUCCESS! Found {len(results)} results")
                    result = results[0]
                    attrs = result.get('attributes', {})
                    print(f"   📋 Attributes: {list(attrs.keys())[:10]}")  # Show first 10 keys
                    return True
                else:
                    print(f"   ⚠️  Layer exists but no data at coordinates")
            else:
                print(f"   ❌ HTTP {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)[:100]}...")
        
        return False
    
    def run_full_investigation(self):
        """Run comprehensive investigation of Sonnendach API."""
        print("🇨🇭 COMPREHENSIVE SONNENDACH API INVESTIGATION")
        print("=" * 60)
        
        # 1. Check available layers
        layers = self.investigate_geoadmin_layers()
        
        # 2. Test specific solar layers found
        for layer in layers[:3]:  # Test first 3 solar layers
            self.test_layer_capabilities(layer['id'])
        
        # 3. Check WMS capabilities
        wms_layers = self.investigate_wms_layers()
        
        # 4. Test known layer name variations
        self.search_for_correct_layer_name()
        
        # 5. Test alternative endpoints
        self.test_alternative_endpoints()
        
        print("\n" + "=" * 60)
        print("🏁 INVESTIGATION COMPLETE")
        print("=" * 60)

def main():
    investigator = SonnendachAPIInvestigator()
    investigator.run_full_investigation()

if __name__ == "__main__":
    main()