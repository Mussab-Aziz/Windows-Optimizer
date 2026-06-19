import winreg
import ctypes
import sys
import os

def is_admin():
    """Checks if the script has Administrator privileges."""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except Exception:
        return False

def run_as_admin():
    """Relaunches the script with admin privileges."""
    print("[*] Requesting Administrator privileges to access the Registry...")
    script_path = os.path.abspath(sys.argv[0])
    ctypes.windll.shell32.ShellExecuteW(
        None, "runas", sys.executable, f'"{script_path}"', None, 1
    )
    sys.exit()

def disable_network_throttling():
    """Disables Windows Network Throttling to prioritize gaming/upload speeds."""
    # The exact path for Network Throttling settings
    registry_path = r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile"
    
    print("[*] Attempting to disable Network Throttling...")
    
    try:
        # Open the specific registry key with Write access
        key = winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE, registry_path, 0, winreg.KEY_SET_VALUE)
        
        # Set NetworkThrottlingIndex to 0xFFFFFFFF (4294967295 in decimal) to disable it
        winreg.SetValueEx(key, "NetworkThrottlingIndex", 0, winreg.REG_DWORD, 0xFFFFFFFF)
        
        winreg.CloseKey(key)
        print("[+] Success! Network Throttling has been completely disabled.")
        return True
        
    except PermissionError:
        print("[-] Permission Denied. You must run this as Administrator.")
        return False
    except Exception as e:
        print(f"[-] An unexpected error occurred: {e}")
        return False

if __name__ == "__main__":
    if not is_admin():
        run_as_admin()

    print("--- Windows Network Optimizer --- \n")
    
    disable_network_throttling()
    
    input("\nPress Enter to exit...")