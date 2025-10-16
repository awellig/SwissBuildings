// Swiss building classification mapping (GKLAS codes)
// Based on Swiss Federal Statistical Office building classification

export const getSwissBuildingType = (gklas: any): string => {
  const code = String(gklas || '').trim();
  
  // Swiss GKLAS building classification codes
  const buildingTypes: { [key: string]: string } = {
    '1010': 'Single family house',
    '1020': 'Multi-family house',
    '1030': 'Apartment building',
    '1040': 'Terraced house',
    '1080': 'Residential building',
    '1121': 'Hotel',
    '1122': 'Motel',
    '1130': 'Other accommodation',
    '1211': 'Office building',
    '1212': 'Administrative building',
    '1220': 'Bank/Insurance building',
    '1230': 'Commercial building',
    '1231': 'Shopping center',
    '1241': 'Restaurant building',
    '1242': 'Bar/Pub building',
    '1251': 'Parking garage',
    '1252': 'Service station',
    '1261': 'Workshop building',
    '1262': 'Industrial building',
    '1263': 'Warehouse',
    '1264': 'Logistics building',
    '1271': 'Transport building',
    '1272': 'Communications building',
    '1273': 'Energy supply building',
    '1274': 'Water supply building',
    '1275': 'Waste disposal building',
    '1276': 'Infrastructure building',
    '1311': 'School building',
    '1312': 'University building',
    '1321': 'Healthcare building',
    '1322': 'Hospital',
    '1323': 'Care facility',
    '1331': 'Cultural building',
    '1332': 'Museum',
    '1333': 'Library',
    '1334': 'Religious building',
    '1335': 'Sports facility',
    '1341': 'Public building',
    '1342': 'Government building'
  };

  return buildingTypes[code] || code || 'Building';
};

export const getBuildingTypeBadgeColor = (gklas: any): string => {
  const buildingType = getSwissBuildingType(gklas).toLowerCase();
  
  if (buildingType.includes('residential') || buildingType.includes('family') || buildingType.includes('apartment')) {
    return 'orange';
  } else if (buildingType.includes('office') || buildingType.includes('administrative') || buildingType.includes('commercial')) {
    return 'blue';
  } else if (buildingType.includes('government') || buildingType.includes('public')) {
    return 'purple';
  } else if (buildingType.includes('school') || buildingType.includes('university') || buildingType.includes('education')) {
    return 'green';
  } else if (buildingType.includes('hotel') || buildingType.includes('restaurant') || buildingType.includes('accommodation')) {
    return 'teal';
  } else if (buildingType.includes('hospital') || buildingType.includes('healthcare') || buildingType.includes('care')) {
    return 'red';
  } else if (buildingType.includes('industrial') || buildingType.includes('warehouse') || buildingType.includes('workshop')) {
    return 'gray';
  } else if (buildingType.includes('cultural') || buildingType.includes('museum') || buildingType.includes('library') || buildingType.includes('religious')) {
    return 'pink';
  }
  
  return 'gray';
};

// Swiss canton abbreviation to full name mapping
export const getFullCantonName = (abbreviation: string): string => {
  const cantonMap: { [key: string]: string } = {
    'AG': 'Aargau',
    'AI': 'Appenzell Innerrhoden',
    'AR': 'Appenzell Ausserrhoden',
    'BE': 'Bern',
    'BL': 'Basel-Landschaft',
    'BS': 'Basel-Stadt',
    'FR': 'Fribourg',
    'GE': 'Geneva',
    'GL': 'Glarus',
    'GR': 'Graubünden',
    'JU': 'Jura',
    'LU': 'Lucerne',
    'NE': 'Neuchâtel',
    'NW': 'Nidwalden',
    'OW': 'Obwalden',
    'SG': 'St. Gallen',
    'SH': 'Schaffhausen',
    'SO': 'Solothurn',
    'SZ': 'Schwyz',
    'TG': 'Thurgau',
    'TI': 'Ticino',
    'UR': 'Uri',
    'VD': 'Vaud',
    'VS': 'Valais',
    'ZG': 'Zug',
    'ZH': 'Zürich'
  };
  
  return cantonMap[abbreviation] || abbreviation;
};