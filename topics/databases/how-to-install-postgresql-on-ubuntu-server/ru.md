# Как установить PostgreSQL 17 на Ubuntu 24.04

Система управления базами данных (СУБД) PostgreSQL 17 является бесплатной объектно-реляционной системой управления базами данных с открытым исходным кодом. Она поддерживает большой набор различных типов данных и многопользовательскую работу. СУБД является кроссплатформенной и может быть установлена на все популярные операционные системы. PostgreSQL соответствует требованиям ACID (atomicity, consistency, isolation, durability или атомарность, согласованность, изоляция, устойчивость) для проведения транзакций и обеспечения сохранности данных.  
В статье мы рассмотрим установку, первоначальную настройку и выполнение удаленного подключения к серверу с помощью pgAdmin. 

## Подготовка системы к установке

Перед началом установки обновим список пакетов и установим последние версии обновлений командой: 

```
sudo apt update && sudo apt upgrade -y
```

Установим необходимые пакеты:

```
sudo apt install -y curl ca-certificates
```

В этой команде:  
•	curl — кроссплатформенный инструмент командной строки для передачи данных (с помощью протоколов FTP, TFTP, SCP, SFTP и др.) и работы с URL-адресами.  
•	ca-certificates — пакет, необходимый для безопасной передачи данных и подтверждения подлинности сертификатов.  
Создадим директорию для ключей репозитория:

```
sudo install -d /usr/share/postgresql-common/pgdg
```
Скачаем и добавим ключ репозитория:

```
sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc
```
Добавим репозиторий в список источников APT:

```
echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt noble-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
```

Снова обновим список пакетов:

```
sudo apt update && sudo apt upgrade -y
```

Предварительная подготовка Вашей системы закончена.

## Установка PostgreSQL 17

Теперь установим PostgreSQL 17 и дополнительные модули, необходимые для работы: 

```
sudo apt install -y postgresql-17 postgresql-client-17 postgresql-contrib
```

В этой команде:  
•	postgresql-17 — основной сервер базы данных.  
•	postgresql-client-17 — клиентские утилиты для взаимодействия с сервером.  
•	postgresql-contrib — дополнительные расширения и утилиты.  
После установки PostgreSQL должен автоматически запуститься. Проверим, что служба активна:
```
sudo systemctl status postgresql
```
Вы должны увидеть сообщение, указывающее на активное состояние службы:
<p align="center"><img alt="активное состояние службы postgresql" src=/topics/databases/how-to-install-postgresql-on-ubuntu-server/static/ru_image_01.png width=1024></p>

## Защита базы данных

По умолчанию PostgreSQL использует одноранговую аутентификацию "peer", что означает, что доступ к базе данных осуществляется только от имени системного пользователя. Изначально удаленное подключение не поддерживается.
Настроим пароль для базового пользователя postgres. Заходим в базу данных: 

```
sudo -u postgres psql
```
Укажем новый пароль **new_password** для пользователя по умолчанию postgres (обратите внимание, он в апострофах и строка обязательно завершается знаком ;)

```
ALTER USER postgres WITH ENCRYPTED PASSWORD 'new_password';
```

Создадим нового пользователя manager и укажем его пароль **manager_password**:

```
CREATE USER manager ENCRYPTED PASSWORD 'manager_password';
```
Теперь необходимо выйти из базы данных и включить доступ по паролю в конфигурационном файле pg_hba.conf. 
Для выхода из базы данных введите:

```
\q
```

Затем введите команду в командной строке Ubuntu:

```
sudo sed -i '/^local/s/peer/scram-sha-256/' /etc/postgresql/17/main/pg_hba.conf
```
Перезапустим PostgreSQL:

```
sudo systemctl restart postgresql
```

Пробуем зайти в базу данных:

```
sudo -u postgres psql
```

При входе теперь требуется ввести пароль.

<p align="center"><img alt="необходим ввод пароля" src=/topics/databases/how-to-install-postgresql-on-ubuntu-server/static/ru_image_02.png width=1024></p>

## Создание новой базы данных

В качестве примера создадим новую базу данных под именем **salers** и дадим права на ее управление пользователю **manager**


```
sudo -u postgres createdb salers -O manager
```

Обратите внимание, что пароль Вы вводите для пользователя postgres.
Заходим в базу данных уже как пользователь manager

```
sudo -u postgres psql -U manager -d salers
```

В базе данных создадим таблицу менеджеры по продажам:

```
CREATE TABLE sales_managers (
           manager_id SERIAL PRIMARY KEY,
           first_name VARCHAR(50),
           last_name VARCHAR(50),
           date_of_employment DATE
       );
```

Заполним данные трех сотрудников для примера:

```
INSERT INTO sales_managers
       (first_name, last_name, date_of_employment)
       VALUES
       ( 'Иван', 'Касаткин', '2024-11-15'),
       ( 'Артём', 'Фролов', '2020-10-10'),
       ( 'Юлия', 'Юсупова', '2019-12-17');

SELECT * FROM sales_managers;
```

<p align="center"><img alt="тестовая база данных" src=/topics/databases/how-to-install-postgresql-on-ubuntu-server/static/ru_image_03.png width=1024></p>

## Настройка удаленного доступа к PostgreSQL

Файлы конфигурации для PostgreSQL 17 в Ubuntu 24.04 хранятся в подкаталоге _/etc/postgresql/17/main_.
Нас будут интересовать два файла: postgresql.conf и pg_hba.conf. Файл postgresql.conf является основным файлом конфигурации и определяет порт по умолчанию, который прослушивает сервер базы данных, максимальный объём памяти на операцию, прослушиваемые IP-адреса и другие параметры, необходимые для корректной работы системы управления базами данных.
Настроим подключение к PostgreSQL с удаленного хоста. Откроем файл с помощью текстового редактора nano:

```
sudo nano  /etc/postgresql/17/main/postgresql.conf
```

Найдем раздел **«CONNECTIONS AND AUTHENTICATION»**

Раскомментируем строчку listen_addresses и заменим 'localhost' на '*':

```
listen_addresses = '*'
```

<p align="center"><img alt="Раскомментируем строчку listen_addresses" src=/topics/databases/how-to-install-postgresql-on-ubuntu-server/static/ru_image_04.png width=1024></p>

Звездочка указывает серверу PostgreSQL прослушивать все сетевые интерфейсы. Если Вы хотите, чтобы сервер базы данных прослушивал только определенные сетевые интерфейсы, укажите их IP-адреса через запятую, например:

```
listen_addresses = ‘192.168.0.111, localhost, 10.10.10.150’
```

Для сохранения файла в редакторе nano: Ctrl+O. Соглашаемся с сохранением, нажимаем Enter. Выход: Ctrl+X.

Отредактируем файл конфигурации **pg_hba.conf**. Он определяет, какие IP-адреса или диапазоны IP-адресов разрешены для подключения к серверу базы данных PostgreSQL. Также в нем указывается, какие учётные записи и механизмы аутентификации должны использоваться для регистрации пользователей.
Открываем его с помощью текстового редактора nano:

```
sudo nano /etc/postgresql/17/main/pg_hba.conf
```

Расскомментируем строчку host. Укажем,  к каким базам, каким пользователям и с каких IP-адресов возможен доступ. Так же укажем механизм аутентификации scram-sha-256.
Аутентификация SCRAM-SHA-256 описана в [RFC 7677](https://datatracker.ietf.org/doc/html/rfc7677). Она предотвращает перехват паролей в ненадежных соединениях и поддерживает хранение паролей на сервере в хешированной форме. Считается наиболее безопасным сегодня методом аутентификации. 

<p align="center"><img alt="Расскомментируем строчку host. Укажем,  к каким базам, каким пользователям и с каких IP-адресов возможен доступ" src=/topics/databases/how-to-install-postgresql-on-ubuntu-server/static/ru_image_05.png width=1024></p>

Перезапускаем базу данных:

```
sudo systemctl restart postgresql
```

Проверим, прослушивает ли PostgreSQL порт 5432, который задан в настройках по умолчанию в файле postgresql.conf. Если Вы поменяете порт, то при проверке укажите его номер. Команда:

```
netstat -ano | grep 5432
```

>Примечание: Если у Вас не установлен пакет net-tools, установите его командой:
>```
>sudo apt install net-tools
>```

<p align="center"><img alt="net-tools" src=/topics/databases/how-to-install-postgresql-on-ubuntu-server/static/ru_image_06.png width=1024></p>

На скриншоте видно, что порт 5432 занят процессом PostgreSQL, все настроено корректно.

## Удаленное подключение к базе с помощью pgAdmin

Для примера выполним подключение к серверу PostgreSQL с помощью pgAdmin. Загрузить и установить pgAdmin можно с [официального сайта](https://www.pgadmin.org/download/).  
Запускаем программу.
Выбираем пункт «Add new server».
<p align="center"><img alt="подключение через pgAdmin" src=/topics/databases/how-to-install-postgresql-on-ubuntu-server/static/ru_image_07.png width=1024></p>

Переходим на вкладку Connections.
Заполняем наши данные. В примере я указываю IP-адрес и порт, который прослушивает сервер, имя базы данных, пользователя и его пароль.

<p align="center"><img alt="указываем параметры подключения (IP-адрес и порт, который прослушивает сервер, имя базы данных, пользователя и его пароль)" src=/topics/databases/how-to-install-postgresql-on-ubuntu-server/static/ru_image_08.png width=1024></p>

После того, как Вы сохраните параметры, подключение произойдет автоматически. Если Вы нажмете правой клавишей мыши на базе данных, то можете выбрать PSQL tools:

<p align="center"><img alt="подключение выполнено успешно" src=/topics/databases/how-to-install-postgresql-on-ubuntu-server/static/ru_image_09.png width=1024></p>

После этого Вы сможете работать с базой данных через PSQL:

<p align="center"><img alt="Работа с базой данных через PSQL" src=/topics/databases/how-to-install-postgresql-on-ubuntu-server/static/ru_image_10.png width=1024></p>

## Заключение

Мы установили PostgreSQL 17 на Ubuntu 24.04. Создали тестовую базу данных, пользователя, защитили доступ к базе данных с помощью пароля. Настроили удаленное подключение к PostgreSQL и протестировали корректность работы с помощью pgAdmin.
