# Как установить MariaDB на Ubuntu 24.04

MariaDB является высокопроизводительной СУБД, совместимой с MySQL. Она активно используется в веб-приложениях, серверных решениях и аналитических системах.

## Создание сервера

Создадим сервер на [HostVDS](https://hostvds.com/control/servers/new). 
> Выбирайте сервер исходя из Ваших требований к системе.

В качестве примера мы создали базовый Highload сервер c 4 Гб оперативной памяти и 1 CPU:
<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/databases/how-to-install-mariadb-on-ubuntu-24.04/static/ru_image_01.png width=1024></p>
Образ Ubuntu 24.04:
<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/databases/how-to-install-mariadb-on-ubuntu-24.04/static/ru_image_02.png width=1024></p>
После создания сервера и подключения к нему по SSH приступаем к подготовке системы.

## Подготовка системы

Обновим систему до последних версий пакетов:

```
sudo apt update && sudo apt upgrade -y
```

Установим серверную и клиентскую части MariaDB:

```
sudo apt install mariadb-server mariadb-client -y
```

Проверим, что СУБД корректно установилась:

```
sudo systemctl status mariadb
```

<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/databases/how-to-install-mariadb-on-ubuntu-24.04/static/ru_image_03.png width=1024></p>

Добавим MariaDB в автозагрузку:

```
sudo systemctl enable mariadb
```

Запустим скрипт безопасной конфигурации MariaDB:

```
sudo mysql_secure_installation
```

Вопросы и ответы к ним:  
Enter current password for root (enter for none):  
Вводим Enter, у нас еще не установлен пароль для root.  
Switch to unix_socket authentication? – **No**, если хотите использовать root с паролем.  
Change root password? – **Yes** (если еще не установлен).  
Вводим пароль для root.  
Запретить удаленное подключение для root (Disallow root login remotely)? – **Yes**  
Удалить анонимных пользователей – **Yes**  
Запретить root-доступ из удалённых систем – **Yes**  
Удалить тестовую базу (Remove test database and access to it?) – **Yes**  
Перезагрузить таблицы привилегий (Reload privilege tables now?) – **Yes**  

<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/databases/how-to-install-mariadb-on-ubuntu-24.04/static/ru_image_04.png width=1024></p>

## Настройка аутентификации root

Проверим текущий метод аутентификации:

```
sudo mariadb -e "SELECT user,host,plugin FROM mysql.user;"
```

Для root@localhost должен быть указан mysql_native_password, то есть требуется ввод пароля при входе из-под sudo.

<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/databases/how-to-install-mariadb-on-ubuntu-24.04/static/ru_image_05.png width=800></p>

Если же Вы пропустили шаг с указанием пароля, то введите следующие команды: 

```
sudo mariadb
```
Далее в самой СУБД:

```
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('StrongPassword1!');
FLUSH PRIVILEGES;
EXIT;
```

Теперь для входа в MariaDB будет необходимо вводить пароль. Команда для входа:

```
mysql -u root -p
```

<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/databases/how-to-install-mariadb-on-ubuntu-24.04/static/ru_image_06.png width=1024></p>

## Создание пользователя

Создаем нового пользователя manager и задаем ему пароль Passw0rd1! :

```
CREATE USER 'manager'@'localhost' IDENTIFIED BY 'Passw0rd1!';
```

Предоставим ему права на 

```
GRANT SELECT, INSERT, UPDATE, DELETE ON *.* TO 'manager'@'localhost';
FLUSH PRIVILEGES;
```

где  
•	SELECT - чтение данных из таблиц;  
•	INSERT – вставка новых строк в таблицы;  
•	UPDATE – изменение данных в таблицах;  
•	DELETE – удаление строк из таблиц;  
Отметим, что команда  
_GRANT ALL PRIVILEGES ON *.* ..._  
включает в себя все возможные права, то есть делает пользователя администратором с полным контролем над сервером базы данных. Дополнительно к предыдущим:  
•	DROP, ALTER, CREATE – управление структурой таблиц и баз;  
•	GRANT OPTION – возможность передавать права другим;  
•	SUPER –  выполнение административных команд: остановка запросов, изменение глобальных переменных, отключение репликации и прочее;  
•	FILE  – чтение и запись файлов на сервере;  
•	PROCESS – просмотр всех активных соединений и их запросов;  
•	 RELOAD – применение настроек без перезапуска сервера;  
•	SHUTDOWN – возможность остановить MariaDB-сервер.  
Выходим из MariaDB:

```
exit;
```

Заходим под созданным пользователем:

```
mysql -u manager -p
```

<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/databases/how-to-install-mariadb-on-ubuntu-24.04/static/ru_image_07.png width=1024></p>

## Настройка удаленного доступа по SSL к MariaDB 

По умолчанию MariaDB позволяет подключаться только с localhost. Настроим возможность удаленного подключения к СУБД. 
 
 Откроем основной конфигурационный файл MariaDB:

```
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
```

Изменим адрес, на котором MariaDB  слушает сетевые подключения. Заменим строку 

```
bind-address = 127.0.0.1
```

на 

```
bind-address = 0.0.0.0
```

<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/databases/how-to-install-mariadb-on-ubuntu-24.04/static/ru_image_08.png width=1024></p>

Сохраняем и выходим из nano: CTRL+O, CTRL+X.  
Перезапускаем MariaDB:

```
sudo systemctl restart mariadb
```

Создаем пользователя для удаленного доступа к MariaDB:

```
mysql -u root -p
```

Вводим команды в MariaDB:

> Замените IP-адрес 185.159.131.116. на IP-адрес Вашей клиентской машины.

```
CREATE USER 'remote_user'@'185.159.131.116' IDENTIFIED BY 'Password123!';
GRANT SELECT, INSERT, UPDATE, DELETE ON *.* TO 'remote_user'@'185.159.131.116';
FLUSH PRIVILEGES;
```

Выходим из СУБД:

```
exit;
```

<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/databases/how-to-install-mariadb-on-ubuntu-24.04/static/ru_image_09.png width=1024></p>

Установим Certbot для получения сертификата:

```
sudo apt install certbot -y
```

Мы воспользуемся сервисом sslip.io для получения доменного имени на наш сервер. Выглядеть оно будет следующим образом:  
**mariadb.31.59.120.76.sslip.io**  
Вводим команду для получения сертификата:

> Замените IP-адрес 31.59.120.76 на IP-адрес Вашего сервера MariaDB.

```
sudo certbot certonly --standalone --preferred-challenges http \
  -d mariadb.31.59.120.76.sslip.io
```

где:  
•	certonly – только получение сертификатов без настройки веб-сервера;  
•	--standalone – Certbot запускает временный веб-сервер.

<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/databases/how-to-install-mariadb-on-ubuntu-24.04/static/ru_image_10.png width=1024></p>

Создаем директорию для сертификатов MySQL:

```
sudo mkdir -p /etc/mysql/ssl
```

Копируем в нее сертификаты:

> Замените IP-адрес 31.59.120.76 на IP-адрес Вашего сервера MariaDB.

```
sudo cp /etc/letsencrypt/live/mariadb.31.59.120.76.sslip.io/cert.pem /etc/mysql/ssl/ && sudo cp /etc/letsencrypt/live/mariadb.31.59.120.76.sslip.io/privkey.pem /etc/mysql/ssl/ && sudo cp /etc/letsencrypt/live/mariadb.31.59.120.76.sslip.io/fullchain.pem /etc/mysql/ssl/
```

Устанавливаем корректные разрешения: 

```
sudo chown mysql:mysql /etc/mysql/ssl/* && sudo chmod 600 /etc/mysql/ssl/privkey.pem && sudo chmod 644 /etc/mysql/ssl/cert.pem && sudo chmod 644 /etc/mysql/ssl/fullchain.pem
```


Открываем конфигурацию MariaDB:

```
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
```

Добавляем строки в конфиг:

```
ssl-ca = /etc/mysql/ssl/fullchain.pem
ssl-cert = /etc/mysql/ssl/cert.pem
ssl-key = /etc/mysql/ssl/privkey.pem
require_secure_transport = ON
```


Отметим, что директива require_secure_transport = ON запрещает подключение без SSL.

<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/databases/how-to-install-mariadb-on-ubuntu-24.04/static/ru_image_11.png width=1024></p>

Сохраняем изменения CTRL+O, CTRL+X.  
Перезапускаем MariaDB:

```
sudo systemctl restart mariadb
```

Проверим, что все выполнено успешно:

```
mysql -u root -p
```

Вводим команду внутри MariaDB:

```
SHOW STATUS LIKE 'Ssl_cipher';
```

Если значение не NULL — SSL работает.

<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/databases/how-to-install-mariadb-on-ubuntu-24.04/static/ru_image_12.png width=1024></p>

Подключаемся с удаленного клиента.  
> На удаленной машине должен быть установлен клиент MariaDB:
> ```
> sudo apt update && sudo apt upgrade -y
> sudo apt install mariadb-client
> ```

С клиентской машины выполняем подключение следующей командой:

> Замените IP-адрес 31.59.120.76 на IP-адрес Вашего сервера MariaDB.

```
mysql -u remote_user -p \
  --host=mariadb.31.59.120.76.sslip.io \
  --ssl
```

Проверим, что мы подключены через SSL:

```
SHOW STATUS LIKE 'Ssl_cipher';
```

Результат:

<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/databases/how-to-install-mariadb-on-ubuntu-24.04/static/ru_image_13.png width=1024></p>

После проверки соединения настроим ufw для обеспечения безопасности сервера.

## Настройка брандмауэра (ufw) для защиты MariaDB

Выполним базовую настройку ufw.

> Замените 22 порт на Ваш реальный порт управления сервером MariaDB.


```
sudo apt install ufw -y
sudo ufw allow 22
```

Если Вам нужно подключение к MariaDB со строго определенного адреса:

> Замените IP-адрес 185.159.131.116 на IP-адрес Вашей клиентской машины.

```
sudo ufw allow from 185.159.131.116 to any port 3306
```

Если Вам нужно подключение к MariaDB из локально сети:

> Замените IP-адрес сети согласно Вашей адресации.

```
sudo ufw allow from 192.168.1.0/24 to any port 3306
```

Включаем и проверяем правильность настройки:

```
sudo systemctl start ufw && sudo ufw enable && sudo ufw status verbose
```

<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/databases/how-to-install-mariadb-on-ubuntu-24.04/static/ru_image_14.png width=1024></p>

После настройки ufw проверьте доступность сервера с клиента:

> Замените IP-адрес 31.59.120.76 на IP-адрес Вашего сервера MariaDB.

```
mysql -u remote_user -p \
  --host=mariadb.31.59.120.76.sslip.io \
  --ssl
```

## Удаление MariaDB

Останавливаем процесс MariaDB:

```
sudo systemctl stop mariadb
```

Удаляем СУБД:

```
sudo apt remove --purge mariadb-server mariadb-client mariadb-common -y
```

В процессе Вас спросит система: Remove all MariaDB databases? [yes/no]  yes  
Очищаем зависимости:

```
sudo apt autoremove -y && sudo apt autoclean
```

Дополнительно удаляем сами базы данных:

```
sudo rm -rf /var/lib/mysql && sudo rm -rf /etc/mysql
```

## Краткие итоги

Мы рассмотрели установку и удаленное подключение к СУБД MariaDB по SSL. Настроили ufw и привели команды для удаления MariaDB с сервера.


