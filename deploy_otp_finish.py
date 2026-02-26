# -*- coding: utf-8 -*-
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
import paramiko, os

HOST = "198.13.184.39"
USER = "root"
PASS = "Alcodome99"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)
print("Connected!")

def run(cmd, timeout=120):
    print(f"$ {cmd}")
    _, o, _ = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = ""
    while True:
        l = o.readline()
        if not l: break
        out += l
        try: print(" ", l.rstrip())
        except: pass
    return out

# Смотрим где лежит .env.local
run("ls /var/www/cardai/.env.local 2>/dev/null || echo 'NOT FOUND'")
run("ls /var/www/cardai/.env 2>/dev/null || echo 'NOT FOUND'")

# Добавляем/обновляем переменные
env_file = "/var/www/cardai/.env.local"

# Убираем старые если есть, добавляем новые
cmds = [
    f"touch {env_file}",
    f"grep -v 'OTP_SERVICE_URL' {env_file} | grep -v 'OTP_API_SECRET' | grep -v 'DEV_MODE' > /tmp/env_tmp && mv /tmp/env_tmp {env_file}",
    f"echo 'OTP_SERVICE_URL=http://127.0.0.1:4010' >> {env_file}",
    f"echo 'OTP_API_SECRET=cardai-otp-secret-2025' >> {env_file}",
    f"echo 'DEV_MODE=false' >> {env_file}",
]
for cmd in cmds:
    run(cmd)

print("\n--- .env.local result ---")
run(f"cat {env_file}")

# Загружаем обновлённые route.ts
print("\nUploading updated routes...")
sftp = client.open_sftp()

def sftp_put(local, remote):
    sftp.put(local, remote)
    print(f"  + {os.path.basename(local)}")

sftp_put(r"C:\Project_bg\WB-Ozon\app\api\auth\send-otp\route.ts",
         "/var/www/cardai/app/api/auth/send-otp/route.ts")
sftp_put(r"C:\Project_bg\WB-Ozon\app\api\auth\verify-otp\route.ts",
         "/var/www/cardai/app/api/auth/verify-otp/route.ts")
sftp.close()

# Rebuild + restart
print("\nRebuilding Next.js...")
run("cd /var/www/cardai && npm run build 2>&1 | tail -10", timeout=300)
run("pm2 restart cardai && sleep 2 && pm2 status")

print("\n=== ALL DONE ===")
print("OTP Service: http://127.0.0.1:4010")
print("Test: curl -s http://127.0.0.1:4010/health")
client.close()
