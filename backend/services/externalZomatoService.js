const fs = require('fs');
const path = require('path');
const { z } = require('zod');
require('dotenv').config();

const ZomatoResponseSchema = z.object({
  page_data: z.object({
    sections: z.object({
      SECTION_SEARCH_RESULT: z.array(
        z.object({
          type: z.string(),
          info: z.object({
            resId: z.number(),
            name: z.string(),
            cuisine: z.array(z.object({ name: z.string() })),
            rating: z.object({
              aggregate_rating: z.string().or(z.number())
            }),
            image: z.object({
              url: z.string()
            }).optional(),
            locality: z.object({
              name: z.string()
            }).optional()
          })
        })
      ).optional()
    }).optional()
  }).optional()
});

async function fetchAndMapZomatoRestaurants() {
  let rawData;
  const cookie = process.env.ZOMATO_COOKIE;
  const userAgent = process.env.ZOMATO_USER_AGENT || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

  if (cookie && cookie !== 'your_zomato_cookie_here') {
    try {
      console.log('🌐 Fetching real data from Zomato webroutes...');
      const response = await fetch('https://www.zomato.com/webroutes/getPage?page_url=/ncr/insta-worthy&location=&isMobile=0', {
        headers: {
          'cookie': cookie,
          'user-agent': userAgent,
          'accept': 'application/json',
          'content-type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Zomato API returned status: ${response.status}`);
      }
      rawData = await response.json();
    } catch (err) {
      console.error('Failed fetching real Zomato API, falling back to mock response:', err.message);
      rawData = loadMockResponse();
    }
  } else {
    rawData = loadMockResponse();
  }

  try {
    ZomatoResponseSchema.parse(rawData);
    console.log('✅ Zod Validation Passed: Third-party API payload matches schema!');
  } catch (validationErr) {
    console.error('❌ Zod Validation Failed:', validationErr.errors || validationErr.message);
    throw new Error('Invalid third-party API response structure');
  }

  const searchResults = rawData.page_data.sections.SECTION_SEARCH_RESULT || [];
  const mappedRestaurants = searchResults
    .filter(item => item.type === 'restaurant')
    .map(item => {
      const info = item.info;
      return {
        id: info.resId,
        name: info.name,
        cuisine: info.cuisine.map(c => c.name).join(', '),
        rating: parseFloat(info.rating?.aggregate_rating) || 4.0,
        rating_count: Math.floor(Math.random() * 400) + 100,
        cost_for_two: Math.floor(Math.random() * 1000) + 500,
        delivery_time: Math.floor(Math.random() * 20) + 20,
        image_url: info.image?.url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500',
        is_pure_veg: false,
        latitude: 28.595490,
        longitude: 77.376030,
        address: info.locality?.name || 'Delhi NCR',
        phone: '011-43210987'
      };
    });

  return mappedRestaurants;
}

function loadMockResponse() {
  const mockPath = path.join(__dirname, 'mockZomatoResponse.json');
  return JSON.parse(fs.readFileSync(mockPath, 'utf8'));
}

module.exports = { fetchAndMapZomatoRestaurants };
