# Как настроить Nginx в качестве обратного прокси-сервера на Ubuntu 24.04

## Введение 

Обратный прокси-сервер или reverse-proxy на базе Nginx представляет собой режим работы веб-сервера, при котором он становится промежуточным узлом между внешними клиентами и внутренними бэкенд-серверами.
При таком использовании Nginx мы получаем несколько преимуществ:
1.	Защита внутреннего сервера.  В интернете виден только внешний адрес прокси. Настоящий сервер спрятан за ним. В этом случае сканеры портов и боты получают ответ от Nginx на 443 порту и не понимают, что находится внутри. Тем самым мы скрываем все потенциальные уязвимости бэкенда. 
2.	Централизация SSL-сертификатов.
Можно создать только один публичный сервер, для которого потребуется один сертификат. Бэкенд может работать на самоподписанном TLS либо вообще слушать HTTP на локальном интерфейсе. 
3.	Единая точка для WAF и логирования.
Web-Application Firewall проще настроить один раз на границе сети, чем разворачивать на каждом сервере. Там же удобно вести централизованные логи доступа. Прокси будет фиксировать исходный IP, конечный URI, результат кэширования и время ответа бэкенда.
4.	Балансировка и масштабирование.
Reverse-proxy можно превратить в балансировщик нагрузки между серверами.

В качестве примера мы настроим reverse-proxy на Nginx и бэкенд Nextcloud. 

## Создание серверов

Создадим наши серверы на [HostVDS](https://hostvds.com/control/servers/new). 
> Выбирайте серверы исходя из Ваших требований к системе
 
В качестве примера для наших серверов мы выбрали тариф Highload c 8 Гб оперативной памяти и 2 CPU, образ Ubuntu 24.04:
<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_01.png width=1024></p>

После создания серверов и подключения к ним по SSH приступаем к настройке. Начнем с reverse-proxy сервера.

## Настройка reverse-proxy на Nginx

### Подготовка системы

Обновим систему до последних версий пакетов:


```
sudo apt update && sudo apt upgrade -y
```

Установим необходимый пакет программ: 

```
sudo apt install nginx certbot python3-certbot-nginx fail2ban ufw -y 
```

### Настройка Nginx

Мы будем использовать доменное имя на базе сервиса [Sslip.io](https://Sslip.io).  
Мой IP-адрес reverse-proxy 217.19.4.19, значит доменное имя будет таким:  
nextcloud.217.19.4.19.sslip.io  
Создаем первоначальный конфиг Nginx для получения сертификата от Let’s Encrypt:

```
sudo nano /etc/nginx/sites-available/reverse-proxy
```

Вставляем в него конфигурацию.
> Замените в конфигурации доменное имя nextcloud.217.19.4.19.sslip.io на свое 

```
server {
    listen 80;
    server_name nextcloud.217.19.4.19.sslip.io;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Сохраняем файл CTRL+O, выходим CTRL+X.  
Удаляем дефолтный конфиг nginx:

```
sudo rm /etc/nginx/sites-enabled/default
```

Включаем сайт:

```
sudo ln -s /etc/nginx/sites-available/reverse-proxy /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```
Вы должны увидеть ответ "test is successful": 
<p align="center"><img alt="test Nginx" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_02.png width=1024></p>

### Получение SSL-сертификата Let's Encrypt

Создаем сертификат для нашего Nextcloud:
> Замените nextcloud.217.19.4.19.sslip.io на Ваше доменное имя

```
sudo certbot --nginx -d nextcloud.217.19.4.19.sslip.io
```

Certbot задаст Вам несколько вопросов и автоматически сконфигурирует сертификат.

<p align="center"><img alt="certbot" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_03.png width=1024></p>

### Настройка reverse-proxy Nginx

Создадим несколько дополнительных конфигурационных файлов, чтобы уменьшить объем конфига reverse-proxy.
Начнем с необходимых директорий:

```
sudo mkdir -p /var/cache/nginx/{nextcloud,nextcloud_api,nextcloud_dynamic}
sudo chown -R www-data:www-data /var/cache/nginx/
sudo mkdir -p /etc/nginx/conf.d/
```

Создаем файл для работы с заголовками:

```
sudo nano /etc/nginx/conf.d/proxy_headers.conf
```

Вставляем в него конфигурацию:

```
proxy_http_version 1.1;
proxy_set_header Host nextcloud.217.19.4.19.sslip.io;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Host nextcloud.217.19.4.19.sslip.io;
proxy_set_header X-Forwarded-Port 443;
proxy_set_header Connection "";

# WebDAV заголовки 
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Destination $http_destination;
proxy_set_header Depth $http_depth;
proxy_set_header Overwrite $http_overwrite;

# SSL
proxy_ssl_server_name on;
proxy_ssl_name nextcloud.46.8.71.133 .sslip.io;
proxy_ssl_verify on;  # Установить в off при проблемах
proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
proxy_ssl_session_reuse on;

# Буферизация
proxy_buffering on;
proxy_buffer_size 8k;
proxy_buffers 16 8k;
proxy_busy_buffers_size 16k;
proxy_request_buffering off;  # Отключено для загрузок
proxy_max_temp_file_size 0;

# Таймауты
proxy_connect_timeout 30s;

# Ошибки
proxy_next_upstream error timeout invalid_header http_502 http_503 http_504;
proxy_next_upstream_tries 2;
proxy_next_upstream_timeout 10s;
```

Создаем файл для статики:

```
sudo nano /etc/nginx/conf.d/proxy_headers_minimal.conf
```

Вставляем в него конфигурацию:

```
proxy_set_header Host nextcloud.217.19.4.19.sslip.io;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header Connection "";
```

Создаем файл для логирования:

```
sudo nano /etc/nginx/conf.d/00-logformat.conf
```

Вставляем в него конфигурацию:

```
log_format nextcloud_proxy_extended
    '$remote_addr - $remote_user [$time_local] "$request" '
    '$status $body_bytes_sent "$http_referer" '
    '"$http_user_agent" "$http_x_forwarded_for" '
    'upstream: $upstream_addr rt=$request_time '
    'uct="$upstream_connect_time" uht="$upstream_header_time" '
    'urt="$upstream_response_time" cache="$upstream_cache_status" '
    'cache_key="$scheme$proxy_host$request_uri" '
    'upstream_status="$upstream_status" '
    'bytes_sent=$bytes_sent request_length=$request_length';
```

Добавляем директивы в блок http {…} конфигурационного файла nginx:

```
sudo nano /etc/nginx/nginx.conf
```

Директивы:

```
        # Скрываем версию Nginx
        server_tokens off;

        # Общий лимит соединений
        limit_conn_zone  $binary_remote_addr zone=global_conn:10m;
        limit_conn       global_conn 50;

         # Детальное логирование
        log_format nextcloud_proxy '$remote_addr - $remote_user [$time_local] "$request" '
                               '$status $body_bytes_sent "$http_referer" '
                               '"$http_user_agent" "$http_x_forwarded_for" '
                               'upstream: $upstream_addr rt=$request_time '
                               'uct="$upstream_connect_time" uht="$upstream_header_time" '
                               'urt="$upstream_response_time" cache="$upstream_cache_status"';

        proxy_headers_hash_max_size  1024;
        proxy_headers_hash_bucket_size 128;
```

<p align="center"><img alt="nginx.conf" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_04.png width=1024></p>

Перед настройкой конфига создадим директории для кэша и ACME:

```
sudo mkdir -p /var/www/letsencrypt
sudo chown www-data:www-data /var/www/letsencrypt
sudo chown -R www-data:www-data /var/cache/nginx/nextcloud
sudo chmod 700 /var/cache/nginx/nextcloud
```

Переходим к настройке самого конфига reverse-proxy. Удаляем базовый файл и создаем новый одной командой:

```
sudo rm /etc/nginx/sites-available/reverse-proxy && sudo nano /etc/nginx/sites-available/reverse-proxy
```

> Замените  IP-адрес прокси 217.19.4.19 на Ваш  IP-адрес 7 раз.

> Замените  IP-адрес бэкенда 46.8.71.133   на Ваш  IP-адрес 1 раз.

```
# UPSTREAM КОНФИГУРАЦИЯ
upstream nextcloud_backend {
    least_conn;
    server 46.8.71.133 :443 max_fails=2 fail_timeout=20s weight=1;
    keepalive 64;
    keepalive_requests 10000;
    keepalive_timeout 300s;
}

# КЕШИРОВАНИЕ
proxy_cache_path /var/cache/nginx/nextcloud levels=1:2 keys_zone=nextcloud_cache:10m max_size=1g inactive=60m use_temp_path=off;
proxy_cache_path /var/cache/nginx/nextcloud_api levels=1:2 keys_zone=api_cache:5m max_size=100m inactive=10m use_temp_path=off;
proxy_cache_path /var/cache/nginx/nextcloud_dynamic levels=1:2 keys_zone=dynamic_cache:5m max_size=200m inactive=5m use_temp_path=off;

# ОПРЕДЕЛЕНИЕ ЗОН ДЛЯ ОГРАНИЧЕНИЯ ЗАПРОСОВ ПО IP
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=webdav:10m rate=50r/s;
limit_req_zone $binary_remote_addr zone=upload:10m rate=5r/s;
limit_req_zone $binary_remote_addr zone=download:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

# СЕРВЕР HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name nextcloud.217.19.4.19.sslip.io;

    ssl_certificate /etc/letsencrypt/live/nextcloud.217.19.4.19.sslip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nextcloud.217.19.4.19.sslip.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/nextcloud.217.19.4.19.sslip.io/chain.pem;

    # БЕЗОПАСНЫЕ ЗАГОЛОВКИ И НАСТРОЙКА ЛОГОВ
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header X-Robots-Tag "noindex, nofollow" always;

    access_log /var/log/nginx/nextcloud_proxy.log nextcloud_proxy_extended;
    error_log /var/log/nginx/nextcloud_proxy_error.log warn;

    # АНТИ-СКАНЕРЫ И ОГРАНИЧЕНИЕ СОЕДИНЕНИЙ
    if ($http_user_agent ~* "masscan|nmap|sqlmap|nikto|acunetix|nessus|wpscan|gobuster|dirb|dirbuster|wget|curl.*bot|python-requests|scanner") {
        return 444;
    }

    limit_conn conn_limit 20;

  # МАКСИМАЛЬНЫЙ РАЗМЕР ЗАГРУЖАЕМЫХ ФАЙЛОВ
    client_max_body_size 16G;
    client_body_timeout 300s;

    # МОНИТОРИНГ
    location = /proxy-status {
        access_log off;
        allow 127.0.0.1;
        allow 217.19.4.19;
        deny all;
    }

    location = /proxy-health {
        access_log off;
        allow 127.0.0.1;
        allow 217.19.4.19;
        deny all;
        proxy_pass https://nextcloud_backend/backend-health;
        proxy_connect_timeout 5s;
        proxy_read_timeout 5s;
        proxy_send_timeout 5s;
        error_page 502 503 504 = @backend_down;
    }

    location @backend_down {
        return 503 "Backend unavailable\n";
        add_header Content-Type text/plain;
    }

    # Обработка входов (без кеширования)
    location ~ ^/(login|index\.php.*login) {
        limit_req zone=login burst=3 nodelay;
        proxy_pass https://nextcloud_backend;
        include /etc/nginx/conf.d/proxy_headers.conf;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }

    # API
    location ~ ^/(ocs/|index\.php/(apps|core)) {
        limit_req zone=api burst=40 nodelay;
        proxy_pass https://nextcloud_backend;
        include /etc/nginx/conf.d/proxy_headers.conf;
        proxy_cache api_cache;
        proxy_cache_methods GET HEAD;
        proxy_cache_valid 200 30s;
        proxy_cache_valid 404 5s;
        proxy_cache_key "$scheme$proxy_host$request_uri$request_method";
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        proxy_cache_lock_timeout 5s;
        proxy_cache_revalidate on;
        add_header X-Cache-Status $upstream_cache_status;
        add_header X-Cache-Key "$scheme$proxy_host$request_uri$request_method";
    }

    # WebDAV-СИНХРОНИЗАЦИЯ С ИНТЕЛЛЕКТУАЛЬНЫМ КЕШИРОВАНИЕМ
    location ~ ^/remote\.php/webdav {
        limit_req zone=webdav burst=100 nodelay;
        proxy_pass https://nextcloud_backend;
        include /etc/nginx/conf.d/proxy_headers.conf;
        set $no_cache 1;
        if ($request_method ~ ^(PROPFIND|GET)$) {
            set $no_cache 0;
        }
        proxy_cache dynamic_cache;
        proxy_cache_bypass $no_cache;
        proxy_no_cache $no_cache;
        proxy_cache_valid 200 1m;
        proxy_cache_key "$scheme$proxy_host$request_uri$request_method";
        proxy_read_timeout 7200;
        proxy_send_timeout 7200;
        client_max_body_size 16G;
        client_body_timeout 300s;
        add_header X-Cache-Status $upstream_cache_status;
    }

    # АГРЕССИВНОЕ КЕШИРОВАНИЕ СТАТИЧЕСКИХ ФАЙЛОВ
    location ~* \.(css|js|woff2?|ttf|otf|eot|ico|png|jpg|jpeg|gif|svg|webp|map|pdf|doc|docx)$ {
        proxy_pass https://nextcloud_backend;
        proxy_ignore_headers Cache-Control Expires;
        proxy_cache nextcloud_cache;
        proxy_cache_valid 200 304 7d;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        proxy_cache_background_update on;
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        add_header X-Cache-Status $upstream_cache_status;
        access_log off;
        include /etc/nginx/conf.d/proxy_headers_minimal.conf;
    }

    # ОБРАБОТКА ВСЕХ ЗАПРОСОВ, НЕ ПОПАВШИХ В ДРУГИЕ LOCATION
    location / {
        limit_req zone=general burst=60 nodelay;
        proxy_pass https://nextcloud_backend;
        include /etc/nginx/conf.d/proxy_headers.conf;
        set $no_cache 1;
        if ($request_method = GET) { set $no_cache 0; }
        if ($request_uri ~ "/(login|logout|admin)") { set $no_cache 1; }
        proxy_cache dynamic_cache;
        proxy_cache_bypass $no_cache;
        proxy_no_cache $no_cache;
        proxy_cache_valid 200 30s;
        proxy_cache_key "$scheme$proxy_host$request_uri$request_method$http_accept";
        proxy_cache_revalidate on;
        add_header X-Cache-Status $upstream_cache_status;
        client_max_body_size 16G;
        client_body_buffer_size 1m;
    }
}

# HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name nextcloud.217.19.4.19.sslip.io;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        try_files $uri $uri/ =404;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

Сохраняем файл CTRL+O, выходим из него CTRL+Z.
Проверяем синтаксис Nginx и перезапускаем его:

```
sudo nginx -t && sudo systemctl reload nginx
```

<p align="center"><img alt="reload nginx" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_05.png width=1024></p>

Опция ssl_stapling – это настройка Nginx для ускорения проверки валидности SSL-сертификата через технологию OCSP Stapling (подписка статуса). В предупреждении указано, что она игнорируется, так как в сертификате не указан URL OCSP responder. Наш сервер работает корректно, но OCSP stapling не включён из-за особенностей сертификата.  
Переходим к Fail2Ban.

### Настройка Fail2Ban

Создадим файл, который будет содержать три jail-блока, каждый из которых отвечает за отслеживание и блокировку разных типов подозрительной активности по логам:  
•	[nextcloud-proxy] – базовая защита авторизации  
•	[nextcloud-brute] – защита от перебора паролей  
•	[nextcloud-scanner] – защита от сканеров и ботов

```
sudo nano  /etc/fail2ban/jail.d/nextcloud-proxy.conf
```

Вставляем в него конфигурацию:

```
[nextcloud-proxy]
enabled = true
port = https
filter = nextcloud-proxy
logpath = /var/log/nginx/nextcloud_proxy.log
action = iptables[name=nextcloud-proxy, port=https, protocol=tcp]
maxretry = 3
findtime = 360s
bantime = 1h

[nextcloud-brute]
enabled = true
port = https
filter = nextcloud-brute
logpath = /var/log/nginx/nextcloud_proxy.log
action = iptables[name=nextcloud-brute, port=https, protocol=tcp]
maxretry = 5
findtime = 300s
bantime = 4h

[nextcloud-scanner]
enabled = true
port = https
filter = nextcloud-scanner
logpath = /var/log/nginx/nextcloud_proxy.log
action = iptables[name=nextcloud-scanner, port=https, protocol=tcp]
maxretry = 1
findtime = 60s
bantime = 24h
```

Следующий файл будет содержать правила фильтрации логов Nginx, по которым Fail2Ban определяет вредоносную активность. Этот фильтр мы указали в jail-блоке [nextcloud-proxy].

```
sudo nano /etc/fail2ban/filter.d/nextcloud-proxy.conf
```

Конфигурация:

```
[Definition]
# Основные ошибки аутентификации
failregex = ^<HOST> .* "(GET|POST) /index\.php.*login.*" .* 401
            ^<HOST> .* "(GET|POST) /index\.php.*ocs" .* 401
            ^<HOST> .* "/remote\.php/webdav/.*" .* (401|403|400)
            
            # Расширенные правила для 40x ошибок
            ^<HOST> .* "(GET|POST|PUT|DELETE) .*" .* 40[0-9]
            
            # Множественные быстрые запросы
            ^<HOST> .* "(GET|POST) .*" .* (429|503)

ignoreregex =
```

Создадим файл, который будет ловить частые ошибки авторизации в логах Nextcloud:

```
sudo nano /etc/fail2ban/filter.d/nextcloud-brute.conf
```

Конфигурация:

```
[Definition]
# Брутфорс попытки
failregex = ^<HOST> .* "(POST) /index\.php.*login.*" .* (401|403)
            ^<HOST> .* "(POST) /remote\.php/webdav/.*" .* (401|403)
            ^<HOST> .* "(PROPFIND|GET) /remote\.php/webdav/.*" .* (401|403)

ignoreregex =
```

Последний файл будет фильтром для сканеров и ботов:

```
sudo nano /etc/fail2ban/filter.d/nextcloud-scanner.conf  
```

Конфигурация:

```
[Definition]
# Сканеры и боты
failregex = ^<HOST> .* ".*sqlmap.*"
            ^<HOST> .* ".*nikto.*"
            ^<HOST> .* ".*nmap.*"
            ^<HOST> .* ".*masscan.*"
            ^<HOST> .* ".*gobuster.*"
            ^<HOST> .* ".*dirb.*"
            ^<HOST> .* ".*wpscan.*"
            ^<HOST> .* ".*acunetix.*"
            ^<HOST> .* ".*nessus.*"
            
            # Подозрительные User-Agent
            ^<HOST> .* ".*python-requests.*"
            ^<HOST> .* ".*wget.*"
            ^<HOST> .* ".*curl.*bot.*"
            ^<HOST> .* ".*scanner.*"
            
            # Попытки доступа к админу
            ^<HOST> .* "(GET|POST) /(admin|config|\.env|wp-admin).*" .* (404|403)

ignoreregex =
```

Перезагружаем Fail2Ban:

```
sudo fail2ban-client reload
```

Проверяем статус:

```
sudo fail2ban-client status
```

<p align="center"><img alt="fail2ban" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_06.png width=1024></p>

Здесь предупреждение говорит о том fail2ban будет использовать значение по умолчанию: 'auto', нас это устраивает.

### Настройка UFW

Настроим UFW. Разрешим прохождение трафика только по определенным портам:
> Замените в первой команде порт на Ваш ssh-порт управления сервером

```
sudo ufw allow 22
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

Перезагружаем и включаем ufw, проверяем его статус:

```
sudo ufw enable && sudo ufw reload  && sudo ufw status
```

<p align="center"><img alt="ufw" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_07.png width=1024></p>

Настройки reverse-proxy завершены. Переходим к бэкенду.

## Настройки  бэкенда Nextcloud

Настроим сервер как в нашей [статье про установку Nextcloud](https://github.com/HostVDS-com/tutorials/blob/main/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/ru.md).

Мы рекомендуем выполнить полную установку по этой статье, а потом просто внести изменения в конфигурацию следующих файлов:  
•	/var/www/nextcloud/config/config.php  
•	/etc/php/8.3/fpm/php.ini  
•	/etc/nginx/nginx.conf  
•	/etc/nginx/sites-available/nextcloud  
В таком случае Вы будете точно уверены, что с Вашим бэкендом изначально нет проблем.

### Конфигурация config.php

Начнем с config.php:

```
sudo nano /var/www/nextcloud/config/config.php
```

Вы увидите текущий конфиг:

<p align="center"><img alt="php.config" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_09.png width=1024></p>

Доработаем его до нужного варианта:
> Замените 46.8.71.133  на IP Вашего бэкенда 3 раза

> Замените 217.19.4.19 на IP Вашего прокси 3 раза

> Замените в директиве   'overwritecondaddr' => '^217\\.19\\.4\\.19$', данные на Ваш IP-адрес

```
  'trusted_domains' => [
    'localhost',
    'nextcloud.46.8.71.133 .sslip.io',
    '46.8.71.133 ',
    'nextcloud.217.19.4.19.sslip.io',
  ],
  'trusted_proxies' => [
    '217.19.4.19',
  ],
  'overwritehost' => 'nextcloud.217.19.4.19.sslip.io',
  'overwritecondaddr' => '^217\\.19\\.4\\.19$',
  'overwrite.cli.url' => 'https://nextcloud.46.8.71.133 .sslip.io',
  'overwriteprotocol' => 'https',
  'appstoreenabled' => true,
  'forwarded_for_headers' => ['HTTP_X_FORWARDED_FOR'],
```

<p align="center"><img alt="php.config_доработка" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_10.png width=1024></p>

Удаляем весь конфиг после директивы 'instanceid' (выделяем и нажимаем Ctrl+K):

<p align="center"><img alt="php.config_доработка" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_11.png width=1024></p>

Затем добавляем в файл перед закрывающей скобкой «);»:

```
  // Кэш и производительность
  'filelocking.enabled' => true,
  'filelocking.ttl' => 3600,
  'memcache.local' => '\\OC\\Memcache\\APCu',
  'memcache.locking' => '\\OC\\Memcache\\Redis',
  'memcache.distributed' => '\\OC\\Memcache\\Redis',
  'redis' => [
    'host' => '127.0.0.1',
    'port' => 6379,
    'timeout' => 3,
  ],
  'filesystem_check_changes' => 0,
  'part_file_in_storage' => false,

  // Превью и медиа
  'enabledPreviewProviders' => [
    'OC\\Preview\\PNG',
    'OC\\Preview\\JPEG',
    'OC\\Preview\\GIF',
    'OC\\Preview\\BMP',
    'OC\\Preview\\XBitmap',
    'OC\\Preview\\MP3',
    'OC\\Preview\\TXT',
    'OC\\Preview\\MarkDown',
  ],
  'jpeg_quality' => 80,
  'enable_previews' => true,
  'preview_max_x' => 2048,
  'preview_max_y' => 2048,
  'preview_max_scale_factor' => 1,

  // Расписание и обновления
  'maintenance_window_start' => 10800,
  'upgrade.disable-web' => true,
  'updater.release.channel' => 'stable',
  'has_internet_connection' => true,

  // Обслуживание
  'maintenance' => false,
  'check_for_working_htaccess' => true,
  'check_data_directory_permissions' => true,
  'config_is_read_only' => false,

  // Управление файлами и корзиной
  'trashbin_retention_obligation' => 'auto, 30',
  'versions_retention_obligation' => 'auto, 30',

  // Загрузка больших файлов
  'max_chunk_size' => 17179869184, // 16 ГБ
  'upload_max_filesize' => '16G',

  // Логирование
  'log_rotate_size' => 104857600,
  'logdateformat' => 'Y-m-d H:i:s',
  'log_type' => 'file',
  'logfile' => '/var/log/nextcloud/nextcloud.log',
  'loglevel' => 2,


  // Сессии и вход
  'session_lifetime' => 86400,
  'session_keepalive' => true,
  'remember_login_cookie_lifetime' => 2592000,
  'auto_logout' => false,

  //  Прочее / Скрытие информации
  'default_phone_region' => 'RU',
  'version_hide' => true,
  'force_ssl' => true,
```

<p align="center"><img alt="php.config_доработка" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_12.png width=1024></p>

Проверяем синтаксис:

```
sudo php -l /var/www/nextcloud/config/config.php
```

Сохраняем, выходим и перезапускаем:

```
sudo systemctl restart php8.3-fpm
```

Проверим статус:

```
sudo systemctl status php8.3-fpm
```

<p align="center"><img alt="статус php" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_13.png width=1024></p>

### Конфигурация php.ini

Внесем изменения в php.ini:

```
sudo nano /etc/php/8.3/fpm/php.ini
```

Измените строку upload_max_filesize = 2M:

```
upload_max_filesize = 16G
```

Добавьте строку:

```
post_max_size = 16G
```

Это необходимо для загрузки больших файлов на сервер.

<p align="center"><img alt="php.ini" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_14.png width=1024></p>

### Конфигурация Nginx

Переходим к настройке Nginx.
Напомним исходные данные:  
Бэкенд-сервер: nextcloud.46.8.71.133 .sslip.io  
Прокси: nextcloud.217.19.4.19.sslip.io  
Открываем файл:

```
sudo nano /etc/nginx/nginx.conf
```

Добавим глобальное определение формата логов, чтобы сделать их более информативными. Мы будем получать максимально подробные логи о каждом запросе, с указанием реального IP клиента (даже за прокси), всех ключевых заголовков. 
Добавляем директивы в блок http { … }:

```    
    log_format nextcloud_backend_extended '$remote_addr - $remote_user [$time_local] "$request" '
        '$status $body_bytes_sent "$http_referer" '
        '"$http_user_agent" "$http_x_forwarded_for" '
        'real_ip: $realip_remote_addr scheme: $real_scheme '
        'host: $http_host forwarded_host: $http_x_forwarded_host '
        'request_time=$request_time '
        'upstream_response_time=$upstream_response_time '
        'php_status="$upstream_status" '
        'request_length=$request_length '
        'bytes_sent=$bytes_sent '
        'gzip_ratio=$gzip_ratio';
```

<p align="center"><img alt="nginx.conf" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_15.png width=1024></p>

Удаляем старый и создаем новый конфигурационный файл:
> Вам необходимо заменить IP 46.8.71.133  на Ваш адрес бэкенда 6 раз

> Вам необходимо заменить IP 217.19.4.19 на Ваш адрес прокси 3 раза

```
sudo rm /etc/nginx/sites-available/nextcloud && sudo nano /etc/nginx/sites-available/nextcloud
```

Конфигурация:

```
# PHP-FPM UPSTREAM
upstream php-handler {
    server unix:/run/php/php8.3-fpm.sock;
    keepalive 16;
}

# ОПРЕДЕЛЕНИЕ РЕАЛЬНОГО ПРОТОКОЛА
map $http_x_forwarded_proto $real_scheme {
    default $scheme;
    https https;
}

map $http_x_forwarded_proto $https_status {
    default "";
    https on;
}

# СЕРВЕР HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name nextcloud.46.8.71.133 .sslip.io;

    # SSL КОНФИГУРАЦИЯ
    ssl_certificate /etc/letsencrypt/live/nextcloud.46.8.71.133 .sslip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nextcloud.46.8.71.133 .sslip.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
   ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/nextcloud.46.8.71.133 .sslip.io/chain.pem;

    # НАСТРОЙКА ДОВЕРЕННОГО ПРОКСИ
    set_real_ip_from 217.19.4.19;
    real_ip_header X-Forwarded-For;
    real_ip_recursive on;

    # КОРНЕВАЯ ДИРЕКТОРИЯ
    root /var/www/nextcloud;
    index index.php index.html /index.php$request_uri;

    # БЕЗОПАСНЫЕ ЗАГОЛОВКИ
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Robots-Tag "noindex,nofollow" always;
    add_header X-Download-Options noopen always;
    add_header X-Permitted-Cross-Domain-Policies none always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=15552000; includeSubDomains" always;

    # ЗАГОЛОВКИ ДЛЯ ОПТИМИЗАЦИИ КЭШИРОВАНИЯ НА ПРОКСИ
    add_header X-Backend-Server "nextcloud-backend-46.8.71.133 " always;
    add_header X-Backend-Version "31.0.6.2" always;

   # ЛОГИ
    access_log /var/log/nginx/nextcloud_backend.log nextcloud_backend_extended;
    error_log /var/log/nginx/nextcloud_backend_error.log warn;

    # БЛОКИРОВКА СКАНЕРОВ
    if ($http_user_agent ~* "(masscan|nmap|sqlmap|nikto|acunetix|nessus|wpscan|gobuster|dirb|dirbuster|wget|curl|bot|python-requests|scanner)") {
    return 444;
    }

    # БЛОКИРОВКА ПОДОЗРИТЕЛЬНЫХ ЗАПРОСОВ
    if ($request_uri ~* (wp-admin|wp-content|\.env|config\.php|phpinfo|phpmyadmin)) {
        return 444;
    }
    # РАЗРЕШЕННЫЕ HTTP МЕТОДЫ
    if ($request_method !~ ^(GET|POST|HEAD|PROPFIND|OPTIONS|PUT|DELETE|MKCOL|MOVE|COPY|PROPPATCH|REPORT)$) {
        return 444;
    }

    # РАЗМЕРЫ ФАЙЛОВ
    client_max_body_size 16G;
    client_body_timeout 300s;
    client_body_buffer_size 1M;
    client_header_buffer_size 8k;
    large_client_header_buffers 4 8k;

    # ОПТИМИЗИРОВАННЫЕ FASTCGI БУФЕРЫ
    fastcgi_buffers 128 4K;
    fastcgi_buffer_size 16K;
    fastcgi_busy_buffers_size 32K;

    # БУФЕРИЗАЦИЯ ДЛЯ БОЛЬШИХ ОТВЕТОВ
    fastcgi_temp_file_write_size 32K;
    fastcgi_max_temp_file_size 256M;

    # GZIP СЖАТИЕ
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_types
        application/atom+xml
        application/javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rss+xml
        application/vnd.geo+json
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-web-app-manifest+json
        application/xhtml+xml
        application/xml
        font/opentype
        image/bmp
        image/svg+xml
        image/x-icon
        text/cache-manifest
        text/css
        text/plain
        text/vcard
        text/vnd.rim.location.xloc
        text/vtt
        text/x-component
        text/x-cross-domain-policy;

    # ГЛАВНЫЙ LOCATION
    location / {
        if ($http_user_agent ~ ^DavClnt) {
            return 302 /remote.php/webdav/$is_args$args;
        }
        try_files $uri $uri/ /index.php$request_uri;
    }

    # ЗАПРЕТ ДОСТУПА К СИСТЕМНЫМ ДИРЕКТОРИЯМ
    location ~ ^/(?:build|tests|config|lib|3rdparty|templates|data)(?:$|/) {
        return 404;
    }

    location ~ ^/(?:\.|autotest|occ|issue|indie|db_|console) {
        return 404;
    }

    # .WELL-KNOWN ENDPOINTS
    location ^~ /.well-known {
        location = /.well-known/carddav { return 301 /remote.php/dav/; }
        location = /.well-known/caldav { return 301 /remote.php/dav/; }
        location = /.well-known/webfinger { return 301 /index.php/.well-known/webfinger; }
        location = /.well-known/nodeinfo { return 301 /index.php/.well-known/nodeinfo; }
        location = /.well-known/acme-challenge { try_files $uri $uri/ =404; }
        location = /.well-known/pki-validation { try_files $uri $uri/ =404; }
        return 301 /remote.php/webdav/;
    }

    # NEXTCLOUD APPS PROVIDER
    location ~ ^/oc[ms]-provider/? {
        try_files $uri $uri/ /index.php$request_uri;
    }

    # UPDATER
    location ~ ^/updater(?:$|/) {
        try_files $uri/ =404;
        index index.php;
    }

    # МОНИТОРИНГ И МЕТРИКИ
    location = /backend-status {
        access_log off;
        allow 217.19.4.19;
        allow 127.0.0.1;
        deny all;

    }

    # ПРОВЕРКА ДОСТУПНОСТИ СЕРВЕРА
    location = /backend-health {
        access_log off;
        allow 217.19.4.19;
        allow 127.0.0.1;
        deny all;

        # ПРОСТАЯ ПРОВЕРКА ДОСТУПНОСТИ
        return 200;
        add_header Content-Type text/plain;
        add_header X-Backend-Time $msec;
    }

    # ОСНОВНЫЕ PHP ENTRY POINTS
    location ~ ^/(?:index|remote|public|cron|core/ajax/update|status|ocs/v[12]|updater/.+|oc[ms]-provider)(?:$|/) {
        fastcgi_split_path_info ^(.+?\.php)(/.*)$;
        set $path_info $fastcgi_path_info;
        try_files $fastcgi_script_name =404;

        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $path_info;

        # ПРАВИЛЬНАЯ ПЕРЕДАЧА ПРОТОКОЛА И ХОСТА
        fastcgi_param HTTPS $https_status;
        fastcgi_param SERVER_PROTOCOL $server_protocol;
        fastcgi_param REQUEST_SCHEME $real_scheme;
        fastcgi_param HTTP_HOST $http_x_forwarded_host;
        fastcgi_param SERVER_NAME $http_x_forwarded_host;

        # СПЕЦИФИЧНЫЕ ПАРАМЕТРЫ NEXTCLOUD
        fastcgi_param modHeadersAvailable true;
        fastcgi_param front_controller_active true;

        # ПРОБРОС ЗАГОЛОВКОВ ОТ ПРОКСИ
        fastcgi_param HTTP_X_FORWARDED_FOR $http_x_forwarded_for;
        fastcgi_param HTTP_X_FORWARDED_PROTO $http_x_forwarded_proto;
        fastcgi_param HTTP_X_FORWARDED_HOST $http_x_forwarded_host;
        fastcgi_param HTTP_X_FORWARDED_PORT $http_x_forwarded_port;
        fastcgi_param HTTP_X_REAL_IP $http_x_real_ip;

        fastcgi_pass php-handler;
        fastcgi_intercept_errors on;
        fastcgi_request_buffering off;

        # ОПТИМИЗИРОВАННЫЕ ТАЙМАУТЫ С ЛОГИКОЙ
        fastcgi_read_timeout 3600s;
        fastcgi_send_timeout 3600;
        fastcgi_connect_timeout 60;

        # ВКЛЮЧЕНИЕ БУФЕРИЗАЦИИ ДЛЯ НЕБОЛЬШИХ ОТВЕТОВ
        fastcgi_buffering on;
        fastcgi_buffer_size 16K;
        fastcgi_buffers 128 4K;

        # ЗАГОЛОВКИ ДЛЯ СТАТИЧНОГО КОНТЕНТА
        if ($request_uri ~ "\.(css|js|woff2?|png|jpg|gif|svg)$") {
            expires 7d;
            add_header Cache-Control "public, max-age=604800";
        }

        # ETAG ПОДДЕРЖКА
        etag on;
    }

    # ОСТАЛЬНЫЕ PHP ФАЙЛЫ
    location ~ \.php(?:$|/) {
        fastcgi_split_path_info ^(.+?\.php)(/.*)$;
        set $path_info $fastcgi_path_info;
        try_files $fastcgi_script_name =404;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $path_info;
        fastcgi_param HTTPS $https_status;
        fastcgi_param SERVER_PROTOCOL $server_protocol;
        fastcgi_param REQUEST_SCHEME $real_scheme;
        fastcgi_param HTTP_HOST $http_x_forwarded_host;
        fastcgi_param SERVER_NAME $http_x_forwarded_host;
        fastcgi_param modHeadersAvailable true;
        fastcgi_param front_controller_active true;
        fastcgi_param HTTP_X_FORWARDED_FOR $http_x_forwarded_for;
        fastcgi_param HTTP_X_FORWARDED_PROTO $http_x_forwarded_proto;
        fastcgi_param HTTP_X_FORWARDED_HOST $http_x_forwarded_host;
        fastcgi_param HTTP_X_FORWARDED_PORT $http_x_forwarded_port;
        fastcgi_param HTTP_X_REAL_IP $http_x_real_ip;

        fastcgi_pass php-handler;
        fastcgi_intercept_errors on;
        fastcgi_request_buffering off;
        fastcgi_read_timeout 3600;
        fastcgi_send_timeout 3600;
        fastcgi_connect_timeout 60;

        # ВКЛЮЧЕНИЕ БУФЕРИЗАЦИИ
        fastcgi_buffering on;
        fastcgi_buffer_size 16K;
        fastcgi_buffers 128 4K;

        etag on;
    }

    # КЭШИРУЕМАЯ СТАТИКА
    location ~ \.(css|js|svg|gif|png|jpg|jpeg|ico|wasm|map|ogg|flac)$ {
        try_files $uri /index.php$request_uri;

        # АГРЕССИВНОЕ КЭШИРОВАНИЕ
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        add_header Vary "Accept-Encoding";

        # ETAG ДЛЯ УСЛОВНЫХ ЗАПРОСОВ
        etag on;

        access_log off;

        location ~ \.wasm$ {
            default_type application/wasm;
            expires 30d;
            add_header Cache-Control "public, max-age=2592000, immutable";
        }
    }

    # ОПТИМИЗИРОВАННЫЕ ШРИФТЫ 
    location ~ \.woff2?$ {
        try_files $uri /index.php$request_uri;

        # ДОЛГОЕ КЭШИРОВАНИЕ ШРИФТОВ
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin *;
        add_header Vary "Accept-Encoding";

        etag on;
        access_log off;
    }

}

# HTTP → HTTPS РЕДИРЕКТ
server {
    listen 80;
    listen [::]:80;
    server_name nextcloud.46.8.71.133 .sslip.io;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        try_files $uri $uri/ =404;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

Сохраняем файл и выходим из него.  
Обязательно проверяем корректность настроенных прав.  
Задаем владельца/группу:

```
sudo chown -R www-data:www-data /var/www/nextcloud/config
```

Выставляем безопасные права:

```
sudo find /var/www/nextcloud/config -type d -exec chmod 755 {} \;
sudo chmod 640 /var/www/nextcloud/config/config.php
```

Создадим директорию для ACME:

```
sudo mkdir -p /var/www/letsencrypt
sudo chown www-data:www-data /var/www/letsencrypt
```

Проверим синтаксис и перезапустим Nginx:

```
sudo nginx -t && sudo systemctl reload nginx
```

<p align="center"><img alt="nginx test is successful" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_16.png width=1024></p>

Перезагрузим дополнительно:

```
sudo systemctl restart php8.3-fpm
```

## Проверка настроенной системы

Заходим на наш Nextcloud по адресу прокси:

```
nextcloud.217.19.4.19.sslip.io
```

<p align="center"><img alt="проверка nextcloud" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_17.png width=1024></p>

Заходим в раздел «Параметры сервера»:

<p align="center"><img alt="Параметры сервера" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_18.png width=1024></p>

Проверяем, что сервер настроен корректно. Выполним проверку безопасности сервера от Nextcloud:

<p align="center"><img alt="проверка параметров nextcloud" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_19.png width=1024></p>

Вводим адрес нашего прокси-сервера:

<p align="center"><img alt="проверка защищенности от nextcloud" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_20.png width=1024></p>

Результат:

<p align="center"><img alt="А+ от nextcloud" src=/topics/installing-the-server-software/nginx-as-a-reverse-proxy-server/static/ru_image_21.png width=1024></p>

## Краткие итоги

Мы настроили два сервера: reverse-proxy Nginx и backend Nextcloud. В нашей схеме внешний сервер занимается безопасностью и производительностью, а внутренний работает только с приложением. Таким образом мы защитили свой реальный сервер от угроз из сети, спрятав его за прокси. По результатам настройки была получена категория безопасности сервера А+ от Nextcloud.



