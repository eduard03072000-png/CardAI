import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('198.13.184.39', username='root', password='Alcodome99')

cmds = [
    'cd /var/www/cardai && git pull origin main 2>&1',
    'cd /var/www/cardai && npm run build 2>&1 | tail -20',
    'pm2 restart cardai 2>&1',
    'sleep 4 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/login',
]
for cmd in cmds:
    print(f'\n>>> {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print(f'ERR: {err}')
ssh.close()
print('\nDONE')