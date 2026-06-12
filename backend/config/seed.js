const { query } = require('./db');

async function seedRestaurants() {
  console.log('Generating seed data for 200 restaurants, 20 dishes each, and 7-8 reviews each...');

  const ADJECTIVES = [
    'Spicy', 'Golden', 'Royal', 'Silver', 'Urban', 'The Gourmet', 'Capital', 'Delhi', 'Saffron', 'Tandoori',
    'Punjabi', 'Bombay', 'South Indian', 'Bistro', 'Bella', 'Great', 'Grand', 'Dhaba', 'Little', 'Street',
    'Desi', 'Organic', 'Asian', 'Fresh', 'Sweet', 'Classic', 'Rich', 'Sizzling', 'Rustic', 'Flavors of',
    'Ancient', 'Imperial', 'Curry', 'Masala', 'Zaika', 'Khana', 'Punjab', 'Nizam', 'Biryani', 'Chutney'
  ];

  const NOUNS = [
    'Haveli', 'Kitchen', 'Bistro', 'Dhaba', 'Corner', 'Dragon', 'Bites', 'Lounge', 'Palace', 'Hub',
    'Express', 'Delight', 'Zest', 'Feast', 'Spoon', 'Tables', 'Tavern', 'Oasis', 'Chutney', 'Curry',
    'Grill', 'Tandoor', 'Spice', 'Plate', 'Wok', 'Rolls', 'Point', 'Chowk', 'Junction', 'House',
    'Court', 'Villa', 'Bazaar', 'Rasoi', 'Haat', 'Kitchens', 'Grills', 'Flavors', 'Kingdom', 'Cafe'
  ];

  const CUISINES = [
    'North Indian, Mughlai',
    'South Indian, Fast Food',
    'Chinese, Asian, Noodles',
    'Italian, Pizza, Pasta',
    'Desserts, Cakes, Ice Cream',
    'Burgers, Fast Food, Fries',
    'Biryani, North Indian',
    'Continental, Salad, Healthy'
  ];

  const AREAS = [
    'Connaught Place', 'Khan Market', 'Greater Kailash 1', 'Lajpat Nagar', 'Dwarka Sector 10',
    'South Extension 2', 'Nehru Place', 'Saket', 'Karol Bagh', 'Defence Colony',
    'Green Park', 'Noida Sector 62', 'Gurgaon Phase 3', 'Vasant Kunj', 'Hauz Khas Village',
    'Rajouri Garden', 'Chandni Chowk', 'Preet Vihar', 'Rohini Sector 9', 'Pitampura'
  ];

  const REVIEWERS = [
    'Amit Sharma', 'Priya Patel', 'Rohan Gupta', 'Sneha Reddy', 'Vikram Singh',
    'Neha Joshi', 'Rahul Verma', 'Ananya Iyer', 'Sanjay Dutt', 'Ritu Sen',
    'Manish Malhotra', 'Pooja Hegde', 'Siddharth Roy', 'Divya Nair', 'Gaurav Kapoor',
    'Shalini Vats', 'Karan Johar', 'Aditi Rao', 'Abhishek Bachchan', 'Tanvi Azmi',
    'Rajesh Kumar', 'Sunita Sharma', 'Arvind Singh', 'Deepika P.', 'Virat K.',
    'Sachin T.', 'Alia B.', 'Ranbir K.', 'Shah Rukh K.', 'Priyanka C.'
  ];

  const UNSPLASH_IMAGES = [
    'https://images.unsplash.com/photo-1585938338392-50a59970d8ee?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1562436260-8c9216eeb703?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1540648639573-8c848de23f0a?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=60'
  ];

  const MENU_TEMPLATES = {
    'North Indian, Mughlai': {
      Recommended: [
        { name: 'Butter Chicken Special', price: 380, is_veg: false, desc: 'Tender tandoori chicken cooked in butter-rich tomato gravy.' },
        { name: 'Dal Makhani Gold', price: 290, is_veg: true, desc: 'Black lentils slow cooked overnight with fresh cream.' },
        { name: 'Paneer Butter Masala', price: 320, is_veg: true, desc: 'Cottage cheese cubes in rich creamy tomato cashew gravy.' }
      ],
      Starters: [
        { name: 'Tandoori Paneer Tikka', price: 260, is_veg: true, desc: 'Spiced cottage cheese chunks grilled in clay oven.' },
        { name: 'Malai Chicken Tikka', price: 340, is_veg: false, desc: 'Boneless chicken marinated in cream, cheese and mild spices.' },
        { name: 'Hara Bhara Kebab', price: 220, is_veg: true, desc: 'Crispy spinach and green pea patties served with green chutney.' },
        { name: 'Mutton Seekh Kebab', price: 390, is_veg: false, desc: 'Minced spiced mutton skewers chargrilled to perfection.' }
      ],
      Mains: [
        { name: 'Kadhai Paneer', price: 310, is_veg: true, desc: 'Paneer cooked with bell peppers and freshly ground kadhai masala.' },
        { name: 'Chicken Tikka Masala', price: 360, is_veg: false, desc: 'Grilled chicken chunks tossed in spicy tikka gravy.' },
        { name: 'Mutton Rogan Josh', price: 420, is_veg: false, desc: 'Kashmiri style mutton curry cooked with aromatic spices.' },
        { name: 'Malai Kofta', price: 330, is_veg: true, desc: 'Fried paneer and potato dumplings in sweet and creamy white gravy.' },
        { name: 'Mix Vegetables', price: 240, is_veg: true, desc: 'Assorted seasonal vegetables sautéed with Indian spices.' },
        { name: 'Bhindi Do Pyaza', price: 230, is_veg: true, desc: 'Okra cooked with caramelized onions and dry mango powder.' }
      ],
      Breads: [
        { name: 'Butter Garlic Naan', price: 80, is_veg: true, desc: 'Leavened flatbread topped with garlic and butter.' },
        { name: 'Butter Naan', price: 70, is_veg: true, desc: 'Traditional soft flatbread cooked in tandoor.' },
        { name: 'Tandoori Roti', price: 35, is_veg: true, desc: 'Crispy whole wheat flatbread.' }
      ],
      Desserts: [
        { name: 'Gulab Jamun Duo', price: 90, is_veg: true, desc: 'Hot sweet milk dumplings dipped in sugar syrup.' },
        { name: 'Rasmalai (2 Pcs)', price: 110, is_veg: true, desc: 'Soft cottage cheese patties in sweetened saffron milk.' }
      ],
      Beverages: [
        { name: 'Sweet Shahi Lassi', price: 100, is_veg: true, desc: 'Thick churned yogurt drink topped with nuts.' },
        { name: 'Masala Chaas', price: 70, is_veg: true, desc: 'Spiced salted buttermilk with roasted cumin.' }
      ]
    },
    'South Indian, Fast Food': {
      Recommended: [
        { name: 'Special Masala Dosa', price: 180, is_veg: true, desc: 'Crispy rice crepe filled with spiced mashed potato.' },
        { name: 'Ghee Podi Dosa', price: 210, is_veg: true, desc: 'Golden crepe smeared with spiced lentil powder and ghee.' },
        { name: 'Cheese Masala Dosa', price: 230, is_veg: true, desc: 'Masala dosa topped with grated cheddar cheese.' }
      ],
      Starters: [
        { name: 'Medhu Vada (2 Pcs)', price: 110, is_veg: true, desc: 'Crispy deep-fried black gram donuts served with sambar.' },
        { name: 'Steamed Idli (2 Pcs)', price: 90, is_veg: true, desc: 'Soft and fluffy steamed rice-lentil cakes.' },
        { name: 'Onion Bhaji', price: 120, is_veg: true, desc: 'Crispy onion fritters served with coconut chutney.' },
        { name: 'Fried Podi Idli', price: 140, is_veg: true, desc: 'Bite-sized idlis tossed in gun powder and ghee.' }
      ],
      Mains: [
        { name: 'Lemon Rice Classic', price: 160, is_veg: true, desc: 'Tangy rice tempered with mustard, peanuts and curry leaves.' },
        { name: 'Curd Rice South Style', price: 140, is_veg: true, desc: 'Cool yogurt rice with mustard seed tempering.' },
        { name: 'Tomato Bath', price: 170, is_veg: true, desc: 'Spiced tomato rice cooked with peas and cashews.' },
        { name: 'Onion Tomato Uttapam', price: 190, is_veg: true, desc: 'Thick savory pancake topped with onion and tomato.' },
        { name: 'Plain Mysore Dosa', price: 150, is_veg: true, desc: 'Crispy crepe coated with spicy red chutney.' },
        { name: 'Rava Plain Dosa', price: 160, is_veg: true, desc: 'Lacy crispy crepe made of semolina.' }
      ],
      Breads: [
        { name: 'Malabar Parotta (2 Pcs)', price: 90, is_veg: true, desc: 'Flaky layered flour flatbread.' },
        { name: 'Appam (2 Pcs)', price: 80, is_veg: true, desc: 'Lacy pancakes with a soft spongy center.' },
        { name: 'Chapathi (2 Pcs)', price: 50, is_veg: true, desc: 'Whole wheat soft flatbreads.' }
      ],
      Desserts: [
        { name: 'Elaneer Payasam', price: 120, is_veg: true, desc: 'Sweet pudding made with tender coconut pulp and milk.' },
        { name: 'Rava Kesari', price: 100, is_veg: true, desc: 'Traditional sweet made of semolina, sugar and ghee.' }
      ],
      Beverages: [
        { name: 'Filter Coffee', price: 60, is_veg: true, desc: 'Authentic South Indian chicory-fused milk coffee.' },
        { name: 'Spiced Buttermilk', price: 50, is_veg: true, desc: 'Salted refreshing yogurt drink with ginger and green chilli.' }
      ]
    },
    'Chinese, Asian, Noodles': {
      Recommended: [
        { name: 'Veg Manchurian Dry', price: 240, is_veg: true, desc: 'Deep-fried veg balls tossed in tangy soy-garlic sauce.' },
        { name: 'Chilli Chicken Dry', price: 320, is_veg: false, desc: 'Stir-fried chicken chunks with bell peppers and green chillies.' },
        { name: 'Schezwan Hakka Noodles', price: 220, is_veg: true, desc: 'Wok-tossed noodles in fiery home-made Schezwan sauce.' }
      ],
      Starters: [
        { name: 'Veg Spring Rolls (4 Pcs)', price: 180, is_veg: true, desc: 'Crispy golden rolls filled with seasoned shredded veg.' },
        { name: 'Chicken Steamed Dimsums', price: 240, is_veg: false, desc: 'Dimplings filled with juicy minced chicken.' },
        { name: 'Honey Chilli Potato', price: 199, is_veg: true, desc: 'Crispy potato fingers glazed in honey and hot chilli.' },
        { name: 'Crispy Corn Salt & Pepper', price: 190, is_veg: true, desc: 'Fried corn kernels tossed with onions and white pepper.' }
      ],
      Mains: [
        { name: 'Veg Manchurian Gravy', price: 260, is_veg: true, desc: 'Manchurian balls served in a thick, savory dark gravy.' },
        { name: 'Chilli Chicken Gravy', price: 340, is_veg: false, desc: 'Spiced chicken chunks in classic soy-garlic gravy.' },
        { name: 'Schezwan Fried Rice', price: 210, is_veg: true, desc: 'Wok-fried rice tossed with veggies and spicy Schezwan.' },
        { name: 'Kung Pao Chicken', price: 360, is_veg: false, desc: 'Diced chicken stir-fried with peanuts and dry red chillies.' },
        { name: 'Stir Fried Greens', price: 250, is_veg: true, desc: 'Broccoli, bok choy and snow peas in light garlic sauce.' },
        { name: 'Thai Green Curry Veg', price: 320, is_veg: true, desc: 'Aromatic coconut curry with vegetables, served with rice.' }
      ],
      Breads: [
        { name: 'Steamed Jasmine Rice', price: 120, is_veg: true, desc: 'Fragrant steamed long grain rice.' },
        { name: 'Egg Fried Rice', price: 190, is_veg: false, desc: 'Stir-fried rice with scrambled egg and green onions.' },
        { name: 'Chilli Garlic Fried Rice', price: 180, is_veg: true, desc: 'Spicy wok fried rice flavored with burnt garlic.' }
      ],
      Desserts: [
        { name: 'Darsaan with Vanilla Ice Cream', price: 150, is_veg: true, desc: 'Crispy honey-glazed noodles topped with sesame seeds.' },
        { name: 'Fried Banana with Ice Cream', price: 140, is_veg: true, desc: 'Sweet golden-fried banana fritters.' }
      ],
      Beverages: [
        { name: 'Lemon Ice Tea', price: 90, is_veg: true, desc: 'Refreshing iced tea with a twist of lemon.' },
        { name: 'Jasmine Hot Tea', price: 80, is_veg: true, desc: 'Traditional Chinese green tea infused with jasmine.' }
      ]
    },
    'Italian, Pizza, Pasta': {
      Recommended: [
        { name: 'Classic Margherita Pizza', price: 399, is_veg: true, desc: 'San Marzano tomato sauce, fresh mozzarella, and fresh basil.' },
        { name: 'Spicy Pepperoni Pizza', price: 549, is_veg: false, desc: 'Pork pepperoni, mozzarella and house marinara.' },
        { name: 'Creamy Alfredo Pasta', price: 360, is_veg: true, desc: 'Fettuccine tossed in a rich, buttery parmesan cream sauce.' }
      ],
      Starters: [
        { name: 'Garlic Bread with Cheese', price: 160, is_veg: true, desc: 'Toasted baguette slices with garlic butter and melted mozzarella.' },
        { name: 'Bruschetta Pomodoro', price: 180, is_veg: true, desc: 'Grilled bread rubbed with garlic and topped with fresh tomatoes.' },
        { name: 'Mozzarella Sticks', price: 199, is_veg: true, desc: 'Breaded and deep-fried cheese sticks served with marinara.' },
        { name: 'Classic Caesar Salad', price: 220, is_veg: true, desc: 'Romaine lettuce, croutons, parmesan, tossed in caesar dressing.' }
      ],
      Mains: [
        { name: 'Penne Arrabiata Veg', price: 320, is_veg: true, desc: 'Penne in a spicy tomato sauce cooked with garlic and olive oil.' },
        { name: 'Baked Lasagna Classico', price: 440, is_veg: false, desc: 'Layers of pasta, minced chicken bolognese, and bechamel.' },
        { name: 'Spaghetti Carbonara', price: 390, is_veg: false, desc: 'Classic Roman pasta with egg yolk, bacon, and black pepper.' },
        { name: 'Veg Supreme Pizza', price: 499, is_veg: true, desc: 'Onions, capsicum, mushrooms, olives and sweet corn.' },
        { name: 'Chicken Fiesta Pizza', price: 529, is_veg: false, desc: 'Spiced chicken chunks, onions, jalapenos and red paprika.' },
        { name: 'Wild Mushroom Risotto', price: 380, is_veg: true, desc: 'Slow-cooked arborio rice with porcini mushrooms and truffle oil.' }
      ],
      Breads: [
        { name: 'Rosemary Focaccia', price: 110, is_veg: true, desc: 'Traditional Italian bread topped with olive oil and rosemary.' },
        { name: 'Cheesy Breadsticks', price: 140, is_veg: true, desc: 'Soft baked breadsticks coated with parmesan and herbs.' },
        { name: 'Calzone Pocket Veg', price: 180, is_veg: true, desc: 'Folded pizza pocket stuffed with cheese and mushrooms.' }
      ],
      Desserts: [
        { name: 'Tiramisu Tradizionale', price: 260, is_veg: true, desc: 'Espresso-soaked ladyfingers layered with mascarpone cream.' },
        { name: 'Panna Cotta Berry', price: 199, is_veg: true, desc: 'Chilled cooked cream dessert topped with sweet berry coulis.' }
      ],
      Beverages: [
        { name: 'Classic Cold Coffee', price: 130, is_veg: true, desc: 'Creamy milk blended with espresso and vanilla ice cream.' },
        { name: 'Fresh Lime Soda', price: 80, is_veg: true, desc: 'Sweet and salted sparkling lime drink.' }
      ]
    },
    'Desserts, Cakes, Ice Cream': {
      Recommended: [
        { name: 'Belgian Chocolate Waffle', price: 210, is_veg: true, desc: 'Fresh crispy waffle loaded with melted Belgian dark chocolate.' },
        { name: 'Classic Blueberry Cheesecake', price: 240, is_veg: true, desc: 'Creamy baked cheesecake slice with sweet blueberry topping.' },
        { name: 'Choco Lava Cake', price: 120, is_veg: true, desc: 'Hot chocolate cake with a gooey liquid chocolate center.' }
      ],
      Starters: [
        { name: 'Chocolate Macarons (Pack of 3)', price: 180, is_veg: true, desc: 'Delicate french almond meringue cookies filled with dark ganache.' },
        { name: 'Butter Croissant', price: 110, is_veg: true, desc: 'Flaky golden French pastry baked with real butter.' },
        { name: 'Warm Apple Pie Slice', price: 160, is_veg: true, desc: 'Traditional spiced apple filling in a flaky crust.' },
        { name: 'Fudge Walnut Brownie', price: 130, is_veg: true, desc: 'Dense, chewy chocolate brownie loaded with walnuts.' }
      ],
      Mains: [
        { name: 'Triple Chocolate Pancakes', price: 220, is_veg: true, desc: 'Fluffy pancake stack layered with dark, milk and white chocolate.' },
        { name: 'Red Velvet Waffle Special', price: 230, is_veg: true, desc: 'Red velvet waffle drizzled with cream cheese frosting.' },
        { name: 'Nutella Banana Crepe', price: 199, is_veg: true, desc: 'Thin French crepe filled with Nutella spread and fresh banana slices.' },
        { name: 'Fruit & Cream Waffle', price: 220, is_veg: true, desc: 'Waffle topped with fresh whipped cream and seasonal berries.' },
        { name: 'Vanilla Butterscotch Pancake', price: 190, is_veg: true, desc: 'Pancakes served with warm butterscotch syrup.' },
        { name: 'Choco Chip Waffle Sundae', price: 240, is_veg: true, desc: 'Waffle topped with chocolate ice cream and hot fudge.' }
      ],
      Breads: [
        { name: 'Garlic Baguette Sweet', price: 110, is_veg: true, desc: 'Baguette slices toasted with sugar and honey glaze.' },
        { name: 'Cinnamon Roll Creamy', price: 140, is_veg: true, desc: 'Soft sweet yeast roll filled with cinnamon sugar and glaze.' },
        { name: 'Sweet Custard Bun', price: 100, is_veg: true, desc: 'Fluffy baked milk bun filled with sweet yellow custard.' }
      ],
      Desserts: [
        { name: 'Death By Chocolate Sundae', price: 260, is_veg: true, desc: 'Scoops of chocolate ice cream, brownie chunks, nuts and chocolate sauce.' },
        { name: 'Double Strawberry Scoop', price: 120, is_veg: true, desc: 'Two scoops of strawberry ice cream.' }
      ],
      Beverages: [
        { name: 'Thick Chocolate Shake', price: 160, is_veg: true, desc: 'Milkshake blended with dark cocoa and chocolate syrup.' },
        { name: 'Oreo Cookie Shake', price: 170, is_veg: true, desc: 'Creamy vanilla shake blended with Oreo cookie chunks.' }
      ]
    },
    'Burgers, Fast Food, Fries': {
      Recommended: [
        { name: 'Double Cheese Grill Burger', price: 180, is_veg: true, desc: 'Potato-herb patty, double slice cheese, lettuce, house mayo.' },
        { name: 'Crispy Chicken Zinger Burger', price: 240, is_veg: false, desc: 'Spicy crispy fried chicken breast fillet with lettuce and mayo.' },
        { name: 'Cheesy Beast Loaded Fries', price: 210, is_veg: true, desc: 'Golden fries drenched in cheese sauce, jalapenos and herbs.' }
      ],
      Starters: [
        { name: 'Crispy Onion Rings', price: 120, is_veg: true, desc: 'Battered and deep-fried thick cut sweet onions.' },
        { name: 'Veggie Nuggets (8 Pcs)', price: 130, is_veg: true, desc: 'Fried crisp breaded mixed vegetable bite-sized snacks.' },
        { name: 'Cheesy Garlic Bread', price: 150, is_veg: true, desc: 'Bread slices topped with garlic spread and melted cheddar.' },
        { name: 'Chicken Popcorn Crispy', price: 199, is_veg: false, desc: 'Bite-sized seasoned chicken nuggets fried crispy.' }
      ],
      Mains: [
        { name: 'Paneer Club Sandwich', price: 199, is_veg: true, desc: 'Triple decker sandwich filled with spiced paneer and veggies.' },
        { name: 'Chicken Club Sandwich', price: 230, is_veg: false, desc: 'Classic double decker sandwich with egg, chicken and bacon.' },
        { name: 'Aloo Tikki Burger Deluxe', price: 120, is_veg: true, desc: 'Crispy potato patty burger with onion and tomato.' },
        { name: 'Spicy Paneer Wrap', price: 180, is_veg: true, desc: 'Flour tortilla rolled with grilled paneer, onions and mint mayo.' },
        { name: 'Crispy Chicken Wrap', price: 210, is_veg: false, desc: 'Spicy chicken tenders wrapped with lettuce and chipotle sauce.' },
        { name: 'Mushroom Cheese Burger', price: 220, is_veg: true, desc: 'Grilled veg patty topped with sautéed garlic mushrooms and cheese.' }
      ],
      Breads: [
        { name: 'Salted French Fries Large', price: 120, is_veg: true, desc: 'Crispy deep-fried salted potato fingers.' },
        { name: 'Peri Peri Fries Large', price: 140, is_veg: true, desc: 'Crispy fries tossed in hot African peri-peri spices.' },
        { name: 'Garlic Butter Toast', price: 70, is_veg: true, desc: 'Slices of bread grilled with salted garlic butter.' }
      ],
      Desserts: [
        { name: 'Molten Choco Lava Cake', price: 110, is_veg: true, desc: 'Decadent cake with hot liquid chocolate center.' },
        { name: 'Warm Brownie with Fudge', price: 130, is_veg: true, desc: 'Sweet chocolate brownie served warm.' }
      ],
      Beverages: [
        { name: 'Cold Coffee Blend', price: 140, is_veg: true, desc: 'Blended milk, ice cream, espresso shot and sugar.' },
        { name: 'Iced Peach Americano', price: 110, is_veg: true, desc: 'Chilled black coffee with sweet peach syrup.' }
      ]
    },
    'Biryani, North Indian': {
      Recommended: [
        { name: 'Special Chicken Biryani', price: 340, is_veg: false, desc: 'Aromatic long grain basmati rice layered with spiced chicken.' },
        { name: 'Royal Paneer Biryani', price: 299, is_veg: true, desc: 'Fragrant basmati cooked with tender paneer cubes and saffron.' },
        { name: 'Mutton Dum Biryani', price: 440, is_veg: false, desc: 'Slow cooked mutton and basmati rice sealed with dough.' }
      ],
      Starters: [
        { name: 'Chicken Tikka Dry (6 Pcs)', price: 320, is_veg: false, desc: 'Spiced chicken cubes roasted over charcoal.' },
        { name: 'Samosa Chat Classic', price: 120, is_veg: true, desc: 'Crushed potato samosas topped with curd and sweet-sour chutneys.' },
        { name: 'Tandoori Chicken Half', price: 340, is_veg: false, desc: 'Traditional bone-in chicken marinated in yogurt and spices.' },
        { name: 'Veg Seekh Kebab', price: 240, is_veg: true, desc: 'Minced vegetable skewers grilled on clay oven.' }
      ],
      Mains: [
        { name: 'Shahi Paneer Creamy', price: 310, is_veg: true, desc: 'Paneer cubes in mild sweet creamy tomato gravy.' },
        { name: 'Chicken Curry Home Style', price: 330, is_veg: false, desc: 'Traditional thin-gravy chicken curry with onions and ginger.' },
        { name: 'Dal Tadka Yellow', price: 210, is_veg: true, desc: 'Yellow lentils cooked and tempered with cumin, garlic and ghee.' },
        { name: 'Mutton Curry Special', price: 420, is_veg: false, desc: 'Rich spicy mutton gravy flavored with cardamoms.' },
        { name: 'Soya Chaap Masala', price: 270, is_veg: true, desc: 'Spiced soya chaap pieces cooked in rich onion-tomato masala.' },
        { name: 'Jeera Rice Basmati', price: 160, is_veg: true, desc: 'Basmati rice steamed and tossed with roasted cumin.' }
      ],
      Breads: [
        { name: 'Butter Naan Soft', price: 70, is_veg: true, desc: 'Baked soft leavened refined flour flatbread.' },
        { name: 'Lacha Paratha Wheat', price: 65, is_veg: true, desc: 'Multi-layered wheat flatbread baked crisp.' },
        { name: 'Missi Roti Besan', price: 50, is_veg: true, desc: 'Gram flour bread flavored with onion and green chilli.' }
      ],
      Desserts: [
        { name: 'Moong Dal Halwa', price: 120, is_veg: true, desc: 'Rich sweet pudding made of yellow lentils, ghee and sugar.' },
        { name: 'Rasgulla Duo', price: 70, is_veg: true, desc: 'Two soft spongy cheese balls dipped in sugar syrup.' }
      ],
      Beverages: [
        { name: 'Sweet Lassi Kulhad', price: 90, is_veg: true, desc: 'Thick yogurt shake served in traditional clay glass.' },
        { name: 'Salted Mint Buttermilk', price: 60, is_veg: true, desc: 'Chilled salted yogurt drink with fresh mint.' }
      ]
    },
    'Continental, Salad, Healthy': {
      Recommended: [
        { name: 'Exotic Garden Fresh Salad', price: 220, is_veg: true, desc: 'Broccoli, lettuce, bell peppers, baby corn tossed in olive oil.' },
        { name: 'Grilled Herb Chicken Breast', price: 360, is_veg: false, desc: 'Juicy chicken breast served with steamed veggies and rosemary sauce.' },
        { name: 'Avocado Toast Sourdough', price: 280, is_veg: true, desc: 'Toasted sourdough topped with mashed avocado, cherry tomatoes and seeds.' }
      ],
      Starters: [
        { name: 'Creamy Mushroom Soup', price: 160, is_veg: true, desc: 'Thick soup made of wild mushrooms, herbs and fresh cream.' },
        { name: 'Bruschetta Basil Tomato', price: 180, is_veg: true, desc: 'Toasted French bread topped with chopped tomatoes, garlic and olive oil.' },
        { name: 'Hummus & Pita Bread Platter', price: 240, is_veg: true, desc: 'Creamy chickpea puree served with warm pita bread.' },
        { name: 'Grilled Tofu Skewers', price: 210, is_veg: true, desc: 'Tofu cubes marinated in soy-ginger glaze and grilled.' }
      ],
      Mains: [
        { name: 'Pesto Penne Pasta Veg', price: 340, is_veg: true, desc: 'Penne pasta tossed in rich basil pine nut pesto sauce.' },
        { name: 'Pan Seared Salmon Fillet', price: 599, is_veg: false, desc: 'Crispy skin salmon served with mashed potatoes and lemon butter sauce.' },
        { name: 'Quinoa Veg Buddha Bowl', price: 299, is_veg: true, desc: 'Bowl of quinoa, chickpeas, roasted sweet potato, kale and tahini.' },
        { name: 'Grilled Paneer Steak', price: 320, is_veg: true, desc: 'Thick paneer steak served with herb brown rice and tomato sauce.' },
        { name: 'Chicken Caesar Wrap Healthy', price: 260, is_veg: false, desc: 'Whole wheat wrap with grilled chicken, lettuce and light caesar.' },
        { name: 'Vegetable Lasagna Whole Wheat', price: 360, is_veg: true, desc: 'Layered wheat pasta with seasonal vegetables and cottage cheese.' }
      ],
      Breads: [
        { name: 'Garlic Bread Slices (3 Pcs)', price: 120, is_veg: true, desc: 'French bread toasted with fresh garlic and olive oil.' },
        { name: 'Garlic Pita Pocket', price: 90, is_veg: true, desc: 'Soft pita bread flavored with garlic.' },
        { name: 'Brown Rice Portion', price: 110, is_veg: true, desc: 'Healthy steamed unpolished brown rice.' }
      ],
      Desserts: [
        { name: 'Sugar Free Fruit Custard', price: 150, is_veg: true, desc: 'Chilled milk custard filled with apple, banana and pomegranate.' },
        { name: 'Greek Yogurt Honey Bowl', price: 160, is_veg: true, desc: 'Thick Greek yogurt topped with honey and walnuts.' }
      ],
      Beverages: [
        { name: 'Fresh Watermelon Juice', price: 120, is_veg: true, desc: 'Cold pressed fresh watermelon juice, sugar free.' },
        { name: 'Detox Green Juice', price: 140, is_veg: true, desc: 'Juice of celery, cucumber, spinach, green apple and lemon.' }
      ]
    }
  };

  const COMMENTS_BY_RATING = {
    5: [
      "Absolutely loved the food! The delivery was extremely fast and the food arrived piping hot.",
      "Hands down the best place in Delhi NCR. Perfect flavor, neat hygiene, and excellent packing.",
      "Mind-blowing taste! The ingredients felt very fresh. Highly recommend their bestsellers!",
      "Delicious food with great portion sizes. Value for money and great customer service."
    ],
    4: [
      "Really liked the taste and quality of the food. Will definitely order again soon.",
      "Great flavor profile. The spices were perfectly balanced. Packaging was solid.",
      "Very nice and savory meal. Delivery took a few minutes extra, but it was worth the wait.",
      "Tasty and clean food. Tastes exactly like traditional recipes. Good experience."
    ],
    3: [
      "Decent taste, but the gravy was a little too oily for my liking.",
      "Average quality. The portion size was a bit small for the price, but tastes fine.",
      "Taste was okay. Nothing extraordinary, but good for a quick daily meal.",
      "Food arrived on time but it was slightly cold. Taste is decent."
    ],
    2: [
      "Below average experience. The spices were not balanced and it was too salty.",
      "Not very satisfied. The food was extremely greasy and felt heavy.",
      "The packaging was leaking and the delivery executive was rude. Average taste."
    ],
    1: [
      "Terrible experience. The food tasted stale and smelled bad. Avoid ordering.",
      "Highly disappointed. Waste of money. The quality has dropped significantly."
    ]
  };

  function getImageForCuisine(cuisine, index) {
    if (cuisine.includes('Indian') || cuisine.includes('Biryani')) {
      const indianImgs = [0, 6, 9, 11, 16, 18];
      return UNSPLASH_IMAGES[indianImgs[index % indianImgs.length]];
    } else if (cuisine.includes('Pizza') || cuisine.includes('Italian')) {
      const italianImgs = [1, 8];
      return UNSPLASH_IMAGES[italianImgs[index % italianImgs.length]];
    } else if (cuisine.includes('Chinese') || cuisine.includes('Asian')) {
      const asianImgs = [2, 12, 14];
      return UNSPLASH_IMAGES[asianImgs[index % asianImgs.length]];
    } else if (cuisine.includes('Desserts')) {
      const dessertImgs = [3, 10, 17];
      return UNSPLASH_IMAGES[dessertImgs[index % dessertImgs.length]];
    } else if (cuisine.includes('Burgers')) {
      const fastFoodImgs = [4, 13, 15];
      return UNSPLASH_IMAGES[fastFoodImgs[index % fastFoodImgs.length]];
    }
    return UNSPLASH_IMAGES[index % UNSPLASH_IMAGES.length];
  }

  function sanitizeDishForVeg(dish, isPureVeg) {
    if (!isPureVeg) return { ...dish };
    let name = dish.name;
    let desc = dish.desc || '';
    if (!dish.is_veg) {
      name = name
        .replace(/Chicken/gi, 'Paneer')
        .replace(/Mutton/gi, 'Mushroom')
        .replace(/Pepperoni/gi, 'Veggie Spicy')
        .replace(/Bacon/gi, 'Paneer Chunks')
        .replace(/Egg/gi, 'Veg Soya')
        .replace(/Salmon/gi, 'Paneer Steak');
      desc = desc
        .replace(/chicken/gi, 'cottage cheese')
        .replace(/mutton/gi, 'savory mushrooms')
        .replace(/pepperoni/gi, 'spicy soya')
        .replace(/bacon/gi, 'paneer')
        .replace(/egg/gi, 'tofu')
        .replace(/salmon/gi, 'paneer');
    }
    return { name, price: dish.price, is_veg: true, desc };
  }

  const restaurantsData = [];
  const menuItemsData = [];
  const reviewsData = [];
  const namesSet = new Set();

  for (let i = 0; i < 200; i++) {
    let adjIdx = i % ADJECTIVES.length;
    let nounIdx = (i * 7) % NOUNS.length;
    let name = `${ADJECTIVES[adjIdx]} ${NOUNS[nounIdx]}`;
    let attempt = 1;
    while (namesSet.has(name)) {
      if (attempt === 1) name = `${ADJECTIVES[adjIdx]} ${NOUNS[nounIdx]} Express`;
      else if (attempt === 2) name = `${ADJECTIVES[adjIdx]} ${NOUNS[nounIdx]} House`;
      else if (attempt === 3) name = `${ADJECTIVES[adjIdx]} ${NOUNS[nounIdx]} Dhaba`;
      else if (attempt === 4) name = `${ADJECTIVES[adjIdx]} ${NOUNS[nounIdx]} Bistro`;
      else name = `${ADJECTIVES[adjIdx]} ${NOUNS[nounIdx]} (No. ${attempt})`;
      attempt++;
    }
    namesSet.add(name);

    const cuisine = CUISINES[i % CUISINES.length];
    let is_pure_veg = (i % 4 === 0);
    if (cuisine.includes('Desserts')) is_pure_veg = true;

    const angle = (i * 2 * Math.PI) / 200;
    const radius = 0.015 + ((i % 6) * 0.012);
    const latitude = parseFloat((28.6139 + Math.sin(angle) * radius).toFixed(6));
    const longitude = parseFloat((77.2090 + Math.cos(angle) * radius).toFixed(6));

    const cost_for_two = 200 + (i % 27) * 50;
    const delivery_time = 15 + (i % 7) * 5;

    const area = AREAS[i % AREAS.length];
    const address = `Shop ${50 + (i % 450)}, Main Road, ${area}, Delhi NCR`;
    const phone = `+91 99999 ${String(10000 + i).slice(1)}`;

    const image_url = 'https://picsum.photos/seed/zomato_res_' + i + '/600/400';

    restaurantsData.push({
      index: i,
      name,
      cuisine,
      cost_for_two,
      delivery_time,
      image_url,
      is_pure_veg,
      latitude,
      longitude,
      address,
      phone,
      rating: 0,
      rating_count: 0
    });

    const menuTemplate = MENU_TEMPLATES[cuisine] || MENU_TEMPLATES['North Indian, Mughlai'];
    const priceFactor = cost_for_two / 700;

    Object.keys(menuTemplate).forEach(category => {
      const dishes = menuTemplate[category];
      dishes.forEach((d, dishIdx) => {
        const sanitized = sanitizeDishForVeg(d, is_pure_veg);
        let price = Math.round(sanitized.price * priceFactor);
        if (category === 'Breads') {
          price = Math.max(30, Math.min(price, 120));
        } else if (category === 'Beverages') {
          price = Math.max(40, Math.min(price, 250));
        } else {
          price = Math.max(80, Math.min(price, 750));
        }
        const is_bestseller = (category === 'Recommended') || (category === 'Mains' && dishIdx === 0);
        const dishSeed = `zomato_dish_${i}_${category}_${dishIdx}`;

        menuItemsData.push({
          restaurant_index: i,
          name: sanitized.name,
          price,
          category,
          is_veg: sanitized.is_veg,
          is_bestseller,
          description: sanitized.desc,
          image_url: 'https://picsum.photos/seed/' + dishSeed + '/300/300'
        });
      });
    });

    const numReviews = 7 + (i % 2);
    const targetRating = 3.6 + ((i % 14) * 0.1);
    let reviewRatings = [];

    for (let j = 0; j < numReviews; j++) {
      const reviewer_name = REVIEWERS[(i * 3 + j) % REVIEWERS.length];
      let rating = Math.round(targetRating + (Math.sin(i * 5 + j) * 0.7));
      rating = Math.max(1, Math.min(5, rating));
      reviewRatings.push(rating);

      const templates = COMMENTS_BY_RATING[rating] || COMMENTS_BY_RATING[4];
      const comment = templates[(i * 2 + j) % templates.length];

      const tagsList = rating >= 4
        ? ['Delicious Food', 'Fast Delivery', 'Great Packaging', 'Hygiene Checked', 'Worth the Price']
        : ['Decent Food', 'Slow Delivery', 'Needs Improvement', 'Average Portions'];
      const tags = tagsList[(i + j) % tagsList.length];

      reviewsData.push({
        restaurant_index: i,
        reviewer_name,
        rating,
        comment,
        tags
      });
    }

    const sum = reviewRatings.reduce((a, b) => a + b, 0);
    restaurantsData[i].rating = parseFloat((sum / numReviews).toFixed(1));
    restaurantsData[i].rating_count = numReviews;
  }

  try {
    console.log(`Generated ${restaurantsData.length} restaurants, ${menuItemsData.length} dishes, and ${reviewsData.length} reviews in memory.`);

    const resColCount = 12;
    const resChunks = [];
    const resValues = [];
    
    for (let i = 0; i < restaurantsData.length; i++) {
      const r = restaurantsData[i];
      const offset = i * resColCount;
      resChunks.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`);
      resValues.push(r.name, r.cuisine, r.rating, r.rating_count, r.cost_for_two, r.delivery_time, r.image_url, r.is_pure_veg, r.latitude, r.longitude, r.address, r.phone);
    }
    
    const resQuery = `
      INSERT INTO restaurants (name, cuisine, rating, rating_count, cost_for_two, delivery_time, image_url, is_pure_veg, latitude, longitude, address, phone)
      VALUES ${resChunks.join(', ')}
      RETURNING id;
    `;
    
    const insertedRes = await query(resQuery, resValues);
    const resIds = insertedRes.rows.map(row => row.id);
    console.log(`Inserted ${resIds.length} restaurants successfully.`);

    const menuColCount = 8;
    const menuChunkSize = 500;
    
    for (let i = 0; i < menuItemsData.length; i += menuChunkSize) {
      const chunk = menuItemsData.slice(i, i + menuChunkSize);
      const chunkStrings = [];
      const chunkValues = [];
      
      for (let j = 0; j < chunk.length; j++) {
        const item = chunk[j];
        const dbResId = resIds[item.restaurant_index];
        const offset = j * menuColCount;
        chunkStrings.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`);
        chunkValues.push(dbResId, item.name, item.price, item.category, item.is_veg, item.is_bestseller, item.description, item.image_url);
      }
      
      const menuQuery = `
        INSERT INTO menu_items (restaurant_id, name, price, category, is_veg, is_bestseller, description, image_url)
        VALUES ${chunkStrings.join(', ')}
      `;
      await query(menuQuery, chunkValues);
    }
    console.log(`Successfully bulk-inserted ${menuItemsData.length} menu items.`);

    const revColCount = 5;
    const revChunkSize = 500;
    
    for (let i = 0; i < reviewsData.length; i += revChunkSize) {
      const chunk = reviewsData.slice(i, i + revChunkSize);
      const chunkStrings = [];
      const chunkValues = [];
      
      for (let j = 0; j < chunk.length; j++) {
        const rev = chunk[j];
        const dbResId = resIds[rev.restaurant_index];
        const offset = j * revColCount;
        chunkStrings.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
        chunkValues.push(dbResId, rev.reviewer_name, rev.rating, rev.comment, rev.tags);
      }
      
      const revQuery = `
        INSERT INTO reviews (restaurant_id, reviewer_name, rating, comment, tags)
        VALUES ${chunkStrings.join(', ')}
      `;
      await query(revQuery, chunkValues);
    }
    console.log(`Successfully bulk-inserted ${reviewsData.length} reviews.`);
    await query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
      ['Yash Agarwal', 'yashagarwal1705@gmail.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9']
    );
    console.log('Database seeding process completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
}

module.exports = { seedRestaurants };
