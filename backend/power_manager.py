import subprocess
import ctypes
import sys

# Standard Windows Power Plan GUIDs
POWER_PLANS = {
    "balanced": "381b4222-f694-41f0-9685-ff5bb260df2e",
    "high_performance": "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c",
    "power_saver": "a1841308-3541-4fab-bc81-f71556f20b4a",
}

def is_admin():
    """Checks if the script is currently running with administrator privileges."""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except (AttributeError, OSError):
        return False

def run_as_admin():
    """Relaunches the script with administrator privileges."""
    print("[*] Requesting Administrator privileges...")
    # This triggers the Windows UAC prompt
    ctypes.windll.shell32.ShellExecuteW(
        None, "runas", sys.executable, " ".join(sys.argv), None, 1
    )
    # Exit the current non-admin instance
    sys.exit()

def get_current_power_plan():
    """Fetches the currently active power plan."""
    try:
        result = subprocess.run(
            ["powercfg", "/getactivescheme"], 
            capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return f"Error reading power plan: {e}"

def set_power_plan(plan_name):
    """Sets the active Windows power plan based on the provided name."""
    plan_name = plan_name.lower()
    if plan_name not in POWER_PLANS:
        print(f"[-] Error: '{plan_name}' is not a recognized power plan.")
        return False

    guid = POWER_PLANS[plan_name]
    try:
        print(f"[*] Attempting to set power plan to: {plan_name.replace('_', ' ').title()}...")
        subprocess.run(
            ["powercfg", "/setactive", guid], 
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        print("[+] Successfully changed the power plan.")
        return True
    except subprocess.CalledProcessError:
        print("[-] Failed. Administrator privileges are required.")
        return False

# --- Main Logic ---
if __name__ == "__main__":
    # 1. Check for Admin rights before doing anything
    if not is_admin():
        run_as_admin()

    # 2. If we reach here, we have Admin rights
    print("--- Current System State ---")
    print(get_current_power_plan())
    print("-" * 28)
    
    success = set_power_plan("high_performance")
    
    if success:
        print("\n--- New System State ---")
        print(get_current_power_plan())
        
        # Pause so you can read the console before it closes
        input("\nPress Enter to exit...")