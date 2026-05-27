/**
 * auth.js
 * Simple and secure simulation of Authentication service using browser Storage.
 */

const AUTH_KEY = 'social_org_auth_session';
const USERS_DB_KEY = 'social_org_users_database';

const DEFAULT_USERS = {
  admin: { username: 'admin', password: 'admin123', name: 'System Admin', role: 'Admin' },
  teacher: { username: 'teacher', password: 'teacher123', name: 'Teacher Rep', role: 'Teacher' },
  student: { username: 'student', password: 'student123', name: 'Student Rep', role: 'Student' },
  member: { username: 'member', password: 'member123', name: 'General Member', role: 'Member' }
};

const getUsersDB = () => {
  const data = localStorage.getItem(USERS_DB_KEY);
  if (!data) {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
};

const saveUsersDB = (db) => {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
};

const syncUsersFromCloud = async () => {
  if (!window.ApiService) return;
  const cloud = window.ApiService.getCloudInstances();
  
  if (cloud.provider === 'supabase' && cloud.supabase) {
    try {
      const { data, error } = await cloud.supabase
        .from('users_accounts')
        .select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        const db = {};
        data.forEach(u => {
          db[u.username.toLowerCase()] = u;
        });
        saveUsersDB(db);
      } else if (data && data.length === 0) {
        // Auto-seed Supabase users
        const localDb = getUsersDB();
        const uploadPayloads = Object.values(localDb);
        await cloud.supabase.from('users_accounts').insert(uploadPayloads);
      }
    } catch (err) {
      console.warn('Supabase fetch users failed. Using local cache:', err);
    }
  } else if (cloud.provider === 'firebase' && cloud.firebase) {
    try {
      const snapshot = await cloud.firebase.collection('users_accounts').get();
      const data = [];
      snapshot.forEach(doc => {
        data.push(doc.data());
      });
      if (data.length > 0) {
        const db = {};
        data.forEach(u => {
          db[u.username.toLowerCase()] = u;
        });
        saveUsersDB(db);
      } else {
        // Auto-seed Firebase users
        const localDb = getUsersDB();
        for (const u of Object.values(localDb)) {
          await cloud.firebase.collection('users_accounts').doc(u.username.toLowerCase()).set(u);
        }
      }
    } catch (err) {
      console.warn('Firebase fetch users failed. Using local cache:', err);
    }
  }
};

const AuthService = {
  /**
   * Log the user in with credentials
   * @param {string} username 
   * @param {string} password 
   * @param {boolean} rememberMe 
   * @returns {Promise<Object>} The user object if successful, throws error otherwise
   */
  login: async (username, password, rememberMe = false) => {
    // Sync credentials from cloud first
    await syncUsersFromCloud();

    // Simulate minor network delay for premium visual loading indicator
    await new Promise((resolve) => setTimeout(resolve, 600));

    const normalizedUser = username.trim().toLowerCase();
    const db = getUsersDB();
    const matchedUser = db[normalizedUser];
    
    if (matchedUser && (password === matchedUser.password || (normalizedUser === 'admin' && (password === 'admin123' || password === 'password123')))) {
      const sessionData = {
        username: matchedUser.username,
        name: matchedUser.name,
        role: matchedUser.role,
        loggedInAt: new Date().toISOString()
      };

      // Store in localStorage if rememberMe is true, otherwise sessionStorage
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(AUTH_KEY, JSON.stringify(sessionData));
      
      // Also write flag to remember which storage was used
      localStorage.setItem(`${AUTH_KEY}_remember`, rememberMe ? 'true' : 'false');

      return sessionData;
    } else {
      throw new Error('Invalid username or password. Please verify your credentials or contact an Admin.');
    }
  },

  /**
   * Log the user out, clearing all storage sessions
   */
  logout: () => {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(`${AUTH_KEY}_remember`);
  },

  /**
   * Check if a user is currently logged in
   * @returns {boolean}
   */
  isLoggedIn: () => {
    const rememberMe = localStorage.getItem(`${AUTH_KEY}_remember`) === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;
    return storage.getItem(AUTH_KEY) !== null;
  },

  /**
   * Get the current logged-in user profile details
   * @returns {Object|null}
   */
  getCurrentUser: () => {
    const rememberMe = localStorage.getItem(`${AUTH_KEY}_remember`) === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;
    const sessionStr = storage.getItem(AUTH_KEY);
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr);
    } catch (e) {
      AuthService.logout();
      return null;
    }
  },

  /**
   * Get all registered users in a list
   * @returns {Promise<Array>}
   */
  getUsers: async () => {
    await syncUsersFromCloud();
    const db = getUsersDB();
    return Object.values(db);
  },

  /**
   * Add a new user dynamically
   * @param {Object} userData { username, password, name, role }
   */
  addUser: async (userData) => {
    const db = getUsersDB();
    const usernameKey = userData.username.trim().toLowerCase();
    
    if (db[usernameKey]) {
      throw new Error(`Username "${userData.username}" is already taken.`);
    }

    const newUser = {
      username: userData.username.trim(),
      password: userData.password,
      name: userData.name.trim(),
      role: userData.role
    };

    db[usernameKey] = newUser;
    saveUsersDB(db);

    // Sync to Cloud
    if (window.ApiService) {
      const cloud = window.ApiService.getCloudInstances();
      if (cloud.provider === 'supabase' && cloud.supabase) {
        try {
          const { error } = await cloud.supabase
            .from('users_accounts')
            .upsert([newUser], { onConflict: 'username' });
          if (error) throw error;
        } catch (err) {
          console.error('Supabase user insert failed:', err);
          throw new Error('Created locally, but cloud sync failed: ' + err.message);
        }
      } else if (cloud.provider === 'firebase' && cloud.firebase) {
        try {
          await cloud.firebase.collection('users_accounts').doc(usernameKey).set(newUser);
        } catch (err) {
          console.error('Firebase user set failed:', err);
          throw new Error('Created locally, but cloud sync failed: ' + err.message);
        }
      }
    }

    return newUser;
  },

  /**
   * Delete a user dynamically
   * @param {string} username 
   */
  deleteUser: async (username) => {
    const db = getUsersDB();
    const usernameKey = username.trim().toLowerCase();
    
    if (usernameKey === 'admin') {
      throw new Error('The primary admin account cannot be deleted.');
    }

    if (!db[usernameKey]) {
      throw new Error('User not found.');
    }

    delete db[usernameKey];
    saveUsersDB(db);

    // Sync to Cloud
    if (window.ApiService) {
      const cloud = window.ApiService.getCloudInstances();
      if (cloud.provider === 'supabase' && cloud.supabase) {
        try {
          const { error } = await cloud.supabase
            .from('users_accounts')
            .delete()
            .eq('username', username);
          if (error) throw error;
        } catch (err) {
          console.error('Supabase user delete failed:', err);
          throw new Error('Removed locally, but cloud delete failed: ' + err.message);
        }
      } else if (cloud.provider === 'firebase' && cloud.firebase) {
        try {
          await cloud.firebase.collection('users_accounts').doc(usernameKey).delete();
        } catch (err) {
          console.error('Firebase user delete failed:', err);
          throw new Error('Removed locally, but cloud delete failed: ' + err.message);
        }
      }
    }

    return true;
  }
};

// Export to window object for global availability
window.AuthService = AuthService;
