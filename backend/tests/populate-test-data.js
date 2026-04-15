import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const generateRandomString = (length = 8) => {
  return Math.random().toString(36).substring(2, 2 + length);
};

const generateRandomPhone = () => {
  return Math.floor(Math.random() * 9000000000) + 1000000000;
};

// Test user data
const testUsers = [
  {
    name: `Student${generateRandomString(5)}`,
    email: `student${generateRandomString(5)}@aust.edu`,
    phone: generateRandomPhone().toString(),
    password: 'TestPassword123!',
    year: '2',
    semester: 'Spring 2026',
  },
  {
    name: `User${generateRandomString(5)}`,
    email: `user${generateRandomString(5)}@aust.edu`,
    phone: generateRandomPhone().toString(),
    password: 'SecurePass456!',
    year: '3',
    semester: 'Spring 2026',
  },
  {
    name: `Scholar${generateRandomString(5)}`,
    email: `scholar${generateRandomString(5)}@aust.edu`,
    phone: generateRandomPhone().toString(),
    password: 'MyPass789!',
    year: '1',
    semester: 'Spring 2026',
  },
];

// Test tuition data
const testTuitions = [
  {
    tutorName: `Tutor${generateRandomString(4)}`,
    subject: 'Mathematics',
    level: 'College',
    rate: Math.floor(Math.random() * 100) + 20,
    location: 'Downtown',
    description: 'Expert in calculus and algebra',
    availability: 'Weekdays',
  },
  {
    tutorName: `Educator${generateRandomString(4)}`,
    subject: 'Physics',
    level: 'High School',
    rate: Math.floor(Math.random() * 80) + 15,
    location: 'Uptown',
    description: 'Specialized in mechanics and thermodynamics',
    availability: 'Flex',
  },
  {
    tutorName: `Coach${generateRandomString(4)}`,
    subject: 'English',
    level: 'College',
    rate: Math.floor(Math.random() * 60) + 25,
    location: 'Online',
    description: 'Professional writing and communication skills',
    availability: 'Weekends',
  },
];

// Test roommate listings
const testRoommates = [
  {
    name: `Roommate${generateRandomString(5)}`,
    age: Math.floor(Math.random() * 10) + 18,
    gender: Math.random() > 0.5 ? 'Male' : 'Female',
    location: 'Dhanmondi',
    description: 'Looking for shared accommodation',
    budget: Math.floor(Math.random() * 30000) + 5000,
  },
  {
    name: `Tenant${generateRandomString(5)}`,
    age: Math.floor(Math.random() * 10) + 20,
    gender: Math.random() > 0.5 ? 'Male' : 'Female',
    location: 'Gulshan',
    description: 'Seeking quiet living space',
    budget: Math.floor(Math.random() * 40000) + 8000,
  },
];

// Test house rent listings
const testHouseRents = [
  {
    title: `Apartment ${generateRandomString(3)}`,
    location: 'Banani',
    bedrooms: Math.floor(Math.random() * 4) + 1,
    price: Math.floor(Math.random() * 100000) + 50000,
    description: 'Modern furnished apartment',
    amenities: 'WiFi, AC, Kitchen',
  },
  {
    title: `Flat ${generateRandomString(3)}`,
    location: 'Mirpur',
    bedrooms: Math.floor(Math.random() * 3) + 2,
    price: Math.floor(Math.random() * 80000) + 40000,
    description: 'Family-friendly living space',
    amenities: 'Parking, Security, Balcony',
  },
];

// Test marketplace listings
const testMarketplace = [
  {
    title: `Used Book ${generateRandomString(4)}`,
    category: 'Books',
    price: Math.floor(Math.random() * 500) + 50,
    description: 'Excellent condition textbook',
    location: 'Campus',
  },
  {
    title: `Laptop Accessories`,
    category: 'Electronics',
    price: Math.floor(Math.random() * 3000) + 500,
    description: 'High-quality tech gear',
    location: 'Online',
  },
  {
    title: `Study Materials`,
    category: 'Stationery',
    price: Math.floor(Math.random() * 200) + 20,
    description: 'Complete study kit',
    location: 'Dhanmondi',
  },
];

async function populateTestData() {
  try {
    console.log('🚀 Starting to populate test data...\n');

    // Sign up test users
    console.log('📝 Creating test users...');
    const users = [];
    for (const userData of testUsers) {
      try {
        const response = await axios.post(`${API_BASE}/signup`, userData);
        console.log(`✅ User created: ${userData.email}`);
        users.push(response.data);
      } catch (error) {
        console.log(`⚠️  User creation issue: ${error.response?.data?.message || error.message}`);
      }
    }

    // Create tuitions
    console.log('\n🎓 Creating tuition listings...');
    for (const tuition of testTuitions) {
      try {
        const response = await axios.post(`${API_BASE}/tuitions`, tuition);
        console.log(`✅ Tuition created: ${tuition.subject} - $${tuition.rate}/hr`);
      } catch (error) {
        console.log(`⚠️  Tuition creation error: ${error.message}`);
      }
    }

    // Create roommate listings
    console.log('\n🏠 Creating roommate listings...');
    for (const roommate of testRoommates) {
      try {
        const response = await axios.post(`${API_BASE}/roommates`, roommate);
        console.log(`✅ Roommate listing created: ${roommate.name}`);
      } catch (error) {
        console.log(`⚠️  Roommate listing error: ${error.message}`);
      }
    }

    // Create house rent listings
    console.log('\n🏢 Creating house rent listings...');
    for (const house of testHouseRents) {
      try {
        const response = await axios.post(`${API_BASE}/houseRent`, house);
        console.log(`✅ House listing created: ${house.title} - ${house.location}`);
      } catch (error) {
        console.log(`⚠️  House listing error: ${error.message}`);
      }
    }

    // Create marketplace listings
    console.log('\n🛒 Creating marketplace listings...');
    for (const item of testMarketplace) {
      try {
        const response = await axios.post(`${API_BASE}/marketplace`, item);
        console.log(`✅ Marketplace item created: ${item.title}`);
      } catch (error) {
        console.log(`⚠️  Marketplace item error: ${error.message}`);
      }
    }

    console.log('\n✨ Test data population completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

populateTestData();
