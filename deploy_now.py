import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('198.13.184.39', username='root', password='Alcodome99')

cmds = [
    'cd /var/www/cardai && git status 2>&1 || echo "NO_GIT"',
    'cd /var/www/cardai && git pull origin main 2>&1',
    'cd /var/www/cardai && npm install 2>&1 | tail -5',
    'cd /var/www/cardai && npm run build 2>&1 | tail -20',
    'cd /var/www/cardai && (pm2 restart cardai 2>&1 || pm2 start npm --name cardai -- start -- -p 3001 2>&1)',
]

for cmd in cmds:
    print(f'\n>>> {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print(f'STDERR: {err}')

ssh.close()
print('\nDONE')