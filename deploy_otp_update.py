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

def run(cmd, timeout=60):
    _, o, _ = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = ""
    while True:
        l = o.readline()
        if not l: break
        out += l
        try: print(" ", l.rstrip())
        except: pass
    return out

# Загружаем обновлённый index.js
print("Uploading updated index.js...")
sftp = client.open_sftp()
sftp.put(r"C:\Project_bg\WB-Ozon\otp-service\index.js", "/opt/cardai-otp/index.js")
sftp.close()
print("  ✓ index.js")

# Перезапускаем
run("pm2 restart cardai-otp && sleep 1")
run("pm2 logs cardai-otp --lines 3 --nostream")

# Тест отправки на Mail.ru
TEST = "eduard03.07.2000@mail.ru"
print(f"\n--- Test send to {TEST} ---")
out = run(f"""curl -s -X POST http://127.0.0.1:4010/send-otp \
  -H 'Content-Type: application/json' \
  -H 'x-otp-secret: cardai-otp-secret-2025' \
  -d '{{"email":"{TEST}"}}'""")

run("pm2 logs cardai-otp --lines 5 --nostream")

print("""
=== Что ещё нужно сделать в панели reg.ru для полного решения ===

1. reg.ru -> Почта -> cardai@evdgroup.ru -> включить DKIM подпись
   (или DNS -> добавить DKIM TXT запись которую даст reg.ru)

2. DNS -> добавить TXT запись:
   Имя:     _dmarc.evdgroup.ru
   Значение: v=DMARC1; p=none; rua=mailto:cardai@evdgroup.ru

3. Зарегистрировать домен на postmaster.mail.ru
   https://postmaster.mail.ru/
   -> Это даст белый список для @mail.ru адресов

Пока DKIM не настроен - часть писем на Mail.ru может отклоняться.
Gmail/Яндекс работают нормально.
""")

client.close()
