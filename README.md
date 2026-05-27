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

## ☁️ Cloud Database Setup & Sync

You can easily synchronize your application's data across multiple devices (PCs, phones, tablets) by connecting a free cloud database (**Supabase** or **Firebase Firestore**). 

### Option A: Supabase Setup (Recommended & Easiest) ⚡
1. Create a free account at [supabase.com](https://supabase.com/) and create a new project.
2. In your Supabase Dashboard, navigate to the **SQL Editor** in the left sidebar.
3. Create a new query, paste the following SQL schema script, and click **Run**:

   ```sql
   -- 1. Create Persons table
   CREATE TABLE persons (
       id TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       category TEXT NOT NULL,
       phone TEXT NOT NULL,
       email TEXT,
       departments JSONB NOT NULL DEFAULT '[]'::jsonb,
       "subscriptionClearedUpto" TEXT,
       "lastSubPaidOn" TEXT,
       "lastSubBillNo" TEXT,
       address TEXT,
       "createdAt" TEXT NOT NULL
   );

   -- 2. Create Events table
   CREATE TABLE events (
       id TEXT PRIMARY KEY,
       title TEXT NOT NULL,
       date TEXT NOT NULL,
       description TEXT,
       participants JSONB NOT NULL DEFAULT '[]'::jsonb,
       "createdAt" TEXT NOT NULL
   );

   -- 3. Create Departments table
   CREATE TABLE departments (
       id TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       category TEXT NOT NULL,
       icon TEXT NOT NULL,
       about TEXT,
       timings TEXT,
       "admissionFees" TEXT,
       "monthlyFees" TEXT,
       poc JSONB,
       "operationalYear" TEXT,
       gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
       "executiveCommittee" JSONB NOT NULL DEFAULT '[]'::jsonb,
       "subCommittee" JSONB NOT NULL DEFAULT '[]'::jsonb
   );

   -- 4. Create User Accounts table
   CREATE TABLE users_accounts (
       username TEXT PRIMARY KEY,
       password TEXT NOT NULL,
       name TEXT NOT NULL,
       role TEXT NOT NULL
   );

   -- 5. Enable Public Access Rules for anonymous read/write operations
   ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
   ALTER TABLE events ENABLE ROW LEVEL SECURITY;
   ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE users_accounts ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Allow anon select" ON persons FOR SELECT USING (true);
   CREATE POLICY "Allow anon insert" ON persons FOR INSERT WITH CHECK (true);
   CREATE POLICY "Allow anon update" ON persons FOR UPDATE USING (true) WITH CHECK (true);
   CREATE POLICY "Allow anon delete" ON persons FOR DELETE USING (true);

   CREATE POLICY "Allow anon select" ON events FOR SELECT USING (true);
   CREATE POLICY "Allow anon insert" ON events FOR INSERT WITH CHECK (true);
   CREATE POLICY "Allow anon update" ON events FOR UPDATE USING (true) WITH CHECK (true);
   CREATE POLICY "Allow anon delete" ON events FOR DELETE USING (true);

   CREATE POLICY "Allow anon select" ON departments FOR SELECT USING (true);
   CREATE POLICY "Allow anon insert" ON departments FOR INSERT WITH CHECK (true);
   CREATE POLICY "Allow anon update" ON departments FOR UPDATE USING (true) WITH CHECK (true);
   CREATE POLICY "Allow anon delete" ON departments FOR DELETE USING (true);

   CREATE POLICY "Allow anon select" ON users_accounts FOR SELECT USING (true);
   CREATE POLICY "Allow anon insert" ON users_accounts FOR INSERT WITH CHECK (true);
   CREATE POLICY "Allow anon update" ON users_accounts FOR UPDATE USING (true) WITH CHECK (true);
   CREATE POLICY "Allow anon delete" ON users_accounts FOR DELETE USING (true);
   ```

4. Go to **Project Settings > API** in Supabase and copy your **Project URL** and **Anon Key**.
5. Open the app, click the **Cloud Icon** next to Logout, select **Supabase**, paste your credentials, and click **Save & Connect**.

### Option B: Firebase Firestore Setup 🔥
1. Create a free project in the [Firebase Console](https://console.firebase.google.com/).
2. In the sidebar, go to **Build > Firestore Database** and click **Create Database** (Start in **Test Mode** so read/write rules are open for public testing).
3. Go to **Project Settings > General**, scroll down to your apps, click the **Web icon `</>`** to register a web app, and copy the **`firebaseConfig` JSON object** (looks like `{"apiKey": "...", "projectId": "...", ...}`).
4. Open the app, click the **Cloud Icon**, select **Firebase**, paste the configuration JSON block, and click **Save & Connect**.

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
