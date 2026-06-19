import winreg
import ctypes
import sys
import os

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def run_as_admin():
    script_path = os.path.abspath(sys.argv[0])
    ctypes.windll.shell32.ShellExecuteW(
        None, "runas", sys.executable, f'"{script_path}"', None, 1
    )
    sys.exit()

def restore_telemetry():
    registry_path = r"SOFTWARE\Policies\Microsoft\Windows\DataCollection"
    
    try:
        key = winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE, registry_path, 0, winreg.KEY_SET_VALUE)
        # Set back to 3 (Default Windows Telemetry level)
        winreg.SetValueEx(key, "AllowTelemetry", 0, winreg.REG_DWORD, 3)
        winreg.CloseKey(key)
        print("[+] Success! Telemetry restored to default.")
    except Exception as e:
        print(f"[-] Error: {e}")

if __name__ == "__main__":
    if not is_admin():
        run_as_admin()
    restore_telemetry()