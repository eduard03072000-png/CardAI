# -*- coding: utf-8 -*-
import sys, os
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('198.13.184.39', username='root', password='Alcodome99', timeout=15)

def run(cmd):
    print(f'>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace')
    print(out)
    return out

# Перезапустить cardai на порту 3001
run('pm2 delete cardai 2>/dev/null; cd /var/www/cardai && pm2 start npm --name cardai -- start -- -p 3001')
run('pm2 save')

# Обновить nginx — проксировать 80 на 3001
nginx_conf = '''server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}'''

run(f"cat > /etc/nginx/sites-available/cardai << 'EOF'\n{nginx_conf}\nEOF")
run('ln -sf /etc/nginx/sites-available/cardai /etc/nginx/sites-enabled/cardai')
run('rm -f /etc/nginx/sites-enabled/default')
run('nginx -t && systemctl reload nginx')
run('pm2 status')
print('\n=== DONE! http://198.13.184.39 -> cardai on port 3001 ===')
client.close()
