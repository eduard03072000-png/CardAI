import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('198.13.184.39', username='root', password='Alcodome99', timeout=15)

cmds = [
    'ss -tlnp | grep LISTEN',
    'pm2 list',
    'ls /etc/nginx/sites-enabled/',
    'cat /etc/nginx/sites-enabled/cardai',
    'cat /etc/nginx/sites-enabled/default 2>/dev/null || echo NO DEFAULT',
]

for cmd in cmds:
    print(f'\n=== {cmd} ===')
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
    print(stdout.read().decode())

client.close()
