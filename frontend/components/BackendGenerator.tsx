"use client";

import { useState } from "react";

const SCRIPT_TEMPLATES = [
  {
    label: "Registry Tweaker",
    value: `import winreg
import ctypes
import sys
import os

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except Exception:
        return False

def run_as_admin():
    print("[*] Requesting Administrator privileges...")
    script = os.path.abspath(sys.argv[0])
    ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, f'"{script}"', None, 1)
    sys.exit()

def apply_tweak():
    # TODO: Replace with your registry path and value
    registry_path = r"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System"
    value_name = "EnableLUA"
    value_data = 1  # DWORD

    try:
        key = winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE, registry_path, 0, winreg.KEY_SET_VALUE)
        winreg.SetValueEx(key, value_name, 0, winreg.REG_DWORD, value_data)
        winreg.CloseKey(key)
        print(f"[+] {value_name} set to {value_data}")
        return True
    except Exception as e:
        print(f"[-] Error: {e}")
        return False

if __name__ == "__main__":
    if not is_admin():
        run_as_admin()
    apply_tweak()
    input("\\nPress Enter to exit...")`,
  },
  {
    label: "Service Manager",
    value: `import sys
import os
import subprocess
import ctypes

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except Exception:
        return False

def run_as_admin():
    print("[*] Requesting Administrator privileges...")
    script = os.path.abspath(sys.argv[0])
    ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, f'"{script}"', None, 1)
    sys.exit()

# Change these to your target service
SERVICE_NAME = "YourService"
SERVICE_DISPLAY = "Your Service Display Name"

def disable_service():
    print(f"[*] Disabling {SERVICE_DISPLAY}...")
    subprocess.run(f'sc.exe stop {SERVICE_NAME}', shell=True)
    subprocess.run(f'sc.exe config {SERVICE_NAME} start=disabled', shell=True)
    print(f"[+] {SERVICE_DISPLAY} disabled.")

def restore_service():
    print(f"[*] Restoring {SERVICE_DISPLAY}...")
    subprocess.run(f'sc.exe config {SERVICE_NAME} start=auto', shell=True)
    subprocess.run(f'sc.exe start {SERVICE_NAME}', shell=True)
    print(f"[+] {SERVICE_DISPLAY} restored.")

if __name__ == "__main__":
    if not is_admin():
        run_as_admin()
    action = sys.argv[1].lower() if len(sys.argv) > 1 else "disable"
    disable_service() if action == "disable" else restore_service()
    input("\\nPress Enter to exit...")`,
  },
  {
    label: "PowerCfg Profile",
    value: `import sys
import os
import subprocess
import ctypes

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except Exception:
        return False

def run_as_admin():
    print("[*] Requesting Administrator privileges...")
    script = os.path.abspath(sys.argv[0])
    ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, f'"{script}"', None, 1)
    sys.exit()

# Replace with your power scheme GUID
POWER_GUID = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"

def apply_power_scheme():
    print("[*] Activating power scheme...")
    result = subprocess.run(["powercfg", "/setactive", POWER_GUID])
    if result.returncode == 0:
        print("[+] Power scheme activated.")
    else:
        print("[-] Failed to activate.")

if __name__ == "__main__":
    if not is_admin():
        run_as_admin()
    apply_power_scheme()
    input("\\nPress Enter to exit...")`,
  },
];

const SNIPPETS = [
  {
    label: "Check Admin Status",
    code: `import ctypes
def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except Exception:
        return False`,
  },
  {
    label: "UAC Elevation",
    code: `import os, sys, ctypes
def run_as_admin():
    script = os.path.abspath(sys.argv[0])
    ctypes.windll.shell32.ShellExecuteW(
        None, "runas", sys.executable, f'"{script}"', None, 1
    )
    sys.exit()`,
  },
  {
    label: "Registry Write (DWORD)",
    code: `import winreg
key = winreg.CreateKeyEx(
    winreg.HKEY_LOCAL_MACHINE,
    r"SOFTWARE\\Path\\Here",
    0, winreg.KEY_SET_VALUE
)
winreg.SetValueEx(key, "ValueName", 0, winreg.REG_DWORD, 1)
winreg.CloseKey(key)`,
  },
  {
    label: "Service Control (sc.exe)",
    code: `import subprocess
subprocess.run("sc.exe stop ServiceName", shell=True)
subprocess.run("sc.exe config ServiceName start=disabled", shell=True)`,
  },
];

export default function BackendGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState(SCRIPT_TEMPLATES[0].value);
  const [activeTab, setActiveTab] = useState<"templates" | "snippets">("templates");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      alert("Copy to clipboard failed. Select the text manually.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white border-b border-zinc-800 pb-2 mb-2">
          Backend Code Generator
        </h3>
        <p className="text-sm text-zinc-400">
          Select a template or snippet to generate Python scripts for new tweaks.
          Copy-paste them into the <code className="text-emerald-400">backend/</code> folder
          and they will be automatically picked up by the bridge.
        </p>
      </div>

      {/* Tab switch */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "templates"
              ? "bg-emerald-700 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          Full Templates
        </button>
        <button
          onClick={() => setActiveTab("snippets")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "snippets"
              ? "bg-emerald-700 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          Snippets
        </button>
      </div>

      {activeTab === "templates" ? (
        <>
          {/* Template selector */}
          <div className="flex gap-2 flex-wrap">
            {SCRIPT_TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => setSelectedTemplate(t.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  selectedTemplate === t.value
                    ? "bg-emerald-700 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Snippet selector */}
          <div className="grid grid-cols-2 gap-2">
            {SNIPPETS.map((s) => (
              <button
                key={s.label}
                onClick={() => setSelectedTemplate(s.code)}
                className="px-3 py-2 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors text-left"
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Code preview */}
      <div className="relative">
        <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-sm text-zinc-300 max-h-96 overflow-y-auto">
          <code>{selectedTemplate}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-md transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-white mb-2">How to Add a New Tweak</h4>
        <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
          <li>Copy a template above</li>
          <li>Save as <code className="text-emerald-400">backend/your_tweak.py</code></li>
          <li>Restart Electron / reload the renderer</li>
          <li>Add a <code className="text-emerald-400">TweakCard</code> in the corresponding tab component</li>
        </ol>
      </div>
    </div>
  );
}
