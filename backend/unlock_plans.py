import subprocess
import ctypes
import sys
import os

def is_admin():
    """Checks if the script is currently running with administrator privileges."""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except (AttributeError, OSError):
        return False

def run_as_admin():
    """Relaunches the script with admin privileges, safely handling spaces in folder paths."""
    print("[*] Requesting Administrator privileges...")
    
    # Safely get the absolute path of the script and wrap it in quotes
    script_path = os.path.abspath(sys.argv[0])
    quoted_script = f'"{script_path}"'
    
    # Re-launch with quotes around the path so Windows doesn't break at the space
    ctypes.windll.shell32.ShellExecuteW(
        None, "runas", sys.executable, quoted_script, None, 1
    )
    sys.exit()

def unlock_power_plan(guid, name):
    """Forces Windows to duplicate a hidden standard power scheme."""
    try:
        print(f"[*] Attempting to unlock '{name}'...")
        result = subprocess.run(
            ["powercfg", "-duplicatescheme", guid],
            capture_output=True, text=True, check=True
        )
        print(f"[+] Success! {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError:
        print(f"[-] Failed to unlock {name}.")
        return False

if __name__ == "__main__":
    if not is_admin():
        run_as_admin()

    print("--- Unlocking Hidden Windows Power Plans ---\n")
    
    # Unlock High Performance
    unlock_power_plan("8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c", "High Performance")
    
    # Unlock Ultimate Performance
    unlock_power_plan("e9a42b02-d5df-448d-aa00-03f14749eb61", "Ultimate Performance")
    
    print("\n--- Verifying Available Plans ---")
    subprocess.run(["powercfg", "/list"])
    
    input("\nPress Enter to exit...")