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

def clean_cache():
    print("[*] Cleaning system caches...")
    ops = [
        ("Temp folder", 'cmd.exe /c del /q /f /s "%temp%\\*" 2>nul & rmdir /q /s "%temp%" 2>nul'),
        ("Prefetch", 'cmd.exe /c del /q /f /s "C:\\Windows\\Prefetch\\*" 2>nul'),
        ("Windows Temp", 'cmd.exe /c del /q /f /s "C:\\Windows\\Temp\\*" 2>nul & rmdir /q /s "C:\\Windows\\Temp\\*" 2>nul'),
        ("SoftwareDistribution (WSUS)", 'cmd.exe /c net stop wuauserv 2>nul & del /q /f /s "C:\\Windows\\SoftwareDistribution\\Download\\*" 2>nul & net start wuauserv 2>nul'),
    ]

    for name, command in ops:
        print(f"  Cleaning {name}...")
        subprocess.run(command, shell=True, capture_output=True, text=True)

    print("[+] Cache cleanup completed.")
    return True

if __name__ == "__main__":
    if not is_admin():
        run_as_admin()

    print("--- System Cache Cleaner ---\n")
    clean_cache()
    input("\nPress Enter to exit...")
