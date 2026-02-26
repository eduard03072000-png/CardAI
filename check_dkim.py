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

print("=== DKIM records for evdgroup.ru ===")
run("dig +short TXT default._domainkey.evdgroup.ru")
run("dig +short TXT mail._domainkey.evdgroup.ru")
run("dig +short TXT dkim._domainkey.evdgroup.ru")
run("dig +short TXT smtp._domainkey.evdgroup.ru")

print("\n=== SPF full ===")
run("dig +short TXT evdgroup.ru")

print("\n=== DMARC full ===")
run("dig +short TXT _dmarc.evdgroup.ru")

print("\n=== Check if our server IP is listed in SPF ===")
run("dig +short TXT evdgroup.ru | grep -o 'ip4:[^ ]*'")

print("\n=== Our server reverse DNS ===")
run("dig +short -x 198.13.184.39")

client.close()
