# Как установить Samba на Ubuntu 24.04

## Создание сервера
Создадим сервер на [HostVDS](https://hostvds.com/control/servers/new). 
> Выбирайте сервер исходя из Ваших требований к системе

В качестве примера мы остановились на тарифном плане Burstable, 8 Gb, 3 CPU:

<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_01.png width=1024></p>

Выбрали образ Ubuntu 24.04:

<p align="center"><img alt="Создадим сервер на HostVDS" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_02.png width=1024></p>

После создания сервера и подключения к нему по SSH приступаем к настройке системы.

## Подготовка системы

Обновим систему до последних версий пакетов:

```
sudo apt update && sudo apt upgrade -y
```

Установим WireGuard (WG) и ufw:

```
sudo apt install wireguard qrencode ufw -y	
```

Включим маршрутизацию для корректной работы WG и Samba.  
Открываем файл:

```
sudo nano /etc/sysctl.conf
```


Найдём строку:

```
#net.ipv4.ip_forward=1
```

Снимем комментарий.
Результат:

<p align="center"><img alt="Настройка маршрутизации" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_03.png width=1024></p>

Сохраняем Ctrl+O, выходим из файла Ctrl+Z. Применим изменения:

```
sudo sysctl -p
```

Результат:

<p align="center"><img alt="Результат настройки маршрутизации" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_04.png width=1024></p>

Настроим ufw. Разрешим порт управления:
> Замените порт 22 на Ваш реальный порт управления сервером:

```
sudo ufw allow 22
```

Разрешим порт WireGuard:

```
sudo ufw allow 51820/udp
```

Разрешим форвардинг для VPN-сети

```
sudo ufw route allow in on wg0 out on eth0 && sudo ufw route allow in on eth0 out on wg0
```

Открываем порты для Samba только внутри сети 10.10.10.0:

```
sudo ufw allow from 10.10.10.0/24 to any port 445 && sudo ufw allow from 10.10.10.0/24 to any port 139
```

Включаем и проверяем правильность настройки:

```
sudo systemctl start ufw && sudo ufw enable && sudo ufw status verbose
```

<p align="center"><img alt="Результат настройки ufw" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_05.png width=1024></p>

## Настройка Wireguard

Протокол SMB/Samba предназначен только для локальных сетей. Если Вы откроете его порты наружу, сервер станет мишенью для взломщиков. Для защиты подключений мы настроили ufw и дополнительно будем использовать туннели через WireGuard.  
Создаем директорию, в которой будем хранить ключи WG:

```
cd && mkdir wg && cd wg
```

Зададим маску прав доступа по умолчанию для всех новых файлов и папок, создаваемых в текущей сессии:  
•	Только владелец сможет читать, писать и (для папок) выполнять (rwx------).  
•	Для всех остальных — никаких прав.

```
umask 077
```

Генерируем публичный и приватный ключи для WG:

```
wg genkey | tee server_private.key | wg pubkey > server_public.key
```

где  
•	server_private.key — приватный ключ сервера;  
•	server_public.key — публичный ключ сервера, который будет использоваться клиентами.  
Создаем файл конфигурации WireGuard сервера:

```
sudo nano /etc/wireguard/wg0.conf
```

```
[Interface]
Address = 10.10.10.1/24
ListenPort = 51820
PrivateKey = 
SaveConfig = true

PostUp = ufw route allow in on wg0 out on eth0
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = ufw route delete allow in on wg0 out on eth0
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
```

Вставляем содержимое server_private.key в конфиг:

```
sudo sed -i "s|^PrivateKey *=.*|PrivateKey = $(cat ~/wg/server_private.key)|" /etc/wireguard/wg0.conf
```

Результат на скриншоте:

<p align="center"><img alt="Результат настройки /etc/wireguard/wg0.conf" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_06.png width=1024></p>

Создадим ключ для сотрудника:

```
wg genkey | tee client1_private.key | wg pubkey > client1_public.key
```

Добавим клиента в серверный конфиг. Открываем файл:

```
sudo nano /etc/wireguard/wg0.conf
```

Вставим в конфиг строчки:
> Замените <Содержимое client1_public.key> на ключ из client1_public.key

```
[Peer]
PublicKey = <Содержимое client1_public.key>
AllowedIPs = 10.10.10.2/32
```

<p align="center"><img alt="добавляем peer в /etc/wireguard/wg0.conf" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_07.png width=1024></p>

Включаем wireguard и интерфейс wg0:

```
sudo systemctl start wg-quick@wg0 && sudo systemctl enable wg-quick@wg0 && sudo systemctl status wg-quick@wg0
```

<p align="center"><img alt="включаем wireguard" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_08.png width=1024></p>

Создадим клиентский конфиг:

```
nano client1.conf
```

Вставьте в него конфигурацию:
> Замените <Содержимое client1_private.key> на Ваши данные

> Замените <Содержимое server_public.key> на Ваши данные

> Замените <Внешний_IP_Сервера> на Ваш IP-адрес

> Для каждого следующего клиента изменяйте параметры Address и client1_private.key

```
[Interface]
PrivateKey = <Содержимое client1_private.key>
Address = 10.10.10.2/32
DNS = 8.8.8.8

[Peer]
PublicKey = <Содержимое server_public.key>
Endpoint = <Внешний_IP_Сервера>:51820
AllowedIPs = 10.10.10.0/24
PersistentKeepalive = 25
```

<p align="center"><img alt="клиентский конфиг wireguard" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_09.png width=1024></p>

На клиентской машине в командной строке вводим команду копирования через scp:

```
scp <имя пользователя>@<IP-адрес сервера>:/home/<имя пользователя> >/wg/client1.conf C:\Users\<имя пользователя>\Downloads\
```

Пример:

```
scp jetcry@46.8.229.3:/home/jetcry/wg/client1.conf C:\Users\jetcry\Downloads\
```

На компьютере клиента устанавливаем  [Wireguard](https://www.wireguard.com/install/).  
Запускаем приложение, нажимаем «Добавить туннель». Выбираем сохраненный конфиг, затем – «Подключить».  
Результат:

<p align="center"><img alt="wireguard на клиенте" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_10.png width=1024></p>

## Установка и первоначальная настройка Samba

Установим Samba на сервер:

```
sudo apt install smbclient samba samba-common-bin acl -y
```

Проверим версию:

```
smbd --version
```

Результат:  
_Version 4.19.5-Ubuntu_  
Покажем логику настройки сервера на примере создания пользователя admin и группы admins.  
Перед настройкой создадим backup конфигурации Samba:

```
sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.backup
```

Создадим общую для всех группу common и директорию для нее:
```
sudo groupadd common
sudo mkdir -p /srv/samba/common
sudo chown -R root:common /srv/samba/common
sudo chmod 2775 /srv/samba/common
sudo find /srv/samba/common -type d -exec chmod 2775 {} \;
sudo find /srv/samba/common -type f -exec chmod 0664 {} \;
```

Создаем группу администраторов:

```
sudo groupadd admins
```

Создаем пользователя admin без домашней директории:

```
sudo useradd -M -s /usr/sbin/nologin admin
```

Добавим пользователя в группу admins:

```
sudo usermod -aG admins admin
```

Установим пароль Samba для пользователя:

```
sudo smbpasswd -a admin
```

Включим пользователя в samba:

```
sudo smbpasswd -e admin # 
```

Создаем личную папку пользователя на Samba

```
sudo mkdir -p /srv/samba/personal/admin
sudo chown admin:admins /srv/samba/personal/admin
sudo chmod 700 /srv/samba/personal/admin
```
здесь 700 — сам пользователь admin имеет полный доступ.  
Создадим директорию для группы:

```
sudo mkdir -p /srv/samba/admins
sudo chown root:admins /srv/samba/admins
sudo chmod 2770 /srv/samba/admins
sudo setfacl -m g:admins:rwx /srv/samba/admins
sudo setfacl -d -m g:admins:rwx /srv/samba/admins
```

где  
•	chown root:admins — владелец root, группа-владелец admins;  
•	chmod 2770: 2 — новые файлы/папки будут принадлежать группе admins; 770 —  только владелец и группа могут читать/писать/заходить, остальные — нет.  
•	setfacl -m g:admins:rwx — ACL даёт группе admins полный доступ;  
•	setfacl -d ... — то же самое, но по умолчанию для новых файлов/папок внутри.  
Проверяем: 
```
id admin
ls -ld /srv/samba/personal/admin
sudo pdbedit -L | grep admin
```
Результат:

<p align="center"><img alt="проверка пользователя admin" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_11.png width=1024></p>

Откроем файл с текущей конфигурацией Samba:

```
sudo nano /etc/samba/smb.conf
```

Добавляем в раздел **[global]** в начале файла

```
   # Безопасность
   hosts allow = 127.0.0.1 10.10.10.0/24
   hosts deny = ALL
   smb ports = 445
   min protocol = SMB2
   client min protocol = SMB2
   ntlm auth = no
```

В конец файла добавим разделы для групп:  
•	общая (common)  
•	с персональными данными (Personal)  
•	для пользователей admins (admins):

```
[common]
   path = /srv/samba/common
   browsable = yes
   read only = no
   guest ok = no
   valid users = @common

[Personal]
   path = /srv/samba/personal/%U
   browsable = no
   read only = no
   guest ok = no
   valid users = %U, @admins
   create mask = 0600
   directory mask = 0700
   root preexec = /bin/mkdir -p /srv/samba/personal/%U; /bin/chown %U:%U /srv/samba/personal/%U
 
[admins]
   path = /srv/samba/admins
   browsable = yes
   read only = no
   guest ok = no
   valid users = @admins
   write list = @admins
   create mask = 0664
   directory mask = 2775
```

<p align="center"><img alt="изменение /etc/samba/smb.conf" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_12.png width=1024></p>

Перезапустим Samba:

```
sudo systemctl restart smbd
```

Проверим, что пользователь admin настроен корректно:

```
smbclient //10.10.10.1/admins -U admin
```

Вывод:

<p align="center"><img alt="проверка пользователя admin" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_13.png width=1024></p>

## Автоматическое добавление пользователей

Теперь автоматизируем работу с помощью скрипта:

```
cd ~/wg/
```

```
nano add_samba_user.sh
```

Вставляем скрипт:

```
#!/bin/bash 

# Скрипт для добавления Samba-пользователя, группы, папки и раздела в smb.conf
# В каждый раздел доступ имеют @<group> и @admins. На уровне ФС добавляется ACL для admins
# Все пользователи автоматически добавляются в группу @common
# Использование скрипта: ./add_samba_user.sh <имя_пользователя> <группа>

set -e

if [ "$#" -ne 2 ]; then
  echo "Использование: $0 <имя_пользователя> <группа>"
  exit 1
fi

USERNAME="$1"
USERGROUP_RAW="$2"
USERGROUP=$(echo "$USERGROUP_RAW" | tr -d "'\"" | tr '[:upper:]' '[:lower:]' | xargs)

echo "DEBUG: USERGROUP=[$USERGROUP]"

SAMBA_BASE="/srv/samba"
PERSONAL_BASE="$SAMBA_BASE/personal"
COMMON_BASE="$SAMBA_BASE/common"
SMBCONF="/etc/samba/smb.conf"

# --- Функция добавления секции в smb.conf ---
add_group_section_to_smbconf() {
  local groupname="$1"
  local path="/srv/samba/$groupname"

  if grep -q "^\[$groupname\]" "$SMBCONF"; then
    echo "ℹ️ Раздел [$groupname] уже есть в $SMBCONF"
    return
  fi

  echo "" | sudo tee -a "$SMBCONF" >/dev/null
  echo "[$groupname]" | sudo tee -a "$SMBCONF" >/dev/null
  echo "   path = $path" | sudo tee -a "$SMBCONF" >/dev/null
  echo "   browsable = yes" | sudo tee -a "$SMBCONF" >/dev/null
  echo "   read only = no" | sudo tee -a "$SMBCONF" >/dev/null
  echo "   guest ok = no" | sudo tee -a "$SMBCONF" >/dev/null
  echo "   valid users = @$groupname, @admins" | sudo tee -a "$SMBCONF" >/dev/null
  echo "   write list = @$groupname, @admins" | sudo tee -a "$SMBCONF" >/dev/null
  echo "   create mask = 0664" | sudo tee -a "$SMBCONF" >/dev/null
  echo "   directory mask = 2775" | sudo tee -a "$SMBCONF" >/dev/null
  echo "✅ Раздел [$groupname] добавлен в $SMBCONF"
}

# --- Создание папок для common и personal ---
function make_shared_dir() {
  DIR="$1"
  OWNER="$2"
  DIRGRP="$3"
  MODE="$4"
  if [ ! -d "$DIR" ]; then
    sudo mkdir -p "$DIR"
    sudo chown "$OWNER:$DIRGRP" "$DIR"
    sudo chmod "$MODE" "$DIR"
    # Даем группе admins полный доступ через ACL (и наследование на новые файлы)
    sudo setfacl -m g:admins:rwx "$DIR"
    sudo setfacl -d -m g:admins:rwx "$DIR"
    echo "✅ Каталог $DIR создан с владельцем $OWNER:$DIRGRP, правами $MODE и доступом для группы admins (ACL)"
  else
    echo "ℹ️ Каталог $DIR уже существует"
    # Обновим права admins на всякий случай
    sudo setfacl -m g:admins:rwx "$DIR"
    sudo setfacl -d -m g:admins:rwx "$DIR"
  fi
}

make_shared_dir "$COMMON_BASE" root common 2775
make_shared_dir "$PERSONAL_BASE" root root 0771

# --- Для любой группы, кроме "common", создаём группу, папку, и секцию в smb.conf ---
if [ -n "$USERGROUP" ] && [ "$USERGROUP" != "common" ]; then
  if ! getent group "$USERGROUP" > /dev/null; then
    sudo groupadd "$USERGROUP"
    echo "✅ Группа $USERGROUP создана."
  fi
  # Создать группу admins, если её нет (один раз)
  if ! getent group admins > /dev/null; then
    sudo groupadd admins
    echo "✅ Группа admins создана."
  fi
  GROUP_DIR="$SAMBA_BASE/$USERGROUP"
  make_shared_dir "$GROUP_DIR" root "$USERGROUP" 2770
  add_group_section_to_smbconf "$USERGROUP"
fi

# --- Проверка что группа common существует ---
if ! getent group common > /dev/null; then
  sudo groupadd common
  echo "✅ Группа common создана."
fi

# --- Создание пользователя ---
if id "$USERNAME" &>/dev/null; then
  echo "ℹ️ Пользователь $USERNAME уже существует."
else
  sudo useradd -M -U -s /usr/sbin/nologin "$USERNAME"
  sleep 2
  echo "✅ Системный пользователь $USERNAME создан с персональной группой."
fi

# --- Добавление пользователя в группы ---
echo "DEBUG перед usermod: USERGROUP=[$USERGROUP]"

# Добавляем пользователя в указанную группу (кроме "common"), если надо
if [ -n "$USERGROUP" ] && [ "$USERGROUP" != "common" ]; then
  sleep 1
  sudo usermod -aG "$USERGROUP" "$USERNAME"
  echo "✅ Пользователь $USERNAME добавлен в группу $USERGROUP."
else
  echo "ℹ️ Пользователь без отдельной групповой папки (общий доступ)."
fi

# --- Всегда добавляем пользователя в группу common ---
sudo usermod -aG common "$USERNAME"
echo "✅ Пользователь $USERNAME добавлен в группу common (общая папка)."

# --- Персональная директория пользователя ---
USER_DIR="$PERSONAL_BASE/$USERNAME"
if [ ! -d "$USER_DIR" ]; then
  sudo mkdir -p "$USER_DIR"
  sudo chown "$USERNAME:$USERNAME" "$USER_DIR"
  sudo chmod 700 "$USER_DIR"
  echo "✅ Персональная директория $USER_DIR создана."
else
  echo "ℹ️ Директория $USER_DIR уже существует."
fi

# --- Samba ---
PASSWORD=$(< /dev/urandom tr -dc 'A-Za-z0-9!@#$%&_+=' | head -c 10)
echo -e "$PASSWORD\n$PASSWORD" | sudo smbpasswd -a "$USERNAME"
sudo smbpasswd -e "$USERNAME"

# --- Перезапуск Samba ---
echo "♻️ Перезапуск Samba (smbd)..."
sudo systemctl restart smbd
echo "✅ Samba перезапущена."

# --- Итоговый вывод ---
echo "=============================="
echo "✅ Пользователь $USERNAME успешно создан!"
echo "🔐 Логин: $USERNAME"
echo "🔐 Пароль: $PASSWORD"
echo "🏠 Личная папка: $USER_DIR"
echo "🗂️ Общая папка: $COMMON_BASE"
if [ "$USERGROUP" != "common" ]; then
  echo "🗂️ Групповая папка: $SAMBA_BASE/$USERGROUP"
  echo "🛡️ Раздел [$USERGROUP] добавлен в $SMBCONF (valid users = @$USERGROUP, @admins)"
fi
echo "🗂️ Доступ к папке common есть у всех пользователей (группа common)"
echo "=============================="
```

Делаем скрипт исполняемым:

```
chmod +x add_samba_user.sh
```


Результат создания пользователя admin1, который входит в группу admins:

```
sudo ./add_samba_user.sh admin1 admins
```

<p align="center"><img alt="Результат создания пользователя admin1" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_14.png width=1024></p>

Создадим пользователя ivan, который относится к отделу it:
sudo ./add_samba_user.sh ivan it

<p align="center"><img alt="Результат создания пользователя ivan" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_15.png width=1024></p>

Проверяем правильность работы скрипта.
Пользователь admin1 имеет доступ ко всем ресурсам:

```
smbclient //10.10.10.1/admins -U admin1
smbclient //10.10.10.1/common -U admin1
smbclient //10.10.10.1/personal -U admin1
smbclient //10.10.10.1/it -U admin1
```

<p align="center"><img alt="Пользователь admin1 имеет доступ ко всем ресурсам" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_16.png width=1024></p>

Пользователь ivan имеет доступ к common, it, personal. К директории admins пользователю ivan нет доступа:

```
smbclient //10.10.10.1/common -U ivan
smbclient //10.10.10.1/it -U ivan
smbclient //10.10.10.1/personal -U ivan
smbclient //10.10.10.1/admins -U ivan
```

<p align="center"><img alt="Пользователь admin1 имеет доступ ко всем ресурсам" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_17.png width=1024></p>

Проверим доступность сервера с компьютера клиента.  
Для этого заходим в Проводник, «Мой компьютер» – «Подключить сетевой диск».  
Указываем IP-адрес сервера Samba.


<p align="center"><img alt="Подключение к Samba с клиента" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_18.png width=800></p>

При подключении вводим логин пользователя admin и его пароль:

<p align="center"><img alt="Ввод данных пользователя" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_19.png width=600></p>

Проверим, что пользователь admin может зайти в другие директории и создать там файлы:

<p align="center"><img alt="Проверка корректности настройки пользователя admin" src=/topics/installing-the-server-software/how-to-install-samba-on-ubuntu/static/ru_image_20.png width=1024></p>

## Краткие итоги

Мы настроили сервер Samba на HostVDS.com. Для защиты корпоративной сети создали туннель WireGuard и настроили ufw. Затем добавили пользователей и директории, указали нужные права. После этого с помощью скрипта мы автоматизировали процесс работы с Samba. Проверили корректность настроек с удаленного клиента.
