# Windows OS Optimization Utility

A modern desktop application that applies low-level Windows performance tweaks through a clean, dark-themed dashboard. Built with **Electron + Next.js** on the frontend and **Python** on the backend, with live system metrics that update in real time so you can compare results directly against Task Manager.

![Dashboard Preview](./preview.png)

---

## ✨ Features

| Tweak | What it does |
|---|---|
| **Ultimate Performance** | Unhides and activates the hidden Windows Ultimate Performance power plan (works on Home via clone) |
| **Disable Telemetry** | Sets `AllowTelemetry = 0` in the Windows Registry via Group Policy path |
| **Optimize GPU (HAGS)** | Enables Hardware-Accelerated GPU Scheduling (`HwSchMode = 2`) |
| **Clean System Cache** | Clears `%TEMP%`, Prefetch, Windows Temp, and WSUS download cache |
| **High Process Priority** | Sets `Win32PrioritySeparation = 0x26` for maximum foreground app responsiveness |
| **Disable SysMain** | Stops and disables the Superfetch/SysMain service (reduces 100% disk usage) |
| **Disable Print Spooler** | Stops and disables the background Print Spooler service |

All tweaks are **fully reversible** — toggling a feature off restores the previous system default.

### 📊 Live System Metrics
The Dashboard shows real-time stats pulled directly from **Windows Performance Counters** (the same source as Task Manager):
- **CPU Usage %** — `\Processor(_Total)\% Processor Time`
- **CPU Speed (GHz)** — `MaxClockSpeed × (% Processor Performance / 100)` — shows actual Turbo Boost speed
- **RAM Used / Free / Total**

---

## 🏗️ Architecture

```
Windows-Optimizer/
├── main.js              # Electron main process — IPC bridge + system stats
├── preload.js           # Context bridge — exposes window.systemAPI to frontend
├── frontend/            # Next.js (React + TypeScript + Tailwind CSS)
│   └── app/page.tsx     # Single-page dashboard UI
└── backend/             # Python scripts (run elevated via PowerShell UAC)
    ├── ultimate_performance.py
    ├── registry_tweaker.py
    ├── hags_enable.py
    ├── clean_cache.py
    ├── high_priority.py
    ├── disable_sysmain.py
    └── disable_printspooler.py
```

**How it works:**
1. The React frontend calls `window.systemAPI.applyTweak(scriptName)` via the Electron context bridge
2. `main.js` spawns the Python script elevated through `powershell.exe Start-Process -Verb RunAs`, triggering a Windows UAC prompt
3. The Python script makes the system change using `winreg`, `subprocess`, or `ctypes`
4. Live metrics are polled every 2.5 seconds via a PowerShell `Get-Counter` encoded command

---

## 📦 Dependencies

### System Requirements
- **OS:** Windows 10 / 11 (x64)
- **Administrator privileges** — required for all tweaks (UAC prompt appears automatically)

### Runtime Dependencies

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | v18+ | Electron runtime & npm |
| [Python](https://www.python.org/downloads/) | 3.9+ | Backend tweak scripts |
| [Git](https://git-scm.com/) | Any | Cloning the repo |

> **Note:** Python must be accessible on your system PATH, or installed at one of the standard paths:
> `C:\Users\<user>\AppData\Local\Programs\Python\Python3XX\python.exe`  
> `C:\Python3XX\python.exe`  
> `python3.exe` / `python.exe` (via PATH)

### Node.js Packages (installed automatically via `npm install`)

**Root (Electron wrapper):**
| Package | Version | Purpose |
|---|---|---|
| `electron` | ^30.0.0 | Desktop app shell |
| `concurrently` | ^8.2.2 | Run Next.js + Electron together in dev |
| `wait-on` | ^7.2.0 | Wait for Next.js server before launching Electron |

**Frontend (`/frontend`):**
| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.9 | React framework with Turbopack |
| `react` | 19.2.4 | UI library |
| `react-dom` | 19.2.4 | DOM rendering |
| `tailwindcss` | ^4 | Utility-first CSS |
| `typescript` | ^5 | Type safety |

### Python Packages
The backend scripts use **only Python standard library modules** — no `pip install` required:
- `winreg` — Windows Registry access
- `subprocess` — Running `powercfg`, `sc.exe` commands
- `ctypes` — Windows API / admin privilege checks
- `os`, `sys`, `re` — Standard utilities

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/Windows-Optimizer.git
cd Windows-Optimizer
```

### 2. Install root dependencies (Electron)
```bash
npm install
```

### 3. Install frontend dependencies (Next.js)
```bash
cd frontend
npm install
cd ..
```

### 4. Run in development mode
```bash
npm run dev
```
This command starts both the Next.js dev server and the Electron window simultaneously. The app will open automatically.

> **First launch tip:** The green **ENGINE CONNECTED** indicator in the top-right confirms the Electron bridge is active and tweaks will actually apply. If it shows **AWAITING ENGINE**, you're viewing the frontend only in a browser.

### 5. Run as standalone Electron app (without Next.js dev server)

If you've already built the frontend:
```bash
# Build the frontend first (only needed once or after changes)
cd frontend && npm run build && cd ..

# Then launch Electron pointing at the built output
npm start
```

---

## ⚙️ How Tweaks Work (Toggle Logic)

Each toggle in the UI maps to a Python script in `/backend`:

| Toggle | Script | Enable arg | Disable arg |
|---|---|---|---|
| Ultimate Performance | `ultimate_performance.py` | *(none)* | `disable` |
| Disable Telemetry | `registry_tweaker.py` | *(none)* | `disable` |
| Optimize GPU (HAGS) | `hags_enable.py` | *(none)* | `disable` |
| Clean System Cache | `clean_cache.py` | *(one-shot)* | N/A |
| High Process Priority | `high_priority.py` | *(none)* | `disable` |
| Disable SysMain | `disable_sysmain.py` | *(none)* | `disable` |
| Disable Print Spooler | `disable_printspooler.py` | *(none)* | `disable` |

When you toggle a feature **off**, the UI passes `disable` as a command-line argument to the Python script, which runs the corresponding restore/undo function.

Each script self-elevates via UAC — a Windows security prompt will appear asking for Administrator permission.

---

## 🔒 Security Notes

- No scripts run silently in the background — every elevated action requires explicit UAC approval
- The Electron `contextBridge` ensures the frontend web code cannot access Node.js APIs directly
- All registry changes are targeted and reversible; no broad system modifications are made
- Python scripts use only Windows built-in tools (`powercfg`, `sc.exe`, `winreg`) — no external binaries

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| "AWAITING ENGINE" shown | Make sure you're running `npm run dev` from the root, not opening the frontend in a browser |
| Metrics show `—` (dash) | Python or PowerShell is not available — check Python is installed and on PATH |
| Toggle shows "Action failed or canceled" | You clicked **No** on the UAC prompt — re-toggle and click **Yes** |
| CPU speed stuck at base clock | Restart the Electron window (`npm start`) to reload the `main.js` stats handler |
| Python not found | Install Python from [python.org](https://www.python.org/downloads/) and ensure "Add to PATH" is checked during install |

---

## 📄 License

MIT — feel free to fork, modify, and distribute.
