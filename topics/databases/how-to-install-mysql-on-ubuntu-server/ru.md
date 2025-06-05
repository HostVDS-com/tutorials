# Как установить MySQL на Ubuntu 24.04

## Введение 

MySQL представляет собой свободно распространяемую реляционную систему управления базами данных с открытым исходным кодом. Чаще всего ее устанавливают в рамках популярного стека LAMP (Linux, Apache, MySQL, PHP/Python/Perl). С помощью языка структурированных запросов SQL система управляет данными, которые находятся в базе.  
В статье мы рассмотрим этапы установки и настройки безопасности MySQL на Ubuntu Server 24.04, а также процесс создания пользователей. 
Версия MySQL 8.0 доступна для релизов Ubuntu Server 20.04 и выше.  
Следуя приведенным ниже инструкциям, Вы сможете настроить работающую реляционную систему управления базами данных, которая подойдет для разработки веб-сайтов, приложений или хранения различных данных.  
>Если вы устанавливаете MySQL на виртуальную машину, рекомендуем использовать приложение [Putty](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html) для подключения. В противном случае Вы можете столкнуться с проблемами кодировки при чтении информации из базы данных. 
> Мы подробно разбирали подключение к удаленному серверу по SSH  в статье <a href=https://github.com/HostVDS-com/tutorials/blob/main/topics/linux-basics/connect-to-the-server-using-ssh-keys/ru.md>Подключение к серверу с помощью SSH-ключей</a>.
<p align="center"><img alt="кодировка mysql" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_01.png width=1024></p>

## Установка MySQL

В сервере Ubuntu 24.04 для установки MySQL мы воспользуемся репозиторием пакетов **APT**. На данный момент версия MySQL, доступная в репозитории Ubuntu по умолчанию, – это версия 8.0.41.
Для корректной установки MySQL последней версии обновим список пакетов с помощью указанной утилиты, запущенной от прав суперпользователя:

>Запуск всех команд идет от имени суперпользователя.
>
```
sudo apt update
```
При необходимости проведем обновление старых версий пакетов на новые:
```
sudo apt upgrade
```
После успешного обновления переходим к процедуре установки:
```
sudo apt-get install mysql-server
```
<p align="center"><img alt="запуск установки mysql" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_02.png width=1024></p>

После завершения установки запуск сервиса MySQL произойдет автоматически. Проверим, 
что установка прошла успешно и сервис MySQL запущен:
```
sudo systemctl start mysql.service
```
Дополнительно можно проверить статус сервиса MySQL с помощью команды:
```
sudo systemctl status mysql
```
<p align="center"><img alt="проверка статуса службы" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_03.png width=1024></p>

Если есть необходимость в проверке сетевого статуса сервиса, то его можно провести с помощью команды:
```
sudo ss -tap | grep mysql
```
<p align="center"><img alt="проверка сетевого статуса" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_04.png width=1024></p>

Также дополнительно можно убедиться, что мы установили последнюю версию MySQL:
```
mysql --version
```
<p align="center"><img alt="проверка версии mysql" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_05.png width=1024></p>

Если по каким-либо причинам сервис не запустился автоматически или статус отображается как неактивный, то необходимо перезапустить его:
```
sudo service mysql restart
```
Для того чтобы MySQL запускался автоматически при загрузке операционной системы выполним команду:
```
sudo systemctl enable mysql
```
Убедиться, что MySQL запускается вместе с операционной системой монжо с помощью команды:
```
sudo systemctl is-enabled mysql.service
```
На этом установка завершена, переходим к настройкам установленного сервера MyQSL.

## Настройка MySQL

После успешной установки сервера MySQL создается основной каталог конфигурации **/etc/mysql/**. В данном каталоге содержится файл конфигурации сервера баз данных MySQL – **my.cnf**. Для того, чтобы провести установку пользовательских параметров отредактируйте файл **.my.cnf** из директории **$HOME/.my.cnf**.  
Вы можете самостоятельно провести дополнительные настройки сервера MySQL, такие как ведение log-файла, номер порта, IP-адрес и другие, путем редактирования файлов **mysql.cnf** и **mysqld.cnf** с помощью текстового редактора nano или vim, находящиеся в директориях **/etc/mysql/conf.d/** и **/etc/mysql/mysql.conf.d/** соответственно. 
<p align="center"><img alt="файл mysql.cnf" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_06.png width=1024></p>

<p align="center"><img alt="файл mysqld.cnf" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_07.png width=1024></p>

После внесения изменений в конфигурационные файлы, необходимо провести перезапуск сервиса MySQL:
```
sudo systemctl restart mysql.service
```
У сервера MySQL есть журнал службы, просмотреть который можно с помощью:
```
sudo journalctl -u mysql.service
```
<p align="center"><img alt="журнал службы" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_08.png width=1024></p>

Если необходимо посмотреть журнал службы более подробно воспользуйтесь командой:
```
sudo journalctl -u mysql.service -xe
```
<p align="center"><img alt="журнал службы подробно" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_09.png width=1024></p>

Файл журнала ошибок MySQL сервера по умолчанию расположен в /var/log/mysql/error.log. Посмотреть последние записи можно с помощью:
```
sudo tail -f /var/log/mysql/error.log
```
<p align="center"><img alt="проверка log-файла" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_10.png width=1024></p>

Выход из логов: CTRL+Z.

После первой установки MySQL необходимо провести улучшение безопасности. Для этого служит mysql_secure_installation – интерактивный скрипт безопасности, включенный в систему управления базами данных. Данный скрипт проводит изменение некоторых параметров безопасности по умолчанию, например, запрещает удаленный вход в систему с правами суперпользователя и удаляет выборочных пользователей.
```
sudo mysql_secure_installation
```
После запуска скрипта начинается диалог, в процессе которого мы внесем изменения в параметры безопасности установленного MySQL. Первым будет задан вопрос о необходимости настройки плагина проверки паролей, который можно использовать для проверки надежности паролей новых пользователей MySQL, до того, как они будут приняты системой. Если плагин будет включен, то все созданные пользователи будут проходить процедуру аутентификации с помощью пароля, соответствующего выбранной политике.
<p align="center"><img alt="запуск скрипта безопасности" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_11.png width=1024></p>

Выберем уровень сложности пароля для работы плагина проверки паролей. Уровня три: 0 Низкий, 1 Средний и 2 Высокий. Какой уровень выбрать решать Вам, а мы выберем максимальный уровень.
<p align="center"><img alt="уровень сложности пароля" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_12.png width=1024></p>
На текущем этапе настройки должна произойти установка пароля пользователю root, но поскольку по умолчанию используется аутентификация с помощью auth_socket, установка будет пропущена. Если для пользователя root уже была выполнена настройка аутентификации по паролю, то установите пароль в соответствии с уровнем сложности выбранном на предыдущем этапе.
<p align="center"><img alt="пароль для суперпользователя" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_13.png width=1024></p>

На следующем шаге будет предложено удалить анонимных пользователей, которые были созданы самим сервисом автоматически, выбираем согласиться:
<p align="center"><img alt="удаление анонимных пользователей" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_14.png width=1024></p>

Теперь запрос на отключение удалённого входа root пользователя, также соглашаемся:
<p align="center"><img alt="отключение удаленного входа" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_15.png width=1024></p>

Аналогично поступаем с удалением созданных тестовых баз данных:
<p align="center"><img alt="удаление тестовых таблиц" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_16.png width=1024></p>

Соглашаемся с перезагрузкой привилегий:
<p align="center"><img alt="перезагрузка привилегий" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_17.png width=1024></p>

Настройка завершена, MySQL немедленно учел внесенные изменения и готов к работе. 

Следующим шагом проведем настройку аутентификации для учетной записи root.

## Настройка аутентификации для root

Входим в консоль MySQL:
```
sudo mysql
```
Перед настройкой аутентификации проверим версию, статус и параметры нашего сервера:
```
STATUS;
```
<p align="center"><img alt="проверка статуса сервера" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_18.png width=1024></p>

>Так как все настройки будут проходит путем отправки SQL-запросов к базе данных, каждая команда должна оканчиваться **;**

По умолчанию в установках Ubuntu учетная запись root не настроена для подключения к службам с использованием пароля. Для того, чтобы установить доступ к службе MySQL по паролю для данной учетной записи, необходимо провести изменение плагина авторизации с auth_socket на caching_sha2_password.  
Далее нам необходимо выполнить запрос пользователей с типом их авторизации:
```
SELECT user,authentication_string,plugin,host FROM mysql.user;
```
<p align="center"><img alt="таблица пользователей mysql" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_19.png width=1024></p>

В результате запроса в списке пользователей видно, что у пользователя root в значении plugin стоит auth_socket, а значение authentication_string пусто. Проведем обновление плагина авторизации и установим пароль (в качестве примера установлен пароль ~MysqlU24, помните, что создаваемый пароль должен удовлетворять требованиям, установленным Вами в плагине проверки паролей):
```
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY ' ~MysqlU24';
```
Применим проведенные изменения:
```
FLUSH PRIVILEGES;
```
<p align="center"><img alt="установка пароля пользователю root" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_20.png width=1024></p>

Не все приложения, которые работают с севером MySQL, поддерживают надежную работу с плагином безопасности **caching_sha2_password**. При необходимости установите плагин **mysql_native_password** для повышения надежности. Настройка аутентификации завершена, выходим с помощью exit.

Теперь для подключения к базе данных потребуется ввести: 
```
mysql -u root –p
```
При попытке подключения с помощью команды sudo mysql будет выведена ошибка доступа.
<p align="center"><img alt="проверка входа без пароля" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_21.png width=1024></p>
 
Если вам требуется вернуться в методу аутентификации по умолчанию и выполнять подключение к MySQL как суперпользователь root с помощью команды sudo mysql необходимо выполнить подключение к MySQL с помощью имени пользователя и пароля. Далее возвращаем настройки аутентификации по умолчанию с помощью команды:
```
ALTER USER 'root'@'localhost' IDENTIFIED WITH auth_socket;
```
<p align="center"><img alt="вход root с паролем" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_22.png width=1024></p>

## Создание пользователя и предоставление привилегий в MySQL

После создания и настройки MySQL сервера может возникнуть необходимость в создании пользователя с набором определенных прав и привилегий. Создадим пользователя sysadmin с помощью команды:
```
CREATE USER 'sysadmin'@'localhost' IDENTIFIED BY '~MysqlU241';
```
В примере мы создаем пользователя sysadmin с паролем ~MysqlU241.
<p align="center"><img alt="создание пользователя" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_23.png width=1024></p>

<p align="center"><img alt="проверка создания пользователя" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_24.png width=1024></p>

Предоставим права на работу с базой данных созданному пользователю:
```
GRANT CREATE, ALTER, DROP, INSERT, UPDATE, DELETE, SELECT, REFERENCES, RELOAD on *.* TO 'sysadmin'@'localhost' **WITH GRANT** OPTION;
```
<p align="center"><img alt="предоставление прав пользователю" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_25.png width=1024></p>

Обратите свое внимание, что предоставление прав пользователю выполнено с использованием параметра WITH GRANT. Это позволит вашему пользователю MySQL предоставлять любые разрешения, которые у него есть, другим пользователям в системе. 

Если есть необходимость в предоставлении всех привилегий созданному пользователю, то стоит воспользоваться командой:
```
GRANT ALL PRIVILEGES ON *.* TO 'sysadmin'@'localhost' WITH GRANT OPTION;
```

>Будьте внимательны при предоставлении привилегий пользователю. Параметр **ALL PRIVILEGES** предоставит пользователю широкие привилегии, как у суперпользователя. Такие широкие привилегии позволят ему иметь полный контроль над каждой базой данных на сервере. Для просмотра назначенных прав и привилегий пользователю используем команду:
```
SHOW GRANTS FOR 'sysadmin'@'localhost';
```
<p align="center"><img alt="просмотр прав и привилегий пользователя" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_26.png width=1024></p>

Для того, чтобы изменения вступили в силу, рекомендуется выполнить команду по обновлению привилегий и прав пользователей:
```
FLUSH PRIVILEGES;
```
Если возникнет необходимость отозвать предоставленные пользователю права и привилегии, воспользуйтесь командой:
```
REVOKE ALL PRIVILEGES ON *.* FROM 'sysadmin'@'localhost';
```
<p align="center"><img alt="удаление привилегий пользователя" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_27.png width=1024></p>

Создание и настройка пользователя на этом завершена. Можно проверить его работу и подключиться с использованием его имени и пароля.

Если в процессе работы потребуется удаление созданного пользователя, то воспользуйтесь командой:
```
DROP USER 'sysadmin'@'localhost';
```
<p align="center"><img alt="удаление созданного пользователя" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_28.png width=1024></p>

Пользователь удален, теперь не отображается в таблице пользователей MySQL.

Возможно потребуется удаление установленного сервера MySQL. 
Чтобы удаление произошло корректно и не было выполнения службы, выполним:
```
sudo systemctl stop mysql
```
Для того чтобы провести удаление сервера также необходимо воспользоваться репозиторием APT. При выполнении команды будет произведено удаление всех баз данных и самого сервера:
```
sudo apt-get remove mysql-server
```
<p align="center"><img alt="удаление сервера mysql" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_29.png width=1024></p>

Были удалены основные пакеты MySQL, но не конфигурационные файлы, логи и каталоги.
<p align="center"><img alt="удаление каталогов сервера" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_30.png width=1024></p> 

Удалим конфигурационные каталоги с файлами и логами:
```
rm -rf /etc/mysql /var/lib/mysql /var/log/mysql
```
<p align="center"><img alt="проверка удаления каталогов" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_31.png width=1024></p>

Проведем удаление всех пакетов, установленных как зависимости MySQL:
```
apt autoremove
```
<p align="center"><img alt="проверка удаления пакетов" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_32.png width=1024></p>

Если у вас были создан специальный пользователь для MySQL, нужно удалить 
и его, выполнив последовательно команды:
```
deluser mysql
rm -rf /home/mysql
```
Проведем проверку полного удаления сервера MySQL с использованием команды проверки процесса:
<p align="center"><img alt="проверка статуса службы" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_33.png width=1024></p>

Если были выведены данные о неполной остановке демона MySQL, выполните:
```
sudo systemctl daemon-reload
```
<p align="center"><img alt="остановка службы" src=/topics/databases/how-to-install-mysql-on-ubuntu-server/static/ru_image_34.png width=1024></p>

Сервер MySQL со всеми пакетами был успешно удален из системы.

## Краткие итоги

1. На сегодняшний день MySQL сервер является распространенной системой управления базами данных, используемой в операционных системах Linux.
2. Для установки MySQL в ручном режиме предпочтительней пользоваться репозиторием APT.
3. После установки сервера необходимо в обязательном порядке провести улучшение безопасности. 
4. Суперпользователю root доступно подключение к серверу как в парольном, так и беспарольном варианте.
