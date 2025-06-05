# Как установить osTicket на Ubuntu 22.04

Система osTicket предлагает централизованную платформу, на которой запросы в службу поддержки преобразуются в тикеты (заявки), с которыми можно работать. Платформа построена на базе открытого кода. 

## Подготовка к установке дистрибутива
Переходим в режим выполнения команд от суперпользователя:
```
sudo -s
```
Перед установкой обновим систему:
```
apt update && apt upgrade -y
```
Изначально текстовый редактор nano и утилита wget для скачивания файлов из интернета уже присутствуют в системе, если они не установлены, то выполним команду:
```
apt install nano wget -y
```
Если у Вас есть доменное имя, то проверьте, что имя сервера ему соответствует, в противном случае установите имя сервера (в примере osticket.test.ru):
```
hostnamectl set-hostname osticket.test.ru
```
В нашей статье у нас сервер «из коробки», на нем не настроен DNS, поэтому мы будем показывать вариант работы с доменным именем и с IP-адресом. Мы выбрали вариант работы с IP-адресом, потому что он чуть сложнее, с доменным именем будет проще.  
Установим временную зону: 
```
timedatectl set-timezone Europe/Moscow
```
Установим службу синхронизации времени:
```
apt install chrony -y
```
Добавим службу в автозагрузку при запуске системы:
```
systemctl enable chrony
```
Для корректной работы перезагрузим сервер:
```
reboot now
```
Для правильной работы нам потребуются следующие компоненты стека LAMP: Apache, MariaDB, PHP.  
Переходим в режим выполнения команд от суперпользователя:
```
sudo -s
```
Установим их в нужной конфигурации с помощью следующей команды:
```
apt install apache2 mariadb-server php libapache2-mod-php php-mysql php-cgi php-fpm php-cli php-curl php-gd php-imap php-mbstring php-pear php-intl php-apcu php-common php-bcmath -y
```
Проверим, что порт 80 свободен, он потребуется для apache:
```
netstat -ltnp | grep -w ':80'
```
В моем случае он занят:
<p align="center"><img alt="ошибка при запуске apache" src=/topics/installing-the-server-software/osticket/static/ru_image_01.png width=1024></p>
Если он будет занят, то при выполнении запуска  apache2 Вы увидите ошибку:
<p align="center"><img alt="ошибка при запуске apache" src=/topics/installing-the-server-software/osticket/static/ru_image_02.png width=1024></p>
Проверим статус системы:
<p align="center"><img alt="статус системы" src=/topics/installing-the-server-software/osticket/static/ru_image_03.png width=1024></p>
В моем случае порт 80 был занят nginx. Удалим процесс nginx, его PID 973:

```
kill 973
```
Проверяем результат и запускаем apache2:
```
systemctl start apache2
```

<p align="center"><img alt="запуск apache2" src=/topics/installing-the-server-software/osticket/static/ru_image_04.png width=1024></p>

Далее запустим службу mariadb:

```
systemctl start mariadb
```
Теперь необходимо добавить в автозагрузку службы Apache и MariaDB:
```
systemctl enable apache2
```

```
systemctl enable mariadb
```
Для безопасности включим защиту базы данных:
```
mysql_secure_installation
```
Система будет задавать Вам следующие вопросы, на первый вопрос необходимо нажать просто Enter, на остальные необходимо ответить символом “Y”. Также надо будет задать пароль для root.  
После этого входим в оболочку MariaDB:
```
mysql -u root -p
```
Работа с базой данных аналогична работе с базой данных MySQL, про которую мы подробно писали в <a href=https://github.com/HostVDS-com/tutorials/blob/main/topics/databases/how-to-install-mysql-on-ubuntu-server/ru.md>этой статье</a>, рекомендуем ознакомиться с ней.  
Создаем базу данных для osTicket:
```
CREATE DATABASE osticket;
```
Обратите внимание, что все команды при работе с базой данных заканчиваются знаком **;**  
Создаем пользователя **osticket** для базы данных **osticket** и указываем для него пароль **osTicket**:
```
CREATE USER 'osticket'@'localhost' IDENTIFIED BY 'osTicket';
```
Даем полные права на базу данных **osticket** нашему пользователю **osticket**:
```
GRANT ALL PRIVILEGES ON osticket.* TO osticket@localhost IDENTIFIED BY "osTicket";
```
Обновляем данные о привилегиях:
```
FLUSH PRIVILEGES;
```
Выходим из настройки базы данных:
```
EXIT;
```

## Скачивание дистрибутива osTicket

Последняя версия osTicket v1.18.2 доступна на Гитхабе:
```
https://github.com/osTicket/osTicket/releases/tag/v1.18.2
```
Скачаем дистрибутив:
```
wget https://github.com/osTicket/osTicket/archive/refs/tags/v1.18.2.tar.gz
```
Создаем папку в директории для нашего сервера:
```
mkdir /var/www/html/osticket
```
Все команды выполняются под root.
Извлекаем архив в созданную папку:
```
tar -xf v1.18.2.tar.gz  -C /var/www/html/osticket
```
Даем права web-серверу на созданную папку:
```
chown -R www-data:www-data /var/www/html/osticket
```

```
chmod -R 755 /var/www/html/osticket
```
Переименовываем конфигурационный файл ost-sampleconfig.php в  ost-config.php:
```
mv /var/www/html/osticket/osTicket-1.18.2/include/ost-sampleconfig.php /var/www/html/osticket/osTicket-1.18.2/include/ost-config.php
```

## Создание виртуального хоста Apache

Создаём файл конфигурации osTicket для виртуального хоста Apache с помощью текстового редактора nano:
```
nano /etc/apache2/sites-available/osticket.conf
```
Добавляем следующие строки:
```
<VirtualHost *:80>
ServerName osticket.test.ru
ServerAdmin admin@osticket.test.ru
DocumentRoot /var/www/html/osticket/osTicket-1.18.2/include/>
<Directory /var/www/html/osticket/osTicket-1.18.2/include/>
Require all granted
Options FollowSymlinks
AllowOverride All
</Directory>
ErrorLog ${APACHE_LOG_DIR}/osticket.error.log
CustomLog ${APACHE_LOG_DIR}/osticket.access.log combined
</VirtualHost>
```
Обратите внимание, что в качестве ServerName надо указать имя Вашего сервера!  
Сохраняем файл CTRL+O, выходим из файла CTRL+X.  
Активируем виртуальный хост osTicket:
```
a2ensite osticket.conf
```
Включим модуль перезаписи Apache:
```
a2enmod rewrite
```
Перезапустим Apache:
```
systemctl restart apache2
```
Проверим состояние web-сервера:
```
systemctl status apache2
```

<p align="center"><img alt="состояние web-сервера" src=/topics/installing-the-server-software/osticket/static/ru_image_05.png width=1024></p>

Служба работает, переходим непосредственно к установке osTicket.

## Установка и запуск  osTicket

Если у Вас работает служба DNS, то введите в браузере:

```
http://osticket.test.ru
```
где вместо _osticket.test.ru_ введите имя Вашего сервера.

Либо введите:
```
http://192.168.1.59/osticket/osTicket-1.18.2/setup/install.php
```
где вместо _192.168.1.59_ укажите IP-адрес Вашего сервера.
Вы увидите следующее приглашение на установку:
<p align="center"><img alt="приглашение на установку" src=/topics/installing-the-server-software/osticket/static/ru_image_06.png width=1024></p>

Нажимаем кнопку **Continue**.  
Заполняем данные администратора osTicket, указываем две электронные почты, которые не должны совпадать. Затем вводим параметры доступа к базе данных.
<p align="center"><img alt="данные администратора osTicket" src=/topics/installing-the-server-software/osticket/static/ru_image_07.png width=1024></p>
<p align="center"><img alt="данные администратора osTicket" src=/topics/installing-the-server-software/osticket/static/ru_image_08.png width=1024></p>
<p align="center"><img alt="данные администратора osTicket" src=/topics/installing-the-server-software/osticket/static/ru_image_09.png width=1024></p>
После этого производим саму установку.

<p align="center"><img alt="установка" src=/topics/installing-the-server-software/osticket/static/ru_image_10.png width=1024></p>
После установки увидим уведомление, что все прошло успешно. 
<p align="center"><img alt="уведомление" src=/topics/installing-the-server-software/osticket/static/ru_image_11.png width=1024></p>

Теперь необходимо изменить разрешения на доступ к файлу **ost-config.php**:
```
chmod 0644 /var/www/html/osticket/osTicket-1.18.2/include/ost-config.php
```
Так же указано, как попасть в панель управления osTicket:
```
http://192.168.1.59/osticket/osTicket-1.18.2/scp
```
Переходим по указанному адресу и вводим данные администратора.
<p align="center"><img alt="вводим данные администратора" src=/topics/installing-the-server-software/osticket/static/ru_image_12.png width=1024></p>
Видим первый тикет, показывающий, что osTicket установлен. 
<p align="center"><img alt="вводим данные администратора" src=/topics/installing-the-server-software/osticket/static/ru_image_13.png width=1024></p>

Все данные представлены на английском языке. Выполним русификацию.

## Русификация osTicket

Все действия выполняем через 
```
sudo -s
```
Переходим в домашний каталог:
```
cd
```
Создадим каталог для загрузки языкового пакета:
```
mkdir ru_language
```
Переходим в каталог:
```
cd ru_language
```
Скачиваем языковой пакет:
```
wget https://s3.amazonaws.com/downloads.osticket.com/lang/1.14.x/ru.phar
```
Создаем php файл:
```
nano extract.php
```
Вставляем блок кода:
```
<?php
try {
$phar = new Phar('ru.phar');
$phar->extractTo('./',null,true); // extract all files
} catch (Exception $e) {
echo "there was an error<br>";
print_r($e);
}
?>
```
Сохраняем файл (**CTRL+O**) и выходим из файла (**CTRL+X**):
Запускаем скрипт и распаковываем файлы:
```
php extract.php
```
Создаём папку для языкового пакета:
```
mkdir -p /var/www/html/osticket/osTicket-1.18.2/include/ i18n/ru_RU
```
Синхронизируем распакованные файлы с созданной папкой, за исключением _extract.php_ и _ru.phar_
```
rsync -r --exclude=ru.phar --exclude=extract.php /root/ru_language/ /var/www/html/osticket/osTicket-1.18.2/include/i18n/ru_RU/
```
Обратите внимание, если Вы сделали директорию не под root, то команда будет выглядеть примерно вот так:
```
rsync -r --exclude=ru.phar --exclude=extract.php /home/jetcry/ru_language /var/www/html/osticket/osTicket-1.18.2/include/i18n/ru_RU/
```
Далее изменим разрешения на директорию с движком для web-сервера:
```
chown -R www-data:www-data /var/www/html/osticket/
```
Меняем разрешения на папку с движком osTicket:
```
chmod -R 755 /var/www/html/osticket/
```
Меняем разрешения на конфигурационный файл osTicket:
```
chmod 644 /var/www/html/osticket/osTicket-1.18.2/include/ost-config.php
```
Перезапускаем web-сервер:
```
systemctl restart apache2
```

Переходим в _Admin Panel_ в браузере.

<p align="center"><img alt="Admin Panel" src=/topics/installing-the-server-software/osticket/static/ru_image_14.png width=1024></p>
Выбираем _Primary_ _Language_ «русский». Сохраняем изменения.
<p align="center"><img alt="Primary_ _Language" src=/topics/installing-the-server-software/osticket/static/ru_image_15.png width=1024></p>
Видим, что изменения применились. 
<p align="center"><img alt="английский язык" src=/topics/installing-the-server-software/osticket/static/ru_image_16.png width=1024></p>
Перезагружаем страницу.
<p align="center"><img alt="русский язык" src=/topics/installing-the-server-software/osticket/static/ru_image_17.png width=1024></p>

Система osTicket русифицирована.  
На этом моменте osTicket предложил для обеспечения безопасности удалить папку **setup**  с сервера. Выполним это действие командой:
```
rm -r /var/www/html/osticket/osTicket-1.18.2/setup
```
Далее переходим в панель персонала и можно приступать непосредственно к работе в osTicket.  
На этом установка и русификация osTicket завершены. 

## Немного о безопасности
Вы можете дополнительно использовать SSL сертификаты для обеспечения безопасности подключения. В этом случае рекомендуем Вам воспользоваться бесплатными SSL сертификатами Let's Encrypt, для регистрации и получения которых в центре сертификации нужно установить пакет certbot и плагин под Apache:
```
apt install certbot python3-certbot-apache -y
```
Запрос на получение сертификата:
 ```
certbot --apache
```
Вводим необходимые данные и перезапускаем сервер:
```
systemctl restart apache2
```
Добавьте автоматическое обновление сертификатов:
```
systemctl enable certbot.timer
```

Если Вы по каким-то причинам не хотите использовать сертификаты, то можно создать SSH-туннель для подключения к osTicket.  
В этом случае не потребуется использование доменного имени и сертификата.  
Команда на клиентском хосте:
```
ssh -L 80:localhost:80 jetcry@192.168.1.59
```
После этого подключение выполняйте на IP-адрес 127.0.0.1:
```
http://127.0.0.1/osticket/osTicket-1.18.2/scp/login.php
```
<p align="center"><img alt="русский язык" src=/topics/installing-the-server-software/osticket/static/ru_image_18.png width=1024></p>

На этом установка osTicket завершена. Можно приступать к работе с платформой.
