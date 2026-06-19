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

def enable_high_priority():
    """Assign high CPU priority to foreground applications via registry."""
    registry_path = r"SYSTEM\CurrentControlSet\Control\PriorityControl"
    print("[*] Setting foreground app to High CPU priority class...")

    try:
        key = winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE, registry_path, 0, winreg.KEY_SET_VALUE)
        # Win32PrioritySeparation: bits 5-6 control foreground boost:
        # 0x26 = 100110b → foreground priority boost +2, short quantum, fixed
        # 0x18 = 011000b → default
        # We set to 0x26 for maximum foreground responsiveness
        winreg.SetValueEx(key, "Win32PrioritySeparation", 0, winreg.REG_DWORD, 0x26)
        winreg.CloseKey(key)
        print("[+] Foreground process priority boosting enabled.")
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

    print("--- High Process Priority (Foreground Boost) ---\n")
    enable_high_priority()
    input("\nPress Enter to exit...")
