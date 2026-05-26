/**
 * api.js
 * Simulated API service layer using localStorage for complete offline support.
 * Implements CRUD actions with simulated minor network latency to trigger gorgeous loading animations.
 */

const STORAGE_KEYS = {
  PERSONS: 'social_org_db_persons',
  EVENTS: 'social_org_db_events'
};

// Fixed Department Hierarchical Structure
const DEPARTMENTS_DB = [
  { id: 'cultural-art-school', name: 'Art School', category: 'Cultural', icon: '🎨' },
  { id: 'cultural-recitation', name: 'Recitation', category: 'Cultural', icon: '🗣️' },
  { id: 'cultural-ghungur', name: 'Ghungur', category: 'Cultural', icon: '💃' },
  { id: 'library', name: 'Library', category: 'Library', icon: '📚' },
  { id: 'sports-mohila-yogasana', name: 'Mohila Yogasana', category: 'Sports', icon: '🧘‍♀️' },
  { id: 'sports-pranayam', name: 'Pranayam', category: 'Sports', icon: '💨' },
  { id: 'sports-park', name: 'Park', category: 'Sports', icon: '🌳' },
  { id: 'social-service-dispensary', name: 'Dispensary', category: 'Social Service', icon: '🏥' },
  { id: 'social-service-others', name: 'Others', category: 'Social Service', icon: '🤝' },
  { id: 'general', name: 'General', category: 'General', icon: '📋' }
];

// Seed Data for initial load
const SEED_PERSONS = [
  {
    id: 'p-1',
    name: 'Arundhati Sen',
    category: 'Teacher',
    phone: '9876543210',
    email: 'arundhati.sen@gmail.com',
    departments: ['cultural-art-school', 'cultural-recitation'],
    address: '12B, Lake Road, Ballygunge, Kolkata - 700029',
    createdAt: new Date().toISOString()
  },
  {
    id: 'p-2',
    name: 'Subrata Dey',
    category: 'Member',
    phone: '9830098300',
    email: 'subrata.dey@example.com',
    departments: ['sports-pranayam', 'social-service-dispensary'],
    address: 'FD-184, Salt Lake City, Sector 3, Kolkata - 700091',
    createdAt: new Date().toISOString()
  },
  {
    id: 'p-3',
    name: 'Sulata Ghosh',
    category: 'Member',
    phone: '9433123456',
    email: 'sulata.ghosh@outlook.com',
    departments: ['sports-mohila-yogasana', 'sports-pranayam', 'social-service-dispensary'],
    address: '45, Jodhpur Park, Kolkata - 700068',
    createdAt: new Date().toISOString()
  },
  {
    id: 'p-4',
    name: 'Rohan Banerjee',
    category: 'Student',
    phone: '8017001234',
    email: 'rohan.b@gmail.com',
    departments: ['cultural-art-school', 'sports-park'],
    address: 'Flat 4A, Green Heights, Behala, Kolkata - 700034',
    createdAt: new Date().toISOString()
  },
  {
    id: 'p-5',
    name: 'Keya Das',
    category: 'Student',
    phone: '9883012345',
    email: 'keyadas@hotmail.com',
    departments: ['cultural-ghungur'],
    address: '32/1, Prince Anwar Shah Road, Jadavpur, Kolkata - 700032',
    createdAt: new Date().toISOString()
  },
  {
    id: 'p-6',
    name: 'Bimal Krishna Roy',
    category: 'Well Wishers',
    phone: '9163012345',
    email: 'bimalroy@gmail.com',
    departments: ['general', 'social-service-dispensary'],
    address: '8B, Shyambazar Street, Hatibagan, Kolkata - 700004',
    createdAt: new Date().toISOString()
  }
];

const SEED_EVENTS = [
  {
    id: 'e-1',
    title: 'Yoga & Pranayam Morning Session',
    date: '2026-05-28',
    description: 'Early morning wellness camp focusing on basic breathing patterns, Pranayam, and beginner yogasanas for senior citizens.',
    participants: ['p-2', 'p-3'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'e-2',
    title: 'Free Health Screening Clinic',
    date: '2026-06-05',
    description: 'Our monthly general medical checkup day in the dispensary. Providing free consultations, blood sugar tests, and basic medications.',
    participants: ['p-2', 'p-3', 'p-6'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'e-3',
    title: 'Annual Rabindra Jayanti Celebrations',
    date: '2026-06-15',
    description: 'Rabindrasangeet recitations, classical dance pieces, and art exhibition showcasing sketches drawn by our art school students.',
    participants: ['p-1', 'p-4', 'p-5'],
    createdAt: new Date().toISOString()
  }
];

// Database Utilities
const getStorageData = (key, defaultData) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
};

const setStorageData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Simulate network request delays
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

const ApiService = {
  // --- PERSONS MODULE ---
  
  /**
   * Get list of all Persons
   * @returns {Promise<Array>}
   */
  getPersons: async () => {
    await delay();
    return getStorageData(STORAGE_KEYS.PERSONS, SEED_PERSONS);
  },

  /**
   * Add a new Person
   * @param {Object} personData 
   * @returns {Promise<Object>} The newly created Person
   */
  addPerson: async (personData) => {
    await delay(600);
    const persons = getStorageData(STORAGE_KEYS.PERSONS, SEED_PERSONS);
    const newPerson = {
      ...personData,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    persons.unshift(newPerson); // Add to the top
    setStorageData(STORAGE_KEYS.PERSONS, persons);
    return newPerson;
  },

  /**
   * Get a single person details by ID
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  getPersonById: async (id) => {
    await delay(300);
    const persons = getStorageData(STORAGE_KEYS.PERSONS, SEED_PERSONS);
    return persons.find(p => p.id === id) || null;
  },

  /**
   * Update a person details
   * @param {string} id 
   * @param {Object} updatedData 
   * @returns {Promise<Object>}
   */
  updatePerson: async (id, updatedData) => {
    await delay(500);
    const persons = getStorageData(STORAGE_KEYS.PERSONS, SEED_PERSONS);
    const index = persons.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Person not found.');
    
    persons[index] = {
      ...persons[index],
      ...updatedData,
      id // Guard ID
    };
    setStorageData(STORAGE_KEYS.PERSONS, persons);
    return persons[index];
  },

  /**
   * Delete a person from the system
   * @param {string} id 
   * @returns {Promise<boolean>}
   */
  deletePerson: async (id) => {
    await delay(500);
    const persons = getStorageData(STORAGE_KEYS.PERSONS, SEED_PERSONS);
    const filtered = persons.filter(p => p.id !== id);
    setStorageData(STORAGE_KEYS.PERSONS, filtered);

    // Also remove this person from event participants
    const events = getStorageData(STORAGE_KEYS.EVENTS, SEED_EVENTS);
    const updatedEvents = events.map(event => ({
      ...event,
      participants: event.participants.filter(pId => pId !== id)
    }));
    setStorageData(STORAGE_KEYS.EVENTS, updatedEvents);

    return true;
  },

  // --- DEPARTMENTS MODULE ---

  /**
   * Get all departments list
   * @returns {Promise<Array>}
   */
  getDepartments: async () => {
    await delay(200);
    return DEPARTMENTS_DB;
  },

  /**
   * Get list of persons registered in a specific department
   * @param {string} deptId 
   * @returns {Promise<Array>}
   */
  getPersonsInDepartment: async (deptId) => {
    await delay(350);
    const persons = getStorageData(STORAGE_KEYS.PERSONS, SEED_PERSONS);
    return persons.filter(p => p.departments.includes(deptId));
  },

  // --- EVENTS MODULE ---

  /**
   * Get list of all events
   * @returns {Promise<Array>}
   */
  getEvents: async () => {
    await delay();
    return getStorageData(STORAGE_KEYS.EVENTS, SEED_EVENTS);
  },

  /**
   * Add a new Event
   * @param {Object} eventData 
   * @returns {Promise<Object>} The newly created Event
   */
  addEvent: async (eventData) => {
    await delay(600);
    const events = getStorageData(STORAGE_KEYS.EVENTS, SEED_EVENTS);
    const newEvent = {
      ...eventData,
      id: `e-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    events.unshift(newEvent); // Add to the top
    setStorageData(STORAGE_KEYS.EVENTS, events);
    return newEvent;
  },

  // --- DASHBOARD / STATS ---

  /**
   * Get quick statistics for the dashboard
   * @returns {Promise<Object>}
   */
  getDashboardStats: async () => {
    await delay(300);
    const persons = getStorageData(STORAGE_KEYS.PERSONS, SEED_PERSONS);
    const events = getStorageData(STORAGE_KEYS.EVENTS, SEED_EVENTS);
    
    // Count upcoming events
    const today = new Date().toISOString().split('T')[0];
    const upcomingEventsCount = events.filter(e => e.date >= today).length;

    // Build department member counts mapping
    const deptCounts = {};
    DEPARTMENTS_DB.forEach(d => {
      deptCounts[d.id] = persons.filter(p => p.departments.includes(d.id)).length;
    });

    // Count categories
    const categoriesCount = {
      Member: persons.filter(p => p.category === 'Member').length,
      Student: persons.filter(p => p.category === 'Student').length,
      Teacher: persons.filter(p => p.category === 'Teacher').length,
      'Well Wishers': persons.filter(p => p.category === 'Well Wishers').length
    };

    return {
      totalPersons: persons.length,
      totalDepartments: DEPARTMENTS_DB.length,
      totalEvents: events.length,
      upcomingEvents: upcomingEventsCount,
      deptCounts,
      categoriesCount
    };
  }
};

// Export to window object for global availability
window.ApiService = ApiService;
