const FOOD_IMAGE_MAP = {
  // Beverages
  'lime': 'photo-1544787219-7f47ccb76574',
  'lemon': 'photo-1544787219-7f47ccb76574',
  'soda': 'photo-1544787219-7f47ccb76574',
  'coffee': 'photo-1495474472287-4d71bcdd2085',
  'cappuccino': 'photo-1495474472287-4d71bcdd2085',
  'latte': 'photo-1495474472287-4d71bcdd2085',
  'tea': 'photo-1576092768241-dec231879fc3',
  'chai': 'photo-1576092768241-dec231879fc3',
  'shake': 'photo-1579954115545-a95591f28bfc',
  'smoothie': 'photo-1553530666-ba11a7da3888',
  'juice': 'photo-1621506289937-a8e4df240d0b',
  'mocktail': 'photo-1536935338788-846bb9981813',
  'beer': 'photo-1505075102175-d8352214bb5e',
  'wine': 'photo-1510812431401-41d2bd2722f3',
  'whiskey': 'photo-1527061011665-3652c757a4d4',
  'cola': 'photo-1622483767028-3f66f32aef97',
  'pepsi': 'photo-1622483767028-3f66f32aef97',
  'coke': 'photo-1622483767028-3f66f32aef97',
  'sprite': 'photo-1622483767028-3f66f32aef97',
  'fanta': 'photo-1622483767028-3f66f32aef97',
  'beverage': 'photo-1622483767028-3f66f32aef97',
  'drink': 'photo-1544787219-7f47ccb76574',

  // Starters / Fast Food
  'burger': 'photo-1568901346375-23c9450c58cd',
  'sandwich': 'photo-1528735602780-2552fd46c7af',
  'fries': 'photo-1573080496219-bb080dd4f877',
  'pizza': 'photo-1513104890138-7c749659a591',
  'pasta': 'photo-1563379091339-03b21ab4a4f8',
  'lasagna': 'photo-1551183053-bf91a1d81141',
  'spaghetti': 'photo-1551183053-bf91a1d81141',
  'macaroni': 'photo-1546549032-9571cd6b27df',
  'noodle': 'photo-1585032226651-759b368d7246',
  'chow mein': 'photo-1585032226651-759b368d7246',
  'roll': 'photo-1623341214825-9f4f963727da',
  'spring roll': 'photo-1608897013039-887f21d8c804',
  'soup': 'photo-1547592165-e1d17f97a15a',
  'salad': 'photo-1512621776951-a57141f2eefd',
  'bruschetta': 'photo-1574071318508-1cdbab80d002',
  'starter': 'photo-1563245372-f21724e3856d',
  'nachos': 'photo-1513456852971-30c0b8199d4d',
  'taco': 'photo-1565299585323-38d6b0865b47',
  'garlic bread': 'photo-1608897013039-887f21d8c804',
  'breadsticks': 'photo-1608897013039-887f21d8c804',
  'focaccia': 'photo-1595295333158-4742f28fbd85',

  // Indian Mains
  'biryani': 'photo-1563379091339-03b21ab4a4f8',
  'pulao': 'photo-1626777552726-4a6b54c97e46',
  'rice': 'photo-1596797038530-2c107229654b',
  'butter chicken': 'photo-1588166524941-3bf61a9c41db',
  'tikka': 'photo-1599487488170-d11ec9c172f0',
  'paneer': 'photo-1601050690597-df056fb4ce78',
  'dal': 'photo-1546833999-b9f581a1996d',
  'makhani': 'photo-1546833999-b9f581a1996d',
  'roti': 'photo-1589301760014-d929f3979dbc',
  'naan': 'photo-1633945274405-b6c8069047b0',
  'paratha': 'photo-1633945274405-b6c8069047b0',
  'kulcha': 'photo-1633945274405-b6c8069047b0',
  'curry': 'photo-1626596147718-f1e405f63a2a',
  'kofta': 'photo-1625398407796-82650a8c135f',
  'masala': 'photo-1626596147718-f1e405f63a2a',
  'korma': 'photo-1626596147718-f1e405f63a2a',
  'chole': 'photo-1627308595229-7830a5c91f9f',
  'bhature': 'photo-1627308595229-7830a5c91f9f',

  // South Indian
  'dosa': 'photo-1668236543090-82eba5ee5976',
  'idli': 'photo-1589301760014-d929f3979dbc',
  'vada': 'photo-1589301760014-d929f3979dbc',
  'sambar': 'photo-1589301760014-d929f3979dbc',
  'uttapam': 'photo-1668236543090-82eba5ee5976',

  // Desserts
  'waffle': 'photo-1506084868230-bb9d95c24759',
  'pancake': 'photo-1567620905732-2d1ec7ab7445',
  'crepe': 'photo-1519676867240-f03562e64548',
  'brownie': 'photo-1606313564200-e75d5e30476c',
  'cake': 'photo-1587314168485-3236d6710814',
  'cupcake': 'photo-1563729784474-d77dbb933a9e',
  'cheesecake': 'photo-1565958011703-44f9829ba187',
  'pie': 'photo-1519869325930-281384150729',
  'ice cream': 'photo-1501443721117-397a2dcfd285',
  'sundae': 'photo-1572490122747-3968b75cc699',
  'donut': 'photo-1551024601-bec78aea704b',
  'macaron': 'photo-1569864358642-9d1684040f43',
  'muffin': 'photo-1607958996333-41aef7caefaa',
  'gulab jamun': 'photo-1610192244261-3f33de3f55e4',
  'kulfi': 'photo-1556910103-1c02745aae4d',
  'halwa': 'photo-1610192244261-3f33de3f55e4',
  'sweet': 'photo-1587314168485-3236d6710814',
  'dessert': 'photo-1551024601-bec78aea704b'
};

const DEFAULT_POOL = [
  'photo-1504674900247-0877df9cc836', // food table platter
  'photo-1555939594-58d7cb561ad1', // meat grill
  'photo-1567620905732-2d1ec7ab7445', // pancake
  'photo-1540189549336-e6e99c3679fe', // generic colorful plate
  'photo-1565299624946-b28f40a0ae38'  // pizza/pasta plate
];

function getFoodImageByName(name, category = '') {
  const n = name.toLowerCase();
  
  for (const [key, imageId] of Object.entries(FOOD_IMAGE_MAP)) {
    if (n.includes(key)) {
      return `https://images.unsplash.com/${imageId}?w=400&h=400&auto=format&fit=crop&q=80`;
    }
  }

  // Fallback by category
  if (category === 'Breads') {
    return `https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=400&auto=format&fit=crop&q=80`;
  } else if (category === 'Beverages') {
    return `https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&auto=format&fit=crop&q=80`;
  } else if (category === 'Desserts') {
    return `https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=400&auto=format&fit=crop&q=80`;
  }

  // Hash-based select from pool
  let charSum = 0;
  for (let i = 0; i < name.length; i++) {
    charSum += name.charCodeAt(i);
  }
  const imageId = DEFAULT_POOL[charSum % DEFAULT_POOL.length];
  return `https://images.unsplash.com/${imageId}?w=400&h=400&auto=format&fit=crop&q=80`;
}

module.exports = { getFoodImageByName };
