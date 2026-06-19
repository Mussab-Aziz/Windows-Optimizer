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

def disable_printspooler():
    print("[*] Disabling Print Spooler service...")
    commands = [
        'sc.exe stop Spooler',
        'sc.exe config Spooler start=disabled',
    ]
    for cmd in commands:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print(f"  $ {cmd} -> {result.returncode}")
        if result.stderr.strip():
            print(f"    stderr: {result.stderr.strip()}")
    print("[+] Print Spooler has been disabled.")
    return True

def restore_printspooler():
    print("[*] Restoring Print Spooler service...")
    commands = [
        'sc.exe config Spooler start=auto',
        'sc.exe start Spooler',
    ]
    for cmd in commands:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print(f"  $ {cmd} -> {result.returncode}")
    print("[+] Print Spooler has been restored.")
    return True

if __name__ == "__main__":
    if not is_admin():
        run_as_admin()

    action = sys.argv[1].lower() if len(sys.argv) > 1 else "enable"
    print(f"--- Print Spooler Service: {action} ---\n")
    if action == "disable":
        restore_printspooler()
    else:
        disable_printspooler()
    input("\nPress Enter to exit...")
