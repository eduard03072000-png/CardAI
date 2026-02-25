import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('198.13.184.39', username='root', password='Alcodome99')

cmds = [
    'cat /tmp/cardai-dev/users.json 2>&1',
    'pm2 logs cardai --lines 15 --nostream 2>&1 | grep -i "email\|resend\|error\|код"',
]

for cmd in cmds:
    print(f'\n>>> {cmd[:80]}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=15)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print(f'STDERR: {err}')

ssh.close()
print('\nDONE')