# Как установить Nextcloud на Ubuntu 24.04

## Создание сервера

Создадим сервер на [HostVDS](https://hostvds.com/control/servers/new). 
> Выбирайте сервер исходя из Ваших требований к системе.

В качестве примера мы выбрали Highload сервер c 16 Гб оперативной памяти и 4 CPU для Nextcloud:
<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_01.png width=1024></p>
Образ Ubuntu 24.04:
<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_02.png width=1024></p>
После создания сервера и подключения к нему по SSH приступаем к подготовке системы.

## Подготовка системы

Обновим систему до последних версий пакетов:

```
sudo apt update && sudo apt upgrade -y
```

Установим Nginx, MySQL, PHP и необходимые расширения:

```
sudo apt install -y ufw nginx mysql-server php8.3-{fpm,mysql,xml,gd,curl,mbstring,zip,bcmath,intl,imagick,gmp} redis-server php-{redis,apcu} bzip2 librsvg2-{bin,common} libmagickcore-6.q16-6-extra imagemagick-6.q16hdri
```

где  

• php8.3-fpm — PHP-FPM для работы с Nginx;  
• php8.3-mysql — модуль для подключения к MySQL;  
• bzip2 – пакет для распаковки архивов .tar.bz2;  
• imagemagick —пакет для работы с изображениями;  
• librsvg2 — пакет для поддержки SVG-графики;  
• ufw — инструмент настройки firewall;  
• остальные расширения являются модулями Nextcloud.  

Настроим ufw:
> Замените в первой команде порт на Ваш ssh-порт управления сервером

```
sudo ufw allow 52222
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

Перезагружаем и включаем ufw, проверяем его статус:

```
sudo ufw enable && sudo ufw reload  && sudo ufw status
```

Результат:
<p align="center"><img alt="статус ufw" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_03.png width=1024></p>

Включаем и перезапускаем службы:

```
sudo systemctl enable --now nginx mysql php8.3-fpm redis-server
```

## Установка и настройка базы данных

Мы подробно рассказывали про настройку mySQL в [этой статье](https://github.com/HostVDS-com/tutorials/blob/main/topics/databases/how-to-install-mysql-on-ubuntu-server/ru.md). 
Остановимся только на моментах защиты СУБД:

```
sudo mysql_secure_installation
```

Установим уровень 2 для максимальной сложности вводимых паролей.  
Далее предлагаем согласиться (нажать Y) со всеми пунктами:  
• Remove anonymous users (Удалить анонимных пользователей)  
• Disallow root login remotely (Запретить удаленный вход пользователя root)  
• Remove the test database (Удалить тестовую базу данных)  
• Reload privilege tables (Перезагрузить таблицы привилегий)  
Переходим в mySQL:

```
sudo mysql
```

Создадим базу данных **nextcloud** и пользователя для неё **ncuser**. 
> Замените nextcloud и ncuser на Ваши значения


Мы явно задаем CHARACTER SET utf8mb4 и COLLATE utf8mb4_general_ci для поддержки расширенного набора символов UTF-8 (включая эмодзи):

```
CREATE DATABASE nextcloud CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

Создаем нового пользователя базы данных ncuser, указываем ему пароль ~MysqlU24. Этот пользователь будет использоваться Nextcloud для подключения к базе.

```
CREATE USER 'ncuser'@'localhost' IDENTIFIED BY '~MysqlU24';
```

Задаем полный доступ пользователю ncuser на все таблицы базы nextcloud. Nextcloud во время установки самостоятельно создаст необходимые таблицы в этой базе.

```
GRANT ALL PRIVILEGES ON nextcloud.* TO 'ncuser'@'localhost';
```

Обновим кеш привилегий MySQL:

```
FLUSH PRIVILEGES;
```

Проверяем, что база данных создана:

```
SHOW DATABASES;
```

Выходим из базы данных:

```
Exit;
```

Результат на скриншоте:

<p align="center"><img alt="настройка MySQL" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_04.png width=1024></p>

База данных настроена. Переходим к Nginx.

## Настройка Nginx

Для получения доменного имени воспользуемся сервисом [Sslip.io](https://Sslip.io).  
Сервис автоматически присваивает доменное имя серверу по IP-адресу.  Вы должны придумать имя для своего Nextcloud и вставить его до IP-адреса. После IP-адреса указываем sslip.io.  
Мой IP-адрес 217.60.36.214, значит доменное имя будет таким:  

**nextcloud.217.60.36.214.sslip.io**

Мы будем использовать этот домен для Nextcloud.  
Теперь выполним базовую настройку nginx.  
Настроим первоначальный конфиг для работы по 80 порту HTTP, чтобы можно было получить сертификат от Let’s Encrypt.  
Создаем файл:

```
sudo nano /etc/nginx/sites-available/nextcloud
```

Вставляем в него конфигурацию.
> Замените в конфигурации доменное имя nextcloud.217.60.36.214.sslip.io на свое 

```
server {
    listen 80;
    server_name nextcloud.217.60.36.214.sslip.io;

    root /var/www/nextcloud; # сюда будем устанавливать Nextcloud

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Сохраняем файл CTRL+O, выходим CTRL+X.  
Настроим логи на подозрительные запросы:

```
sudo sed -i '/http {/a\
    map $status $suspicious {\n        ~^[23] 0;\n        default 1;\n    }\
' /etc/nginx/nginx.conf
```

Отключим отображение версии nginx в HTTP-заголовках и на стандартных страницах ошибок

```
sudo sed -i '/http {/a\    server_tokens off;' /etc/nginx/nginx.conf
```

Зададим ограничение на одновременные соединения и на частоту запросов:

```
sudo sed -i '/http {/a\
    limit_conn_zone $binary_remote_addr zone=perip:10m;\
    limit_req_zone $binary_remote_addr zone=global:10m rate=20r/s;\
' /etc/nginx/nginx.conf
```

Настроим веб-сервер для обслуживания файлов .mjs с типом MIME text/javascript или application/javascript. Дополнительно сразу настроим обслуживание шрифтов .otf:

```
sudo nano /etc/nginx/mime.types
```

Изменим  строку: 
application/javascript  js;
на:

```
application/javascript  js mjs;
```

Добавим строку:

```
font/otf  otf;
```

<p align="center"><img alt="конфигурация /etc/nginx/mime.types" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_05.png width=1024></p>

Удаляем дефолтный конфиг nginx:

```
sudo rm /etc/nginx/sites-enabled/default
```

Включаем сайт:

```
sudo ln -s /etc/nginx/sites-available/nextcloud /etc/nginx/sites-enabled/
```

```
sudo nginx -t && sudo systemctl reload nginx
```

Вы должны увидеть ответ:  
_nginx: the configuration file /etc/nginx/nginx.conf syntax is ok  
nginx: configuration file /etc/nginx/nginx.conf test is successful_

<p align="center"><img alt="nginx: test is successful" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_06.png width=1024></p>

## Загрузка и установка Nextcloud

Скачаем образ Nextcloud и файл SHA256-хеша для проверки целостности с официального сайта. Используем ссылку latest.tar.bz2, которая всегда указывает на последнюю стабильную версию Nextcloud:

```
cd /var/www
```

```
sudo wget -4 https://download.nextcloud.com/server/releases/latest.tar.bz2
```

```
sudo wget -4  https://download.nextcloud.com/server/releases/latest.tar.bz2.sha256
```

Проверим целостность скачанного архива:

```
sha256sum -c latest.tar.bz2.sha256
```

Если файл не поврежден, Вы получите сообщение **OK**.
Распаковываем архив:

```
sudo tar -xjf latest.tar.bz2
```

Удалим архив и контрольную сумму:

```
sudo rm latest.tar.bz2 latest.tar.bz2.sha256
```

<p align="center"><img alt="скачивание nextcloud" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_07.png width=1024></p>

## Настройка директорий, прав и параметров PHP

Назначим нужные права на файлы:

```
sudo chown -R www-data:www-data /var/www/nextcloud && sudo find /var/www/nextcloud -type d -exec chmod 755 {} \; && sudo find /var/www/nextcloud -type f -exec chmod 644 {} \; && sudo chmod +x /var/www/nextcloud/occ
```

Создадим директорию для данных, чтобы файлы пользователей не были доступны через веб-браузер:

```
sudo mkdir -p /var/nextcloud-data && sudo chown www-data:www-data /var/nextcloud-data && sudo chmod 750 /var/nextcloud-data
```

Создаем директорию для логов:

```
sudo mkdir -p /var/log/nextcloud && sudo chown www-data:www-data /var/log/nextcloud && sudo chmod 755 /var/log/nextcloud
```

Отредактируем параметры php.ini.  
Создадим директорию для логов:

```
sudo mkdir -p /var/log/php && sudo chown www-data:www-data /var/log/php && sudo chmod 755 /var/log/php
```

Создаем резервную копию

```
sudo cp /etc/php/8.3/fpm/pool.d/www.conf /etc/php/8.3/fpm/pool.d/www.conf.backup
```

Выполним все изменения php одной командой:

```
sudo sed -i \
-e 's/^pm = .*/pm = dynamic/' \
-e 's/^pm.max_children = .*/pm.max_children = 50/' \
-e 's/^pm.start_servers = .*/pm.start_servers = 12/' \
-e 's/^pm.min_spare_servers = .*/pm.min_spare_servers = 6/' \
-e 's/^pm.max_spare_servers = .*/pm.max_spare_servers = 18/' \
-e 's/^;pm.max_requests = .*/pm.max_requests = 1000/' \
-e 's/^pm.max_requests = .*/pm.max_requests = 1000/' \
-e 's/^;request_terminate_timeout = .*/request_terminate_timeout = 3600/' \
-e 's/^request_terminate_timeout = .*/request_terminate_timeout = 3600/' \
-e 's/^;request_slowlog_timeout = .*/request_slowlog_timeout = 10s/' \
-e 's/^request_slowlog_timeout = .*/request_slowlog_timeout = 10s/' \
-e 's/^;slowlog = .*/slowlog = \/var\/log\/php\/fpm-slow.log/' \
-e 's/^slowlog = .*/slowlog = \/var\/log\/php\/fpm-slow.log/' \
-e 's/^;*env\[PATH\].*/env[PATH] = \/usr\/local\/sbin:\/usr\/local\/bin:\/usr\/sbin:\/usr\/bin:\/sbin:\/bin/' \
/etc/php/8.3/fpm/pool.d/www.conf && sudo sed -i \
-e 's/^;opcache.interned_strings_buffer=8/opcache.interned_strings_buffer=16/' \
-e 's/^memory_limit = .*/memory_limit = 1024M/' \
-e 's/^;memory_limit = .*/memory_limit = 1024M/' \
/etc/php/8.3/fpm/php.ini
```

Добавим переменные окружения

```
cat << 'EOF' | sudo tee -a /etc/php/8.3/fpm/pool.d/www.conf

; Environment variables
env[HOSTNAME] = $HOSTNAME
env[PATH] = /usr/local/bin:/usr/bin:/bin
env[TMP] = /tmp
env[TMPDIR] = /tmp
env[TEMP] = /tmp
EOF
```

Проверим синтаксис:

```
sudo php-fpm8.3 -t
```

<p align="center"><img alt="настройка php" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_08.png width=1024></p>

Перезапустим PHP-FPM:

```
sudo systemctl restart php8.3-fpm
```

Проверим статус:

```
sudo systemctl status php8.3-fpm
```

<p align="center"><img alt="php статус" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_09.png width=1024></p>

## Установка Nextcloud через CLI

Установим Nextcloud через командную строку.
> Замените в команде:

> nextcloud – на имя своей базы данных


> ncuser – на имя своего пользователя БД

> ~MysqlU24 – на свой пароль к БД

> jetcry_admin – укажите Ваш логин админа на сервере Nextcloud

> jetcry – укажите свой пароль для админа сервера

```
sudo -u www-data php /var/www/nextcloud/occ maintenance:install \
  --database "mysql" \
  --database-name "nextcloud" \
  --database-user "ncuser" \
  --database-pass "~MysqlU24" \
  --database-host "localhost" \
  --admin-user "jetcry_admin" \
  --admin-pass "jetcry" \
  --data-dir "/var/nextcloud-data"
```

<p align="center"><img alt="установка nextcloud через cli" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_10.png width=1024></p>

## Оптимизация производительности

Nextcloud по умолчанию защищён от атак подделки запросов (CSRF) и DNS rebinding. Он принимает соединения только с явно указанных доменов и IP-адресов.  
Выполним необходимые настройки конфигурации, добавив оптимизацию кеширования с помощью APCu и Redis.  
APCu (Alternative PHP Cache User) — это встроенный в PHP кэш, работающий локально в оперативной памяти каждого процесса PHP. Он очень быстр и используется для хранения временных данных (например, конфигураций, маршрутов, промежуточных вычислений), что позволяет ускорить работу Nextcloud и снизить нагрузку на базу данных. Параметр memcache.local в конфигурации Nextcloud использует именно APCu.  
Redis — отдельный сервер кэширования (in-memory database), который может работать по сети или через сокет. Он используется для распределённого кеша и механизма блокировок между PHP-процессами. В параметрах memcache.locking и memcache.distributed указывается Redis, чтобы обеспечить корректную работу совместного доступа к файлам и ускорить выполнение операций в многопользовательском режиме.  
Откроем файл:

```
sudo nano /var/www/nextcloud/config/config.php
```

В конфигурации меняем  
_'trusted_domains' =>  
array (  
  0 => 'localhost',  
),_  
На:

> Замените nextcloud.217.60.36.214.sslip.io на Ваше доменное имя

> Замените 217.60.36.214 на Ваш IP-адрес

```
'trusted_domains' =>
array (
  0 => 'localhost',
  1 => 'nextcloud.217.60.36.214.sslip.io',
  2 => '217.60.36.214',
),
```

Добавляем весь этот блок перед закрывающей скобкой );

> Замените nextcloud.217.60.36.214.sslip.io на Ваше доменное имя

```
  'appstoreenabled' => true,
  'overwriteprotocol' => 'https',
  'overwrite.cli.url' => 'https://nextcloud.217.60.36.214.sslip.io',

// Оптимизация превью
  'enabledPreviewProviders' =>
  array (
    0 => 'OC\\Preview\\PNG',
    1 => 'OC\\Preview\\JPEG',
    2 => 'OC\\Preview\\GIF',
    3 => 'OC\\Preview\\BMP',
    4 => 'OC\\Preview\\XBitmap',
    5 => 'OC\\Preview\\MP3',
    6 => 'OC\\Preview\\TXT',
    7 => 'OC\\Preview\\MarkDown',
  ),

  // Кеширование
  'filelocking.enabled' => true,
  'filelocking.ttl' => 3600,
  'memcache.local' => '\\OC\\Memcache\\APCu',
  'memcache.locking' => '\\OC\\Memcache\\Redis',
  'memcache.distributed' => '\\OC\\Memcache\\Redis',
  'redis' =>
  array (
    'host' => '127.0.0.1',
    'port' => 6379,
    'timeout' => 3,
  ),

  // Настройки производительности
  'default_phone_region' => 'RU',
  'maintenance_window_start' => 10800,
  'upgrade.disable-web' => true,
  'maintenance' => false,
  'trashbin_retention_obligation' => 'auto, 30',
  'versions_retention_obligation' => 'auto, 30',
  'max_chunk_size' => 1073741824,
  'max_input_time' => 3600,
  
  // Безопасность
  'htaccess.RewriteBase' => '/',
  'check_for_working_htaccess' => true,
  'force_ssl' => true,

  // Логирование
  'log_type' => 'file',
  'logfile' => '/var/log/nextcloud/nextcloud.log',
  'loglevel' => 2,
  'log_rotate_size' => 104857600,

  // Дополнительные настройки производительности
  'jpeg_quality' => 60,
  'enable_previews' => true,
  'preview_max_x' => 1024,
  'preview_max_y' => 768,
  'preview_max_scale_factor' => 1,

  // Настройки файловой системы
  'filesystem_check_changes' => 0,
  'part_file_in_storage' => false,

  // Отключение уведомлений об обновлениях
  'updater.release.channel' => 'stable',
  'has_internet_connection' => true,
  'version_hide' => true,

  // Настройки сессий
  'session_lifetime' => 86400,
  'session_keepalive' => true,
  'auto_logout' => false,
  'check_data_directory_permissions' => true,
  'config_is_read_only' => false,
```

Выглядеть должно вот так:

<p align="center"><img alt="установка nextcloud через cli" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_11.png width=1024></p>

<p align="center"><img alt="установка nextcloud через cli" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_12.png width=1024></p>

Настраиваем корректные права, ограничим доступ к файлу с паролями базы данных:

```
sudo chown www-data:www-data /var/www/nextcloud/config/config.php && sudo chmod 640 /var/www/nextcloud/config/config.php
```

## Получение SSL-сертификата Let's Encrypt

Устанавливаем certbot:

```
sudo apt install certbot python3-certbot-nginx -y
```

Создаем сертификат для нашего Nextcloud:

> Замените nextcloud.217.60.36.214.sslip.io на Ваше доменное имя

```
sudo certbot --nginx -d nextcloud.217.60.36.214.sslip.io
```

Certbot задаст Вам несколько вопросов и автоматически сконфигурирует сертификат.

<p align="center"><img alt="установка nextcloud через cli" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_13.png width=1024></p>

Сертификат получен, выполним дополнительные настройки для работы Nextcloud по HTTPS.

## Настройка Nginx для Nextcloud через HTTPS

Удалим старый конфиг и создадим новый.

```
sudo rm /etc/nginx/sites-available/nextcloud && sudo nano /etc/nginx/sites-available/nextcloud
```

Вставляем новую конфигурацию:

> Вам нужно 4 раза заменить nextcloud.217.60.36.214.sslip.io на имя своего сервера

```
upstream php-handler {
    server unix:/run/php/php8.3-fpm.sock;
}

map $arg_v $asset_immutable {
    "" "";
    default "immutable";
}


server {
    server_name nextcloud.217.60.36.214.sslip.io;

    root /var/www/nextcloud; # путь до Nextcloud
    index index.php index.html /index.php$request_uri;
                                                                                                                                                                                                                 
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    ssl_certificate /etc/letsencrypt/live/nextcloud.217.60.36.214.sslip.io/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/nextcloud.217.60.36.214.sslip.io/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

    # Защита от DoS и перегрузки
    limit_conn perip 30;
    limit_req zone=global burst=40 nodelay;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Robots-Tag "noindex, nofollow" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header X-Permitted-Cross-Domain-Policies "none" always;
    add_header X-Download-Options "noopen" always;

   access_log /var/log/nginx/nextcloud_access.log combined if=$suspicious;
    error_log /var/log/nginx/nextcloud_error.log warn;
# Блокировка вредоносных ботов
    if ($http_user_agent ~* "masscan|nmap|sqlmap|nikto|acunetix|nessus|wpscan") {
        return 444;
    }
# Блокировка ненужных HTTP-методов
    if ($request_method !~ ^(GET|POST|HEAD|PROPFIND|OPTIONS|PUT|DELETE)$ ) {
        return 444;
    }



    client_max_body_size 10G;
    client_body_timeout 300s;
    client_body_buffer_size 128k;
    fastcgi_buffers 64 4K;

    gzip on;
    gzip_vary on;
    gzip_comp_level 4;
    gzip_min_length 256;
    gzip_proxied expired no-cache no-store private no_last_modified no_etag auth;
gzip_types application/atom+xml application/javascript application/json application/ld+json application/manifest+json application/rss+xml application/vnd.geo+json application/vnd.ms-fontobject application/x-font-ttf application/x-web-app-manifest+json application/xhtml+xml application/xml font/opentype image/bmp image/svg+xml image/x-icon text/cache-manifest text/css text/plain text/vcard text/vnd.rim.location.xloc text/vtt text/x-component text/x-cross-domain-policy; 
    # Перенаправление WebDAV-клиентов на endpoint WebDAV
    location = / {
        if ( $http_user_agent ~ ^DavClnt ) {
            return 302 /remote.php/webdav/$is_args$args;
        }
    }

    # Запрет доступа к скрытым служебным файлам и директориям
    location ~ ^/(?:build|tests|config|lib|3rdparty|templates|data)(?:$|/)  { return 404; }
    location ~ ^/(?:\.|autotest|occ|issue|indie|db_|console)                { return 404; }

    # Well-known URLs
    location ^~ /.well-known {
        location = /.well-known/carddav     { return 301 /remote.php/dav/; }
        location = /.well-known/caldav      { return 301 /remote.php/dav/; }
        location = /.well-known/webfinger   { return 301 /index.php/.well-known/webfinger; }
        location = /.well-known/nodeinfo    { return 301 /index.php/.well-known/nodeinfo; }
        location = /.well-known/acme-challenge    { try_files $uri $uri/ =404; }
        location = /.well-known/pki-validation    { try_files $uri $uri/ =404; }
        return 301 /remote.php/webdav/;
    }

    # OCM и OCS провайдеры
    location ~ ^/oc[ms]-provider/? {
        try_files $uri $uri/ /index.php$request_uri;
    }

    # Доступ к интерфейсу обновления Nextcloud
    location ~ ^/updater(?:$|/) {
        try_files $uri/ =404;
        index index.php;
    }

    # Основные обработчики PHP-скриптов (API, cron, публичный доступ, обновление и провайдеры)
    location ~ ^/(?:index|remote|public|cron|core/ajax/update|status|ocs/v[12]|updater/.+|oc[ms]-provider/.+)\.php(?:$|/) {
        fastcgi_split_path_info ^(.+?\.php)(/.*)$;
        set $path_info $fastcgi_path_info;
        try_files $fastcgi_script_name =404;

        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $path_info;
        fastcgi_param HTTPS on;
        fastcgi_param modHeadersAvailable true;
        fastcgi_param front_controller_active true;
        fastcgi_pass php-handler;

        fastcgi_intercept_errors on;
        fastcgi_request_buffering off;
        fastcgi_max_temp_file_size 0;
        fastcgi_read_timeout 600;
        fastcgi_send_timeout 600;
        fastcgi_connect_timeout 600;
    }

    # Универсальный обработчик PHP 
    location ~ \.php(?:$|/) {
        rewrite ^/(?!index|remote|public|cron|core/ajax/update|status|ocs/v[12]|updater/.+|oc[ms]-provider/.+|\.well-known/.*) /index.php$request_uri;

        fastcgi_split_path_info ^(.+?\.php)(/.*)$;
        set $path_info $fastcgi_path_info;
        try_files $fastcgi_script_name =404;

        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $path_info;
        fastcgi_param HTTPS on;
        fastcgi_param modHeadersAvailable true;
        fastcgi_param front_controller_active true;
        fastcgi_pass php-handler;

        fastcgi_intercept_errors on;
        fastcgi_request_buffering off;
        fastcgi_max_temp_file_size 0;
        fastcgi_read_timeout 600;
        fastcgi_send_timeout 600;
        fastcgi_connect_timeout 600;
    }

    # Статические ресурсы и кэширование (css, js, изображения)
    location ~ \.(?:css|js|mjs|svg|gif|png|jpg|ico|wasm|tflite|map|ogg|flac)$ {
        try_files $uri /index.php$request_uri;
        add_header Cache-Control "public, max-age=15778463, $asset_immutable";
        access_log off;

        location ~ \.wasm$ {
            default_type application/wasm;
        }
    }

    # Шрифты
    location ~ \.woff2?$ {
        try_files $uri /index.php$request_uri;
        expires 7d;
        access_log off;
        add_header Cache-Control "public, max-age=604800, immutable";
    }

    # Обработка всех остальных запросов через index.php
    location / {
        try_files $uri $uri/ /index.php$request_uri;
    }

}

server {
    listen 80;
    listen [::]:80;
    server_name nextcloud.217.60.36.214.sslip.io;

    location ^~ /.well-known/acme-challenge/ {
        try_files $uri $uri/ =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

Мы только что установили сервер и на нем еще нет файлов, поэтому сразу же выполним миграцию новых типов файлов (MIME-типы).  
Это нужно выполнить для того, чтобы они корректно поддерживались. При большом количестве файлов на сервере миграция может занять много времени.  
Вводим команду:

```
sudo -u www-data php /var/www/nextcloud/occ maintenance:repair --include-expensive
```

Выполним оптимизацию базы данных Nextcloud. Добавим недостающие индексы и удалим устаревшие/неэффективные:

```
sudo -u www-data php /var/www/nextcloud/occ db:add-missing-indices
```

Настроим время начала окна обслуживания. В нашем примере выберем время начала выполнения в 3 ночи. Nextcloud использует параметр maintenance_window_start в секундах от полуночи. Вычисляем наше время:  3 часа умножить на 3600 = 10 800 секунд:

```
sudo -u www-data php /var/www/nextcloud/occ config:system:set maintenance_window_start --value=10800 --type=integer
```

Перезапустим PHP и Nginx:

```
sudo systemctl restart php8.3-fpm nginx
```

Результат: 

<p align="center"><img alt="restart php8.3 и nginx" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_14.png width=1024></p>

## Проверка Nextcloud

После этого открываем в браузере Nextcloud:

> Замените на свое доменное имя

```
nextcloud.217.60.36.214.sslip.io 
```

<p align="center"><img alt="заходим на nextcloud" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_15.png width=1024></p>

Видим приветствие:

<p align="center"><img alt="приветствие nextcloud" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_16.png width=1024></p>

Переходим в меню «Параметры сервера»:

<p align="center"><img alt="параметры сервера" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_17.png width=1024></p>

Вы должны увидеть сообщение:
**Все проверки пройдены.**

<p align="center"><img alt="Все проверки пройдены" src=/topics/installing-the-server-software/how-to-install-nextcloud-on-ubuntu/static/ru_image_18.png width=1024></p>

На этом установка и базовая настройка Nextcloud завершены.

## Краткие итоги

Мы развернули сервер с MySQL, PHP, Nginx и Nextcloud, настроив его как платформу для облачного хранения файлов. Для ускорения работы и повышения стабильности мы использовали APCu для локального кэширования, а Redis — для распределённого кэша и блокировки файлов.
