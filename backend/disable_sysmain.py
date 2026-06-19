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

def disable_sysmain():
    print("[*] Disabling SysMain (Superfetch) service...")
    commands = [
        'sc.exe stop SysMain',
        'sc.exe config SysMain start=disabled',
    ]
    for cmd in commands:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print(f"  $ {cmd} -> {result.returncode}")
        if result.stderr.strip():
            print(f"    stderr: {result.stderr.strip()}")
    print("[+] SysMain (Superfetch) has been disabled.")
    return True

def restore_sysmain():
    print("[*] Restoring SysMain (Superfetch) service...")
    commands = [
        'sc.exe config SysMain start=auto',
        'sc.exe start SysMain',
    ]
    for cmd in commands:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print(f"  $ {cmd} -> {result.returncode}")
    print("[+] SysMain has been restored.")
    return True

if __name__ == "__main__":
    if not is_admin():
        run_as_admin()

    action = sys.argv[1].lower() if len(sys.argv) > 1 else "enable"
    print(f"--- SysMain Service: {action} ---\n")
    if action == "disable":
        restore_sysmain()
    else:
        disable_sysmain()
    input("\nPress Enter to exit...")
