import sys
import os
import subprocess
import ctypes
import re

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

# The base GUID Microsoft uses for Ultimate Performance (Pro/Enterprise only)
ULTIMATE_BASE_GUID = "e9a42b02-d5df-448d-aa00-03f14749eb61"
# High Performance — available on ALL editions, used as our fallback base
HIGH_PERFORMANCE_GUID = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"
# Balanced — used when reverting
BALANCED_GUID = "381b4222-f694-41f0-9685-ff5bb260df2e"

# Aggressive power settings to apply manually (mirrors Ultimate Performance plan).
# Format: (subgroup_guid, setting_guid, ac_value, dc_value)
# These are all safe to apply on any Windows edition.
ULTIMATE_SETTINGS = [
    # Hard disk — Turn off after: Never (0 seconds)
    ("0012ee47-9041-4b5d-9b77-535fba8b1442", "6738e2c4-e8a5-4a42-b16a-e040e769756e", 0, 0),
    # Sleep — Sleep after: Never (0 seconds)
    ("238c9fa8-0aad-41ed-83f4-97be242c8f20", "29f6c1db-86da-48c5-9fdb-f2de3053062a", 0, 0),
    # Sleep — Allow hybrid sleep: Off (0)
    ("238c9fa8-0aad-41ed-83f4-97be242c8f20", "94ac6d29-73ce-41a6-809f-6363ba21b47e", 0, 0),
    # Sleep — Hibernate after: Never (0 seconds)
    ("238c9fa8-0aad-41ed-83f4-97be242c8f20", "9d7815a6-7ee4-497e-8888-515a05f02364", 0, 0),
    # Processor — Minimum processor state: 100%
    ("54533251-82be-4824-96c1-47b60b740d00", "893dee8e-2bef-41e0-89c6-b55d0929964c", 100, 100),
    # Processor — Maximum processor state: 100%
    ("54533251-82be-4824-96c1-47b60b740d00", "bc5038f7-23e0-4960-96da-33abaf5935ec", 100, 100),
    # Processor — System cooling policy: Active (1)
    ("54533251-82be-4824-96c1-47b60b740d00", "94d3a615-a899-4ac5-ae2b-e4d8f634367f", 1, 1),
    # USB — USB selective suspend: Disabled (0)
    ("2a737441-1930-4402-8d77-b2bebba308a3", "48e6b7a6-50f5-4782-a5d4-53bb8f07e226", 0, 0),
    # PCI Express — Link state power management: Off (0)
    ("501a4d13-42af-4429-9fd1-a8218c268e20", "ee12f906-d277-404b-b6da-e5fa1a576df5", 0, 0),
]

def apply_performance_settings(guid):
    """
    Manually applies all Ultimate Performance equivalent settings to a given plan GUID.
    This works on ALL Windows editions — including Home — by using powercfg index commands
    instead of relying on the locked base plan.
    """
    print("[*] Applying Ultimate Performance settings to plan...")
    skipped = 0
    for subgroup, setting, ac_val, dc_val in ULTIMATE_SETTINGS:
        for flag, val in [("/setacvalueindex", ac_val), ("/setdcvalueindex", dc_val)]:
            r = subprocess.run(
                ["powercfg", flag, guid, subgroup, setting, str(val)],
                capture_output=True, text=True
            )
            if r.returncode != 0:
                skipped += 1  # Non-critical — some settings may not exist on all hardware

    if skipped:
        print(f"[!] {skipped} setting(s) skipped (hardware or edition limitation — non-critical).")
    else:
        print("[+] All performance settings applied.")

def activate_plan(guid):
    """
    Attempts to set a power plan as active.
    Stage 1: powercfg /setactive
    Stage 2 (fallback): Direct registry write for Windows Home compatibility
    Returns True on success, False on failure.
    """
    # Stage 1: Standard powercfg activation
    result = subprocess.run(
        ["powercfg", "/setactive", guid],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        return True

    # Stage 2: Registry fallback (handles Windows Home "unsupported setting" error)
    print("[*] Standard activation failed. Trying registry fallback for Windows Home...")
    try:
        import winreg
        key = winreg.OpenKey(
            winreg.HKEY_LOCAL_MACHINE,
            r"SYSTEM\CurrentControlSet\Control\Power",
            0,
            winreg.KEY_SET_VALUE
        )
        winreg.SetValueEx(key, "ActivePowerScheme", 0, winreg.REG_SZ, guid)
        winreg.CloseKey(key)
        print("[+] Plan activated via registry.")
        return True
    except Exception as reg_err:
        print(f"[-] Registry fallback failed: {reg_err}")
        return False

def get_existing_ultimate_guid():
    """Checks if an Ultimate Performance plan already exists and returns its GUID."""
    try:
        list_output = subprocess.check_output(["powercfg", "/l"], text=True, stderr=subprocess.DEVNULL)
        for line in list_output.splitlines():
            if "Ultimate Performance" in line:
                match = re.search(r"([0-9a-fA-F\-]{36})", line)
                if match:
                    return match.group(1)
    except Exception:
        pass
    return None

def toggle_ultimate_performance(enable=True):
    try:
        if enable:
            # ── STEP 1: Check if plan already exists ──────────────────────────────
            ultimate_guid = get_existing_ultimate_guid()
            if ultimate_guid:
                print(f"[*] Found existing Ultimate Performance plan: {ultimate_guid}")

            # ── STEP 2: Create the plan if it doesn't exist ───────────────────────
            if not ultimate_guid:
                print("[*] Unhiding Ultimate Performance power plan...")

                # Attempt A: Duplicate the native Ultimate Performance base scheme
                dup = subprocess.run(
                    ["powercfg", "-duplicatescheme", ULTIMATE_BASE_GUID],
                    capture_output=True, text=True
                )
                if dup.returncode == 0:
                    match = re.search(r"([0-9a-fA-F\-]{36})", dup.stdout)
                    if match:
                        ultimate_guid = match.group(1)
                        print(f"[+] Ultimate Performance plan unhidden.")

                # Attempt B: Clone High Performance and configure it identically
                # This works on Windows Home where the native GUID is blocked.
                if not ultimate_guid:
                    print("[*] Native plan unavailable on this edition. Building equivalent plan...")
                    dup = subprocess.run(
                        ["powercfg", "-duplicatescheme", HIGH_PERFORMANCE_GUID],
                        capture_output=True, text=True
                    )
                    if dup.returncode == 0:
                        match = re.search(r"([0-9a-fA-F\-]{36})", dup.stdout)
                        if match:
                            ultimate_guid = match.group(1)
                            # Rename so it shows as "Ultimate Performance" in Power Options
                            subprocess.run(
                                ["powercfg", "/changename", ultimate_guid,
                                 "Ultimate Performance",
                                 "Maximum performance for gaming and content creation."],
                                capture_output=True
                            )
                            print(f"[+] Custom Ultimate Performance plan created.")

                if not ultimate_guid:
                    raise Exception("Failed to create Ultimate Performance plan via any method.")

            # ── STEP 3: Apply all aggressive settings ─────────────────────────────
            apply_performance_settings(ultimate_guid)

            # ── STEP 4: Activate the plan ─────────────────────────────────────────
            print(f"[*] Activating Ultimate Performance plan...")
            if activate_plan(ultimate_guid):
                print("[+] Success: Ultimate Performance is now ACTIVE.")
            else:
                print("[-] Could not activate the plan. Please run as Administrator.")
                sys.exit(1)

        else:
            # ── DISABLE: Revert to Balanced ───────────────────────────────────────
            print(f"[*] Restoring Balanced Power Plan...")
            if activate_plan(BALANCED_GUID):
                print("[+] Success: Restored to Balanced plan.")
            else:
                print("[-] Could not restore Balanced plan.")
                sys.exit(1)

    except subprocess.CalledProcessError as e:
        print(f"[-] powercfg error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"[-] Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if not is_admin():
        run_as_admin()

    enable_mode = True
    if len(sys.argv) > 1 and sys.argv[1].lower() == "disable":
        enable_mode = False

    toggle_ultimate_performance(enable_mode)