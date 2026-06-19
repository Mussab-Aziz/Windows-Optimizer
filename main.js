const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        backgroundColor: '#09090b',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadURL('http://localhost:3000');
    
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('[Electron] Page loaded successfully');
    });
    
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// --- UTILITY: Find Python executable dynamically ---
function findPython() {
    const candidates = [
        'C:\\Users\\massa\\AppData\\Local\\Programs\\Python\\Python313\\python.exe',
        'C:\\Users\\massa\\AppData\\Local\\Programs\\Python\\Python312\\python.exe',
        'C:\\Users\\massa\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
        'C:\\Python313\\python.exe',
        'C:\\Python312\\python.exe',
        'C:\\Python311\\python.exe',
        'python.exe',
        'python3.exe',
    ];

    // First try the exact known path
    for (const candidate of candidates) {
        if (candidate.includes('\\') && fs.existsSync(candidate)) {
            console.log(`[Bridge] Found Python at: ${candidate}`);
            return candidate;
        }
    }

    // Fallback: try 'where python' to find it on PATH
    return 'python.exe';
}

// --- SYSTEM STATS IPC HANDLER ---

// Helper: sample CPU usage over 200ms via os.cpus() (fallback)
function getCpuUsageFallback() {
    return new Promise((resolve) => {
        const cpus1 = os.cpus();
        setTimeout(() => {
            const cpus2 = os.cpus();
            let totalIdle = 0, totalTick = 0;
            cpus2.forEach((cpu, i) => {
                const prev = cpus1[i];
                for (const type in cpu.times) totalTick += cpu.times[type] - prev.times[type];
                totalIdle += cpu.times.idle - prev.times.idle;
            });
            const usage = 100 - Math.floor(100 * totalIdle / totalTick);
            resolve(Math.max(0, Math.min(100, usage)));
        }, 300);
    });
}

// Helper: read Windows Performance Counters — same formula as Task Manager
// Task Manager current speed = MaxClockSpeed x (% Processor Performance / 100)
// % Processor Performance > 100 when Turbo Boost is active.
// Uses -EncodedCommand (base64 UTF-16LE) to avoid all shell quoting issues.
function getWindowsPerfCounters() {
    return new Promise((resolve) => {
        // Build the PS script as plain lines — verified working via test
        const lines = [
            '$maxMHz = (Get-WmiObject Win32_Processor | Select-Object -First 1).MaxClockSpeed',
            '$perf = (Get-Counter "\\Processor Information(_Total)\\% Processor Performance" -ErrorAction SilentlyContinue).CounterSamples[0].CookedValue',
            '$load = (Get-Counter "\\Processor(_Total)\\% Processor Time" -ErrorAction SilentlyContinue).CounterSamples[0].CookedValue',
            'Write-Output ("" + [int]($maxMHz * $perf / 100) + "|" + [int]$load)',
        ];
        const script  = lines.join('\n');

        // Encode to UTF-16LE base64 (what PowerShell -EncodedCommand expects)
        const encoded = Buffer.from(script, 'utf16le').toString('base64');

        exec('powershell.exe -NoProfile -EncodedCommand ' + encoded, { timeout: 5000 }, (error, stdout) => {
            if (error || !stdout.trim()) { resolve(null); return; }
            const parts = stdout.trim().split('|');
            if (parts.length !== 2) { resolve(null); return; }
            const mhz  = parseInt(parts[0], 10);
            const load = parseInt(parts[1], 10);
            if (isNaN(mhz) || isNaN(load)) { resolve(null); return; }
            resolve({ cpuSpeedMHz: mhz, cpuUsage: Math.max(0, Math.min(100, load)) });
        });
    });
}

ipcMain.handle('get-system-stats', async () => {
    const cpus = os.cpus();
    const baseCpuSpeedMHz = cpus.length > 0 ? cpus[0].speed : 0;
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';
    const cpuCount = cpus.length;

    const totalRam = os.totalmem();
    const freeRam  = os.freemem();
    const usedRam  = totalRam - freeRam;

    // Try Windows perf counters first; fall back to os.cpus() sampling
    const [perfCounters, fallbackUsage] = await Promise.all([
        getWindowsPerfCounters(),
        getCpuUsageFallback(),
    ]);

    const cpuSpeedMHz = perfCounters?.cpuSpeedMHz ?? baseCpuSpeedMHz;
    const cpuUsage    = perfCounters?.cpuUsage    ?? fallbackUsage;

    return {
        cpuSpeedMHz,
        cpuModel,
        cpuCount,
        cpuUsage,
        totalRamGB: (totalRam / 1073741824).toFixed(1),
        usedRamGB:  (usedRam  / 1073741824).toFixed(2),
        freeRamGB:  (freeRam  / 1073741824).toFixed(2),
        ramUsedPct: Math.round((usedRam / totalRam) * 100),
    };
});

// --- THE PYTHON BRIDGE ---

ipcMain.handle('apply-tweak', async (event, scriptName) => {
    return new Promise((resolve) => {
        const scriptPath = path.join(__dirname, 'backend', scriptName);
        const pythonExecutable = findPython();
        
        // Validate that the script exists
        if (!fs.existsSync(scriptPath)) {
            console.error(`[Bridge Error] Script not found: ${scriptPath}`);
            resolve({ success: false, message: `Script not found: ${scriptName}` });
            return;
        }

        console.log(`[Bridge] Requesting Native Admin rights for: ${scriptName}...`);
        console.log(`[Bridge] Script path: ${scriptPath}`);
        console.log(`[Bridge] Python: ${pythonExecutable}`);

        // Build the PowerShell command:
        // We use Start-Process with -Verb RunAs to trigger UAC.
        // -FilePath gets the Python executable
        // -ArgumentList gets the script path
        // We use -Wait so the Promise resolves only after the script finishes.
        //
        // Critical: We pass the command as a single string to exec().
        // The outer "..." is for cmd.exe; inside we provide the full PowerShell command.
        // For -ArgumentList we use single quotes (') which are literal in PowerShell
        // and pass through cmd.exe safely inside the outer double-quotes.
        const psCmd = 
            `powershell.exe -NoProfile -Command "Start-Process -FilePath '${pythonExecutable}' -ArgumentList '${scriptPath}' -Wait -WindowStyle Normal"`;

        console.log(`[Bridge] Executing: ${psCmd}`);

        exec(psCmd, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[Bridge Error] UAC Denied or script failed: ${error.message}`);
                if (stderr) console.error(`[Bridge Stderr] ${stderr}`);
                // Provide a clearer error message
                const msg = stderr && stderr.includes('Access is denied')
                    ? 'UAC prompt was denied. Please click "Yes" when Windows asks for permission.'
                    : `Script execution failed. ${error.message}`;
                resolve({ success: false, message: msg });
                return;
            }
            
            if (stdout) console.log(`[Bridge Output] ${stdout}`);
            console.log(`[Bridge] Execution successful.`);
            resolve({ success: true, message: 'Registry updated successfully!' });
        });
    });
});

// --- SECOND IPC HANDLER: with extra argument ---

ipcMain.handle('apply-tweak-with-args', async (event, scriptName, args) => {
    return new Promise((resolve) => {
        const scriptPath = path.join(__dirname, 'backend', scriptName);
        const pythonExecutable = findPython();
        
        if (!fs.existsSync(scriptPath)) {
            console.error(`[Bridge Error] Script not found: ${scriptPath}`);
            resolve({ success: false, message: `Script not found: ${scriptName}` });
            return;
        }

        console.log(`[Bridge] Requesting Native Admin rights for: ${scriptName} (args: ${args})...`);
        console.log(`[Bridge] Script path: ${scriptPath}`);
        console.log(`[Bridge] Python: ${pythonExecutable}`);

        // Pass the argument to the Python script as a second command-line argument.
        // IMPORTANT: PowerShell -ArgumentList requires comma-separated values (array syntax),
        // NOT space-separated — a space between two quoted strings is ambiguous to PS binder.
        const psCmd = 
            `powershell.exe -NoProfile -Command "Start-Process -FilePath '${pythonExecutable}' -ArgumentList '${scriptPath}','${args}' -Wait -WindowStyle Normal"`;

        console.log(`[Bridge] Executing: ${psCmd}`);

        exec(psCmd, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[Bridge Error] UAC Denied or script failed: ${error.message}`);
                if (stderr) console.error(`[Bridge Stderr] ${stderr}`);
                const msg = stderr && stderr.includes('Access is denied')
                    ? 'UAC prompt was denied. Please click "Yes" when Windows asks for permission.'
                    : `Script execution failed. ${error.message}`;
                resolve({ success: false, message: msg });
                return;
            }
            
            if (stdout) console.log(`[Bridge Output] ${stdout}`);
            console.log(`[Bridge] Execution successful.`);
            resolve({ success: true, message: 'Tweak applied successfully!' });
        });
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
