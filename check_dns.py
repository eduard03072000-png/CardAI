# -*- coding: utf-8 -*-
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
import paramiko

HOST = "198.13.184.39"
USER = "root"
PASS = "Alcodome99"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=30):
    _, o, _ = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = ""
    while True:
        l = o.readline()
        if not l: break
        out += l
        try: print(" ", l.rstrip())
        except: pass
    return out

print("=== Server IP & reverse DNS ===")
run("curl -s https://api.ipify.org && echo ''")
run("dig +short -x 198.13.184.39 2>/dev/null || host 198.13.184.39")

print("\n=== SPF record for evdgroup.ru ===")
run("dig +short TXT evdgroup.ru | grep spf")

print("\n=== MX records ===")
run("dig +short MX evdgroup.ru")

print("\n=== DKIM check ===")
run("dig +short TXT default._domainkey.evdgroup.ru")

print("\n=== Current email headers test ===")
run("""curl -s -X POST http://127.0.0.1:4010/send-otp \
  -H 'Content-Type: application/json' \
  -H 'x-otp-secret: cardai-otp-secret-2025' \
  -d '{"email":"test@example.com"}' 2>&1 | head -5""")

run("pm2 logs cardai-otp --lines 5 --nostream")

client.close()
