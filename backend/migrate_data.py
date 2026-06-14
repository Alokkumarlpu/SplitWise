import subprocess
import os
import shutil
import sys

def run_cmd(cmd, cwd):
    print(f"Running: {cmd}")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
    if res.returncode != 0:
        print(f"Error:\n{res.stderr}")
        return False
    print(res.stdout)
    return True

def main():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.environ["PYTHONUTF8"] = "1"
    env_path = os.path.join(backend_dir, ".env")
    env_bak = os.path.join(backend_dir, ".env.bak")
    dump_file = os.path.join(backend_dir, "datadump.json")
    
    python_exe = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
    if not os.path.exists(python_exe):
        python_exe = "python"

    print("Step 1: Renaming .env temporarily to force Django to connect to local SQLite database...")
    env_exists = os.path.exists(env_path)
    if env_exists:
        if os.path.exists(env_bak):
            os.remove(env_bak)
        shutil.move(env_path, env_bak)

    try:
        print("\nStep 2: Dumping data from local SQLite database (excluding contenttypes, permissions, and sessions)...")
        # Using --natural-foreign and --natural-primary to resolve FK values using natural keys (like username instead of ID)
        dump_cmd = f'"{python_exe}" manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission -e sessions.Session -o "{dump_file}"'
        success = run_cmd(dump_cmd, backend_dir)
        if not success:
            print("Failed to dump data from SQLite.")
            return
    finally:
        if env_exists:
            print("\nRestoring .env to connect back to Neon PostgreSQL database...")
            shutil.move(env_bak, env_path)

    print("\nStep 3: Loading data into Neon PostgreSQL database (with user signals disabled to avoid unique constraint violations)...")
    
    # Configure Django in this script to run the loaddata command with signals disconnected.
    sys.path.insert(0, backend_dir)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'splitwise_backend.settings')
    
    try:
        import django
        from django.core.management import call_command
        
        django.setup()
        
        from django.db.models.signals import post_save
        from django.contrib.auth.models import User
        
        # Disconnect the signal that automatically creates profiles and preferences
        from splitwise_api.models import create_user_settings
        post_save.disconnect(create_user_settings, sender=User)
        print("Successfully disconnected post_save signals for User creation.")
        
        # Load the data
        print("Loading fixture database dump...")
        call_command('loaddata', dump_file)
        print("Data loaded successfully.")
    except Exception as e:
        print(f"Failed to load data into PostgreSQL: {e}")
        import traceback
        traceback.print_exc()
        return

    # Clean up
    if os.path.exists(dump_file):
        os.remove(dump_file)
        
    print("\nDatabase migration completed successfully! All data has been copied from SQLite to Neon PostgreSQL.")

if __name__ == "__main__":
    main()
