# -*- coding: utf-8 -*-
import sys, os
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

import paramiko

HOST = "198.13.184.39"
USER = "root"
PASS = "Alcodome99"
LOCAL_DIR = r"C:\Project\WB-OZON"
REMOTE_DIR = "/var/www/cardai"
IGNORE = {'.next', 'node_modules', '.git', '__pycache__', 'deploy.py', 'tsconfig.tsbuildinfo'}

def run(client, cmd, timeout=180):
    print(f">>> {cmd[:100]}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = ""
    while True:
        line = stdout.readline()
        if not line: break
        try: print(line.rstrip())
        except: pass
        out += line
    return out

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f"Connecting to {HOST}...")
client.connect(HOST, username=USER, password=PASS, timeout=15)
print("Connected!")

# Upload files
print("\nUploading files...")
sftp = client.open_sftp()

def sftp_mkdir_p(sftp, path):
    parts = path.strip('/').split('/')
    current = ''
    for part in parts:
        current += '/' + part
        try: sftp.stat(current)
        except FileNotFoundError:
            try: sftp.mkdir(current)
            except: pass

def upload_dir(local, remote):
    sftp_mkdir_p(sftp, remote)
    for item in os.listdir(local):
        if item in IGNORE: continue
        lpath = os.path.join(local, item)
        rpath = remote + '/' + item
        if os.path.isdir(lpath):
            upload_dir(lpath, rpath)
        else:
            try:
                sftp.put(lpath, rpath)
                print(f"  + {item}")
            except Exception as e:
                print(f"  skip {item}: {e}")

upload_dir(LOCAL_DIR, REMOTE_DIR)
sftp.close()
print("Upload done!\n")

# Install & build
print("Installing dependencies...")
run(client, f"cd {REMOTE_DIR} && npm install 2>&1 | tail -3", timeout=300)

print("Building...")
out = run(client, f"cd {REMOTE_DIR} && npm run build 2>&1 | tail -15", timeout=300)

if "error" in out.lower() and "build worker exited" in out.lower():
    print("BUILD FAILED! Check errors above.")
    client.close()
    sys.exit(1)

print("Build OK!")

# PM2 start
run(client, f"cd {REMOTE_DIR} && pm2 delete cardai 2>/dev/null; pm2 start npm --name cardai -- start -- -p 3001 2>&1 | tail -5")
run(client, "pm2 save 2>&1 | tail -2")
run(client, "pm2 startup 2>&1 | tail -3")

# Nginx
nginx_conf = """server {
    listen 80;
    server_name _ ;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}"""

run(client, f"echo '{nginx_conf}' > /etc/nginx/sites-available/cardai")
run(client, "ln -sf /etc/nginx/sites-available/cardai /etc/nginx/sites-enabled/cardai")
run(client, "rm -f /etc/nginx/sites-enabled/default")
run(client, "nginx -t && systemctl restart nginx && systemctl enable nginx 2>&1")

# Status
run(client, "pm2 status")

print(f"\n=== DEPLOYED! http://{HOST} ===")
client.close()
