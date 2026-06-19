import subprocess

def list_system_power_plans():
    """Queries the system for all installed power plans."""
    try:
        print("[*] Querying Windows for available power plans...\n")
        
        # Run powercfg /list to get all plans
        result = subprocess.run(
            ["powercfg", "/list"], 
            capture_output=True, 
            text=True, 
            check=True
        )
        
        # Print the exact output from Windows
        print(result.stdout.strip())
        
    except subprocess.CalledProcessError as e:
        print(f"[-] Failed to query power plans. Error: {e}")

if __name__ == "__main__":
    list_system_power_plans()
    input("\nPress Enter to exit...")