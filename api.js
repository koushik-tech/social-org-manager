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
    subscriptionClearedUpto: '2026-08',
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
    subscriptionClearedUpto: '2026-04',
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
    subscriptionClearedUpto: '2026-06',
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
    subscriptionClearedUpto: '2026-03',
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
    subscriptionClearedUpto: '2026-07',
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
    subscriptionClearedUpto: '2026-05',
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

const CLOUD_CONFIG_KEY = 'social_org_cloud_config';

let activeCloudProvider = 'none'; // 'none', 'supabase', 'firebase'
let supabaseClientInstance = null;
let firebaseDbInstance = null;

const initCloudDatabase = () => {
  try {
    const config = JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY) || '{"provider":"none"}');
    activeCloudProvider = config.provider || 'none';
    supabaseClientInstance = null;
    firebaseDbInstance = null;

    if (activeCloudProvider === 'supabase' && config.supabaseUrl && config.supabaseAnonKey) {
      if (window.supabase) {
        supabaseClientInstance = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
        console.log('Supabase client initialized successfully');
      } else {
        console.warn('Supabase SDK not loaded yet.');
      }
    } else if (activeCloudProvider === 'firebase' && config.firebaseConfig) {
      if (window.firebase) {
        const parsedConfig = JSON.parse(config.firebaseConfig);
        let app;
        if (window.firebase.apps.length === 0) {
          app = window.firebase.initializeApp(parsedConfig);
        } else {
          app = window.firebase.app();
        }
        firebaseDbInstance = window.firebase.firestore(app);
        console.log('Firebase client initialized successfully');
      } else {
        console.warn('Firebase SDK not loaded yet.');
      }
    }
  } catch (err) {
    console.error('Error initializing cloud database:', err);
    activeCloudProvider = 'none';
  }
};

// Auto-trigger initialization on module import
initCloudDatabase();

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
    await delay(200);
    
    if (activeCloudProvider === 'supabase' && supabaseClientInstance) {
      try {
        const { data, error } = await supabaseClientInstance
          .from('persons')
          .select('*')
          .order('createdAt', { ascending: false });
        if (error) throw error;
        if (data) {
          setStorageData(STORAGE_KEYS.PERSONS, data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetch failed. Falling back to local cache:', err);
      }
    } else if (activeCloudProvider === 'firebase' && firebaseDbInstance) {
      try {
        const snapshot = await firebaseDbInstance.collection('persons').get();
        const data = [];
        snapshot.forEach(doc => {
          data.push(doc.data());
        });
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setStorageData(STORAGE_KEYS.PERSONS, data);
        return data;
      } catch (err) {
        console.warn('Firebase fetch failed. Falling back to local cache:', err);
      }
    }
    
    return getStorageData(STORAGE_KEYS.PERSONS, SEED_PERSONS);
  },

  /**
   * Add a new Person
   * @param {Object} personData 
   * @returns {Promise<Object>} The newly created Person
   */
  addPerson: async (personData) => {
    await delay(300);
    const newPerson = {
      ...personData,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    // Update Local Storage immediately (write-through cache)
    const persons = getStorageData(STORAGE_KEYS.PERSONS, SEED_PERSONS);
    persons.unshift(newPerson);
    setStorageData(STORAGE_KEYS.PERSONS, persons);

    if (activeCloudProvider === 'supabase' && supabaseClientInstance) {
      try {
        const { error } = await supabaseClientInstance
          .from('persons')
          .insert([newPerson]);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase insert failed:', err);
        throw new Error('Saved locally (Offline Mode), but cloud sync failed: ' + err.message);
      }
    } else if (activeCloudProvider === 'firebase' && firebaseDbInstance) {
      try {
        await firebaseDbInstance.collection('persons').doc(newPerson.id).set(newPerson);
      } catch (err) {
        console.error('Firebase set failed:', err);
        throw new Error('Saved locally (Offline Mode), but cloud sync failed: ' + err.message);
      }
    }

    return newPerson;
  },

  /**
   * Get a single person details by ID
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  getPersonById: async (id) => {
    await delay(150);
    
    if (activeCloudProvider === 'supabase' && supabaseClientInstance) {
      try {
        const { data, error } = await supabaseClientInstance
          .from('persons')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        if (data) return data;
      } catch (err) {
        console.warn('Supabase fetch single profile failed, using local cache:', err);
      }
    } else if (activeCloudProvider === 'firebase' && firebaseDbInstance) {
      try {
        const doc = await firebaseDbInstance.collection('persons').doc(id).get();
        if (doc.exists) return doc.data();
      } catch (err) {
        console.warn('Firebase fetch single profile failed, using local cache:', err);
      }
    }

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
    await delay(300);
    
    // Update Local Storage (write-through)
    const persons = getStorageData(STORAGE_KEYS.PERSONS, SEED_PERSONS);
    const index = persons.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Person not found.');
    
    persons[index] = {
      ...persons[index],
      ...updatedData,
      id
    };
    setStorageData(STORAGE_KEYS.PERSONS, persons);

    if (activeCloudProvider === 'supabase' && supabaseClientInstance) {
      try {
        const { error } = await supabaseClientInstance
          .from('persons')
          .update(updatedData)
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase update failed:', err);
        throw new Error('Updated locally, but cloud sync failed: ' + err.message);
      }
    } else if (activeCloudProvider === 'firebase' && firebaseDbInstance) {
      try {
        await firebaseDbInstance.collection('persons').doc(id).update(updatedData);
      } catch (err) {
        console.error('Firebase update failed:', err);
        throw new Error('Updated locally, but cloud sync failed: ' + err.message);
      }
    }

    return persons[index];
  },

  /**
   * Delete a person from the system
   * @param {string} id 
   * @returns {Promise<boolean>}
   */
  deletePerson: async (id) => {
    await delay(300);
    
    // Update Local Storage
    const persons = getStorageData(STORAGE_KEYS.PERSONS, SEED_PERSONS);
    const filtered = persons.filter(p => p.id !== id);
    setStorageData(STORAGE_KEYS.PERSONS, filtered);

    // Also remove from events locally
    const events = getStorageData(STORAGE_KEYS.EVENTS, SEED_EVENTS);
    const updatedEvents = events.map(event => ({
      ...event,
      participants: event.participants.filter(pId => pId !== id)
    }));
    setStorageData(STORAGE_KEYS.EVENTS, updatedEvents);

    if (activeCloudProvider === 'supabase' && supabaseClientInstance) {
      try {
        const { error: pError } = await supabaseClientInstance
          .from('persons')
          .delete()
          .eq('id', id);
        if (pError) throw pError;

        for (const evt of updatedEvents) {
          await supabaseClientInstance
            .from('events')
            .update({ participants: evt.participants })
            .eq('id', evt.id);
        }
      } catch (err) {
        console.error('Supabase delete failed:', err);
        throw new Error('Removed locally, but cloud delete failed: ' + err.message);
      }
    } else if (activeCloudProvider === 'firebase' && firebaseDbInstance) {
      try {
        await firebaseDbInstance.collection('persons').doc(id).delete();
        for (const evt of updatedEvents) {
          await firebaseDbInstance.collection('events').doc(evt.id).update({
            participants: evt.participants
          });
        }
      } catch (err) {
        console.error('Firebase delete failed:', err);
        throw new Error('Removed locally, but cloud delete failed: ' + err.message);
      }
    }

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
    await delay(300);
    const persons = await ApiService.getPersons();
    return persons.filter(p => p.departments.includes(deptId));
  },

  // --- EVENTS MODULE ---

  /**
   * Get list of all events
   * @returns {Promise<Array>}
   */
  getEvents: async () => {
    await delay(200);
    
    if (activeCloudProvider === 'supabase' && supabaseClientInstance) {
      try {
        const { data, error } = await supabaseClientInstance
          .from('events')
          .select('*')
          .order('createdAt', { ascending: false });
        if (error) throw error;
        if (data) {
          setStorageData(STORAGE_KEYS.EVENTS, data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetch events failed. Using cache:', err);
      }
    } else if (activeCloudProvider === 'firebase' && firebaseDbInstance) {
      try {
        const snapshot = await firebaseDbInstance.collection('events').get();
        const data = [];
        snapshot.forEach(doc => {
          data.push(doc.data());
        });
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setStorageData(STORAGE_KEYS.EVENTS, data);
        return data;
      } catch (err) {
        console.warn('Firebase fetch events failed. Using cache:', err);
      }
    }

    return getStorageData(STORAGE_KEYS.EVENTS, SEED_EVENTS);
  },

  /**
   * Add a new Event
   * @param {Object} eventData 
   * @returns {Promise<Object>} The newly created Event
   */
  addEvent: async (eventData) => {
    await delay(300);
    const newEvent = {
      ...eventData,
      id: `e-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    // Update Local Storage
    const events = getStorageData(STORAGE_KEYS.EVENTS, SEED_EVENTS);
    events.unshift(newEvent);
    setStorageData(STORAGE_KEYS.EVENTS, events);

    if (activeCloudProvider === 'supabase' && supabaseClientInstance) {
      try {
        const { error } = await supabaseClientInstance
          .from('events')
          .insert([newEvent]);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase event insert failed:', err);
        throw new Error('Saved locally (Offline Mode), but cloud sync failed: ' + err.message);
      }
    } else if (activeCloudProvider === 'firebase' && firebaseDbInstance) {
      try {
        await firebaseDbInstance.collection('events').doc(newEvent.id).set(newEvent);
      } catch (err) {
        console.error('Firebase event set failed:', err);
        throw new Error('Saved locally (Offline Mode), but cloud sync failed: ' + err.message);
      }
    }

    return newEvent;
  },

  // --- DASHBOARD / STATS ---

  /**
   * Get quick statistics for the dashboard
   * @returns {Promise<Object>}
   */
  getDashboardStats: async () => {
    await delay(200);
    const persons = await ApiService.getPersons();
    const events = await ApiService.getEvents();
    
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
  },

  // --- CLOUD CONFIGURATION & SYNC TOOLS ---

  /**
   * Reinitialize the database client with new credentials dynamically
   */
  reloadConfig: () => {
    initCloudDatabase();
  },

  /**
   * Test connection credentials dynamically before saving them
   * @param {Object} config 
   * @returns {Promise<boolean>}
   */
  testConnection: async (config) => {
    try {
      if (config.provider === 'none') return true;
      
      if (config.provider === 'supabase') {
        if (!window.supabase) throw new Error('Supabase SDK failed to load.');
        const testClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
        
        // Simple query limit 1 to verify table access
        const { error } = await testClient.from('persons').select('id').limit(1);
        if (error) {
          throw new Error(`Table verification error: ${error.message}. Please verify SQL schemas.`);
        }
        return true;
      }
      
      if (config.provider === 'firebase') {
        if (!window.firebase) throw new Error('Firebase SDK failed to load.');
        const parsed = JSON.parse(config.firebaseConfig);
        
        const testAppId = `test-app-${Date.now()}`;
        const testApp = window.firebase.initializeApp(parsed, testAppId);
        const testDb = window.firebase.firestore(testApp);
        
        // Fetch to check connection keys
        await testDb.collection('persons').limit(1).get();
        await testApp.delete();
        return true;
      }
      
      throw new Error('Invalid provider type.');
    } catch (err) {
      console.error('Connection verification failed:', err);
      throw new Error(err.message || 'Verification failed. Double check your API configurations.');
    }
  },

  /**
   * Upload current offline records to cloud database (Bulk Upload)
   */
  uploadLocalToCloud: async () => {
    if (activeCloudProvider === 'none') {
      throw new Error('Please configure a cloud database first.');
    }
    
    const localPersons = getStorageData(STORAGE_KEYS.PERSONS, SEED_PERSONS);
    const localEvents = getStorageData(STORAGE_KEYS.EVENTS, SEED_EVENTS);
    
    if (activeCloudProvider === 'supabase' && supabaseClientInstance) {
      try {
        if (localPersons.length > 0) {
          const { error } = await supabaseClientInstance
            .from('persons')
            .upsert(localPersons, { onConflict: 'id' });
          if (error) throw error;
        }
        
        if (localEvents.length > 0) {
          const { error } = await supabaseClientInstance
            .from('events')
            .upsert(localEvents, { onConflict: 'id' });
          if (error) throw error;
        }
      } catch (err) {
        throw new Error('Supabase upload failed: ' + err.message);
      }
    } else if (activeCloudProvider === 'firebase' && firebaseDbInstance) {
      try {
        const batch = firebaseDbInstance.batch();
        
        localPersons.forEach(person => {
          const docRef = firebaseDbInstance.collection('persons').doc(person.id);
          batch.set(docRef, person, { merge: true });
        });
        
        localEvents.forEach(event => {
          const docRef = firebaseDbInstance.collection('events').doc(event.id);
          batch.set(docRef, event, { merge: true });
        });
        
        await batch.commit();
      } catch (err) {
        throw new Error('Firebase upload failed: ' + err.message);
      }
    }
    return true;
  },

  /**
   * Pull database from cloud and replace local offline records (Bulk Download)
   */
  downloadCloudToLocal: async () => {
    if (activeCloudProvider === 'none') {
      throw new Error('Please configure a cloud database first.');
    }
    
    if (activeCloudProvider === 'supabase' && supabaseClientInstance) {
      try {
        const { data: persons, error: pError } = await supabaseClientInstance
          .from('persons')
          .select('*');
        if (pError) throw pError;
        
        const { data: events, error: eError } = await supabaseClientInstance
          .from('events')
          .select('*');
        if (eError) throw eError;
        
        setStorageData(STORAGE_KEYS.PERSONS, persons || []);
        setStorageData(STORAGE_KEYS.EVENTS, events || []);
      } catch (err) {
        throw new Error('Supabase download failed: ' + err.message);
      }
    } else if (activeCloudProvider === 'firebase' && firebaseDbInstance) {
      try {
        const personsSnap = await firebaseDbInstance.collection('persons').get();
        const persons = [];
        personsSnap.forEach(doc => {
          persons.push(doc.data());
        });
        
        const eventsSnap = await firebaseDbInstance.collection('events').get();
        const events = [];
        eventsSnap.forEach(doc => {
          events.push(doc.data());
        });
        
        setStorageData(STORAGE_KEYS.PERSONS, persons);
        setStorageData(STORAGE_KEYS.EVENTS, events);
      } catch (err) {
        throw new Error('Firebase download failed: ' + err.message);
      }
    }
    return true;
  },

  /**
   * Return current database connection metadata
   */
  getCloudStatus: () => {
    return {
      provider: activeCloudProvider,
      isConnected: activeCloudProvider !== 'none' && (supabaseClientInstance !== null || firebaseDbInstance !== null)
    };
  },

  /**
   * Log a subscription payment for a single member in one click
   * @param {string} personId 
   * @param {string} monthYearString (e.g. '2026-06')
   */
  updateSubscription: async (personId, monthYearString) => {
    await delay(300);
    
    // Update Local Storage immediately (write-through)
    const persons = getStorageData(STORAGE_KEYS.PERSONS, SEED_PERSONS);
    const index = persons.findIndex(p => p.id === personId);
    if (index === -1) throw new Error('Person not found.');
    
    persons[index].subscriptionClearedUpto = monthYearString;
    setStorageData(STORAGE_KEYS.PERSONS, persons);

    if (activeCloudProvider === 'supabase' && supabaseClientInstance) {
      try {
        const { error } = await supabaseClientInstance
          .from('persons')
          .update({ subscriptionClearedUpto: monthYearString })
          .eq('id', personId);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase subscription update failed:', err);
        throw new Error('Recorded locally (Offline), but cloud sync failed: ' + err.message);
      }
    } else if (activeCloudProvider === 'firebase' && firebaseDbInstance) {
      try {
        await firebaseDbInstance.collection('persons').doc(personId).update({
          subscriptionClearedUpto: monthYearString
        });
      } catch (err) {
        console.error('Firebase subscription update failed:', err);
        throw new Error('Recorded locally (Offline), but cloud sync failed: ' + err.message);
      }
    }
    return persons[index];
  }
};

// Export to window object for global availability
window.ApiService = ApiService;
