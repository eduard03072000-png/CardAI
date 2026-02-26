# -*- coding: utf-8 -*-
import sys, os
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
import paramiko

HOST = "198.13.184.39"
USER = "root"
PASS = "Alcodome99"
LOCAL_DIR = r"C:\Project_bg\WB-Ozon\otp-service"
REMOTE_DIR = "/opt/cardai-otp"

def run(client, cmd, timeout=120):
    print(f"$ {cmd}")
    _, stdout, _ = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = ""
    while True:
        line = stdout.readline()
        if not line: break
        out += line
        try: print(" ", line.rstrip())
        except: pass
    return out

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f"Connecting to {HOST}...")
client.connect(HOST, username=USER, password=PASS, timeout=15)
print("Connected!\n")

# Создаём папку
run(client, f"mkdir -p {REMOTE_DIR}")

# Загружаем файлы
print("Uploading files...")
sftp = client.open_sftp()
for fname in ["index.js", "package.json"]:
    sftp.put(os.path.join(LOCAL_DIR, fname), f"{REMOTE_DIR}/{fname}")
    print(f"  ✓ {fname}")
sftp.close()

# npm install
print("\nInstalling dependencies...")
run(client, f"cd {REMOTE_DIR} && npm install --production 2>&1 | tail -5")

# Останавливаем старый инстанс если есть
run(client, "pm2 delete cardai-otp 2>/dev/null; echo ok")

# Запускаем через pm2
print("\nStarting with PM2...")
run(client, f"cd {REMOTE_DIR} && pm2 start index.js --name cardai-otp && pm2 save")

# Проверяем что запустился
import time
time.sleep(2)
out = run(client, "curl -s http://127.0.0.1:4010/health")
if '"ok":true' in out:
    print("\n✅ OTP Service is UP!")
else:
    print("\n⚠️  Health check failed, checking logs...")
    run(client, "pm2 logs cardai-otp --lines 20 --nostream")

run(client, "pm2 status")
print(f"\n=== DONE! OTP service at 127.0.0.1:4010 ===")
client.close()
