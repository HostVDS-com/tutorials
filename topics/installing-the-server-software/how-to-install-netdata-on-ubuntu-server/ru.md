# Настройка мониторинга через NetData на Ubuntu 24.04

## Введение

NetData – инструмент с открытым исходным кодом для мониторинга производительности сервера Linux в режиме реального времени с веб-интерфейсом. Написанный на языке программирования C, NetData является сверхбыстрым и ресурсосберегающим.  
NetData может отслеживать следующие параметры сервера:  
• Загрузка ядер CPU  
• Использование оперативной памяти  
• Использование накопителей информации  
• Пропускную способность сети  
• Параметры брандмауэра  
• Данные о процессах в системе  
• Характеристики системных приложений  
• Статус Apache и Nginx  
• Работу базы данных MySQL  
• Очередь сообщений почтового сервера Postfix  
• Данные от аппаратных датчиков (температура, напряжение, влажность и др.)

## Подготовка системы

> Вам потребуются привилегии sudo для установки пакетов и настройки параметров системы.

Перед установкой проведем обновление системы:
```
sudo apt-get update && sudo apt-get upgrade
```
<p align="center"><img alt="обновление пакетов" src=/topics/installing-the-server-software/how-to-install-netdata-on-ubuntu-server/static/ru_image_01.png width=1024></p>

После успешной подготовки системы проведем установку необходимых зависимостей:
```
sudo apt-get install curl software-properties-common
```
<p align="center"><img alt="установка зависимостей" src=/topics/installing-the-server-software/how-to-install-netdata-on-ubuntu-server/static/ru_image_02.png width=1024></p>

## Установка NetData

Netdata входит в репозитории многих дистрибутивов Linux. Однако, скорее всего, это не последняя версия. Чтобы получить последнюю версию, необходимо воспользоваться официальным скриптом NetData для установки программного обеспечения. Этот метод удобен и автоматически установит все необходимые компоненты. Выполним следующую команду в нашей системе:
```
bash <(curl -Ss https://my-netdata.io/kickstart-static64.sh)
```
Стоит отметить, что команда приведена для 64-битной операционной системы, для 32-битной выполните комнаду:
```
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```
<p align="center"><img alt="установка нетдата" src=/topics/installing-the-server-software/how-to-install-netdata-on-ubuntu-server/static/ru_image_03.png width=1024></p>

Установка и обновление NetData успешно завершено.  
После установки запустим, включим и проверим состояние Netdata:
```
sudo systemctl start netdata
sudo systemctl enable netdata
sudo systemctl status netdata
```
<p align="center"><img alt="запуск проверка" src=/topics/installing-the-server-software/how-to-install-netdata-on-ubuntu-server/static/ru_image_04.png width=1024></p>

## Настройка NetData

Проведем настройку доступа к панели мониторинга. После установки, Netdata будет доступен по адресу http://<your_server_ip>:19999. 

В случае, если на сервере используется брандмауэр, то вам необходимо открыть соответствующий TCP порт. По умолчанию Netdata прослушивает порт 19999. Проверим, что сервис корректно работает с помощью _netstat_:
```
sudo netstat -pnltu | grep netdata
```
<p align="center"><img alt="проверка портов" src=/topics/installing-the-server-software/how-to-install-netdata-on-ubuntu-server/static/ru_image_05.png width=1024></p>

Для того, чтобы разрешить соответствующий порт в брандмауэре и перезапустить его выполним команды:

```
sudo ufw allow 19999/tcp
sudo ufw reload
```

Если вы хотите изменить порт или ограничить доступ по IP, отредактируйте конфигурационный файл:
```
sudo nano /etc/netdata/netdata.conf
```
<p align="center"><img alt="редактирование файла" src=/topics/installing-the-server-software/how-to-install-netdata-on-ubuntu-server/static/ru_image_06.png width=1024></p>

Если конфигурационный файл после проведенной установки не содержит никакой информации по настройкам NetData, то необходимо выполнить запрос файла конфигурации с помощью команды:
```
sudo wget –O /etc/netdata/netdata.conf http://localhost:19999/netdata.conf
```
После выполнения данной команды повторите открытие и редактирование файла с помощью предыдущей команды.
<p align="center"><img alt="редактир_файла" src=/topics/installing-the-server-software/how-to-install-netdata-on-ubuntu-server/static/ru_image_07.png width=1024></p>

В файле netdata.conf найдите строки **bind to** и **allow connections from**:

Для изменения порта на 20001 задайте следующее значение строки **bind to**: 

```
bind to = 127.0.0.1:20001
```

Для ограничения доступа по IP укажите нужный IP-адрес в строке **allow connections from**.  
Например, если Вы хотите, чтобы подключение выполнялось только с IP-адреса **192.168.0.5**, то строка должна выглядеть вот так:

```
allow connections from = 192.168.0.5/24
```

После внесения изменений, сохраните файл и перезапустите Netdata:
```
sudo systemctl restart netdata
```

Если Вы измените порт, то необходимо дополнительно разрешить его в брандмауэре и запретить предыдущий:

```
sudo ufw deny 19999/tcp
sudo ufw allow 20001/tcp
sudo ufw reload
```

По умолчанию Netdata отслеживает множество системных параметров и служб. Также она позволяет добавлять мониторинг дополнительных сервисов или приложений, для этого необходимо провести настройки в соответствующих конфигурационных файлах, находящихся в директории /etc/netdata/.

Проверим доступность и работу NetData на нашей операционной системе. Подключимся к ней с помощью браузера.
<p align="center"><img alt="дашборд нетдата" src=/topics/installing-the-server-software/how-to-install-netdata-on-ubuntu-server/static/ru_image_08.png width=1024></p>

## Обновление и удаление Netdata

После установки с помощью скрипта Netdata добавляет задание **cron ()** для автоматического ежедневного обновления программного. Если по каким-либо причинам обновление не происходит, можно провести обновление вручную с помощью команды:
```
sudo /usr/libexec/netdata/netdata-updater.sh
```
<p align="center"><img alt="обнов_нетдата" src=/topics/installing-the-server-software/how-to-install-netdata-on-ubuntu-server/static/ru_image_09.png width=1024></p>

Если вам потребуется удалить Netdata с сервера воспользуйтесь скриптом:
```
sudo /usr/libexec/netdata/netdata-uninstaller.sh
```

## Защита Netdata

По умолчанию в NetData не предусмотрено никакой аутентификации при подключении по http. 
Мы рекомендуем выполнить настройку базовой http-аутентификации с вводом логина и пароля, а также подключение по https. Очень подробно механизм настройки разобран в нашей статье [Как установить phpMyAdmin на Ubuntu 24.04](https://github.com/HostVDS-com/tutorials/blob/main/topics/installing-the-server-software/how-to-install-phpmyadmin-on-ubuntu-server/ru.md). Рекомендуем ознакомиться и обеспечить дополнительную защиту данных при работе с NetData.

## Заключение

Netdata – это мощный и простой в использовании инструмент для мониторинга производительности в режиме реального времени. Вы можете настроить веб-интерфейс в соответствии с вашими конкретными потребностями. Следуя шагам, описанным в этой статье, Вы можете легко установить и выполнить первоначальную настройку Netdata.
