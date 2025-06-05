
# Как установить phpMyAdmin на Ubuntu 24.04

Веб-приложение phpMyAdmin разрабатывается с открытым кодом и представляет собой веб-интерфейс для администрирования СУБД MySQL.

## Установка mySQL

Перед установкой и настройкой phpMyAdmin предварительно установим и настроим СУБД mySQL, если она еще не установлена на Ваш сервер.
Мы подробно расписывали установку и настройку СУБД mySQL в [этой статье](https://github.com/HostVDS-com/tutorials/blob/main/topics/databases/how-to-install-mysql-on-ubuntu-server/ru.md), сейчас создадим только пользователя phpmyadmin, который по умолчанию будет работать с phpMyAdmin. 
Установим и обновим все пакеты системы:

```
sudo apt update && sudo apt upgrade -y
```

Установим mySQL:

```
sudo apt install mysql-server -y
```

Запускаем СУБД:

```
sudo systemctl start mysql
```

Устанавливаем автоматический запуск после перезагрузки системы:

```
sudo systemctl enable mysql
```

Защищаем нашу СУБД:

```
sudo mysql_secure_installation
```

Рекомендуем согласиться со следующими параметрами:  
Установить утилиту для проверки надежности паролей validate password.  
Установим уровень 2 для максимальной сложности вводимых паролей.

<p align="center"><img alt="validate password" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_01.png width=1024></p>

Далее предлагаем согласиться (нажать **Y**) со всеми пунктами:  
•	Remove anonymous users (Удалить анонимных пользователей)  
•	Disallow root login remotely (Запретить удаленный вход пользователя root)  
•	Remove the test database (Удалить тестовую базу данных)  
•	Reload privilege tables (Перезагрузить таблицы привилегий)

Переходим в mySQL:

```
sudo mysql
```

Создаем пользователя phpmyadmin и задаем ему пароль Pmy@dm1n:

```
CREATE USER 'phpmyadmin'@'localhost' IDENTIFIED WITH 'caching_sha2_password' BY 'Pmy@dm1n';
```

Разрешаем ему выполнение всех операций:

```
GRANT ALL PRIVILEGES ON phpmyadmin.* TO 'phpmyadmin'@'localhost' WITH GRANT OPTION;
```

Применяем изменений привилегий:

```
FLUSH PRIVILEGES;
```

Проверяем, что пользователь добавлен:

```
SELECT user,authentication_string,plugin,host FROM mysql.user;
```

<p align="center"><img alt="пользователь phpmyadmin в mysql" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_02.png width=1024></p>

Выходим из mySQL:

```
Exit
```

## Установка Apache

Для корректной работы phpMyAdmin необходим веб-сервер. Мы будем использовать Apache. Установка Apache выполняется следующей командой:

```
sudo apt install apache2 -y
```

После установки следует убедиться в корректном запуске службы Apache:

```
sudo systemctl status apache2
```

Вывод этой команды должен содержать строку active (running), что свидетельствует о работоспособности веб-сервера. Вы можете увидеть вот такую ошибку:
<p align="center"><img alt="ошибка apache" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_03.png width=1024></p>

В этом случае проверяем, кто использует порт http (80):

```
sudo ss -tap | grep http
```

<p align="center"><img alt="проверяем порт 80" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_04.png width=1024></p>

Скорее всего это будет сервер nginx, как в моем варианте. Останавливаем его:

```
sudo systemctl stop nginx
```

Маскируем процесс, чтобы при перезагрузке системы не было конфликта.

```
sudo systemctl mask nginx
```

Запускаем Apache:

```
sudo systemctl start apache2
```

Проверяем его статус:

```
sudo systemctl status apache2
```

<p align="center"><img alt="проверяем статус apache" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_05.png width=1024></p>

Добавляем его в автоматический запуск при перезагрузке системы:

```
sudo systemctl enable apache2
```

## Установка php

Установим набор модулей для работы php:

```
sudo apt install php libapache2-mod-php php-mysql php-mbstring php-zip php-gd php-json php-curl -y
```

Этот набор модулей обеспечивает поддержку основного функционала phpMyAdmin:  
•	php: базовый пакет PHP.  
•	libapache2-mod-php: пакет интегрирует PHP с Apache.  
•	php-mysql: пакет позволяет PHP взаимодействовать с MySQL.  
•	mbstring, zip, gd, json, curl: расширение функционала (пакеты обработки json, работы с многобайтовыми строками, архивами, изображениями).

Проверяем, что php работает корректно. Для этого создаем файл

```
sudo nano /var/www/html/info.php
```

Добавим в файл следующие строки:

```
<?php
phpinfo();
?>
```

Открываем страницу в браузере: http://your_server_ip/info.php  
Вместо your_server_ip указываете IP-адрес Вашего сервера или доменное имя. В моем случае 192.168.6.142.  
При корректной настройке Вы увидите следующий результат:

<p align="center"><img alt="php info" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_06.png width=1024></p>

## Установка phpMyAdmin

Установим сам phpMyAdmin:

```
sudo apt install phpmyadmin -y
```

Во время установки выберем сервер Apache.

<p align="center"><img alt="выбор Apache" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_07.png width=1024></p>

Настроим базу данных для phpMyAdmin с помощью dbconfig-common. Выбираем “yes”.

<p align="center"><img alt="Настроим базу данных для phpMyAdmin с помощью dbconfig-common" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_08.png width=1024></p>

Указываем пароль для регистрации пользователя, который мы ввели при его создании в mySQL. **В моем случае: Pmy@dm1n**

<p align="center"><img alt="устанавливаем пароль" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_09.png width=1024></p>

Подтверждаем пароль на следующем шаге.  
Установщик должен автоматически установить и настроить phpMyAdmin.

Включим PHP-модуль mbstring для работы с многобайтовыми строками:

```
sudo phpenmod mbstring
```

Перезагружаем Apache для применения изменений:

```
sudo systemctl restart apache2
```

Проверяем корректность установки. В первую очередь нас интересует наличие символической ссылки в html-директории:

```
sudo ls /var/www/html/phpmyadmin
```

Если каталог не существует (ls: cannot access '/var/www/html/phpmyadmin': No such file or directory), то необходимо создать ссылку самостоятельно:

```
sudo ln -s /usr/share/phpmyadmin /var/www/html/phpmyadmin
```

Дополнительно проверяем, что Apache подключил конфигурацию phpMyAdmin:

```
sudo ln -s /etc/phpmyadmin/apache.conf /etc/apache2/conf-available/phpmyadmin.conf
```

Если ответа от системы нет, значит все верно.  
Включаем конфигурационный файл Apache для phpMyAdmin, чтобы веб-сервер знал, как взаимодействовать с phpMyAdmin:

```
sudo a2enconf phpmyadmin
```

Перезагружаем Apache

```
sudo systemctl reload apache2
```

Проверяем статус Apache:

```
sudo systemctl status apache2
```

В браузере переходим по адресу:  
http://your_server_ip/phpmyadmin 

<p align="center"><img alt="открываем в браузере phpMyAdmin" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_10.png width=1024></p>

Вводим имя пользователя phpmyadmin и пароль Pmy@dm1n.  
Попадаем в рабочую область phpMyAdmin:

<p align="center"><img alt="рабочая область phpMyAdmin" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_11.png width=1024></p>

Установка завершена.

## Настройка базовой HTTP-аутентификации

Настроим авторизацию до введения логина и пароля phpMyAdmin. Выполним ее с помощью базовой HTTP аутентификации (basic HTTP authentication).
Создаем файл .htaccess, который позволит управлять поведением Apache:

```
sudo nano /usr/share/phpmyadmin/.htaccess
```

Создаем конфигурацию:

```
AuthType Basic 
AuthName "Restricted Files"
AuthUserFile /etc/phpmyadmin/.htpasswd
Require valid-user
```

где:  
•	AuthType Basic – тип аутентификации (Basic - простая HTTP-авторизация).  
•	AuthName "Restricted Files" – сообщение, отображаемое в диалоговом окне браузера при запросе логина и пароля.  
•	AuthUserFile /etc/phpmyadmin/.htpasswd – путь к файлу с логинами и хешами паролей.  
•	Require valid-user – разрешить доступ только тем, кто прошел аутентификацию.

Создаем директорию для хранения файла паролей и сам файл с первым пользователем:

```
sudo mkdir -p /etc/phpmyadmin
```

```
sudo htpasswd -c /etc/phpmyadmin/.htpasswd jetcry
```

где:  
•	.htpasswd создаёт файл с логином jetcry и запрашивает пароль.  
•	Опция **-c** означает "создать новый файл".

В файл запишется хэш пароля, а не сам пароль в открытом виде.

> Если Вы добавляете второго пользователя — не используйте **-c**, иначе файл перезапишется!

<p align="center"><img alt="файл с паролями" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_12.png width=1024></p>

Теперь необходимо настроить Apache на чтение файлов .htaccess:

```
sudo nano /etc/apache2/conf-available/phpmyadmin.conf
```

В блоке <Directory /usr/share/phpmyadmin> добавьте или измените строку:

```
AllowOverride All
```

Директива AllowOverride All позволяет файлам .htaccess переопределять директивы конфигурации Apache в указанной директории.

<p align="center"><img alt="Директива AllowOverride All" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_13.png width=1024></p>

Проверим конфигурацию Apache на ошибки:

```
sudo apachectl configtest
```

Если все правильно, то ответ:
**Syntax OK**

Перезапускаем Apache:

```
sudo systemctl restart apache2
```

Открываем браузер. Теперь браузер показывает окно авторизации:

<p align="center"><img alt="браузер показывает окно авторизации" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_14.png width=1024></p>

Если не появилось окно с вводом пароля, дополнительно измените директивы AllowOverride с none на All в файле:

```
nano /etc/apache2/apache2.conf
```

<p align="center"><img alt="измените директивы AllowOverride с none на All" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_15.png width=1024></p>

Перезапустите Apache:

```
sudo systemctl restart apache2
```

## Подключение к phpMyAdmin по HTTPS

Сначала активируем модуль SSL для Apache:

```
sudo a2enmod ssl
```

```
sudo systemctl restart apache2
```

Сгенерируем самоподписанный сертификат. Замените 192.168.6.142 на ваш IP или доменное имя:

```
sudo openssl req -x509 -nodes -days 365 \
-newkey rsa:2048 \
-keyout /etc/ssl/private/apache-selfsigned.key \
-out /etc/ssl/certs/apache-selfsigned.crt \
-subj "/C=RU/ST=Region/L=City/O=MyOrg/CN=192.168.6.142"
```

Если у Вас есть домен, то используйте бесплатный сертификат Let's Encrypt:

```
sudo apt install certbot python3-certbot-apache
sudo certbot --apache
```


Отредактируем конфигурационный файл SSL:

```
sudo nano /etc/apache2/sites-available/default-ssl.conf
```

Добавьте в конфигурацию следующие строки: 

```
<IfModule mod_ssl.c>
  <VirtualHost _default *:443>
    ServerAdmin webmaster@localhost
    ServerName 192.168.6.142

    DocumentRoot /var/www/html

    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/apache-selfsigned.crt
    SSLCertificateKeyFile /etc/ssl/private/apache-selfsigned.key

    <Directory /usr/share/phpmyadmin>
        Options Indexes FollowSymLinks
        DirectoryIndex index.php
        AllowOverride All
        Require all granted
    </Directory>
  </VirtualHost>
</IfModule>
```

<p align="center"><img alt="параметры в default-ssl.comf" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_16.png width=1024></p>

Продолжение:

<p align="center"><img alt="параметры в default-ssl.conf" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_17.png width=1024></p>

Активируем созданную конфигурацию и перезапустим Apache:

```
sudo a2ensite default-ssl
```

```
sudo systemctl restart apache2
```

Настроим редирект на автоматический переход на https.
Открываем файл, который обрабатывает запросы на порт 80:

```
sudo nano /etc/apache2/sites-available/000-default.conf
```

Добавляем редирект в блок <VirtualHost *:80>:

```
    Redirect "/phpmyadmin" https://192.168.6.142/phpmyadmin
```

<p align="center"><img alt="редирект на автоматический переход на https" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_18.png width=1024></p>

Сохраняем изменения в файле. Проверяем конфигурацию и перезапускаем Apache:

```
sudo apachectl configtest
```

```
sudo systemctl restart apache2
```

Проверяем. Вводим в браузере 192.168.6.142/phpmyadmin. Автоматически переходим на https:

<p align="center"><img alt="автоматический переход на https" src=/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/static/ru_image_19.png width=1024></p>

Настройка завершена. Подключение защищено.

## Краткие итоги

Мы установили и настроили phpMyAdmin на сервере, предварительно установив другие компоненты стека LAMP: Apache, mySQL, PHP. Дополнительно защитили взаимодействие с СУБД с помощью SSL и авторизации в браузере до введения логина и пароля от СУБД.
