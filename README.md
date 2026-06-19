# Windows OS Optimization Utility

A full-stack desktop application engineered to perform low-level Windows OS optimizations. It features a modern React-based user interface that communicates securely with a Python backend to modify the Windows Registry, manage power plans, and control system services, utilizing native PowerShell for secure User Account Control (UAC) elevation.

## 🏗️ Architecture

1. **Frontend (Next.js / React / Tailwind CSS):** A static-exported Next.js application providing a highly responsive, dark-themed dashboard.
2. **The Bridge (Electron / Node.js):** The main application wrapper. It securely isolates the frontend web code from the system and uses Inter-Process Communication (IPC) to listen for UI events.
3. **The Engine (Python):** Standalone backend scripts executing system-level API calls via `ctypes` and `winreg`.

---

## ✅ Phase 1 & 2: What We Have Built So Far

### 1. The Core Python Engine (`/backend`)
* `power_manager.py`: Interfaces with Windows PowerCfg to switch to optimal power profiles.
* `registry_tweaker.py`: Safely modifies the `DataCollection` registry keys to disable Windows Telemetry.
* `network_optimizer.py`: Disables Network Throttling for gaming and large file uploads.
* `restore_telemetry.py`: Failsafe script to restore default Windows diagnostic settings.

### 2. The Bulletproof IPC Bridge (`main.js` & `preload.js`)
* Established a secure `contextBridge` exposing `window.systemAPI.applyTweak()`.
* Engineered a native UAC Elevation workaround. Instead of relying on buggy third-party node modules, the bridge uses native PowerShell (`Start-Process -Verb RunAs`) to reliably spawn the Windows Administrator prompt for background processes without triggering Windows Defender silent blocks.

### 3. UI Sandbox (`/frontend`)
* Initialized Next.js with TypeScript and Tailwind.
* Built the React state-management loop to track asynchronous script execution and update UI button states (e.g., "Applying..." -> "Applied").

---

## 🚀 Phase 3: What Needs to Be Built (The UI Overhaul)

Based on the core design specifications, the UI needs to be completely restructured to match the target analytical dashboard.

### 1. Navigation & Layout
* Implement top-tier tabbed navigation: **DASHBOARD**, **ADVANCED TWEAKS**, **BACKEND CODE GENERATOR**.
* Upgrade the global layout to a premium dark-mode aesthetic with refined typography and spacing.

### 2. Dynamic Metric Visualizations
* **Top Metric Bar:** Add estimated calculations for:
  * `Est. RAM Freed` (e.g., 425 MB)
  * `CPU Overhead` (e.g., -35%)
  * `I/O Efficiency` (e.g., +10%)
* **Gauge Charts:** Implement visual gauges (using SVGs or a charting library) for real-time or estimated RAM and GPU usage.

### 3. Advanced Tweak Controls (New Python Scripts Required)
Implement UI toggles and corresponding backend Python scripts for the following advanced features:
* **Workload Profiles:** A dropdown to select profiles (e.g., "Gaming", "Creator", "Office").
* **Ultimate Performance:** Unhide and enable the hidden Windows Ultimate Performance power plan.
* **Optimize GPU (HAGS):** Enable Hardware-Accelerated GPU Scheduling via Registry.
* **Clean System Cache:** A script to safely clear `%temp%`, `prefetch`, and Windows Update caches.
* **High Process Priority:** Automatically assign high CPU priority to foreground applications.
* **Service Management Modules:**
  * **SYSMAIN:** Disable Superfetch/SysMain to reduce 100% disk I/O usage bugs.
  * **PRINTSPOOLER:** Disable background printer services for dedicated gaming/development rigs.

---
