# Подключение к серверу с помощью SSH-ключей

[Введение](#title1) <br>
[1. Предварительная настройка сервера](#title2) <br>
[2. Автоматическое копирование ключа для Debian/Ubuntu](#title3) <br>
[3.	Ручное копирование ключа ](#title4) <br>
[4.	Создание сервера на HostVDS и подключение к нему с помощью SSH-ключей](#title5) <br>
[5.	Дополнительная защита подключения к серверу](#title6) <br>
[Краткие итоги](#title7) <br>


### <a id="title1">Введение</a> 

Механизм генерации ssh-ключей был подробно описан в [этой статье](https://github.com/HostVDS-com/tutorials/blob/main/topics/linux-basics/ssh-key-generation/ru.md). Сегодня мы рассмотрим различные способы переноса открытого ключа на сервер, а также настройку дополнительных параметров безопасности.

### <a id="title2">1. Предварительная настройка сервера</a> 

В качестве изначальных данных у нас готов открытый ключ на клиентской машине, так же есть доступ к root по паролю на сервере. \
При первом подключении необходимо подтвердить, что мы хотим установить соединение с удаленным сервером. Далее вводим пароль и вход в систему будет выполнен.
<p align="center"><img alt="первое подключение к серверу" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_01.png width=1024></p>
Мы настоятельно рекомендуем отключить возможность подключения к суперпользователю root через ssh. Поэтому нам необходимо создать нового пользователя для удаленного подключения и скопировать для него открытый ключ.

Создаем нового пользователя:

```
adduser <имя пользователя> 
```

Добавляем его в группу администраторов:

```
adduser <имя пользователя> sudo
```  

Переключаемся в созданную учетную запись
```  
su <имя пользователя>
```

<p align="center"><img alt="создание нового пользователя на сервере" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_02.png width=1024></p>

Заходим в корневую папку созданного пользователя:
```
cd
```

Создаем директорию .ssh:
```
mkdir .ssh
```

Устанавливаем текущему пользователю права на чтение, запись и выполнение. Остальные пользователи и группы пользователей не имеют никаких прав.
```
chmod 700 .ssh
```

<p align="center"><img alt="новая директория на сервере" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_03.png width=1024></p>

Новый пользователь и директория для хранения ключей созданы, переходим непосредственно к переносу ключей.

### <a id="title3">2. Автоматическое копирование ключа для Debian/Ubuntu</a>

На Debian/Ubuntu для автоматической передачи ключа можно использовать команду:
```
ssh-copy-id user@IP_server
```
где \
**user** – это имя пользователя на удаленном сервере; \
**IP_server** – IP-адрес сервера.
<p align="center"><img alt="автоматическое копирование ключа на сервер" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_04.png width=1024></p>

После копирования ключа вводим следующую команду:

```
ssh user@IP_server
```
В нашем случае она выглядит следующим образом:

```
ssh admin@192.168.1.160
```

<p align="center"><img alt="подключение на сервер после копирования ключа" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_05.png width=1024></p>

Мы зашли на удаленный сервер, ввод пароля не потребовался. \
Создадим ключ ed25519 и скопируем его на сервер:

<p align="center"><img alt="создание ключа и его копирование на сервер" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_06.png width=1024></p>

Проверим на сервере созданные ключи в директории ~/.ssh 

<p align="center"><img alt="проверяем ключ в директории ~/.ssh" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_07.png width=600></p>

Откроем ключ на клиенте: 

<p align="center"><img alt="файл ключа на клиенте" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_08.png width=1024></p>

Проверим содержимое файла ssh_host_ed25519 на сервере:

<p align="center"><img alt="файл ключа на сервере" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_09.png width=1024></p>

Содержимое ключей идентичны, копирование прошло успешно.

### <a id="title4">3. Ручное копирование ключа</a>
Для ручного копирования ключа будем использовать утилиту scp, входящую в стандартный пакет программ для Windows 10/11, Ubuntu/Debian. Настройки будем производить на примере ОС Windows 10. \
Синтаксис команды выглядит следующим образом:
```
scp route\ssh_key.pub user@IP-server:/home/user/.ssh/
```
где \
**route** – путь до ключа \
**ssh_key.pub** – имя ключа, расширение .pub. \
**user** – имя пользователя на сервере
В нашем случае:
```
scp C:\Users\jetcry\.ssh\id_ed25519.pub admin@192.168.1.160:/home/admin/.ssh/
```
Появится результат выполнения команды:
<p align="center"><img alt="пример использования scp" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_10.png width=1024></p>

Переходим на сервер. Необходимо содержимое ключа скопировать в файл authorized_keys, который еще не создан. Воспользуемся следующими командами:

```
cd ~/.ssh
cat id_ed25519.pub >> authorized_keys
```

<p align="center"><img alt="создание файла authorized_keys и копирование в него ключа" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_11.png width=600></p>

Открываем файл, проверяем, что все получилось:

```
nano authorized_keys
```

<p align="center"><img alt="открываем authorized_keys с помощью текстового редактора nano" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_12.png width=1024></p>
Выходим из файла с помощью Сtrl+X.

Ключ скопирован в ручном режиме.

### <a id="title5">4.	Создание сервера на HostVDS и подключение к нему с помощью SSH-ключей</a>

На сайте [hostvds.com](https://hostvds.com) выберем создать новый сервер. Укажем его местоположение, подберем тарифный план и образ системы. После этого нажмем «+» в поле “SSH-ключ”. 
<p align="center"><img alt="добавление ssh-ключа на hostvds" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_13.png width=600></p>
Вставим данные нашего созданного ключа, включая его название, в открывшееся поле.
<p align="center"><img alt="копирование ssh-ключа при создании сервера на hostvds" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_14.png width=600></p>
После этого создаем виртуальный сервер с заранее установленным ssh-ключом и операционной системой Ubuntu 22.04.
<p align="center"><img alt="создание сервера" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_15.png width=1024></p>
Как только появится IP-адрес сервера, выполним подключение через терминал. Укажем протокол ssh, IP-адрес, root в качестве пользователя.
<p align="center"><img alt="подключение к серверу hostvds.com" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_16.png width=1024></p>
Подключение выполнено. В следующем разделе разберем механизмы дополнительной защиты Вашего сервера.

### <a id="title6">5.	Дополнительная защита подключения к серверу </a>

Настройки будем выполнять в файле /etc/ssh/sshd_config. Открываем его с помощью редактора nano

```
sudo nano /etc/ssh/sshd_config
```
Укажем подключение по SSH через другой порт. Расскомментируем строчку **#Port 22** и укажем любой другой номер порта из частного (динамического) диапазона операционной системы: **от 49152 до 65535**. 

```
Port 59898
```

> [!NOTE]
> Если Вы хотите выбрать другой порт для работы протокола ssh, необходимо убедиться, что он не занят системой. Для этого воспользуйтесь утилитой **netstat**.
<p align="center"><img alt="изменение номера порта ssh" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_17.png width=600></p>

Далее отключим возможность подключения к суперпользователю root и вход с помощью пароля. 

Удаляем возможность подключения через root:

```
PermitRootLogin no
```

Удаляем возможность подключения с помощью пароля:

```
PasswordAuthentication no
PermitEmptyPasswords no
```

Указываем, что подключение идет только с помощью ключей:

```
PubkeyAuthentication yes
```

<p align="center"><img alt="изменения параметров в sshd_config" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_18.png width=1024></p>

Сохраняем: Ctrl+O. Enter (соглашаемся с именем сохраняемого файла).

Выходим из файла с помощью Сtrl+X. 

Переходим в директорию sshd_config:

```
cd /etc/ssh/sshd_config
``` 

Проверяем наличие там дополнительных файлов конфигурации командой **ls**

<p align="center"><img alt="дополнительные файлы конфигурации" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_19.png width=600></p>

Запрещаем подключение с помощью пароля (меняем **“yes”** на **“no”**)

<p align="center"><img alt="Запрещаем подключение с помощью пароля" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_20.png width=600></p>

Перезапускаем службу ssh

```
sudo systemctl restart ssh
```

<p align="center"><img alt="Перезапускаем службу ssh" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_21.png width=600></p>

Теперь при подключении к пользователям root и admin по ssh будет ошибка. Подключение будет доступно только при указании верного номера порта для протокола ssh. 

<p align="center"><img alt="невозможность подключения со стандартными параметрами" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_22.png width=1024></p>

Если на клиенте перенести ключи из папки .ssh, то подключение будет так же запрещено, даже с указанием номера порта 

<p align="center"><img alt="невозможно подключиться без ключа" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_23.png width=600></p>

Укажем с помощью параметра **-i**, какой ключ следует использовать для подключения:

```
ssh admin@192.168.1.160 -i C:\Users\jetcry\id_ed25519 –p 59898
```

<p align="center"><img alt="подключение с указанием ключа и номера порта" src=/topics/linux-basics/connect-to-the-server-using-ssh-keys/static/ru_image_24.png width=1024></p>

Вход выполнен. Мы завершили настройку дополнительной безопасности при подключении к серверу.

### <a id="title7">Краткие итоги</a>
1. Использование SSH-ключей для аутентификации обеспечивает максимальный уровень безопасности при подключении к удаленному серверу.
2. Закрытый ключ остается на клиентской машине, открытый копируется на сервер.
3. Команда ssh-copy-id – автоматическое копирование ключа в Ubuntu/Debian.
4. Утилита scp – копирование ключа в ручном режиме.
5. Для обеспечения дополнительной безопасности измените номер порта для протокола ssh, удалите возможность подключения к суперпользователю root и запретите использование паролей.

