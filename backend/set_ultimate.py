import subprocess
import ctypes
import sys

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except Exception:
        return False

def run_as_admin():
    import os
    script_path = os.path.abspath(sys.argv[0])
    ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, f'"{script_path}"', None, 1)
    sys.exit()

if __name__ == "__main__":
    if not is_admin():
        run_as_admin()

    # The custom GUID your system just generated
    my_ultimate_guid = "1534a077-85bd-46ce-ac1c-bb6a8affff27"

    print("[*] Activating Ultimate Performance...")
    
    # 1. Set it as the active plan
    subprocess.run(["powercfg", "/setactive", my_ultimate_guid])
    
    # 2. List the plans to verify it is now the active one (marked with an asterisk *)
    print("\n--- Current Power Plans ---")
    subprocess.run(["powercfg", "/list"])
    
    input("\nPress Enter to exit...")