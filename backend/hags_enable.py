import sys
import os
import winreg
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

def enable_hags():
    """Enable Hardware-Accelerated GPU Scheduling via Registry."""
    registry_path = r"SYSTEM\CurrentControlSet\Control\GraphicsDrivers"
    print("[*] Enabling Hardware-Accelerated GPU Scheduling (HAGS)...")
    try:
        key = winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE, registry_path, 0, winreg.KEY_SET_VALUE)
        winreg.SetValueEx(key, "HwSchMode", 0, winreg.REG_DWORD, 2)  # 2 = Enabled
        winreg.CloseKey(key)
        print("[+] HAGS enabled. A system restart is required for the change to take effect.")
        return True
    except PermissionError:
        print("[-] Permission denied. Run as Administrator.")
        return False
    except Exception as e:
        print(f"[-] Error: {e}")
        return False

def disable_hags():
    """Disable Hardware-Accelerated GPU Scheduling via Registry."""
    registry_path = r"SYSTEM\CurrentControlSet\Control\GraphicsDrivers"
    print("[*] Disabling Hardware-Accelerated GPU Scheduling (HAGS)...")
    try:
        key = winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE, registry_path, 0, winreg.KEY_SET_VALUE)
        winreg.SetValueEx(key, "HwSchMode", 0, winreg.REG_DWORD, 1)  # 1 = Disabled
        winreg.CloseKey(key)
        print("[+] HAGS disabled. A system restart is required for the change to take effect.")
        return True
    except PermissionError:
        print("[-] Permission denied. Run as Administrator.")
        return False
    except Exception as e:
        print(f"[-] Error: {e}")
        return False

if __name__ == "__main__":
    if not is_admin():
        run_as_admin()

    action = sys.argv[1].lower() if len(sys.argv) > 1 else "enable"
    print(f"--- GPU Scheduling (HAGS): {action} ---\n")
    if action == "disable":
        disable_hags()
    else:
        enable_hags()
    input("\nPress Enter to exit...")
