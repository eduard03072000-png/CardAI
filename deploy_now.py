import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('198.13.184.39', username='root', password='Alcodome99')

cmds = [
    'echo "" >> /var/www/cardai/.env.local',
    'echo "# Yandex OAuth" >> /var/www/cardai/.env.local',
    'echo "YANDEX_CLIENT_ID=74e4cdedfd1d40bfb61d1eec1c623b94" >> /var/www/cardai/.env.local',
    'echo "YANDEX_CLIENT_SECRET=abec0398bf27490d867d761ad8834f7f" >> /var/www/cardai/.env.local',
    'cat /var/www/cardai/.env.local',
    'cd /var/www/cardai && pm2 restart cardai 2>&1 | tail -3',
]

for cmd in cmds:
    print(f'\n>>> {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print(f'STDERR: {err}')

ssh.close()
print('\nDONE')