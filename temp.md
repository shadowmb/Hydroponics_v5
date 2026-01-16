1. Проверка на статуса на контейнерите
WARN[0000] /home/hydro/hydroponics/docker-compose.rpi.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
NAME                      IMAGE                   COMMAND                  SERVICE     CREATED         STATUS                          PORTS
hydroponics-backend-1     hydroponics-backend     "docker-entrypoint.s…"   backend     5 minutes ago   Up 5 minutes                    
hydroponics-frontend-1    hydroponics-frontend    "/docker-entrypoint.…"   frontend    5 minutes ago   Restarting (1) 45 seconds ago   
hydroponics-mongodb-1     mongo:7.0               "docker-entrypoint.s…"   mongodb     5 minutes ago   Up 5 minutes                    
hydroponics-simulator-1   hydroponics-simulator   "docker-entrypoint.s…"   simulator   5 minutes ago   Up 5 minutes     

2. Проверка дали портовете са заети
tcp        0      0 0.0.0.0:27017           0.0.0.0:*               LISTEN      28575/mongod        
tcp        0      0 0.0.0.0:3000            0.0.0.0:*               LISTEN      28754/node          

3. Преглед на логовете (ако контейнерите са Exited)

docker compose -f docker-compose.rpi.yml logs frontend:

frontend-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
frontend-1  | 2026/01/16 17:18:18 [emerg] 1#1: host not found in upstream "backend" in /etc/nginx/conf.d/default.conf:14
frontend-1  | nginx: [emerg] host not found in upstream "backend" in /etc/nginx/conf.d/default.conf:14
frontend-1  | /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
frontend-1  | /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
frontend-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
frontend-1  | 10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
frontend-1  | 10-listen-on-ipv6-by-default.sh: info: /etc/nginx/conf.d/default.conf differs from the packaged version
frontend-1  | /docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
frontend-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
frontend-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
frontend-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
frontend-1  | 2026/01/16 17:19:18 [emerg] 1#1: host not found in upstream "backend" in /etc/nginx/conf.d/default.conf:14
frontend-1  | nginx: [emerg] host not found in upstream "backend" in /etc/nginx/conf.d/default.conf:14

docker compose -f docker-compose.rpi.yml logs backend:

lse,"msg":"🕒 Scheduler Tick"}
backend-1  | {"level":30,"time":1768583980002,"env":"production","time":"17:19","isSim":false,"msg":"🕒 Scheduler Tick"}
backend-1  | {"level":30,"time":1768583990003,"env":"production","time":"17:19","isSim":false,"msg":"🕒 Scheduler Tick"}
backend-1  | {"level":30,"time":1768584000002,"env":"production","time":"17:20","isSim":false,"msg":"🕒 Scheduler Tick"}
backend-1  | {"level":30,"time":1768584010002,"env":"production","time":"17:20","isSim":false,"msg":"🕒 Scheduler Tick"}
backend-1  | {"level":30,"time":1768584020001,"env":"production","time":"17:20","isSim":false,"msg":"🕒 Scheduler Tick"}
backend-1  | {"level":30,"time":1768584030002,"env":"production","time":"17:20","isSim":false,"msg":"🕒 Scheduler Tick"}
backend-1  | {"level":30,"time":1768584040002,"env":"production","time":"17:20","isSim":false,"msg":"🕒 Scheduler Tick"}
backend-1  | {"level":30,"time":1768584050002,"env":"production","time":"17:20","isSim":false,"msg":"🕒 Scheduler Tick"}

