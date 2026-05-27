/**
 * app.js
 * Core Application Controller and Router.
 * Manages screen states, event bindings, DOM rendering, forms, and custom UI behaviors.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log("=== DIAGNOSTIC: Version 2.0 Active (Responsive Height Patch) ===");
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
  const btnCloudSyncLogin = document.getElementById('btn-cloud-sync-login');
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
    events: document.getElementById('action-events'),
    users: document.getElementById('action-users')
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
      applyRolePermissions(user.role);
      switchScreen('screen-dashboard');
      loadDashboardStats();
      updateCloudStatusUI();
      renderCommonGallery();
    } else {
      bottomNav.style.display = 'none';
      switchScreen('screen-login');
    }
  };

  const applyRolePermissions = (role) => {
    // 1. Reset all previously applied permissions classes
    const elementsToReset = document.querySelectorAll('.role-hidden, .role-disabled');
    elementsToReset.forEach(el => {
      el.classList.remove('role-hidden', 'role-disabled');
    });

    const navPersons = document.getElementById('nav-persons');
    const navSubscription = document.getElementById('nav-subscription');
    const actionPersons = document.getElementById('action-persons');
    const actionSubscription = document.getElementById('action-subscription');
    const statPersonsCard = document.getElementById('stat-persons-trigger');
    const fabPerson = document.getElementById('fab-add-person');
    const fabEvent = document.getElementById('fab-add-event');
    const actionUsers = document.getElementById('action-users');

    // Hide user accounts action card for everyone except Admin
    if (role !== 'Admin') {
      if (actionUsers) actionUsers.classList.add('role-hidden');
    }

    if (role === 'Student') {
      // Students see only Events and Departments
      if (navPersons) navPersons.classList.add('role-hidden');
      if (navSubscription) navSubscription.classList.add('role-hidden');
      if (actionPersons) actionPersons.classList.add('role-hidden');
      if (actionSubscription) actionSubscription.classList.add('role-hidden');
      if (statPersonsCard) statPersonsCard.classList.add('role-hidden');
      if (fabPerson) fabPerson.classList.add('role-hidden');
      if (fabEvent) fabEvent.classList.add('role-hidden');
    } 
    
    else if (role === 'Teacher') {
      // Teachers cannot access Subscription tracker, and have Read-Only on Events
      if (navSubscription) navSubscription.classList.add('role-hidden');
      if (actionSubscription) actionSubscription.classList.add('role-hidden');
      if (fabEvent) fabEvent.classList.add('role-hidden');
      
      // Teachers can only view/manage Students: hide other category filter chips
      if (filterChipsContainer) {
        const chipsToHide = filterChipsContainer.querySelectorAll('.chip[data-category="Member"], .chip[data-category="Teacher"], .chip[data-category="Well Wishers"]');
        chipsToHide.forEach(chip => chip.classList.add('role-hidden'));
      }
    } 
    
    else if (role === 'Member') {
      // Members have Read-Only access: Hide all add buttons (FABs)
      if (fabPerson) fabPerson.classList.add('role-hidden');
      if (fabEvent) fabEvent.classList.add('role-hidden');
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

  const openModal = (title, contentHTML, showBackButton = false) => {
    modalTitle.innerText = title;
    modalBody.innerHTML = contentHTML;
    
    // Manage dynamic back button in modal header
    let backBtn = modalOverlay.querySelector('.modal-back-btn');
    if (showBackButton) {
      if (!backBtn) {
        backBtn = document.createElement('button');
        backBtn.className = 'modal-back-btn';
        backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
        backBtn.title = 'Go Back';
        modalTitle.parentNode.insertBefore(backBtn, modalTitle);
      }
      backBtn.style.display = 'flex';
    } else {
      if (backBtn) backBtn.style.display = 'none';
    }
    
    modalOverlay.classList.add('active');
  };

  const closeModal = () => {
    modalOverlay.classList.remove('active');
    
    // Hide back button on close to avoid flashing on next modal open
    const backBtn = modalOverlay.querySelector('.modal-back-btn');
    if (backBtn) backBtn.style.display = 'none';

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
      
      checkSession();
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

  if (btnCloudSyncLogin) {
    btnCloudSyncLogin.addEventListener('click', (e) => {
      e.preventDefault();
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
            <button type="button" class="provider-btn" data-provider="none">
              <i class="fa-solid fa-hard-drive"></i>
              <span>Local Only</span>
            </button>
            <button type="button" class="provider-btn" data-provider="supabase">
              <i class="fa-solid fa-bolt"></i>
              <span>Supabase</span>
            </button>
            <button type="button" class="provider-btn" data-provider="firebase">
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
        renderCommonGallery();
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
        renderCommonGallery();
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
        renderCommonGallery();
      } catch (err) {
        hideLoader();
        showToast(err.message, 'error');
      }
    });
  };

  // Expose globally for login page inline onclick trigger
  window.openCloudSyncModal = openCloudSyncModal;

  // --- HTML5 Canvas Image Compression Utility ---
  const compressAndLoadImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 375;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // --- Compiled Common Gallery (Dashboard) ---
  let commonGalleryItems = []; // Flat list of images loaded dynamically
  let activeLightboxItems = []; // Dynamic list of images currently loaded in the lightbox
  let currentLightboxIndex = 0; // State variable for bidirectional traversal

  const renderCommonGallery = async () => {
    const galleryContainer = document.getElementById('common-gallery-container');
    const btnPrevSlider = document.getElementById('gallery-slider-prev');
    const btnNextSlider = document.getElementById('gallery-slider-next');
    if (!galleryContainer) return;

    try {
      const depts = await window.ApiService.getDepartments();
      commonGalleryItems = [];
      let compiledHTML = '';
      
      depts.forEach(dept => {
        if (dept.gallery && Array.isArray(dept.gallery)) {
          dept.gallery.forEach(img => {
            commonGalleryItems.push({
              url: img.url,
              title: img.title,
              deptName: dept.name,
              deptIcon: dept.icon
            });
          });
        }
      });

      if (commonGalleryItems.length === 0) {
        if (btnPrevSlider) btnPrevSlider.style.display = 'none';
        if (btnNextSlider) btnNextSlider.style.display = 'none';
        galleryContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 24px 10px; border: 1px dashed var(--border); border-radius: var(--radius-md); width:100%;">
            <i class="fa-solid fa-images" style="font-size: 1.8rem; margin-bottom: 8px;"></i>
            <p style="font-size: 0.8rem; margin:0;">No photos in the gallery yet.</p>
          </div>
        `;
        return;
      }

      if (btnPrevSlider) btnPrevSlider.style.display = 'flex';
      if (btnNextSlider) btnNextSlider.style.display = 'flex';

      commonGalleryItems.forEach((item, index) => {
        compiledHTML += `
          <div class="common-gallery-card" data-index="${index}">
            <img class="common-gallery-img" src="${item.url}" alt="${item.title}" loading="lazy">
            <span class="common-gallery-badge">${item.deptIcon} ${item.deptName}</span>
            <div class="common-gallery-info">
              <h4 class="common-gallery-title">${item.title}</h4>
            </div>
          </div>
        `;
      });

      galleryContainer.innerHTML = compiledHTML;

      // Bind zoom lightbox click triggers
      const cards = galleryContainer.querySelectorAll('.common-gallery-card');
      cards.forEach(card => {
        card.addEventListener('click', () => {
          const index = parseInt(card.getAttribute('data-index'));
          openLightbox(index, commonGalleryItems);
        });
      });

      // Bind horizontal slider buttons scroll triggers
      if (btnPrevSlider) {
        btnPrevSlider.onclick = () => {
          galleryContainer.scrollBy({ left: -240, behavior: 'smooth' });
        };
      }
      if (btnNextSlider) {
        btnNextSlider.onclick = () => {
          galleryContainer.scrollBy({ left: 240, behavior: 'smooth' });
        };
      }

    } catch (err) {
      console.error('Error rendering common gallery:', err);
      galleryContainer.innerHTML = `<p style="text-align:center; font-size:0.8rem; color:var(--error); width:100%;">Failed to load gallery.</p>`;
    }
  };

  // --- Lightbox Overlay Zoom ---
  const lightboxOverlay = document.getElementById('lightbox-overlay');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  const openLightbox = (index, itemsArray = commonGalleryItems) => {
    if (!lightboxOverlay || itemsArray.length === 0) return;
    
    activeLightboxItems = itemsArray;

    // Boundary checks for cyclic navigation
    if (index < 0) {
      index = activeLightboxItems.length - 1;
    } else if (index >= activeLightboxItems.length) {
      index = 0;
    }

    currentLightboxIndex = index;
    const item = activeLightboxItems[index];

    lightboxImg.src = item.url;
    lightboxCaption.innerText = item.deptName 
      ? `${item.title} (${item.deptName} Wing)` 
      : item.title;
    lightboxOverlay.classList.add('active');
  };

  const closeLightbox = () => {
    if (!lightboxOverlay) return;
    lightboxOverlay.classList.remove('active');
    setTimeout(() => {
      lightboxImg.src = '';
      lightboxCaption.innerText = '';
    }, 300);
  };

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent modal dismiss
      openLightbox(currentLightboxIndex - 1, activeLightboxItems);
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent modal dismiss
      openLightbox(currentLightboxIndex + 1, activeLightboxItems);
    });
  }

  if (lightboxOverlay) {
    lightboxOverlay.addEventListener('click', (e) => {
      if (e.target === lightboxOverlay) closeLightbox();
    });
  }

  // Keyboard navigation support
  document.addEventListener('keydown', (e) => {
    if (!lightboxOverlay || !lightboxOverlay.classList.contains('active')) return;
    
    if (e.key === 'ArrowLeft') {
      openLightbox(currentLightboxIndex - 1, activeLightboxItems);
    } else if (e.key === 'ArrowRight') {
      openLightbox(currentLightboxIndex + 1, activeLightboxItems);
    } else if (e.key === 'Escape') {
      closeLightbox();
    }
  });

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
  if (quickLinks.users) {
    quickLinks.users.addEventListener('click', () => openUserManagementModal());
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
      const currentUser = window.AuthService.getCurrentUser();
      const isAdmin = currentUser && currentUser.role === 'Admin';
      
      let treeHTML = '';
      if (isAdmin) {
        treeHTML += `
          <div class="admin-create-actions" style="margin-bottom: 20px; display: flex; justify-content: center;">
            <button class="btn btn-primary" id="btn-create-dept-trigger" style="font-size: 0.875rem; padding: 10px 18px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-folder-plus"></i> Add New Department
            </button>
          </div>
        `;
      }

      treeHTML += `
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

      // Event binding for dynamic add department trigger (Admin only)
      if (isAdmin) {
        const createBtn = document.getElementById('btn-create-dept-trigger');
        if (createBtn) {
          createBtn.addEventListener('click', () => {
            closeModal();
            setTimeout(() => {
              openCreateDepartmentModal();
            }, 320);
          });
        }
      }

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

      // Event bindings for selecting a department (opens Department Details modal)
      const childCards = document.querySelectorAll('.dept-child-card');
      childCards.forEach(card => {
        card.addEventListener('click', () => {
          const deptId = card.getAttribute('data-dept-id');
          closeModal();
          setTimeout(() => {
            openDepartmentDetailsModal(deptId);
          }, 320);
        });
      });

    } catch (e) {
      hideLoader();
      showToast('Could not load departments list.', 'error');
      console.error(e);
    }
  };

  // ==============================================
  // 7B. DEPARTMENT DETAILS & ADMIN USER ACCOUNTS
  // ==============================================

  const openDepartmentDetailsModal = async (deptId) => {
    showLoader('Fetching department details...');
    try {
      const depts = await window.ApiService.getDepartments();
      const dept = depts.find(d => d.id === deptId);
      hideLoader();

      if (!dept) {
        showToast('Department not found.', 'error');
        return;
      }

      // Check role based permissions for Edit action
      const user = window.AuthService.getCurrentUser();
      const showEditBtn = user && user.role === 'Admin';

      let contentHTML = '';

      if (deptId === 'general') {
        let execHTML = '';
        dept.executiveCommittee.forEach(m => {
          execHTML += `
            <div class="committee-item">
              <span class="committee-member-name">${m.name}</span>
              <span class="committee-member-role">${m.role}</span>
            </div>
          `;
        });

        let subHTML = '';
        dept.subCommittee.forEach(m => {
          subHTML += `
            <div class="committee-item">
              <span class="committee-member-name">${m.name}</span>
              <span class="committee-member-role">${m.role}</span>
            </div>
          `;
        });

        let galleryHTML = '';
        dept.gallery.forEach(img => {
          galleryHTML += `
            <div class="dept-gallery-item">
              <img src="${img.url}" alt="${img.title}" loading="lazy">
              <div class="dept-gallery-title">${img.title}</div>
            </div>
          `;
        });

        contentHTML = `
          <div class="dept-details-modal">
            <div class="dept-details-header">
              <div class="dept-details-avatar">${dept.icon}</div>
              <h2 class="dept-details-name">${dept.name} Department</h2>
              <span class="badge badge-member" style="margin-bottom: 8px;">General Wing</span>
            </div>

            <div class="dept-details-body">
              <div>
                <div class="dept-section-title"><i class="fa-solid fa-users-gear"></i> Executive Committee</div>
                <div class="committee-list">
                  ${execHTML}
                </div>
              </div>

              <div style="margin-top: 10px;">
                <div class="dept-section-title"><i class="fa-solid fa-people-group"></i> Sub-Committee</div>
                <div class="committee-list">
                  ${subHTML}
                </div>
              </div>

              <div style="margin-top: 10px;">
                <div class="dept-section-title"><i class="fa-solid fa-images"></i> Wing Gallery</div>
                <div class="dept-gallery-scroll">
                  ${galleryHTML}
                </div>
              </div>
            </div>

            <div class="modal-footer-btns" style="margin-top: 20px; flex-wrap: wrap;">
              <button class="btn btn-secondary" id="btn-back-to-tree" style="flex: 1; min-width: 80px;"><i class="fa-solid fa-arrow-left"></i> Back</button>
              <button class="btn btn-primary" id="btn-view-dept-members" style="flex: 2; min-width: 150px;"><i class="fa-solid fa-users"></i> Members</button>
              ${showEditBtn ? `<button class="btn btn-secondary" id="btn-edit-dept" style="width: 100%; margin-top: 8px; background-color: var(--primary-light); color: var(--primary); border-color: hsl(var(--primary-hsl), 0.2);"><i class="fa-solid fa-pen-to-square"></i> Edit Wing Details</button>` : ''}
            </div>
          </div>
        `;
      } else {
        let galleryHTML = '';
        dept.gallery.forEach(img => {
          galleryHTML += `
            <div class="dept-gallery-item">
              <img src="${img.url}" alt="${img.title}" loading="lazy">
              <div class="dept-gallery-title">${img.title}</div>
            </div>
          `;
        });

        contentHTML = `
          <div class="dept-details-modal">
            <div class="dept-details-header">
              <div class="dept-details-avatar">${dept.icon}</div>
              <h2 class="dept-details-name">${dept.name}</h2>
              <span class="badge ${dept.category === 'Cultural' ? 'badge-student' : dept.category === 'Sports' ? 'badge-teacher' : 'badge-member'}" style="margin-bottom: 8px;">${dept.category} Wing</span>
            </div>

            <div class="dept-details-body">
              <div>
                <div class="dept-section-title"><i class="fa-solid fa-circle-info"></i> About the Department</div>
                <div class="dept-about-text">
                  ${dept.about}
                </div>
              </div>

              <div>
                <div class="dept-section-title"><i class="fa-solid fa-clock"></i> Timings</div>
                <div class="dept-about-text" style="font-weight: 600;">
                  <i class="fa-regular fa-calendar-days" style="color:var(--primary); margin-right: 6px;"></i> ${dept.timings}
                </div>
              </div>

              <div class="dept-stats-grid">
                <div class="dept-stat-box">
                  <span class="stat-label">Admission Fees</span>
                  <span class="stat-val"><i class="fa-solid fa-indian-rupee-sign" style="font-size:0.75rem; color:var(--success);"></i> ${dept.admissionFees}</span>
                </div>
                <div class="dept-stat-box">
                  <span class="stat-label">Monthly Fees</span>
                  <span class="stat-val"><i class="fa-solid fa-indian-rupee-sign" style="font-size:0.75rem; color:var(--primary);"></i> ${dept.monthlyFees}/mo</span>
                </div>
              </div>

              <div>
                <div class="dept-section-title"><i class="fa-solid fa-user-tie"></i> Point of Contact (POC)</div>
                <div class="dept-poc-card">
                  <div class="dept-poc-info">
                    <span class="dept-poc-name">${dept.poc.name}</span>
                    <span class="dept-poc-role">${dept.poc.role}</span>
                  </div>
                  <a href="tel:${dept.poc.phone}" class="dept-poc-call" title="Call Point of Contact">
                    <i class="fa-solid fa-phone"></i>
                  </a>
                </div>
              </div>

              <div>
                <div class="dept-section-title"><i class="fa-solid fa-images"></i> Department Gallery</div>
                <div class="dept-gallery-scroll">
                  ${galleryHTML}
                </div>
              </div>
            </div>

            <div class="modal-footer-btns" style="margin-top: 20px; flex-wrap: wrap;">
              <button class="btn btn-secondary" id="btn-back-to-tree" style="flex: 1; min-width: 80px;"><i class="fa-solid fa-arrow-left"></i> Back</button>
              <button class="btn btn-primary" id="btn-view-dept-members" style="flex: 2; min-width: 150px;"><i class="fa-solid fa-users"></i> Members</button>
              ${showEditBtn ? `<button class="btn btn-secondary" id="btn-edit-dept" style="width: 100%; margin-top: 8px; background-color: var(--primary-light); color: var(--primary); border-color: hsl(var(--primary-hsl), 0.2);"><i class="fa-solid fa-pen-to-square"></i> Edit Wing Details</button>` : ''}
            </div>
          </div>
        `;
      }

      openModal(`${dept.name} Details`, contentHTML, true);

      // Bind click triggers to department details gallery items
      const deptGalleryItems = modalOverlay.querySelectorAll('.dept-gallery-item');
      deptGalleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
          const formattedItems = dept.gallery.map(img => ({
            url: img.url,
            title: img.title,
            deptName: dept.name,
            deptIcon: dept.icon
          }));
          openLightbox(index, formattedItems);
        });
      });

      // Bind dynamic modal header back button
      const headerBackBtn = modalOverlay.querySelector('.modal-back-btn');
      if (headerBackBtn) {
        const newHeaderBackBtn = headerBackBtn.cloneNode(true);
        headerBackBtn.parentNode.replaceChild(newHeaderBackBtn, headerBackBtn);
        newHeaderBackBtn.addEventListener('click', () => {
          closeModal();
          setTimeout(() => {
            openDepartmentsModal();
          }, 320);
        });
      }

      document.getElementById('btn-back-to-tree').addEventListener('click', () => {
        closeModal();
        setTimeout(() => {
          openDepartmentsModal();
        }, 320);
      });

      document.getElementById('btn-view-dept-members').addEventListener('click', () => {
        closeModal();
        switchScreen('screen-persons');
        personsSearch.value = `dept:${deptId}`;
        personSearchQuery = `dept:${deptId}`;
        renderPersonsList();
        showToast(`Filtered members list by department: ${dept.name}`, 'info');
      });

      if (showEditBtn) {
        document.getElementById('btn-edit-dept').addEventListener('click', () => {
          closeModal();
          setTimeout(() => {
            openDepartmentEditFormModal(deptId);
          }, 320);
        });
      }

    } catch (e) {
      hideLoader();
      showToast('Could not load department details.', 'error');
      console.error(e);
    }
  };

  const openDepartmentEditFormModal = async (deptId) => {
    showLoader('Loading department details...');
    try {
      const depts = await window.ApiService.getDepartments();
      const dept = depts.find(d => d.id === deptId);
      hideLoader();

      if (!dept) {
        showToast('Department not found.', 'error');
        return;
      }

      // Maintain dynamic local array copy of the gallery photos
      let currentGallery = [...dept.gallery];

      // Reusable HTML compiler for dynamic gallery editing
      const renderGalleryEditorHTML = () => {
        let itemsHTML = '';
        currentGallery.forEach((img, idx) => {
          itemsHTML += `
            <div class="form-gallery-item" data-idx="${idx}">
              <img src="${img.url}" alt="${img.title}">
              <button type="button" class="btn-remove-gallery-item" data-idx="${idx}" title="Remove photo">
                <i class="fa-solid fa-xmark"></i>
              </button>
              <div class="form-gallery-caption-overlay">${img.title}</div>
            </div>
          `;
        });

        return `
          <div class="form-group" style="margin-bottom: 16px;">
            <label style="margin-bottom:6px; display:block;">Department Gallery Photos</label>
            <div class="form-gallery-grid" id="form-gallery-grid-items">
              ${itemsHTML || '<div style="grid-column: span 3; text-align: center; color: var(--text-muted); padding: 16px 10px; border: 1px dashed var(--border); border-radius: var(--radius-sm); font-size: 0.8rem; background-color: var(--background);">No photos inside this wing.</div>'}
            </div>
            
            <div class="form-file-upload-card" id="form-file-uploader-trigger">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span>Browse Device Photo</span>
              <p>PNG, JPG up to 5MB (auto-compressed)</p>
              <input type="file" id="form-file-uploader-input" accept="image/*" style="display:none;">
            </div>
            
            <div id="form-file-uploader-status" style="display:none; margin-bottom: 12px; font-size:0.8rem; background-color: var(--background); border:1px solid var(--border); border-radius: var(--radius-sm); padding:10px; text-align:left;">
              <div class="form-group" style="margin-bottom: 8px;">
                <label for="form-new-photo-caption" style="font-size:0.75rem; margin-bottom:4px; font-weight:700; color:var(--text-muted);">Photo Caption</label>
                <input type="text" id="form-new-photo-caption" class="form-control" placeholder="E.g. Annual General Meeting" style="padding: 8px 10px; font-size: 0.85rem;">
              </div>
              <button type="button" class="btn btn-primary" id="btn-add-uploaded-photo" style="padding: 8px 12px; font-size:0.8rem; width:100%;">
                <i class="fa-solid fa-plus"></i> Append to Wing Gallery
              </button>
            </div>
          </div>
        `;
      };

      // Handler to bind interactive upload event listeners dynamically
      const bindGalleryEvents = () => {
        const gridContainer = document.getElementById('form-gallery-grid-items');
        const uploadTrigger = document.getElementById('form-file-uploader-trigger');
        const uploadInput = document.getElementById('form-file-uploader-input');
        const uploadStatus = document.getElementById('form-file-uploader-status');
        const newCaptionInput = document.getElementById('form-new-photo-caption');
        const btnAddPhoto = document.getElementById('btn-add-uploaded-photo');
        
        let loadedBase64 = '';

        // Deletion clicks
        if (gridContainer) {
          const deleteBtns = gridContainer.querySelectorAll('.btn-remove-gallery-item');
          deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const idx = parseInt(btn.getAttribute('data-idx'));
              currentGallery.splice(idx, 1);
              refreshGalleryUI();
            });
          });
        }

        // Picker click trigger
        if (uploadTrigger && uploadInput) {
          uploadTrigger.addEventListener('click', () => {
            uploadInput.click();
          });
        }

        // File compression trigger on change
        if (uploadInput) {
          uploadInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            showLoader('Compressing photo...');
            try {
              loadedBase64 = await compressAndLoadImage(file);
              hideLoader();
              uploadStatus.style.display = 'block';
              
              // Preset caption with filename
              newCaptionInput.value = file.name.split('.')[0] || 'Gallery Photo';
              newCaptionInput.focus();
              showToast('Photo compressed successfully!', 'success');
            } catch (err) {
              hideLoader();
              showToast('Failed to load image: ' + err.message, 'error');
            }
          });
        }

        // Save uploaded photo to current list
        if (btnAddPhoto) {
          btnAddPhoto.addEventListener('click', () => {
            const caption = newCaptionInput.value.trim();
            if (!caption) {
              showToast('Please enter a caption for the photo.', 'error');
              return;
            }
            if (!loadedBase64) {
              showToast('No image loaded.', 'error');
              return;
            }

            currentGallery.push({
              title: caption,
              url: loadedBase64
            });

            uploadStatus.style.display = 'none';
            uploadInput.value = '';
            loadedBase64 = '';
            refreshGalleryUI();
            showToast('Photo added to list!', 'success');
          });
        }
      };

      const refreshGalleryUI = () => {
        const gridItems = document.getElementById('form-gallery-grid-items');
        if (!gridItems) return;
        
        let itemsHTML = '';
        currentGallery.forEach((img, idx) => {
          itemsHTML += `
            <div class="form-gallery-item" data-idx="${idx}">
              <img src="${img.url}" alt="${img.title}">
              <button type="button" class="btn-remove-gallery-item" data-idx="${idx}" title="Remove photo">
                <i class="fa-solid fa-xmark"></i>
              </button>
              <div class="form-gallery-caption-overlay">${img.title}</div>
            </div>
          `;
        });

        gridItems.innerHTML = itemsHTML || '<div style="grid-column: span 3; text-align: center; color: var(--text-muted); padding: 16px 10px; border: 1px dashed var(--border); border-radius: var(--radius-sm); font-size: 0.8rem; background-color: var(--background);">No photos inside this wing.</div>';
        
        // Re-bind delete listeners
        const deleteBtns = gridItems.querySelectorAll('.btn-remove-gallery-item');
        deleteBtns.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.getAttribute('data-idx'));
            currentGallery.splice(idx, 1);
            refreshGalleryUI();
          });
        });
      };

      let formHTML = '';

      if (deptId === 'general') {
        let execInputs = '';
        dept.executiveCommittee.forEach((m, idx) => {
          execInputs += `
            <div style="border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 10px; background: white;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Executive #${idx + 1} (${m.role})</div>
              <input type="hidden" id="edit-exec-role-${idx}" value="${m.role}">
              <div class="form-group" style="margin-bottom: 6px;">
                <input type="text" id="edit-exec-name-${idx}" class="form-control" placeholder="Name" required value="${m.name}" style="padding: 8px 12px; font-size: 0.85rem;">
              </div>
            </div>
          `;
        });

        let subInputs = '';
        dept.subCommittee.forEach((m, idx) => {
          subInputs += `
            <div style="border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 10px; background: white;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Sub-Committee #${idx + 1} (${m.role})</div>
              <input type="hidden" id="edit-sub-role-${idx}" value="${m.role}">
              <div class="form-group" style="margin-bottom: 6px;">
                <input type="text" id="edit-sub-name-${idx}" class="form-control" placeholder="Name" required value="${m.name}" style="padding: 8px 12px; font-size: 0.85rem;">
              </div>
            </div>
          `;
        });

        formHTML = `
          <div class="form-view" style="padding-bottom: 20px;">
            <form id="dept-edit-form-general">
              <div class="dept-section-title" style="margin-bottom: 10px;"><i class="fa-solid fa-users-gear"></i> Executive Committee</div>
              ${execInputs}

              <div class="dept-section-title" style="margin-top: 15px; margin-bottom: 10px;"><i class="fa-solid fa-people-group"></i> Sub-Committee</div>
              ${subInputs}

              <div class="dept-section-title" style="margin-top: 15px; margin-bottom: 10px;"><i class="fa-solid fa-images"></i> Dynamic Photo Gallery</div>
              ${renderGalleryEditorHTML()}

              <div class="modal-footer-btns" style="margin-top: 20px;">
                <button type="button" class="btn btn-secondary" id="btn-cancel-edit-dept" style="width: 48%;"><i class="fa-solid fa-xmark"></i> Cancel</button>
                <button type="submit" class="btn btn-primary" style="width: 48%;"><i class="fa-solid fa-floppy-disk"></i> Save Wing</button>
              </div>
            </form>
          </div>
        `;
      } else {
        formHTML = `
          <div class="form-view" style="padding-bottom: 20px;">
            <form id="dept-edit-form-non-general">
              <div class="form-group">
                <label for="edit-dept-about">About the Department</label>
                <textarea id="edit-dept-about" class="form-control" required style="padding: 12px; font-size: 0.875rem; height: 90px;">${dept.about}</textarea>
              </div>

              <div class="form-group">
                <label for="edit-dept-timings">Timings</label>
                <div class="input-container">
                  <i class="fa-regular fa-clock"></i>
                  <input type="text" id="edit-dept-timings" class="form-control" placeholder="E.g. Saturdays, 4:00 PM - 6:00 PM" required value="${dept.timings}" style="padding-left: 40px; font-size: 0.875rem;">
                </div>
              </div>

              <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                <div class="form-group" style="flex: 1; margin-bottom: 0;">
                  <label for="edit-dept-adm-fees">Admission Fees</label>
                  <input type="text" id="edit-dept-adm-fees" class="form-control" placeholder="E.g. ₹500" required value="${dept.admissionFees}" style="padding: 10px 12px; font-size: 0.875rem;">
                </div>
                <div class="form-group" style="flex: 1; margin-bottom: 0;">
                  <label for="edit-dept-mon-fees">Monthly Fees</label>
                  <input type="text" id="edit-dept-mon-fees" class="form-control" placeholder="E.g. ₹200" required value="${dept.monthlyFees}" style="padding: 10px 12px; font-size: 0.875rem;">
                </div>
              </div>

              <div class="dept-section-title" style="margin-top: 15px; margin-bottom: 10px;"><i class="fa-solid fa-user-tie"></i> Point of Contact (POC)</div>
              <div style="border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; background: white; margin-bottom: 16px;">
                <div class="form-group" style="margin-bottom: 10px;">
                  <label for="edit-dept-poc-name" style="font-size: 0.75rem; margin-bottom: 4px;">POC Full Name</label>
                  <input type="text" id="edit-dept-poc-name" class="form-control" placeholder="E.g. Arundhati Sen" required value="${dept.poc.name}" style="padding: 8px 12px; font-size: 0.85rem;">
                </div>
                <div class="form-group" style="margin-bottom: 10px;">
                  <label for="edit-dept-poc-role" style="font-size: 0.75rem; margin-bottom: 4px;">POC Designation/Role</label>
                  <input type="text" id="edit-dept-poc-role" class="form-control" placeholder="E.g. Teacher" required value="${dept.poc.role}" style="padding: 8px 12px; font-size: 0.85rem;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label for="edit-dept-poc-phone" style="font-size: 0.75rem; margin-bottom: 4px;">POC Phone Number</label>
                  <input type="tel" id="edit-dept-poc-phone" class="form-control" placeholder="10-digit number" required pattern="[0-9]{10}" title="Please enter a valid 10-digit mobile number" value="${dept.poc.phone}" style="padding: 8px 12px; font-size: 0.85rem;">
                </div>
              </div>

              <div class="dept-section-title" style="margin-top: 15px; margin-bottom: 10px;"><i class="fa-solid fa-images"></i> Dynamic Photo Gallery</div>
              ${renderGalleryEditorHTML()}

              <div class="modal-footer-btns" style="margin-top: 20px;">
                <button type="button" class="btn btn-secondary" id="btn-cancel-edit-dept" style="width: 48%;"><i class="fa-solid fa-xmark"></i> Cancel</button>
                <button type="submit" class="btn btn-primary" style="width: 48%;"><i class="fa-solid fa-floppy-disk"></i> Save Wing</button>
              </div>
            </form>
          </div>
        `;
      }

      openModal(`Edit ${dept.name} Wing`, formHTML, true);

      // Bind dynamic modal header back button
      const headerBackBtn = modalOverlay.querySelector('.modal-back-btn');
      if (headerBackBtn) {
        const newHeaderBackBtn = headerBackBtn.cloneNode(true);
        headerBackBtn.parentNode.replaceChild(newHeaderBackBtn, headerBackBtn);
        newHeaderBackBtn.addEventListener('click', () => {
          closeModal();
          setTimeout(() => {
            openDepartmentDetailsModal(deptId);
          }, 320);
        });
      }
      
      // Bind gallery drag/drop and delete handles
      bindGalleryEvents();

      document.getElementById('btn-cancel-edit-dept').addEventListener('click', () => {
        closeModal();
        setTimeout(() => {
          openDepartmentDetailsModal(deptId);
        }, 320);
      });

      const editFormGeneral = document.getElementById('dept-edit-form-general');
      if (editFormGeneral) {
        editFormGeneral.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const newExec = [];
          for (let i = 0; i < dept.executiveCommittee.length; i++) {
            newExec.push({
              name: document.getElementById(`edit-exec-name-${i}`).value.trim(),
              role: document.getElementById(`edit-exec-role-${i}`).value
            });
          }

          const newSub = [];
          for (let i = 0; i < dept.subCommittee.length; i++) {
            newSub.push({
              name: document.getElementById(`edit-sub-name-${i}`).value.trim(),
              role: document.getElementById(`edit-sub-role-${i}`).value
            });
          }

          showLoader('Updating wing details...');
          try {
            await window.ApiService.updateDepartment(deptId, {
              executiveCommittee: newExec,
              subCommittee: newSub,
              gallery: currentGallery
            });

            hideLoader();
            showToast('Wing details updated successfully!', 'success');
            closeModal();
            
            // Refresh dashboard common gallery immediately
            renderCommonGallery();
            
            setTimeout(() => {
              openDepartmentDetailsModal(deptId);
            }, 320);
          } catch (err) {
            hideLoader();
            showToast('Failed to update details: ' + err.message, 'error');
          }
        });
      }

      const editFormNonGeneral = document.getElementById('dept-edit-form-non-general');
      if (editFormNonGeneral) {
        editFormNonGeneral.addEventListener('submit', async (e) => {
          e.preventDefault();

          const aboutVal = document.getElementById('edit-dept-about').value.trim();
          const timingsVal = document.getElementById('edit-dept-timings').value.trim();
          const admFeesVal = document.getElementById('edit-dept-adm-fees').value.trim();
          const monFeesVal = document.getElementById('edit-dept-mon-fees').value.trim();
          
          const pocVal = {
            name: document.getElementById('edit-dept-poc-name').value.trim(),
            role: document.getElementById('edit-dept-poc-role').value.trim(),
            phone: document.getElementById('edit-dept-poc-phone').value.trim()
          };

          showLoader('Updating wing details...');
          try {
            await window.ApiService.updateDepartment(deptId, {
              about: aboutVal,
              timings: timingsVal,
              admissionFees: admFeesVal,
              monthlyFees: monFeesVal,
              poc: pocVal,
              gallery: currentGallery
            });

            hideLoader();
            showToast('Wing details updated successfully!', 'success');
            closeModal();
            
            // Refresh dashboard common gallery immediately
            renderCommonGallery();
            
            setTimeout(() => {
              openDepartmentDetailsModal(deptId);
            }, 320);
          } catch (err) {
            hideLoader();
            showToast('Failed to update details: ' + err.message, 'error');
          }
        });
      }
    } catch (e) {
      hideLoader();
      showToast('Could not load edit structures.', 'error');
    }
  };

  const openCreateDepartmentModal = () => {
    const formHTML = `
      <div class="form-view" style="padding-bottom: 20px;">
        <form id="dept-create-form">
          <div class="form-group">
            <label for="create-dept-name">Department Name</label>
            <input type="text" id="create-dept-name" class="form-control" placeholder="E.g. Dance Academy, Art School, Karate Club" required style="padding: 10px 12px; font-size: 0.875rem;">
          </div>

          <div class="form-group">
            <label for="create-dept-category-select">Department Category</label>
            <select id="create-dept-category-select" class="form-control" required style="padding: 10px 12px; font-size: 0.875rem;">
              <option value="" disabled selected>Select Category</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Library">Library</option>
              <option value="Social Service">Social Service</option>
              <option value="General">General</option>
              <option value="Others">Others</option>
              <option value="CUSTOM">-- Add Custom Category --</option>
            </select>
          </div>

          <div class="form-group" id="create-dept-custom-category-group" style="display: none; margin-bottom: 16px;">
            <label for="create-dept-custom-category">Custom Category Name</label>
            <input type="text" id="create-dept-custom-category" class="form-control" placeholder="E.g. Science, Health, Education" style="padding: 10px 12px; font-size: 0.875rem;">
          </div>

          <div class="form-group">
            <label for="create-dept-icon">Icon / Emoji</label>
            <div style="display: flex; gap: 8px; flex-direction: column;">
              <div style="display: flex; gap: 8px;">
                <input type="text" id="create-dept-icon" class="form-control" placeholder="🎨" required maxlength="4" style="width: 70px; text-align: center; font-size: 1.25rem; padding: 6px;">
                <span style="font-size: 0.75rem; color: var(--text-muted); align-self: center;">Type any emoji or pick from the list below:</span>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center; background: var(--background); border: 1px solid var(--border); padding: 8px; border-radius: var(--radius-sm);" class="emoji-picker-row">
                <button type="button" class="btn-emoji-quick" style="background: white; border: 1px solid var(--border); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 1.1rem; cursor: pointer; transition: transform 0.1s ease;">🎨</button>
                <button type="button" class="btn-emoji-quick" style="background: white; border: 1px solid var(--border); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 1.1rem; cursor: pointer; transition: transform 0.1s ease;">🗣️</button>
                <button type="button" class="btn-emoji-quick" style="background: white; border: 1px solid var(--border); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 1.1rem; cursor: pointer; transition: transform 0.1s ease;">💃</button>
                <button type="button" class="btn-emoji-quick" style="background: white; border: 1px solid var(--border); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 1.1rem; cursor: pointer; transition: transform 0.1s ease;">📚</button>
                <button type="button" class="btn-emoji-quick" style="background: white; border: 1px solid var(--border); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 1.1rem; cursor: pointer; transition: transform 0.1s ease;">🧘‍♀️</button>
                <button type="button" class="btn-emoji-quick" style="background: white; border: 1px solid var(--border); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 1.1rem; cursor: pointer; transition: transform 0.1s ease;">💨</button>
                <button type="button" class="btn-emoji-quick" style="background: white; border: 1px solid var(--border); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 1.1rem; cursor: pointer; transition: transform 0.1s ease;">🌳</button>
                <button type="button" class="btn-emoji-quick" style="background: white; border: 1px solid var(--border); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 1.1rem; cursor: pointer; transition: transform 0.1s ease;">🏥</button>
                <button type="button" class="btn-emoji-quick" style="background: white; border: 1px solid var(--border); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 1.1rem; cursor: pointer; transition: transform 0.1s ease;">🤝</button>
                <button type="button" class="btn-emoji-quick" style="background: white; border: 1px solid var(--border); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 1.1rem; cursor: pointer; transition: transform 0.1s ease;">🏆</button>
                <button type="button" class="btn-emoji-quick" style="background: white; border: 1px solid var(--border); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 1.1rem; cursor: pointer; transition: transform 0.1s ease;">⚽</button>
                <button type="button" class="btn-emoji-quick" style="background: white; border: 1px solid var(--border); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 1.1rem; cursor: pointer; transition: transform 0.1s ease;">📋</button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="create-dept-about">About the Department</label>
            <textarea id="create-dept-about" class="form-control" placeholder="Describe the activities, objectives, and history of this wing..." required style="padding: 12px; font-size: 0.875rem; height: 80px;"></textarea>
          </div>

          <div class="form-group">
            <label for="create-dept-timings">Timings</label>
            <div class="input-container">
              <i class="fa-regular fa-clock"></i>
              <input type="text" id="create-dept-timings" class="form-control" placeholder="E.g. Saturdays, 4:00 PM - 6:00 PM" required style="padding-left: 40px; font-size: 0.875rem;">
            </div>
          </div>

          <div style="display: flex; gap: 12px; margin-bottom: 16px;">
            <div class="form-group" style="flex: 1; margin-bottom: 0;">
              <label for="create-dept-adm-fees">Admission Fees</label>
              <input type="text" id="create-dept-adm-fees" class="form-control" placeholder="E.g. ₹500" required style="padding: 10px 12px; font-size: 0.875rem;">
            </div>
            <div class="form-group" style="flex: 1; margin-bottom: 0;">
              <label for="create-dept-mon-fees">Monthly Fees</label>
              <input type="text" id="create-dept-mon-fees" class="form-control" placeholder="E.g. ₹200" required style="padding: 10px 12px; font-size: 0.875rem;">
            </div>
          </div>

          <div class="dept-section-title" style="margin-top: 15px; margin-bottom: 10px;"><i class="fa-solid fa-user-tie"></i> Point of Contact (POC)</div>
          <div style="border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; background: white; margin-bottom: 16px;">
            <div class="form-group" style="margin-bottom: 10px;">
              <label for="create-dept-poc-name" style="font-size: 0.75rem; margin-bottom: 4px;">POC Full Name</label>
              <input type="text" id="create-dept-poc-name" class="form-control" placeholder="E.g. Arundhati Sen" required style="padding: 8px 12px; font-size: 0.85rem;">
            </div>
            <div class="form-group" style="margin-bottom: 10px;">
              <label for="create-dept-poc-role" style="font-size: 0.75rem; margin-bottom: 4px;">POC Designation/Role</label>
              <input type="text" id="create-dept-poc-role" class="form-control" placeholder="E.g. Teacher" required style="padding: 8px 12px; font-size: 0.85rem;">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label for="create-dept-poc-phone" style="font-size: 0.75rem; margin-bottom: 4px;">POC Phone Number</label>
              <input type="tel" id="create-dept-poc-phone" class="form-control" placeholder="10-digit number" required pattern="[0-9]{10}" title="Please enter a valid 10-digit mobile number" style="padding: 8px 12px; font-size: 0.85rem;">
            </div>
          </div>

          <div class="modal-footer-btns" style="margin-top: 20px;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-create-dept" style="width: 48%;"><i class="fa-solid fa-xmark"></i> Cancel</button>
            <button type="submit" class="btn btn-primary" style="width: 48%;"><i class="fa-solid fa-floppy-disk"></i> Save Department</button>
          </div>
        </form>
      </div>
    `;

    openModal('Create New Department', formHTML, true);

    // Bind dynamic modal header back button to return to tree
    const headerBackBtn = modalOverlay.querySelector('.modal-back-btn');
    if (headerBackBtn) {
      const newHeaderBackBtn = headerBackBtn.cloneNode(true);
      headerBackBtn.parentNode.replaceChild(newHeaderBackBtn, headerBackBtn);
      newHeaderBackBtn.addEventListener('click', () => {
        closeModal();
        setTimeout(() => {
          openDepartmentsModal();
        }, 320);
      });
    }

    // Toggle Custom Category text input
    const categorySelect = document.getElementById('create-dept-category-select');
    const customCategoryGroup = document.getElementById('create-dept-custom-category-group');
    const customCategoryInput = document.getElementById('create-dept-custom-category');

    categorySelect.addEventListener('change', (e) => {
      if (e.target.value === 'CUSTOM') {
        customCategoryGroup.style.display = 'block';
        customCategoryInput.setAttribute('required', 'true');
        customCategoryInput.focus();
      } else {
        customCategoryGroup.style.display = 'none';
        customCategoryInput.removeAttribute('required');
        customCategoryInput.value = '';
      }
    });

    // Emoji Picker binding
    const emojiInput = document.getElementById('create-dept-icon');
    const emojiBtns = document.querySelectorAll('.btn-emoji-quick');
    emojiBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        emojiInput.value = btn.innerText;
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => { btn.style.transform = 'none'; }, 100);
      });
    });

    // Cancel Button
    document.getElementById('btn-cancel-create-dept').addEventListener('click', () => {
      closeModal();
      setTimeout(() => {
        openDepartmentsModal();
      }, 320);
    });

    // Form Submit Handler
    const createForm = document.getElementById('dept-create-form');
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameVal = document.getElementById('create-dept-name').value.trim();
      const catSelectVal = categorySelect.value;
      const customCatVal = customCategoryInput.value.trim();
      
      const categoryVal = catSelectVal === 'CUSTOM' ? customCatVal : catSelectVal;
      
      if (!categoryVal) {
        showToast('Please select or specify a category.', 'error');
        return;
      }

      const iconVal = emojiInput.value.trim() || '📋';
      const aboutVal = document.getElementById('create-dept-about').value.trim();
      const timingsVal = document.getElementById('create-dept-timings').value.trim();
      const admFeesVal = document.getElementById('create-dept-adm-fees').value.trim();
      const monFeesVal = document.getElementById('create-dept-mon-fees').value.trim();

      const pocVal = {
        name: document.getElementById('create-dept-poc-name').value.trim(),
        role: document.getElementById('create-dept-poc-role').value.trim(),
        phone: document.getElementById('create-dept-poc-phone').value.trim()
      };

      // Generate a dynamic slugified ID
      const categorySlug = categoryVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const nameSlug = nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const deptId = `${categorySlug}-${nameSlug}`;

      showLoader('Creating new department...');
      try {
        await window.ApiService.addDepartment({
          id: deptId,
          name: nameVal,
          category: categoryVal,
          icon: iconVal,
          about: aboutVal,
          timings: timingsVal,
          admissionFees: admFeesVal,
          monthlyFees: monFeesVal,
          poc: pocVal,
          gallery: [],
          executiveCommittee: [],
          subCommittee: []
        });

        hideLoader();
        showToast(`Department "${nameVal}" created successfully!`, 'success');
        closeModal();

        // Refresh stats and common organization gallery
        loadDashboardStats();
        renderCommonGallery();

        // Open tree view modal to show the new addition
        setTimeout(() => {
          openDepartmentsModal();
        }, 320);

      } catch (err) {
        hideLoader();
        showToast('Failed to create department: ' + err.message, 'error');
      }
    });
  };

  const openUserManagementModal = async () => {
    const currentUser = window.AuthService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'Admin') {
      showToast('Permission denied. Admins only.', 'error');
      return;
    }

    showLoader('Loading users database...');
    let users = [];
    try {
      users = await window.AuthService.getUsers();
    } catch (err) {
      console.error(err);
      showToast('Failed to sync users: ' + err.message, 'error');
    }
    hideLoader();

    const renderUsersListHTML = (usersList) => {
      let usersHTML = '';

      usersList.forEach(u => {
        let badgeClass = 'role-member-badge';
        if (u.role === 'Admin') badgeClass = 'role-admin-badge';
        if (u.role === 'Teacher') badgeClass = 'role-teacher-badge';
        if (u.role === 'Student') badgeClass = 'role-student-badge';
        if (u.role === 'Well Wishers') badgeClass = 'role-wellwisher-badge';

        const isSelf = u.username.toLowerCase() === currentUser.username.toLowerCase();
        const deleteBtnHTML = (isSelf || u.username.toLowerCase() === 'admin') ? '' : `
          <button class="btn-delete-user" data-username="${u.username}" title="Delete User Account">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        `;

        usersHTML += `
          <div class="user-account-card">
            <div class="user-card-left">
              <span class="user-card-name">${u.name}</span>
              <div class="user-card-details">
                <span>@${u.username}</span>
                <span class="user-card-role-badge ${badgeClass}">${u.role}</span>
              </div>
            </div>
            ${deleteBtnHTML}
          </div>
        `;
      });

      return usersHTML;
    };

    const modalHTML = `
      <div class="form-view" style="padding-bottom: 20px;">
        <div id="credentials-share-area" style="display: none;"></div>

        <div class="dept-section-title" style="margin-bottom: 8px;"><i class="fa-solid fa-users-gear"></i> Active Accounts</div>
        <div class="users-list-container" id="admin-users-list-container">
          ${renderUsersListHTML(users)}
        </div>

        <div class="dept-section-title" style="margin-top: 15px; margin-bottom: 8px;"><i class="fa-solid fa-user-plus"></i> Create New User Account</div>
        <form id="admin-create-user-form">
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="new-user-name">Full Name</label>
            <div class="input-container">
              <i class="fa-solid fa-user-tag"></i>
              <input type="text" id="new-user-name" class="form-control" placeholder="E.g. Koushik Dey" required style="padding: 10px 10px 10px 40px; font-size: 0.85rem;">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label for="new-user-username">Username / User ID</label>
            <div class="input-container">
              <i class="fa-solid fa-at"></i>
              <input type="text" id="new-user-username" class="form-control" placeholder="E.g. koushik_dey" required pattern="[a-zA-Z0-9_-]{3,20}" title="3-20 characters, alphanumeric or underscores" style="padding: 10px 10px 10px 40px; font-size: 0.85rem;">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label for="new-user-password">Password</label>
            <div class="input-container">
              <i class="fa-solid fa-key"></i>
              <input type="text" id="new-user-password" class="form-control" placeholder="Enter secure password" required style="padding: 10px 10px 10px 40px; font-size: 0.85rem;">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 18px;">
            <label for="new-user-role">System Access Role</label>
            <div class="input-container">
              <i class="fa-solid fa-shield-halved"></i>
              <select id="new-user-role" class="form-control" required style="padding: 10px 10px 10px 40px; font-size: 0.85rem;">
                <option value="" disabled selected>Select Role</option>
                <option value="Member">Member</option>
                <option value="Teacher">Teacher</option>
                <option value="Student">Student</option>
                <option value="Well Wishers">Well Wishers</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px;">
            <i class="fa-solid fa-user-plus"></i> Create User Credentials
          </button>
        </form>
      </div>
    `;

    openModal('User Accounts', modalHTML);

    const usersListContainer = document.getElementById('admin-users-list-container');
    const createUserForm = document.getElementById('admin-create-user-form');
    const shareArea = document.getElementById('credentials-share-area');

    const refreshUsersList = async () => {
      showLoader('Refreshing user list...');
      try {
        const updatedUsers = await window.AuthService.getUsers();
        usersListContainer.innerHTML = renderUsersListHTML(updatedUsers);
        bindDeleteHandlers();
      } catch (err) {
        showToast('Failed to refresh user list: ' + err.message, 'error');
      } finally {
        hideLoader();
      }
    };

    createUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nameVal = document.getElementById('new-user-name').value.trim();
      const usernameVal = document.getElementById('new-user-username').value.trim();
      const passwordVal = document.getElementById('new-user-password').value;
      const roleVal = document.getElementById('new-user-role').value;

      if (!nameVal || !usernameVal || !passwordVal || !roleVal) {
        showToast('Please fill in all user account fields.', 'error');
        return;
      }

      showLoader('Creating user account...');
      try {
        await window.AuthService.addUser({
          username: usernameVal,
          password: passwordVal,
          name: nameVal,
          role: roleVal
        });
        
        hideLoader();
        showToast(`Account successfully created for ${nameVal}!`, 'success');
        
        await refreshUsersList();
        
        const portalUrl = window.location.href.split('#')[0];
        const credentialsText = `Hi ${nameVal},\n\nHere are your login credentials for Udayan360 Portal:\nPortal: ${portalUrl}\nUser ID: ${usernameVal}\nPassword: ${passwordVal}\nRole: ${roleVal}\n\nDo not share these credentials with anyone else.`;
        
        shareArea.innerHTML = `
          <div class="share-credentials-box">
            <div class="share-title">
              <i class="fa-solid fa-circle-check"></i> Account Created Successfully!
            </div>
            <div class="credentials-display" id="share-creds-text">${credentialsText}</div>
            <button class="btn btn-secondary" id="btn-copy-creds" style="width: 100%; padding: 10px; background-color: var(--success); color: white; border: none;">
              <i class="fa-solid fa-copy"></i> Copy Credentials & Share
            </button>
          </div>
        `;
        shareArea.style.display = 'block';

        document.getElementById('btn-copy-creds').addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(credentialsText);
            showToast('Credentials copied to clipboard!', 'success');
          } catch (err) {
            showToast('Failed to copy to clipboard.', 'error');
          }
        });

        createUserForm.reset();
      } catch (err) {
        hideLoader();
        showToast(err.message, 'error');
      }
    });

    const bindDeleteHandlers = () => {
      const deleteButtons = usersListContainer.querySelectorAll('.btn-delete-user');
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
          const username = btn.getAttribute('data-username');
          const confirmDelete = confirm(`Are you sure you want to delete the user account "@${username}"? The user will instantly lose all access to Udayan360.`);
          if (!confirmDelete) return;

          showLoader('Deleting user account...');
          try {
            await window.AuthService.deleteUser(username);
            hideLoader();
            showToast(`Account "@${username}" deleted successfully.`, 'success');
            
            await refreshUsersList();
            shareArea.style.display = 'none';
          } catch (err) {
            hideLoader();
            showToast(err.message, 'error');
          }
        });
      });
    };

    bindDeleteHandlers();
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

      const user = window.AuthService.getCurrentUser();
      const userRole = user ? user.role : '';

      // If user is Teacher, filter to show only category 'Student'
      let visiblePersons = persons;
      if (userRole === 'Teacher') {
        visiblePersons = persons.filter(p => p.category === 'Student');
      } else if (userRole === 'Student') {
        visiblePersons = [];
      }

      // Apply Search and Category chip filtering in memory
      const filteredPersons = visiblePersons.filter(person => {
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
              <span>${person.email || 'Not specified'}</span>
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
            ${person.email ? `
            <a href="mailto:${person.email}" class="btn-contact btn-email-send" stop-propagation>
              <i class="fa-solid fa-envelope"></i> Email
            </a>` : ''}
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

      // Check role based permissions for Edit/Delete actions
      const user = window.AuthService.getCurrentUser();
      const userRole = user ? user.role : '';
      
      let showEditDelete = false;
      if (userRole === 'Admin') {
        showEditDelete = true;
      } else if (userRole === 'Teacher' && person.category === 'Student') {
        showEditDelete = true;
      }

      const footerBtnsHTML = showEditDelete ? `
        <div class="modal-footer-btns">
          <button class="btn btn-secondary" id="btn-edit-person" style="width: 48%;"><i class="fa-solid fa-user-pen"></i> Edit</button>
          <button class="btn btn-danger" id="btn-delete-person" style="width: 48%;"><i class="fa-solid fa-trash-can"></i> Delete</button>
        </div>
      ` : '';

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

            <div style="margin-top: 10px;">
              <div class="detail-item-title">Last Subscription Paid On</div>
              <div class="detail-item-value">
                <i class="fa-solid fa-calendar-day" style="color:var(--text-muted);"></i>
                <span>${person.lastSubPaidOn || 'Not recorded'}</span>
              </div>
            </div>

            <div style="margin-top: 10px;">
              <div class="detail-item-title">Last Subscription Bill No.</div>
              <div class="detail-item-value">
                <i class="fa-solid fa-file-invoice" style="color:var(--text-muted);"></i>
                <span>${person.lastSubBillNo || 'Not recorded'}</span>
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
                ${person.email ? `<a href="mailto:${person.email}">${person.email}</a>` : '<span style="color: var(--text-muted); font-style: italic;">Not specified</span>'}
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

          ${footerBtnsHTML}
        </div>
      `;

      openModal('Person Details', detailsHTML);

      if (showEditDelete) {
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
      }

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
      
      const user = window.AuthService.getCurrentUser();
      const userRole = user ? user.role : '';
      const isMember = userRole === 'Member';
      const isTeacher = userRole === 'Teacher';
      const disabledAttr = isMember ? 'disabled' : '';

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

      let categorySelectHTML = '';
      if (isTeacher) {
        // Teachers can only register or edit Student
        categorySelectHTML = `
          <select id="form-person-category" class="form-control" style="padding-left:44px;" required disabled>
            <option value="Student" selected>Student</option>
          </select>
        `;
      } else {
        categorySelectHTML = `
          <select id="form-person-category" class="form-control" style="padding-left:44px;" required ${disabledAttr}>
            <option value="" disabled ${!isEditMode ? 'selected' : ''}>Select Category</option>
            <option value="Member" ${isEditMode && personToEdit.category === 'Member' ? 'selected' : ''}>Member</option>
            <option value="Student" ${isEditMode && personToEdit.category === 'Student' ? 'selected' : ''}>Student</option>
            <option value="Teacher" ${isEditMode && personToEdit.category === 'Teacher' ? 'selected' : ''}>Teacher</option>
            <option value="Well Wishers" ${isEditMode && personToEdit.category === 'Well Wishers' ? 'selected' : ''}>Well Wishers</option>
          </select>
        `;
      }

      const submitBtnHTML = isMember ? '' : `
        <button type="submit" class="btn btn-primary" style="margin-top: 10px; padding:16px;">
          <i class="fa-solid fa-cloud-arrow-up"></i> ${isEditMode ? 'Save Changes' : 'Register Member'}
        </button>
      `;

      const formHTML = `
        <div class="form-view">
          <form id="person-upsert-form">
            <div class="form-group">
              <label for="form-person-name">Full Name</label>
              <div class="input-container">
                <i class="fa-solid fa-user-tag"></i>
                <input type="text" id="form-person-name" class="form-control" placeholder="Enter full name" required value="${isEditMode ? personToEdit.name : ''}" ${disabledAttr}>
              </div>
            </div>

            <div class="form-group">
              <label for="form-person-category">Category</label>
              <div class="input-container">
                <i class="fa-solid fa-graduation-cap"></i>
                ${categorySelectHTML}
              </div>
            </div>

            <div class="form-group">
              <label for="form-person-phone">Phone Number</label>
              <div class="input-container">
                <i class="fa-solid fa-phone"></i>
                <input type="tel" id="form-person-phone" class="form-control" placeholder="Enter 10-digit number" required pattern="[0-9]{10}" title="Please enter a valid 10-digit mobile number" value="${isEditMode ? personToEdit.phone : ''}" ${disabledAttr}>
              </div>
            </div>

            <div class="form-group">
              <label for="form-person-email">Email Address (Optional)</label>
              <div class="input-container">
                <i class="fa-solid fa-envelope"></i>
                <input type="email" id="form-person-email" class="form-control" placeholder="Enter email address" value="${isEditMode ? (personToEdit.email || '') : ''}" ${disabledAttr}>
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
                <input type="month" id="form-person-sub" class="form-control" style="padding-left:44px;" required value="${isEditMode ? (personToEdit.subscriptionClearedUpto || new Date().toISOString().substring(0, 7)) : new Date().toISOString().substring(0, 7)}" ${disabledAttr}>
              </div>
            </div>

            <div class="form-group">
              <label for="form-person-last-paid-on">Last Subscription Paid On (Date)</label>
              <div class="input-container">
                <i class="fa-solid fa-calendar-day"></i>
                <input type="date" id="form-person-last-paid-on" class="form-control" style="padding-left:44px;" value="${isEditMode ? (personToEdit.lastSubPaidOn || '') : ''}" ${disabledAttr}>
              </div>
            </div>

            <div class="form-group">
              <label for="form-person-last-bill-no">Last Subscription Bill No.</label>
              <div class="input-container">
                <i class="fa-solid fa-file-invoice"></i>
                <input type="text" id="form-person-last-bill-no" class="form-control" style="padding-left:44px;" placeholder="E.g. BILL-2026-124" value="${isEditMode ? (personToEdit.lastSubBillNo || '') : ''}" ${disabledAttr}>
              </div>
            </div>

            <div class="form-group">
              <label for="form-person-address">Home Address</label>
              <textarea id="form-person-address" class="form-control" placeholder="Enter complete address" ${disabledAttr}>${isEditMode ? personToEdit.address : ''}</textarea>
            </div>

            ${submitBtnHTML}
          </form>
        </div>
      `;

      openModal(isEditMode ? 'Edit Person Profile' : 'Add New Person', formHTML);

      // Setup custom interactive UI bindings for multi-select checklist cards
      const checkboxes = document.querySelectorAll('.multi-select-item');
      checkboxes.forEach(item => {
        item.addEventListener('click', (e) => {
          if (isMember) return; // Prevent toggling for Members
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
        if (isMember) return; // Guard for Members

        // 1. Fetch form input values
        const nameVal = document.getElementById('form-person-name').value.trim();
        const categoryVal = isTeacher ? 'Student' : document.getElementById('form-person-category').value;
        const phoneVal = document.getElementById('form-person-phone').value.trim();
        const emailVal = document.getElementById('form-person-email').value.trim();
        const subVal = document.getElementById('form-person-sub').value || new Date().toISOString().substring(0, 7);
        const lastPaidOnVal = document.getElementById('form-person-last-paid-on').value;
        const lastBillNoVal = document.getElementById('form-person-last-bill-no').value.trim();
        const addressVal = document.getElementById('form-person-address').value.trim();

        // 2. Fetch all checked departments
        const selectedDepts = [];
        const checkedBoxes = formElement.querySelectorAll('input[name="form-depts"]:checked');
        checkedBoxes.forEach(box => {
          selectedDepts.push(box.value);
        });

        // Basic validation checklist (email is now optional)
        if (!nameVal || !categoryVal || !phoneVal) {
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
          lastSubPaidOn: lastPaidOnVal,
          lastSubBillNo: lastBillNoVal,
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
    const user = window.AuthService.getCurrentUser();
    const userRole = user ? user.role : '';
    if (userRole !== 'Admin') {
      showToast('Permission denied. Only Admins can schedule events.', 'error');
      return;
    }

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
      
      const user = window.AuthService.getCurrentUser();
      const userRole = user ? user.role : '';
      const isMember = userRole === 'Member';

      filtered.forEach(person => {
        const card = document.createElement('div');
        card.className = 'sub-card';
        
        const footerHTML = isMember ? '' : `
          <div class="sub-card-footer">
            <button class="btn-record-payment" data-person-id="${person.id}" data-person-name="${person.name}" data-current-sub="${person.subscriptionClearedUpto || ''}">
              <i class="fa-solid fa-credit-card"></i> Record Payment
            </button>
          </div>
        `;

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
          ${footerHTML}
        `;
        
        const recordBtn = card.querySelector('.btn-record-payment');
        if (recordBtn) {
          recordBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openQuickPaymentModal(person.id, person.name, person.subscriptionClearedUpto);
          });
        }
        
        subscriptionListContainer.appendChild(card);
      });
      
    } catch (err) {
      subscriptionListContainer.innerHTML = `<p style="color:var(--error); text-align:center; padding: 20px;">Error loading subscriptions.</p>`;
      console.error(err);
    }
  };

  const openQuickPaymentModal = (personId, name, currentSubDate) => {
    const user = window.AuthService.getCurrentUser();
    if (user && user.role === 'Member') {
      showToast('Permission denied. Members cannot record payments.', 'error');
      return;
    }

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
