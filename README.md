# Social Organisation Management System 🏢✨

A **simple, clean, and extremely tactile mobile-first Progressive Web Application (PWA)** designed to manage Members, Departments, and Events for your social organization. 

This application was engineered with a **zero-dependency, no-build SPA model**, making it exceptionally easy for non-technical administrators to run, use, and install without touching complex command lines, Node, or Android compilation SDKs.

---

## 🚀 Key Features

*   **Premium Visual Experience**: Styled with custom CSS using HSL variables, fluid gradients, tactile touch cards, glassmorphic bottom sheets, and Google Fonts (`Inter` and `Outfit`).
*   **Bottom Tab Navigation**: Home (Dashboard), Persons, and Events switch instantly with native-feeling animations.
*   **Offline-First & Local Storage**: Utilizes an API simulation layer linked directly to the browser's `localStorage`. All data remains cached and perfectly saved even when closing the browser or disconnecting from the internet.
*   **Dynamic Collapsible Departments Tree**: Hierarchical department layout grouping cultural, sports, and social service wings. Sub-departments automatically list live membership counts.
*   **Deep-Linked Filter Navigation**: Clicking any department in the tree will automatically close the modal, switch to the **Persons** directory, and filter/display only the members enrolled in that department.
*   **Comprehensive Member Directory**:
    *   Real-time search bar that filters as you type.
    *   Touch-friendly category chips (Member, Student, Teacher, Well Wishers).
    *   Clickable contact shortcuts (`tel:` and `mailto:`) on cards to call or email members directly.
    *   Complete profile details sheet, addition forms, editing panels, and records deletion with safety checks.
*   **Events Planner**:
    *   Schedules tracking dates, locations, and descriptions.
    *   Interactive multi-select checkboxes displaying registered members to assign participants to events.
*   **Micro-Animations & Toasts**: Floating Action Buttons (FAB) spin on hover, and modern toast banners pop down to report successes or errors instantly. Fully screen-blurred loaders simulate background network fetches.

---

## 🔑 Administrative Credentials

To access the administrative panel on the secure login screen:

*   **Username**: `admin`
*   **Password**: `password123`
*   **Option**: Toggle "Keep me logged in" to remember your session across browser tabs and system reboots.

---

## 📥 How to Run the Application

Since there are no complicated compiler tools, this app can be launched in seconds:

### Method 1: Double-Click (Offline & Dependency-Free) 🖱5
1. Locate your visible folder `C:\Users\Smita Dey\social-org-manager` in your Windows File Explorer.
2. Double-click the [index.html](file:///C:/Users/Smita%20Dey/social-org-manager/index.html) file.
3. It will instantly open in your default browser (Chrome, Edge, Firefox, Safari) and is fully operational!

### Method 2: Lightweight Python Server 🐍
If you wish to test the service worker caching, PWA installation, or share the app on your local Wi-Fi:
1. Open PowerShell or Command Prompt.
2. Navigate to the project directory:
   ```powershell
   cd "C:\Users\Smita Dey\social-org-manager"
   ```
3. Start the built-in lightweight Python HTTP server:
   ```powershell
   python -m http.server 8000
   ```
4. Open your web browser and go to: `http://localhost:8000`

---

## 📱 Mobile Installation (Progressive Web App)

Because the project includes standard PWA components (`manifest.json` and `sw.js`), you can install it as a standalone app!

### On Android (Google Chrome) 🤖
1. Open Chrome and type in your local server IP (e.g., `http://192.168.1.XX:8000` or `http://localhost:8000`).
2. Tap the **three-dot menu** in the top right.
3. Select **"Add to Home Screen"** or **"Install App"**.
4. The system will create a gorgeous app icon styled with the administrative brand on your phone!

### On iOS (Apple Safari) 🍎
1. Open Safari and navigate to your local hosted server URL.
2. Tap the **Share icon** (square with an arrow pointing up) at the bottom.
3. Scroll down and tap **"Add to Home Screen"**.

---

## 📂 File Architecture

The codebase is highly modular, commented in detail, and beginner-friendly:

*   [`index.html`](file:///C:/Users/Smita%20Dey/social-org-manager/index.html): The viewport scaffolding, layout container, tab sections, and hook wrappers.
*   [`app.css`](file:///C:/Users/Smita%20Dey/social-org-manager/app.css): Premium design theme tokens (HSL properties, Outfit & Inter typography, glassmorphism, responsive breakpoints, keyframe card and toast animations).
*   [`auth.js`](file:///C:/Users/Smita%20Dey/social-org-manager/auth.js): Mock Authentication controller managing session persistence inside storage.
*   [`api.js`](file:///C:/Users/Smita%20Dey/social-org-manager/api.js): Database layer pre-populating high-quality seed members and events, persisting all CRUD modifications to the offline browser memory (`localStorage`), and simulating mock latency.
*   [`app.js`](file:///C:/Users/Smita%20Dey/social-org-manager/app.js): Single-page router, interactive trees coordinator, dynamic card compilers, forms validator, notifications toaster, and loading overlays manager.
*   [`manifest.json`](file:///C:/Users/Smita%20Dey/social-org-manager/manifest.json): Configuration detailing app orientation, colors, and responsive vector icons.
*   [`sw.js`](file:///C:/Users/Smita%20Dey/social-org-manager/sw.js): Service worker script enabling local caching of scripts and assets for offline performance.
