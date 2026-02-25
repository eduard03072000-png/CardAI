import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('198.13.184.39', username='root', password='Alcodome99')

stdin, stdout, stderr = ssh.exec_command('cd /var/www/cardai && npm run build 2>&1 | head -50', timeout=120)
print(stdout.read().decode())
print(stderr.read().decode())

ssh.close()