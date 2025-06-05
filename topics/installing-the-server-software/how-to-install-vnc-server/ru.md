# Настройка удаленного рабочего стола через VNC на Ubuntu 24.04 

## Введение
VNC (Virtual Network Computing) в Ubuntu – это графическая система совместного использования рабочего стола, которая использует протокол Remote Frame Buffer для удаленного управления другим компьютером. Она функционирует по модели клиент-сервер, передает события клавиатуры и мыши с одного компьютера на другой, одновременно ретранслируя графические обновления экрана в обратном направлении по сетевому соединению. С помощью VNC можно администрировать и отлаживать системы без физического присутствия. 

## Подготовка системы

> Вам потребуются привилегии sudo для установки пакетов и настройки параметров системы.

Перед установкой проведем обновление системы, чтобы убедиться, что установлены последние версии пакетов и исправлений безопасности:
```
sudo apt-get update && sudo apt-get upgrade
```
<p align="center"><img alt="обновление пакетов" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_01.png width=1024></p>

Если Вы используете Ubuntu Server без графического интерфейса, Вам потребуется установить среду рабочего стола. Ubuntu 24.04 предлагает несколько вариантов:  
• GNOME: среда рабочего стола Ubuntu по умолчанию, многофункциональная, но ресурсоемкая.  
• XFCE: облегченная среда рабочего стола, идеально подходящая для сценариев удаленного доступа.  
• KDE Plasma: настраиваемое окружение рабочего стола с современными функциями и красивым дизайном.  
• MATE: легкая традиционная компоновка окружения рабочего стола.  
• LXQt: очень легкая и быстрая среда рабочего стола для старых систем.  
Для установки VNC-сервера мы будем использовать систему XFCE, как самую легковесную и быструю. Установим её:
```
sudo apt install xfce4 xfce4-goodies
```
<p align="center"><img alt="установка рабочего стола" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_02.png width=1024></p>

Если Вы предпочитаете GNOME (рабочий стол Ubuntu по умолчанию), то его можно установить с помощью команды::

```
sudo apt install ubuntu-gnome-desktop
```


## Установка VNC сервера

После успешной подготовки системы, установим VNC-сервер. Для Ubuntu 24.04 доступно несколько реализаций VNC-серверов:  
• TigerVNC: высокопроизводительный, надежный VNC-сервер с активным сообществом разработчиков.  
• x11vnc: пакет присутствует в стандартных репозиториях большинства дистрибутивов Linux. Полезен для совместного использования существующих сеансов рабочего стола.  
• TightVNC: эффективный VNC-сервер, ориентированный на оптимизацию пропускной способности.  
• RealVNC Server:  коммерческое решение для удалённого доступа к серверу для различных дистрибутивов Linux.  
В данной статье мы будем использоавть TigerVNC, который предлагает оптимальный баланс функционала и производительности.  

Установим сервер TigerVNC:
```
sudo apt install tigervnc-standalone-server tigervnc-common
```
<p align="center"><img alt="установка сервера" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_03.png width=1024></p>

Убедимся, что TigerVNC был установлен правильно, проверив его версию:
```
vncserver --version
```
<p align="center"><img alt="проверка версии" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_04.png width=1024></p>

## Настройка VNC сервера

Установим пароль для доступа к VNC:
```
vncpasswd
```
<p align="center"><img alt="установка пароля" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_05.png width=1024></p>

Нам предложено ввести и подтвердить пароль. Этот пароль потребуется при подключении к VNC-серверу. В целях безопасности обязательно задавайте надежный пароль.  

При необходимости Вы можете установить пароль для режима view-only. Режим «только просмотр» разрешает пользователю видеть удаленный рабочий стол, но запрещает ему изменять какие-либо данные на нем.  

Запустим VNC-сервер один раз для генерации исходных конфигурационных файлов:
```
vncserver
```
<p align="center"><img alt="запуск сервера" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_06.png width=1024></p>

При этом в домашней папке будет создан каталог .vnc и он будет заполнен файлами конфигурации по умолчанию.  
Остановим сервер для изменения этих файлов:
```
vncserver -kill :1
```
<p align="center"><img alt="остановка сервера" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_07.png width=1024></p>

Файл xstartup определяет, какая среда рабочего стола запускается при подключении к VNC.  
Отредактируем этот файл:
```
nano ~/.vnc/xstartup
```
Для XFCE заменим содержимое на:
```
#!/bin/bash
xrdb $HOME/.Xresources
startxfce4 &
```
<p align="center"><img alt="редактирование файла" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_08.png width=1024></p>

Для среды рабочего стола GNOME:
```
#!/bin/bash
xrdb $HOME/.Xresources
export XKL_XMODMAP_DISABLE=1
/etc/X11/Xsession
gnome-session &
```
Для среды рабочего стола KDE Plasma:
```
#!/bin/bash
xrdb $HOME/.Xresources
export XKL_XMODMAP_DISABLE=1
/etc/X11/Xsession
startplasma-x11 &
```
Сохраним файл (Ctrl+O, затем Enter) и выйдем (Ctrl+X).\
Сделаем файл исполняемым:
```
chmod +x ~/.vnc/xstartup
```
На этом настройка завершена, переходим к запуску и управлению сервером VNC.

## Запуск и управление VNC сервером

Запустим свой VNC-сервер:
```
vncserver -localhost no
```

Опция позволяет подключаться с внешних компьютеров. Без этой опции были бы разрешены только подключения с локальной машины.

<p align="center"><img alt="запуск сервера" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_09.png width=1024></p>


При успешном выполнении команды увидим «New 'X' desktop is your_hostname:1», это означает, что сервер VNC работает на дисплее :1 (обычно порт 5901). Серверы VNC используют номера отображения, соответствующие определенным сетевым портам:  
• Дисплей :1 соответствует порту 5901  
• Дисплей :2 соответствует порту 5902 и так далее.  
Номер порта рассчитывается как 5900 + номер дисплея.  
TigerVNC предлагает множество опций командной строки для настройки сервера:  
• geometry WIDTHxHEIGHT: Установка разрешения экрана  
• depth DEPTH: Устанавливает глубину цвета (16, 24 и т.д.)  
• localhost yes/no: Определяет, разрешены ли удаленные подключения  
• name NAME: Устанавливает имя для сеанса рабочего стола  
Для примера запустим сервер VNC с разрешением Full HD, 24-битной глубиной цвета, пользовательским именем и позволим удаленное подключение:  
```
vncserver -geometry 1920x1080 -depth 24 -name "Ubuntu Remote Desktop" -localhost no :1
```

Обеспечим запуск VNC-сервера автоматически при загрузке, создав службу в операционной системе:
```
sudo nano /etc/systemd/system/vncserver@.service
```
Добавим следующие данные:
```
[Unit]
Description=Start TigerVNC server at startup
After=syslog.target network.target

[Service]
Type=forking
User=your_username
Group=your_username
WorkingDirectory=/home/your_username

PIDFile=/home/your_username/.vnc/%H:%i.pid
ExecStartPre=-/usr/bin/vncserver -kill :%i > /dev/null 2>&1
ExecStart=/usr/bin/vncserver -depth 24 -geometry 1920x1080 -localhost no :%i
ExecStop=/usr/bin/vncserver -kill :%i

[Install]
WantedBy=multi-user.target
```

Замените your_username своим фактическим именем пользователя.

<p align="center"><img alt="автозапуск сервера" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_10.png width=1024></p>

Проведем включение и запуск службы:

```
sudo systemctl daemon-reload
sudo systemctl enable vncserver@.service
sudo systemctl start vncserver@.service
```
<p align="center"><img alt="перезапуск служб" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_11.png width=1024></p>

Мы создали службу, которая запускает сервер VNC на дисплее :1 при загрузке системы.

## Настройка брандмауэра

При использовании UFW (Uncomplicated Firewall), необходимо разрешить трафик VNC:
```
sudo ufw allow 5901/tcp
```
<p align="center"><img alt="настройка брандмауэра" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_12.png width=1024></p>

При работе с несколькими дисплеями, потребуется разрешить дополнительные порты:
```
sudo ufw allow 5901:5905/tcp
```
При использовании IPTables напрямую, потребуется разрешить трафик VNC:
```
sudo iptables -A INPUT -p tcp --dport 5901 -j ACCEPT 
sudo iptables-save
```
<p align="center"><img alt="настройка iptables" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_13.png width=1024></p>

Также необходимо провести сохранение этих правил:
```
sudo apt install iptables-persistent
sudo netfilter-persistent save
```
Проверим на стройку брандмауэра и IPTables:
```
sudo ufw status
```

<p align="center"><img alt="статус ufw" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_14.png width=1024></p>

```
sudo iptables -L
```

<p align="center"><img alt="статус iptables" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_15.png width=1024></p>

Эти команды отображают текущие правила брандмауэра, позволяя проверить, правильно ли разрешены порты VNC.

## Подключение к VNC серверу

После того как сервер VNC запущен и брандмауэр настроен, подключимся с клиентского устройства.  
Для разных платформ доступны различные VNC-клиенты:  
• Linux: TigerVNC Viewer, Remmina  
• Windows: TightVNC Viewer, RealVNC Viewer  
• macOS: RealVNC  
• Android и iOS: VNC Viewer   

Для подключения к VNC-серверу потребуется ввести: 
```
your_server_ip:1
```
В некоторых случаях может потребоваться указать полный формат с номером порта:
```
your_server_ip:5901
```
<p align="center"><img alt="удаленное подключение" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_16.png width=1024></p>

Рабочийстол будет выглядеть следующим образом:
<p align="center"><img alt="удаленный рабочий стол" src=/topics/installing-the-server-software/how-to-install-vnc-server/static/ru_image_17.png width=1024></p>
VNC не был разработан с учетом высоких требований к безопасности, поэтому для защиты удаленного рабочего стола мы рекомендуем применить туннелирование через SSH. 

Такой подход обеспечит шифрование VNC-соединений.

Для направления трафика VNC через зашифрованный туннель SSH запустим сервер с использованием параметра:
```
vncserver -localhost yes
```

Параметр гарантирует, что VNC-сервер принимает соединения теперь только с localhost. 

Выполним подключение через туннель SSH с клиентского компьютера:
```
ssh -L 5901:localhost:5901 username@your_server_ip
```

Дополнительно можно создать отдельного пользователя для доступа к VNC-серверу:
```
sudo adduser vncuser
sudo usermod -aG sudo vncuser
```

Включим общий доступ к буферу обмена, чтобы копировать текст между локальными и удаленными компьютерами:
```
vncserver -AllowClipboardTransfer=yes :1
```
Также данный сервер поддерживает передачу файлов. Включить данную возможность можно с помощью команды:
```
vncserver -AllowFileDrag=true :1
```

Если возникла необходимость удалить VNC-сервер и конфигурацию, воспользуйтесь командой:
```
sudo apt purge tigervnc-standalone-server tigervnc-common
rm -rf ~/.vnc
```

## Заключение

Мы рассмотрели этапы установки и настройки VNC-сервера для создания удаленного рабочего стола. Уделите особое внимание безопасности при создании таких подключений. Используйте надежные пароли и ограничьте доступ к VNC  с помощью брандмауэра.  
Обязательно создавайте SSH-туннели для защиты Ваших данных.
