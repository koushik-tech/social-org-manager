/**
 * app.js
 * Core Application Controller and Router.
 * Manages screen states, event bindings, DOM rendering, forms, and custom UI behaviors.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements Selectors ---
  const screens = {
    login: document.getElementById('screen-login'),
    dashboard: document.getElementById('screen-dashboard'),
    persons: document.getElementById('screen-persons'),
    subscription: document.getElementById('screen-subscription'),
    events: document.getElementById('screen-events')
  };

  const navItems = {
    home: document.getElementById('nav-home'),
    persons: document.getElementById('nav-persons'),
    subscription: document.getElementById('nav-subscription'),
    events: document.getElementById('nav-events')
  };

  const bottomNav = document.getElementById('app-bottom-nav');
  const loginForm = document.getElementById('login-form');
  const btnLogout = document.getElementById('btn-logout');
  const btnCloudSync = document.getElementById('btn-cloud-sync');
  const toastContainer = document.getElementById('toast-container');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');

  // Modal Selectors
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-content');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');

  // Dashboard Stats Selectors
  const stats = {
    persons: document.getElementById('stat-total-persons'),
    depts: document.getElementById('stat-total-depts'),
    events: document.getElementById('stat-total-events'),
    upcoming: document.getElementById('stat-upcoming-events'),
    personsCard: document.getElementById('stat-persons-trigger'),
    deptsCard: document.getElementById('stat-depts-trigger'),
    eventsCard: document.getElementById('stat-events-trigger'),
    upcomingCard: document.getElementById('stat-upcoming-trigger')
  };

  // Dashboard Quick Links
  const quickLinks = {
    persons: document.getElementById('action-persons'),
    depts: document.getElementById('action-depts'),
    subscription: document.getElementById('action-subscription'),
    events: document.getElementById('action-events')
  };

  // Persons Screen Search & Filter Selectors
  const personsSearch = document.getElementById('persons-search');
  const filterChipsContainer = document.getElementById('persons-filter-chips');
  const personsListContainer = document.getElementById('persons-list-container');
  const fabAddPerson = document.getElementById('fab-add-person');

  // Subscription Screen Search & Filter Selectors
  const subscriptionSearch = document.getElementById('subscription-search');
  const subscriptionFilterChips = document.getElementById('subscription-filter-chips');
  const subscriptionListContainer = document.getElementById('subscription-list-container');

  // Events Screen Selectors
  const eventsListContainer = document.getElementById('events-list-container');
  const fabAddEvent = document.getElementById('fab-add-event');

  // --- State Variables ---
  let currentActiveScreen = 'screen-login';
  let activePersonFilter = 'all';
  let personSearchQuery = '';
  let activeSubscriptionFilter = 'all';
  let subscriptionSearchQuery = '';
  let departmentsCache = [];

  // ==============================================
  // 1. SESSION MANAGEMENT & INITS
  // ==============================================
  
  const checkSession = () => {
    if (window.AuthService.isLoggedIn()) {
      const user = window.AuthService.getCurrentUser();
      document.getElementById('user-greeting').innerText = `Welcome, ${user.name}`;
      bottomNav.style.display = 'flex';
      switchScreen('screen-dashboard');
      loadDashboardStats();
      updateCloudStatusUI();
    } else {
      bottomNav.style.display = 'none';
      switchScreen('screen-login');
    }
  };

  const updateCloudStatusUI = () => {
    const status = window.ApiService.getCloudStatus();
    const welcomeNote = document.getElementById('user-greeting');
    if (!welcomeNote) return;
    
    // Remove any existing cloud indicator
    const existingInd = welcomeNote.parentNode.querySelector('.cloud-status-indicator');
    if (existingInd) existingInd.remove();
    
    const ind = document.createElement('div');
    ind.className = `cloud-status-indicator ${status.provider}`;
    
    let providerText = 'Local Offline';
    let dotClass = 'inactive';
    if (status.provider === 'supabase') {
      providerText = 'Supabase Cloud';
      dotClass = 'active';
    } else if (status.provider === 'firebase') {
      providerText = 'Firebase Cloud';
      dotClass = 'active';
    }
    
    ind.innerHTML = `
      <span class="cloud-indicator-dot ${dotClass}"></span>
      <span>${providerText}</span>
    `;
    welcomeNote.parentNode.appendChild(ind);
  };

  // Switch between views with custom transition animations
  const switchScreen = (screenId) => {
    Object.values(screens).forEach(screen => {
      screen.classList.remove('active');
    });

    const activeScreen = document.getElementById(screenId);
    activeScreen.classList.add('active');
    currentActiveScreen = screenId;

    // Highlight matching bottom navigation tab
    Object.values(navItems).forEach(item => {
      item.classList.remove('active');
    });

    if (screenId === 'screen-dashboard') {
      navItems.home.classList.add('active');
      loadDashboardStats();
    } else if (screenId === 'screen-persons') {
      navItems.persons.classList.add('active');
      renderPersonsList();
    } else if (screenId === 'screen-subscription') {
      navItems.subscription.classList.add('active');
      renderSubscriptionList();
    } else if (screenId === 'screen-events') {
      navItems.events.classList.add('active');
      renderEventsList();
    }
  };

  // ==============================================
  // 2. GENERAL UI HELPERS (Toast & Loader)
  // ==============================================

  const showLoader = (text = 'Loading...') => {
    loadingText.innerText = text;
    loadingOverlay.classList.add('active');
  };

  const hideLoader = () => {
    loadingOverlay.classList.remove('active');
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-xmark';
    if (type === 'info') iconClass = 'fa-circle-info';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span class="toast-message">${message}</span>
    `;

    toastContainer.appendChild(toast);
    
    // Trigger CSS slide-down animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Automatic slide up and removal after 3.2s
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 3200);
  };

  // ==============================================
  // 3. SHEET MODAL CONTROLLER
  // ==============================================

  const openModal = (title, contentHTML) => {
    modalTitle.innerText = title;
    modalBody.innerHTML = contentHTML;
    modalOverlay.classList.add('active');
  };

  const closeModal = () => {
    modalOverlay.classList.remove('active');
    // Clear dynamic bindings inside modal to prevent leaks
    setTimeout(() => {
      modalBody.innerHTML = '';
    }, 300);
  };

  // Close modal when close button or clicking on blurred background
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // ==============================================
  // 4. AUTHENTICATION FLOW
  // ==============================================

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('login-username').value;
    const passwordInput = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('login-remember').checked;

    showLoader('Logging you in...');
    try {
      const user = await window.AuthService.login(usernameInput, passwordInput, rememberMe);
      hideLoader();
      showToast(`Welcome back, ${user.name}!`, 'success');
      
      document.getElementById('user-greeting').innerText = `Welcome, ${user.name}`;
      bottomNav.style.display = 'flex';
      switchScreen('screen-dashboard');
    } catch (error) {
      hideLoader();
      showToast(error.message, 'error');
    }
  });

  btnLogout.addEventListener('click', () => {
    showLoader('Logging out...');
    setTimeout(() => {
      window.AuthService.logout();
      hideLoader();
      showToast('Logged out successfully.', 'info');
      checkSession();
    }, 600);
  });

  if (btnCloudSync) {
    btnCloudSync.addEventListener('click', () => {
      openCloudSyncModal();
    });
  }

  const openCloudSyncModal = () => {
    const config = JSON.parse(localStorage.getItem('social_org_cloud_config') || '{"provider":"none"}');
    
    const contentHTML = `
      <div class="form-view" style="padding-bottom: 20px;">
        <div class="cloud-info-box">
          <i class="fa-solid fa-circle-info"></i>
          Configure a free database to synchronize your data automatically across all devices.
        </div>
        
        <div class="form-group">
          <label>Select Cloud Provider</label>
          <div class="cloud-provider-toggle" id="cloud-provider-toggle">
            <button type="button" class="provider-btn \${selectedProvider === 'none' ? 'active' : ''}" data-provider="none">
              <i class="fa-solid fa-hard-drive"></i>
              <span>Local Only</span>
            </button>
            <button type="button" class="provider-btn \${selectedProvider === 'supabase' ? 'active' : ''}" data-provider="supabase">
              <i class="fa-solid fa-bolt"></i>
              <span>Supabase</span>
            </button>
            <button type="button" class="provider-btn \${selectedProvider === 'firebase' ? 'active' : ''}" data-provider="firebase">
              <i class="fa-solid fa-fire"></i>
              <span>Firebase</span>
            </button>
          </div>
        </div>
        
        <!-- Supabase Form Fields -->
        <div class="cloud-config-section" id="sec-supabase">
          <div class="form-group">
            <label for="cloud-sb-url">Supabase Project URL</label>
            <div class="input-container">
              <i class="fa-solid fa-link"></i>
              <input type="url" id="cloud-sb-url" class="form-control" placeholder="https://yourproject.supabase.co" value="">
            </div>
          </div>
          <div class="form-group">
            <label for="cloud-sb-key">Supabase Anon Key</label>
            <div class="input-container">
              <i class="fa-solid fa-key"></i>
              <input type="password" id="cloud-sb-key" class="form-control" placeholder="eyJhbGciOi..." value="">
            </div>
          </div>
        </div>
        
        <!-- Firebase Form Fields -->
        <div class="cloud-config-section" id="sec-firebase">
          <div class="form-group">
            <label for="cloud-fb-config">Firebase Configuration JSON</label>
            <textarea id="cloud-fb-config" class="form-control" style="font-family: monospace; font-size: 0.8rem; height: 110px; padding: 12px;" placeholder='{\\n  "apiKey": "...",\\n  "authDomain": "...",\\n  "projectId": "..."\\n}'></textarea>
          </div>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:12px; margin-top:20px;">
          <button type="button" class="btn btn-secondary" id="btn-test-cloud" style="width:100%; padding:14px;">
            <i class="fa-solid fa-vial"></i> Test Database Connection
          </button>
          <button type="button" class="btn btn-primary" id="btn-save-cloud" style="width:100%; padding:14px;">
            <i class="fa-solid fa-floppy-disk"></i> Save & Connect Database
          </button>
        </div>
        
        <!-- Sync Migration Actions -->
        <div class="sync-tools-grid" id="sync-tools-grid" style="display: none;">
          <button type="button" class="btn btn-contact btn-sync-tool" id="btn-push-local" style="justify-content:center;">
            <i class="fa-solid fa-cloud-arrow-up"></i> Push Local to Cloud
          </button>
          <button type="button" class="btn btn-contact btn-sync-tool" id="btn-pull-cloud" style="justify-content:center;">
            <i class="fa-solid fa-cloud-arrow-down"></i> Pull Cloud to Local
          </button>
        </div>
      </div>
    `;
    
    openModal('Cloud Sync Settings', contentHTML);
    
    // Set dynamic values in input fields
    const toggleButtons = document.querySelectorAll('.provider-btn');
    const secSupabase = document.getElementById('sec-supabase');
    const secFirebase = document.getElementById('sec-firebase');
    const syncToolsGrid = document.getElementById('sync-tools-grid');
    const sbUrlInput = document.getElementById('cloud-sb-url');
    const sbKeyInput = document.getElementById('cloud-sb-key');
    const fbConfigText = document.getElementById('cloud-fb-config');
    
    let activeProv = config.provider || 'none';
    
    // Pre-populate fields
    if (activeProv === 'supabase') {
      secSupabase.classList.add('active');
      syncToolsGrid.style.display = 'grid';
      toggleButtons.forEach(b => {
        if (b.getAttribute('data-provider') === 'supabase') b.classList.add('active');
        else b.classList.remove('active');
      });
    } else if (activeProv === 'firebase') {
      secFirebase.classList.add('active');
      syncToolsGrid.style.display = 'grid';
      toggleButtons.forEach(b => {
        if (b.getAttribute('data-provider') === 'firebase') b.classList.add('active');
        else b.classList.remove('active');
      });
    } else {
      toggleButtons.forEach(b => {
        if (b.getAttribute('data-provider') === 'none') b.classList.add('active');
        else b.classList.remove('active');
      });
    }
    
    sbUrlInput.value = config.supabaseUrl || '';
    sbKeyInput.value = config.supabaseAnonKey || '';
    fbConfigText.value = config.firebaseConfig || '';
    
    // Setup manual switching logic
    document.getElementById('cloud-provider-toggle').addEventListener('click', (e) => {
      const btn = e.target.closest('.provider-btn');
      if (!btn) return;
      
      toggleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeProv = btn.getAttribute('data-provider');
      
      secSupabase.classList.remove('active');
      secFirebase.classList.remove('active');
      
      if (activeProv === 'supabase') {
        secSupabase.classList.add('active');
        syncToolsGrid.style.display = 'grid';
      } else if (activeProv === 'firebase') {
        secFirebase.classList.add('active');
        syncToolsGrid.style.display = 'grid';
      } else {
        syncToolsGrid.style.display = 'none';
      }
    });
    
    // Bind Connection Test
    document.getElementById('btn-test-cloud').addEventListener('click', async () => {
      const sbUrl = sbUrlInput.value.trim();
      const sbKey = sbKeyInput.value.trim();
      const fbConfig = fbConfigText.value.trim();
      
      const testConfig = {
        provider: activeProv,
        supabaseUrl: sbUrl,
        supabaseAnonKey: sbKey,
        firebaseConfig: fbConfig
      };
      
      showLoader('Verifying keys...');
      try {
        await window.ApiService.testConnection(testConfig);
        hideLoader();
        showToast('Connection successfully verified!', 'success');
      } catch (err) {
        hideLoader();
        showToast(err.message, 'error');
      }
    });
    
    // Bind Save
    document.getElementById('btn-save-cloud').addEventListener('click', async () => {
      const sbUrl = sbUrlInput.value.trim();
      const sbKey = sbKeyInput.value.trim();
      const fbConfig = fbConfigText.value.trim();
      
      const newConfig = {
        provider: activeProv,
        supabaseUrl: sbUrl,
        supabaseAnonKey: sbKey,
        firebaseConfig: fbConfig
      };
      
      showLoader('Connecting cloud...');
      try {
        if (activeProv !== 'none') {
          await window.ApiService.testConnection(newConfig);
        }
        
        localStorage.setItem('social_org_cloud_config', JSON.stringify(newConfig));
        window.ApiService.reloadConfig();
        
        hideLoader();
        closeModal();
        showToast('Configuration saved successfully.', 'success');
        
        updateCloudStatusUI();
        loadDashboardStats();
      } catch (err) {
        hideLoader();
        showToast(err.message, 'error');
      }
    });
    
    // Push Local Data
    document.getElementById('btn-push-local').addEventListener('click', async () => {
      const confirmPush = confirm('Push all members and events on this browser to your cloud? This will overwrite existing items on the server.');
      if (!confirmPush) return;
      
      showLoader('Uploading local database...');
      try {
        await window.ApiService.uploadLocalToCloud();
        hideLoader();
        showToast('Local database successfully synchronized up!', 'success');
        loadDashboardStats();
      } catch (err) {
        hideLoader();
        showToast(err.message, 'error');
      }
    });
    
    // Pull Cloud Data
    document.getElementById('btn-pull-cloud').addEventListener('click', async () => {
      const confirmPull = confirm('Replace your offline cache with the database from the cloud? Any offline updates not pushed will be replaced.');
      if (!confirmPull) return;
      
      showLoader('Downloading database...');
      try {
        await window.ApiService.downloadCloudToLocal();
        hideLoader();
        showToast('Cloud database downloaded successfully!', 'success');
        loadDashboardStats();
      } catch (err) {
        hideLoader();
        showToast(err.message, 'error');
      }
    });
  };

  // ==============================================
  // 5. NAVIGATION BINDINGS
  // ==============================================

  // Bottom Tabs navigation
  Object.values(navItems).forEach(item => {
    item.addEventListener('click', () => {
      const targetScreen = item.getAttribute('data-screen');
      switchScreen(targetScreen);
    });
  });

  // Dashboard stats navigation shortcut clicks
  stats.personsCard.addEventListener('click', () => switchScreen('screen-persons'));
  stats.eventsCard.addEventListener('click', () => switchScreen('screen-events'));
  stats.upcomingCard.addEventListener('click', () => switchScreen('screen-events'));
  
  // Dashboard action buttons shortcut clicks
  quickLinks.persons.addEventListener('click', () => switchScreen('screen-persons'));
  quickLinks.events.addEventListener('click', () => switchScreen('screen-events'));
  if (quickLinks.subscription) {
    quickLinks.subscription.addEventListener('click', () => switchScreen('screen-subscription'));
  }

  // ==============================================
  // 6. DASHBOARD STATISTICS DATA LAYER
  // ==============================================

  const loadDashboardStats = async () => {
    try {
      const dbStats = await window.ApiService.getDashboardStats();
      stats.persons.innerText = dbStats.totalPersons;
      stats.depts.innerText = dbStats.totalDepartments;
      stats.events.innerText = dbStats.totalEvents;
      stats.upcoming.innerText = dbStats.upcomingEvents;
    } catch (e) {
      console.error('Error fetching dashboard stats', e);
    }
  };

  // ==============================================
  // 7. DEPARTMENTS TREE COLLAPSIBLE TREE & DIALOG
  // ==============================================

  // Triggers Department Modal View
  const openDepartmentsModal = async () => {
    showLoader('Fetching departments...');
    try {
      const depts = await window.ApiService.getDepartments();
      const statsData = await window.ApiService.getDashboardStats();
      departmentsCache = depts;
      hideLoader();

      // Group departments by their category group
      const categories = {};
      depts.forEach(d => {
        if (!categories[d.category]) {
          categories[d.category] = [];
        }
        categories[d.category].push(d);
      });

      // Construct interactive tree layout
      let treeHTML = `
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px; text-align:center;">
          Tap any department to view enrolled members.
        </p>
        <div class="dept-tree-container">
      `;

      for (const [catName, subDepts] of Object.entries(categories)) {
        // Icon mapping based on category name
        let catClass = 'cat-general';
        if (catName === 'Cultural') catClass = 'cat-cultural';
        if (catName === 'Sports') catClass = 'cat-sports';
        if (catName === 'Library') catClass = 'cat-library';
        if (catName === 'Social Service') catClass = 'cat-social';

        let catEmoji = '📋';
        if (catName === 'Cultural') catEmoji = '🎨';
        if (catName === 'Sports') catEmoji = '🧘‍♀️';
        if (catName === 'Library') catEmoji = '📚';
        if (catName === 'Social Service') catEmoji = '🏥';

        treeHTML += `
          <div class="dept-category" id="dept-cat-${catName.replace(/\s+/g, '-')}">
            <div class="dept-category-header">
              <div class="dept-category-title">
                <div class="dept-category-icon ${catClass}">${catEmoji}</div>
                <span>${catName}</span>
              </div>
              <i class="fa-solid fa-chevron-down arrow"></i>
            </div>
            <div class="dept-category-content">
              <div class="dept-grid">
        `;

        subDepts.forEach(dept => {
          const count = statsData.deptCounts[dept.id] || 0;
          treeHTML += `
            <div class="dept-child-card" data-dept-id="${dept.id}" data-dept-name="${dept.name}">
              <div class="dept-child-info">
                <span class="dept-child-emoji">${dept.icon}</span>
                <span class="dept-child-name">${dept.name}</span>
              </div>
              <span class="dept-member-count">${count} ${count === 1 ? 'person' : 'people'}</span>
            </div>
          `;
        });

        treeHTML += `
              </div>
            </div>
          </div>
        `;
      }

      treeHTML += `</div>`;

      openModal('Departments Tree', treeHTML);

      // Event bindings for collapsible tree headers
      const categoryBlocks = document.querySelectorAll('.dept-category');
      categoryBlocks.forEach(block => {
        const header = block.querySelector('.dept-category-header');
        header.addEventListener('click', () => {
          const isExpanded = block.classList.contains('expanded');
          // Collapse all others (optional accordion visual effect)
          categoryBlocks.forEach(b => b.classList.remove('expanded'));
          
          if (!isExpanded) {
            block.classList.add('expanded');
          }
        });
      });

      // Expand the first category block by default
      if (categoryBlocks.length > 0) {
        categoryBlocks[0].classList.add('expanded');
      }

      // Event bindings for selecting a department (switches view with search filter)
      const childCards = document.querySelectorAll('.dept-child-card');
      childCards.forEach(card => {
        card.addEventListener('click', () => {
          const deptId = card.getAttribute('data-dept-id');
          const deptName = card.getAttribute('data-dept-name');
          
          closeModal();
          
          // Switch tab to Persons
          switchScreen('screen-persons');
          
          // Set search query and search input box to find members with this department
          personsSearch.value = `dept:${deptId}`;
          personSearchQuery = `dept:${deptId}`;
          
          // Render the list reflecting this department filter
          renderPersonsList();
          showToast(`Filtered list by department: ${deptName}`, 'info');
        });
      });

    } catch (e) {
      hideLoader();
      showToast('Could not load departments list.', 'error');
      console.error(e);
    }
  };

  stats.deptsCard.addEventListener('click', openDepartmentsModal);
  quickLinks.depts.addEventListener('click', openDepartmentsModal);

  // ==============================================
  // 8. PERSONS MODULE: SEARCH, CHIPS & RENDER
  // ==============================================

  // Live filtering search input
  personsSearch.addEventListener('input', (e) => {
    personSearchQuery = e.target.value.trim();
    renderPersonsList();
  });

  // Filter Chips toggle handling
  filterChipsContainer.addEventListener('click', (e) => {
    const clickedChip = e.target.closest('.chip');
    if (!clickedChip) return;

    // Toggle active class
    filterChipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    clickedChip.classList.add('active');

    activePersonFilter = clickedChip.getAttribute('data-category');
    renderPersonsList();
  });

  // Core render function for Persons cards
  const renderPersonsList = async () => {
    personsListContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 12px; color: var(--primary);"></i>
        <p>Syncing directory...</p>
      </div>
    `;

    try {
      const persons = await window.ApiService.getPersons();
      const depts = await window.ApiService.getDepartments();

      // Create department mapping for faster lookup
      const deptMap = {};
      depts.forEach(d => { deptMap[d.id] = d; });

      // Apply Search and Category chip filtering in memory
      const filteredPersons = persons.filter(person => {
        // 1. Category chip filter
        if (activePersonFilter !== 'all' && person.category !== activePersonFilter) {
          return false;
        }

        // 2. Search query filter (handles normal name search or deep-linked department search)
        if (personSearchQuery) {
          if (personSearchQuery.startsWith('dept:')) {
            const searchDeptId = personSearchQuery.substring(5);
            return person.departments.includes(searchDeptId);
          } else {
            return person.name.toLowerCase().includes(personSearchQuery.toLowerCase());
          }
        }

        return true;
      });

      // Clear container loading state
      personsListContainer.innerHTML = '';

      if (filteredPersons.length === 0) {
        personsListContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 48px 20px; background: white; border-radius: var(--radius-lg); border: 1px dashed var(--border);">
            <i class="fa-solid fa-circle-question" style="font-size: 2.5rem; margin-bottom: 16px; color: var(--text-muted);"></i>
            <h3 style="font-family:'Outfit'; font-weight:700; margin-bottom:6px; color: var(--text-main);">No Records Found</h3>
            <p style="font-size:0.85rem;">Try adjusting your filters or search keywords.</p>
          </div>
        `;
        return;
      }

      // Generate Card elements
      filteredPersons.forEach(person => {
        const card = document.createElement('div');
        card.className = 'app-card';

        // Choose class according to Category
        let badgeClass = 'badge-member';
        if (person.category === 'Student') badgeClass = 'badge-student';
        if (person.category === 'Teacher') badgeClass = 'badge-teacher';
        if (person.category === 'Well Wishers') badgeClass = 'badge-wellwishers';

        // Render department tag pills
        let deptTagsHTML = '';
        person.departments.forEach(deptId => {
          const dept = deptMap[deptId];
          if (dept) {
            deptTagsHTML += `<span class="dept-tag">${dept.icon} ${dept.name}</span>`;
          }
        });

        card.innerHTML = `
          <div class="card-header">
            <h3 class="card-title">${person.name}</h3>
            <span class="badge ${badgeClass}">${person.category}</span>
          </div>
          <div class="card-details">
            <div class="detail-row">
              <i class="fa-solid fa-phone"></i>
              <span>${person.phone}</span>
            </div>
            <div class="detail-row">
              <i class="fa-solid fa-envelope"></i>
              <span>${person.email}</span>
            </div>
            <div class="detail-row">
              <i class="fa-solid fa-credit-card"></i>
              <span>Sub Cleared Upto: ${person.subscriptionClearedUpto || 'None'}</span>
            </div>
            <div class="card-depts-tags">
              ${deptTagsHTML || '<span class="dept-tag">No Departments Assigned</span>'}
            </div>
          </div>
          <div class="card-actions">
            <a href="tel:${person.phone}" class="btn-contact btn-phone-call" stop-propagation>
              <i class="fa-solid fa-phone"></i> Call
            </a>
            <a href="mailto:${person.email}" class="btn-contact btn-email-send" stop-propagation>
              <i class="fa-solid fa-envelope"></i> Email
            </a>
          </div>
        `;

        // Card tapping listener: Open details view modal
        card.addEventListener('click', (e) => {
          // Guard to avoid opening modal if user clicked call or email links
          if (e.target.closest('[stop-propagation]')) return;
          openPersonDetailsModal(person.id);
        });

        personsListContainer.appendChild(card);
      });

    } catch (e) {
      personsListContainer.innerHTML = `
        <div style="text-align: center; color: var(--error); padding: 40px 20px;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.2rem; margin-bottom: 12px;"></i>
          <p>Failed sync. Make sure local caching is enabled.</p>
        </div>
      `;
      console.error(e);
    }
  };

  // ==============================================
  // 9. PERSON DETAILS VIEW & DELETE/EDIT TRIGGERS
  // ==============================================

  const openPersonDetailsModal = async (personId) => {
    showLoader('Fetching profile details...');
    try {
      const person = await window.ApiService.getPersonById(personId);
      const depts = await window.ApiService.getDepartments();
      hideLoader();

      if (!person) {
        showToast('Person profile not found.', 'error');
        return;
      }

      // Group department mapped tags
      const deptMap = {};
      depts.forEach(d => { deptMap[d.id] = d; });
      let deptTagsHTML = '';
      person.departments.forEach(deptId => {
        const dept = deptMap[deptId];
        if (dept) {
          deptTagsHTML += `<span class="dept-tag">${dept.icon} ${dept.name}</span>`;
        }
      });

      // Render category avatar initials helper
      const initial = person.name.charAt(0);
      let badgeClass = 'badge-member';
      if (person.category === 'Student') badgeClass = 'badge-student';
      if (person.category === 'Teacher') badgeClass = 'badge-teacher';
      if (person.category === 'Well Wishers') badgeClass = 'badge-wellwishers';

      const detailsHTML = `
        <div class="person-details-view">
          <div class="person-detail-header">
            <div class="person-detail-avatar">${initial}</div>
            <h2 class="person-detail-name">${person.name}</h2>
            <span class="badge ${badgeClass}" style="display:inline-block; margin-bottom: 8px;">${person.category}</span>
          </div>

          <div class="person-detail-body">
            <div>
              <div class="detail-item-title">Registered Departments</div>
              <div class="card-depts-tags" style="margin-top: 6px; margin-bottom: 14px;">
                ${deptTagsHTML || '<span class="dept-tag">No wings assigned</span>'}
              </div>
            </div>

            <div>
              <div class="detail-item-title">Subscription Status</div>
              <div style="margin-top: 6px; margin-bottom: 14px;">
                ${getSubscriptionBadgeHTML(person.subscriptionClearedUpto)}
              </div>
            </div>

            <div>
              <div class="detail-item-title">Phone Contact</div>
              <div class="detail-item-value">
                <i class="fa-solid fa-phone" style="color:var(--text-muted);"></i>
                <a href="tel:${person.phone}">${person.phone}</a>
              </div>
            </div>

            <div style="margin-top: 10px;">
              <div class="detail-item-title">Email Address</div>
              <div class="detail-item-value">
                <i class="fa-solid fa-envelope" style="color:var(--text-muted);"></i>
                <a href="mailto:${person.email}">${person.email}</a>
              </div>
            </div>

            <div style="margin-top: 10px;">
              <div class="detail-item-title">Home Address</div>
              <div class="detail-item-value" style="font-weight: 500; font-size: 0.9rem;">
                <i class="fa-solid fa-location-dot" style="color:var(--text-muted); align-self: flex-start; margin-top: 3px;"></i>
                <span>${person.address || 'Not specified'}</span>
              </div>
            </div>
          </div>

          <div class="modal-footer-btns">
            <button class="btn btn-secondary" id="btn-edit-person" style="width: 48%;"><i class="fa-solid fa-user-pen"></i> Edit</button>
            <button class="btn btn-danger" id="btn-delete-person" style="width: 48%;"><i class="fa-solid fa-trash-can"></i> Delete</button>
          </div>
        </div>
      `;

      openModal('Person Details', detailsHTML);

      // Bind Edit triggers
      document.getElementById('btn-edit-person').addEventListener('click', () => {
        closeModal();
        setTimeout(() => {
          openPersonFormModal(person);
        }, 320);
      });

      // Bind Delete triggers
      document.getElementById('btn-delete-person').addEventListener('click', () => {
        closeModal();
        setTimeout(() => {
          confirmDeletePerson(person);
        }, 320);
      });

    } catch (e) {
      hideLoader();
      showToast('Could not load profile details.', 'error');
      console.error(e);
    }
  };

  const confirmDeletePerson = (person) => {
    const confirmHTML = `
      <div style="text-align: center; padding: 10px 0 20px 0;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--error); margin-bottom:16px;"></i>
        <h3 style="font-family:'Outfit'; margin-bottom: 8px;">Are you sure?</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px;">
          This will permanently delete <strong>${person.name}</strong> from the organization directory and remove them from all participant list groups.
        </p>
        <div class="modal-footer-btns">
          <button class="btn btn-secondary" id="btn-cancel-delete" style="width: 48%;">Cancel</button>
          <button class="btn btn-danger" id="btn-confirm-delete" style="width: 48%; background-color: var(--error); color: white;">Yes, Delete</button>
        </div>
      </div>
    `;

    openModal('Confirm Action', confirmHTML);

    document.getElementById('btn-cancel-delete').addEventListener('click', closeModal);
    
    document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
      showLoader('Deleting record...');
      try {
        await window.ApiService.deletePerson(person.id);
        hideLoader();
        closeModal();
        showToast('Member removed successfully.', 'success');
        
        // Reload interfaces
        renderPersonsList();
        loadDashboardStats();
      } catch (e) {
        hideLoader();
        showToast('Error removing record.', 'error');
      }
    });
  };

  // ==============================================
  // 10. PERSON FORM FLOW (Create / Update Member)
  // ==============================================

  const openPersonFormModal = async (personToEdit = null) => {
    showLoader('Preparing form...');
    try {
      const depts = await window.ApiService.getDepartments();
      hideLoader();

      const isEditMode = personToEdit !== null;
      
      // Render departments multi-select grid items
      let deptsCheckboxesHTML = '';
      depts.forEach(dept => {
        const isChecked = isEditMode && personToEdit.departments.includes(dept.id);
        const activeClass = isChecked ? 'selected' : '';
        
        deptsCheckboxesHTML += `
          <label class="multi-select-item ${activeClass}" data-dept-id="${dept.id}">
            <input type="checkbox" name="form-depts" value="${dept.id}" ${isChecked ? 'checked' : ''} style="display:none;">
            <span>${dept.icon} ${dept.name}</span>
          </label>
        `;
      });

      const formHTML = `
        <div class="form-view">
          <form id="person-upsert-form">
            <div class="form-group">
              <label for="form-person-name">Full Name</label>
              <div class="input-container">
                <i class="fa-solid fa-user-tag"></i>
                <input type="text" id="form-person-name" class="form-control" placeholder="Enter full name" required value="${isEditMode ? personToEdit.name : ''}">
              </div>
            </div>

            <div class="form-group">
              <label for="form-person-category">Category</label>
              <div class="input-container">
                <i class="fa-solid fa-graduation-cap"></i>
                <select id="form-person-category" class="form-control" style="padding-left:44px;" required>
                  <option value="" disabled ${!isEditMode ? 'selected' : ''}>Select Category</option>
                  <option value="Member" ${isEditMode && personToEdit.category === 'Member' ? 'selected' : ''}>Member</option>
                  <option value="Student" ${isEditMode && personToEdit.category === 'Student' ? 'selected' : ''}>Student</option>
                  <option value="Teacher" ${isEditMode && personToEdit.category === 'Teacher' ? 'selected' : ''}>Teacher</option>
                  <option value="Well Wishers" ${isEditMode && personToEdit.category === 'Well Wishers' ? 'selected' : ''}>Well Wishers</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="form-person-phone">Phone Number</label>
              <div class="input-container">
                <i class="fa-solid fa-phone"></i>
                <input type="tel" id="form-person-phone" class="form-control" placeholder="Enter 10-digit number" required pattern="[0-9]{10}" title="Please enter a valid 10-digit mobile number" value="${isEditMode ? personToEdit.phone : ''}">
              </div>
            </div>

            <div class="form-group">
              <label for="form-person-email">Email Address</label>
              <div class="input-container">
                <i class="fa-solid fa-envelope"></i>
                <input type="email" id="form-person-email" class="form-control" placeholder="Enter email address" required value="${isEditMode ? personToEdit.email : ''}">
              </div>
            </div>

            <div class="form-group">
              <label>Select Departments (Multi-select)</label>
              <div class="multi-select-list" id="form-depts-container">
                ${deptsCheckboxesHTML}
              </div>
            </div>

            <div class="form-group">
              <label for="form-person-sub">Subscription Cleared Upto</label>
              <div class="input-container">
                <i class="fa-solid fa-calendar-check"></i>
                <input type="month" id="form-person-sub" class="form-control" style="padding-left:44px;" required value="${isEditMode ? (personToEdit.subscriptionClearedUpto || new Date().toISOString().substring(0, 7)) : new Date().toISOString().substring(0, 7)}">
              </div>
            </div>

            <div class="form-group">
              <label for="form-person-address">Home Address</label>
              <textarea id="form-person-address" class="form-control" placeholder="Enter complete address">${isEditMode ? personToEdit.address : ''}</textarea>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top: 10px; padding:16px;">
              <i class="fa-solid fa-cloud-arrow-up"></i> ${isEditMode ? 'Save Changes' : 'Register Member'}
            </button>
          </form>
        </div>
      `;

      openModal(isEditMode ? 'Edit Person Profile' : 'Add New Person', formHTML);

      // Setup custom interactive UI bindings for multi-select checklist cards
      const checkboxes = document.querySelectorAll('.multi-select-item');
      checkboxes.forEach(item => {
        item.addEventListener('click', (e) => {
          // Prevent default checkbox clicks and manage toggling manually for tactile feel
          e.preventDefault();
          const checkbox = item.querySelector('input[type="checkbox"]');
          checkbox.checked = !checkbox.checked;
          
          if (checkbox.checked) {
            item.classList.add('selected');
          } else {
            item.classList.remove('selected');
          }
        });
      });

      // Submit listener
      const formElement = document.getElementById('person-upsert-form');
      formElement.addEventListener('submit', async (submitEvent) => {
        submitEvent.preventDefault();

        // 1. Fetch form input values
        const nameVal = document.getElementById('form-person-name').value.trim();
        const categoryVal = document.getElementById('form-person-category').value;
        const phoneVal = document.getElementById('form-person-phone').value.trim();
        const emailVal = document.getElementById('form-person-email').value.trim();
        const subVal = document.getElementById('form-person-sub').value || new Date().toISOString().substring(0, 7);
        const addressVal = document.getElementById('form-person-address').value.trim();

        // 2. Fetch all checked departments
        const selectedDepts = [];
        const checkedBoxes = formElement.querySelectorAll('input[name="form-depts"]:checked');
        checkedBoxes.forEach(box => {
          selectedDepts.push(box.value);
        });

        // Basic validation checklist
        if (!nameVal || !categoryVal || !phoneVal || !emailVal) {
          showToast('Please fill out all mandatory fields.', 'error');
          return;
        }

        const payload = {
          name: nameVal,
          category: categoryVal,
          phone: phoneVal,
          email: emailVal,
          departments: selectedDepts,
          subscriptionClearedUpto: subVal,
          address: addressVal
        };

        showLoader(isEditMode ? 'Updating profile...' : 'Adding member...');
        try {
          if (isEditMode) {
            await window.ApiService.updatePerson(personToEdit.id, payload);
            showToast('Person updated successfully.', 'success');
          } else {
            await window.ApiService.addPerson(payload);
            showToast('Person registered successfully.', 'success');
          }
          
          hideLoader();
          closeModal();
          
          // Refresh statistics and listing screen
          renderPersonsList();
          loadDashboardStats();
        } catch (e) {
          hideLoader();
          showToast('Error registering profile.', 'error');
        }
      });

    } catch (e) {
      hideLoader();
      showToast('Could not initiate form structures.', 'error');
    }
  };

  fabAddPerson.addEventListener('click', () => openPersonFormModal());

  // ==============================================
  // 11. EVENTS MODULE: LISTING & CREATION
  // ==============================================

  const renderEventsList = async () => {
    eventsListContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 12px; color: var(--primary);"></i>
        <p>Syncing schedule...</p>
      </div>
    `;

    try {
      const events = await window.ApiService.getEvents();
      const persons = await window.ApiService.getPersons();

      // Create mapping of persons for quick participant name fetch
      const personsMap = {};
      persons.forEach(p => { personsMap[p.id] = p; });

      eventsListContainer.innerHTML = '';

      if (events.length === 0) {
        eventsListContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 48px 20px; background: white; border-radius: var(--radius-lg); border: 1px dashed var(--border);">
            <i class="fa-solid fa-calendar-xmark" style="font-size: 2.5rem; margin-bottom: 16px; color: var(--text-muted);"></i>
            <h3 style="font-family:'Outfit'; font-weight:700; margin-bottom:6px; color: var(--text-main);">No Scheduled Events</h3>
            <p style="font-size:0.85rem;">Create a new event using the action button below.</p>
          </div>
        `;
        return;
      }

      events.forEach(event => {
        const card = document.createElement('div');
        card.className = 'app-card event-card';

        // Format dates beautifully e.g. 2026-05-28 -> Thursday, May 28, 2026
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        const eventDateObj = new Date(event.date);
        let formattedDate = event.date;
        if (!isNaN(eventDateObj.getTime())) {
          formattedDate = eventDateObj.toLocaleDateString('en-US', dateOptions);
        }

        // Render visual listing of participants names with emojis
        let participantsHTML = '';
        event.participants.forEach(pId => {
          const person = personsMap[pId];
          if (person) {
            let catEmoji = '👤';
            if (person.category === 'Student') catEmoji = '🎓';
            if (person.category === 'Teacher') catEmoji = '🗣️';
            if (person.category === 'Member') catEmoji = '🤝';
            if (person.category === 'Well Wishers') catEmoji = '🌟';

            participantsHTML += `
              <span class="dept-tag" style="background-color: var(--primary-light); color: var(--primary); font-size: 0.7rem; border-color: hsl(var(--primary-hsl), 0.15)">
                ${catEmoji} ${person.name}
              </span>
            `;
          }
        });

        card.innerHTML = `
          <div class="event-date">
            <i class="fa-solid fa-clock"></i>
            <span>${formattedDate}</span>
          </div>
          <h3 class="card-title" style="margin-bottom: 8px;">${event.title}</h3>
          <p class="event-desc">${event.description || 'No descriptive context provided.'}</p>
          
          <div class="participants-count" style="border-top: 1px dashed var(--border); padding-top: 10px;">
            <i class="fa-solid fa-users-viewfinder"></i>
            <span style="font-weight: 700; color: var(--text-main);">Participants (${event.participants.length}):</span>
          </div>
          <div class="card-depts-tags" style="margin-top: 8px;">
            ${participantsHTML || '<span class="dept-tag">No participants assigned</span>'}
          </div>
        `;

        eventsListContainer.appendChild(card);
      });

    } catch (e) {
      eventsListContainer.innerHTML = `
        <div style="text-align: center; color: var(--error); padding: 40px 20px;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.2rem; margin-bottom: 12px;"></i>
          <p>Failed syncing events schedule.</p>
        </div>
      `;
      console.error(e);
    }
  };

  // Create Event Form
  const openEventFormModal = async () => {
    showLoader('Fetching participants data...');
    try {
      const persons = await window.ApiService.getPersons();
      hideLoader();

      if (persons.length === 0) {
        showToast('Please register at least one member before scheduling events.', 'info');
        return;
      }

      // Generate checkable participant rows
      let participantCheckboxesHTML = '';
      persons.forEach(person => {
        let catEmoji = '👤';
        if (person.category === 'Student') catEmoji = '🎓';
        if (person.category === 'Teacher') catEmoji = '🗣️';
        if (person.category === 'Member') catEmoji = '🤝';
        if (person.category === 'Well Wishers') catEmoji = '🌟';

        participantCheckboxesHTML += `
          <label class="multi-select-item" data-person-id="${person.id}">
            <input type="checkbox" name="event-participants" value="${person.id}" style="display:none;">
            <span>${catEmoji} ${person.name} (${person.category})</span>
          </label>
        `;
      });

      // Today YYYY-MM-DD helper for date-picker minimum restriction
      const todayString = new Date().toISOString().split('T')[0];

      const formHTML = `
        <div class="form-view">
          <form id="event-creation-form">
            <div class="form-group">
              <label for="form-event-title">Event Title</label>
              <div class="input-container">
                <i class="fa-solid fa-bullhorn"></i>
                <input type="text" id="form-event-title" class="form-control" placeholder="Enter event name" required>
              </div>
            </div>

            <div class="form-group">
              <label for="form-event-date">Date Scheduled</label>
              <div class="input-container">
                <i class="fa-solid fa-calendar-check"></i>
                <input type="date" id="form-event-date" class="form-control" min="${todayString}" required>
              </div>
            </div>

            <div class="form-group">
              <label for="form-event-desc">Event Description</label>
              <textarea id="form-event-desc" class="form-control" placeholder="Provide event agenda or location details..."></textarea>
            </div>

            <div class="form-group">
              <label>Select Participants (Multi-select)</label>
              <div class="multi-select-list" id="form-participants-container">
                ${participantCheckboxesHTML}
              </div>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top: 10px; padding:16px;">
              <i class="fa-solid fa-calendar-plus"></i> Schedule Event
            </button>
          </form>
        </div>
      `;

      openModal('Create New Event', formHTML);

      // Custom checkboxes click toggle handler
      const checkboxes = document.querySelectorAll('.multi-select-item');
      checkboxes.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const checkbox = item.querySelector('input[type="checkbox"]');
          checkbox.checked = !checkbox.checked;
          
          if (checkbox.checked) {
            item.classList.add('selected');
          } else {
            item.classList.remove('selected');
          }
        });
      });

      // Submit listener
      const eventForm = document.getElementById('event-creation-form');
      eventForm.addEventListener('submit', async (submitEvent) => {
        submitEvent.preventDefault();

        const titleVal = document.getElementById('form-event-title').value.trim();
        const dateVal = document.getElementById('form-event-date').value;
        const descVal = document.getElementById('form-event-desc').value.trim();

        // Accumulate checked participants
        const selectedParticipants = [];
        const checkedBoxes = eventForm.querySelectorAll('input[name="event-participants"]:checked');
        checkedBoxes.forEach(box => {
          selectedParticipants.push(box.value);
        });

        if (!titleVal || !dateVal) {
          showToast('Please fill out event title and date.', 'error');
          return;
        }

        const payload = {
          title: titleVal,
          date: dateVal,
          description: descVal,
          participants: selectedParticipants
        };

        showLoader('Scheduling event...');
        try {
          await window.ApiService.addEvent(payload);
          hideLoader();
          closeModal();
          showToast('Event scheduled successfully!', 'success');
          
          // Refresh statistics and listing screen
          renderEventsList();
          loadDashboardStats();
        } catch (e) {
          hideLoader();
          showToast('Error scheduling event.', 'error');
        }
      });

    } catch (e) {
      hideLoader();
      showToast('Could not load participants checklist.', 'error');
    }
  };

  fabAddEvent.addEventListener('click', openEventFormModal);

  // ==============================================
  // 11. SUBSCRIPTION MODULE RENDERING & FLOWS
  // ==============================================

  const getSubscriptionBadgeHTML = (dateString) => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const isCleared = dateString && dateString >= currentMonth;
    const readableDate = dateString ? new Date(dateString + '-02').toLocaleString('default', { month: 'long', year: 'numeric' }) : 'None';
    
    if (isCleared) {
      return `
        <span class="status-badge status-badge-cleared">
          <i class="fa-solid fa-circle-check"></i> Cleared: ${readableDate}
        </span>
      `;
    } else {
      return `
        <span class="status-badge status-badge-overdue">
          <i class="fa-solid fa-circle-exclamation"></i> Overdue (${readableDate})
        </span>
      `;
    }
  };

  const renderSubscriptionList = async () => {
    if (!subscriptionListContainer) return;
    
    subscriptionListContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 12px; color: var(--primary);"></i>
        <p>Syncing subscription registry...</p>
      </div>
    `;
    
    try {
      const persons = await window.ApiService.getPersons();
      const currentMonth = new Date().toISOString().substring(0, 7);
      
      const searchQuery = subscriptionSearch.value.trim().toLowerCase();
      
      const filtered = persons.filter(p => {
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery)) return false;
        
        const isCleared = p.subscriptionClearedUpto && p.subscriptionClearedUpto >= currentMonth;
        if (activeSubscriptionFilter === 'cleared' && !isCleared) return false;
        if (activeSubscriptionFilter === 'overdue' && isCleared) return false;
        
        return true;
      });
      
      subscriptionListContainer.innerHTML = '';
      
      if (filtered.length === 0) {
        subscriptionListContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 48px 20px; background: white; border-radius: var(--radius-lg); border: 1px dashed var(--border);">
            <i class="fa-solid fa-circle-question" style="font-size: 2.5rem; margin-bottom: 16px; color: var(--text-muted);"></i>
            <h3 style="font-family:'Outfit'; font-weight:700; margin-bottom:6px; color: var(--text-main);">No Matches</h3>
            <p style="font-size:0.85rem;">Try adjusting your filters or search keywords.</p>
          </div>
        `;
        return;
      }
      
      filtered.forEach(person => {
        const card = document.createElement('div');
        card.className = 'sub-card';
        
        card.innerHTML = `
          <div class="sub-card-row">
            <h3 class="sub-card-member">${person.name}</h3>
            <span class="badge ${person.category === 'Student' ? 'badge-student' : person.category === 'Teacher' ? 'badge-teacher' : person.category === 'Well Wishers' ? 'badge-wellwishers' : 'badge-member'}">${person.category}</span>
          </div>
          <div class="sub-card-details">
            <div class="detail-row">
              <i class="fa-solid fa-phone"></i>
              <span>${person.phone}</span>
            </div>
            <div style="margin-top: 6px;">
              ${getSubscriptionBadgeHTML(person.subscriptionClearedUpto)}
            </div>
          </div>
          <div class="sub-card-footer">
            <button class="btn-record-payment" data-person-id="${person.id}" data-person-name="${person.name}" data-current-sub="${person.subscriptionClearedUpto || ''}">
              <i class="fa-solid fa-credit-card"></i> Record Payment
            </button>
          </div>
        `;
        
        card.querySelector('.btn-record-payment').addEventListener('click', (e) => {
          e.stopPropagation();
          openQuickPaymentModal(person.id, person.name, person.subscriptionClearedUpto);
        });
        
        subscriptionListContainer.appendChild(card);
      });
      
    } catch (err) {
      subscriptionListContainer.innerHTML = `<p style="color:var(--error); text-align:center; padding: 20px;">Error loading subscriptions.</p>`;
      console.error(err);
    }
  };

  const openQuickPaymentModal = (personId, name, currentSubDate) => {
    const defaultMonth = currentSubDate || new Date().toISOString().substring(0, 7);
    
    const contentHTML = `
      <div class="form-view">
        <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 20px; text-align:left;">
          Select the month up to which <strong>${name}</strong> has cleared their subscription fees.
        </p>
        
        <form id="quick-payment-form">
          <div class="form-group">
            <label for="quick-sub-month">Cleared Upto Month</label>
            <div class="input-container">
              <i class="fa-solid fa-calendar-days"></i>
              <input type="month" id="quick-sub-month" class="form-control" style="padding-left:44px;" required value="${defaultMonth}">
            </div>
          </div>
          
          <button type="submit" class="btn btn-primary" style="margin-top: 15px; padding: 14px; width: 100%;">
            <i class="fa-solid fa-circle-check"></i> Record Payment
          </button>
        </form>
      </div>
    `;
    
    openModal('Record Subscription', contentHTML);
    
    document.getElementById('quick-payment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const selectedMonth = document.getElementById('quick-sub-month').value;
      
      showLoader('Recording payment...');
      try {
        await window.ApiService.updateSubscription(personId, selectedMonth);
        hideLoader();
        closeModal();
        showToast(`Subscription cleared month updated for ${name}!`, 'success');
        
        // Reload views
        renderSubscriptionList();
        loadDashboardStats();
      } catch (err) {
        hideLoader();
        showToast(err.message, 'error');
      }
    });
  };

  // Search filter matching
  if (subscriptionSearch) {
    subscriptionSearch.addEventListener('input', () => {
      renderSubscriptionList();
    });
  }

  // Filter chips triggers
  if (subscriptionFilterChips) {
    subscriptionFilterChips.addEventListener('click', (e) => {
      const clickedChip = e.target.closest('.chip');
      if (!clickedChip) return;
      
      subscriptionFilterChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      clickedChip.classList.add('active');
      
      activeSubscriptionFilter = clickedChip.getAttribute('data-filter');
      renderSubscriptionList();
    });
  }

  // ==============================================
  // 12. RUN INITIALIZATIONS ON BOOTSTRAP
  // ==============================================
  checkSession();
});
