import sys
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

ULTIMATE_GUID = "e9a42b02-d5df-448d-aa00-03f14749eb61"

def enable_ultimate_performance():
    print("[*] Unhiding Ultimate Performance power plan...")
    result = subprocess.run(
        ["powercfg", "/restoredefaultschemes"],
        capture_output=True, text=True
    )
    
    # Try to unhide it explicitly
    result = subprocess.run(
        ["powercfg", "/list"],
        capture_output=True, text=True
    )
    
    # Check if already present
    if ULTIMATE_GUID.lower() in result.stdout.lower():
        print("[+] Ultimate Performance plan already visible.")
    else:
        # Add the Ultimate Performance plan
        result = subprocess.run(
            ["powercfg", "/duplicatescheme", ULTIMATE_GUID],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f"[-] Could not duplicate scheme: {result.stderr.strip()}")
            return False
        print("[+] Ultimate Performance plan unhidden.")

    # Activate it
    result = subprocess.run(
        ["powercfg", "/setactive", ULTIMATE_GUID],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"[-] Could not activate: {result.stderr.strip()}")
        return False

    print("[+] Ultimate Performance power plan is now active.")
    return True

if __name__ == "__main__":
    if not is_admin():
        run_as_admin()

    print("--- Ultimate Performance Power Plan ---\n")
    enable_ultimate_performance()
    input("\nPress Enter to exit...")
