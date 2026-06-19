import sys
import os
import subprocess
import ctypes
import winreg

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

POWER_SCHEMES = {
    "gaming": {
        "name": "High performance",
        "guid": "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c",
    },
    "creator": {
        "name": "Balanced",
        "guid": "381b4222-f694-41f0-9685-ff5bb260df2f",
    },
    "office": {
        "name": "Power saver",
        "guid": "a1841308-3541-4fab-bc81-f71556f20b4a",
    },
}

def apply_profile(profile: str):
    profile = profile.lower().strip()
    if profile not in POWER_SCHEMES:
        print(f"[-] Unknown profile '{profile}'. Choose from: gaming, creator, office")
        return False

    info = POWER_SCHEMES[profile]
    print(f"[*] Applying profile: {info['name']} ({profile})")

    # Set active power scheme
    result = subprocess.run(
        ["powercfg", "/setactive", info["guid"]],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"[-] powercfg error: {result.stderr.strip()}")
        return False

    # Additional registry tweaks per profile
    if profile == "gaming":
        try:
            key = winreg.CreateKeyEx(
                winreg.HKEY_LOCAL_MACHINE,
                r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile",
                0, winreg.KEY_SET_VALUE
            )
            winreg.SetValueEx(key, "SystemResponsiveness", 0, winreg.REG_DWORD, 0)
            winreg.SetValueEx(key, "NetworkThrottlingIndex", 0, winreg.REG_DWORD, 0xFFFFFFFF)
            winreg.CloseKey(key)
            print("[+] Gaming profile: disabled throttling, set responsiveness to 0")
        except Exception as e:
            print(f"[-] Could not apply gaming registry tweaks: {e}")

    print(f"[+] Profile '{profile}' applied successfully.")
    return True

if __name__ == "__main__":
    if not is_admin():
        run_as_admin()

    profile_arg = sys.argv[1] if len(sys.argv) > 1 else "gaming"
    print(f"--- Workload Profile: {profile_arg} ---\n")
    apply_profile(profile_arg)
    input("\nPress Enter to exit...")
