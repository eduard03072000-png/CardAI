# -*- coding: utf-8 -*-
import subprocess, sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

REPO = r"C:\Project_bg\WB-Ozon"

def run(args):
    r = subprocess.run(args, cwd=REPO, capture_output=True, text=True, encoding='utf-8')
    out = (r.stdout + r.stderr).strip()
    print(out)
    return r.returncode

run(["git", "add", "-A"])
run(["git", "commit", "-m", "feat: otp-service smtp, json export, bulk csv guard, photo ai guard, team invite email"])
code = run(["git", "push", "origin", "main"])
if code == 0:
    print("\n=== Pushed to GitHub successfully ===")
else:
    print("\n=== Push failed, check credentials ===")
