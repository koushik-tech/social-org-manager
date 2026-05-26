/**
 * auth.js
 * Simple and secure simulation of Authentication service using browser Storage.
 */

const AUTH_KEY = 'social_org_auth_session';
const USERS_DB = {
  admin: { username: 'admin', password: 'password123', name: 'System Admin', role: 'Admin' },
  teacher: { username: 'teacher', password: 'teacher123', name: 'Teacher Rep', role: 'Teacher' },
  student: { username: 'student', password: 'student123', name: 'Student Rep', role: 'Student' },
  member: { username: 'member', password: 'member123', name: 'General Member', role: 'Member' }
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
    // Simulate minor network delay for premium visual loading indicator
    await new Promise((resolve) => setTimeout(resolve, 800));

    const normalizedUser = username.trim().toLowerCase();
    const matchedUser = USERS_DB[normalizedUser];
    
    if (matchedUser && password === matchedUser.password) {
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
      throw new Error('Invalid username or password. Try: admin/password123, teacher/teacher123, student/student123, or member/member123.');
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
  }
};

// Export to window object for global availability
window.AuthService = AuthService;
