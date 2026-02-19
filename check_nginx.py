# -*- coding: utf-8 -*-
import sys
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('198.13.184.39', username='root', password='Alcodome99', timeout=15)

def run(cmd):
    print(f'>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True, timeout=15)
    print(stdout.read().decode('utf-8', errors='replace'))

run('ls /etc/nginx/sites-available/')
run('cat /etc/nginx/sites-available/default 2>/dev/null || echo NO DEFAULT')
run('ls /etc/nginx/sites-enabled/')
run('cat /etc/nginx/sites-enabled/* 2>/dev/null')
run('pm2 list')

client.close()
