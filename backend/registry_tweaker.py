import winreg
import ctypes
import sys
import os

def is_admin():
    """Checks if the script has Administrator privileges."""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except (AttributeError, OSError):
        return False

def run_as_admin():
    """Relaunches the script with admin privileges."""
    print("[*] Requesting Administrator privileges to access the Registry...")
    script_path = os.path.abspath(sys.argv[0])
    ctypes.windll.shell32.ShellExecuteW(
        None, "runas", sys.executable, f'"{script_path}"', None, 1
    )
    sys.exit()

def disable_telemetry():
    """Disables Windows Telemetry by setting AllowTelemetry=0 in the Registry."""
    registry_path = r"SOFTWARE\Policies\Microsoft\Windows\DataCollection"
    print("[*] Attempting to disable Windows Telemetry...")
    try:
        key = winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE, registry_path, 0, winreg.KEY_SET_VALUE)
        winreg.SetValueEx(key, "AllowTelemetry", 0, winreg.REG_DWORD, 0)
        winreg.CloseKey(key)
        print("[+] Success! Windows Telemetry has been disabled.")
        return True
    except PermissionError:
        print("[-] Permission Denied. You must run this as Administrator.")
        return False
    except Exception as e:
        print(f"[-] An unexpected error occurred: {e}")
        return False

def restore_telemetry():
    """Re-enables Windows Telemetry by setting AllowTelemetry=1."""
    registry_path = r"SOFTWARE\Policies\Microsoft\Windows\DataCollection"
    print("[*] Restoring Windows Telemetry (AllowTelemetry=1)...")
    try:
        key = winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE, registry_path, 0, winreg.KEY_SET_VALUE)
        winreg.SetValueEx(key, "AllowTelemetry", 0, winreg.REG_DWORD, 1)
        winreg.CloseKey(key)
        print("[+] Success! Windows Telemetry has been restored.")
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

    print("--- Windows Registry Optimizer ---\n")
    action = sys.argv[1].lower() if len(sys.argv) > 1 else "enable"
    if action == "disable":
        restore_telemetry()
    else:
        disable_telemetry()

    input("\nPress Enter to exit...")