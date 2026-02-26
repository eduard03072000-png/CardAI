# -*- coding: utf-8 -*-
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
import paramiko

HOST = "198.13.184.39"
USER = "root"
PASS = "Alcodome99"

TEST_EMAIL = input("Введи email для тестовой отправки: ").strip()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)

def run(cmd):
    _, o, _ = client.exec_command(cmd, timeout=30, get_pty=True)
    out = ""
    while True:
        l = o.readline()
        if not l: break
        out += l
        try: print(" ", l.rstrip())
        except: pass
    return out

print("\n--- Health check ---")
run("curl -s http://127.0.0.1:4010/health")

print(f"\n--- Sending test OTP to {TEST_EMAIL} ---")
run(f"""curl -s -X POST http://127.0.0.1:4010/send-otp \
  -H 'Content-Type: application/json' \
  -H 'x-otp-secret: cardai-otp-secret-2025' \
  -d '{{"email":"{TEST_EMAIL}"}}'""")

print("\n--- PM2 OTP logs ---")
run("pm2 logs cardai-otp --lines 10 --nostream")

client.close()
