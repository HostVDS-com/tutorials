# 🔐SSH keys generation 🔐

[1.	Benefits of using SSH keys](#title1) <br>
[2.	Key encryption algorithms](#title2) <br>
[3. Generation of public and private keys](#title3) <br>
[4. Key Generation with PuttyGen](#title4)<br>
[Conclusion](#title5)<br>

###  <a id="title1">1.	Benefits of using SSH keys</a>
SSH (Secure Shell) is a network protocol used for secure communication and remote control of hosts. The protocol is used in various areas, from server administration and working with cloud hosting to interacting with databases and corporate systems. One of the key features of SSH is the authentication mechanism that uses a private and public key pair. In this article, we will look at how key generation works, explaining in detail the process of creating and configuring additional key parameters on different operating systems.

Using SSH keys is significantly more secure than using a password. This is primarily because passwords can be guessed through brute force attacks, whereas a private key is a long and random sequence of data that is almost impossible to guess. In addition, unlike a password, the private key is not transmitted over the network — only the fact that it is used is verified by the server. 
Another important advantage is the ability to configure additional security settings, such as the use of passphrases to protect private keys.
### <a id="title2">2.	Key encryption algorithms</a>
SSH provides support for a variety of encryption algorithms to ensure secure communication and authentication. The most common are RSA, Ed25519, ECDSA, and DSA. \
Today, it is preferable to use the modern Ed25519 algorithm, designed for high performance, small key sizes, and strong security. It is based on the Curve25519 elliptic curve and uses deterministic key generation to eliminate randomness vulnerabilities.

The RSA algorithm is an example of a strong encryption algorithm, and its security is based on the computational complexity of factoring large integers, specifically the product of two large primes. RSA with a 2048-bit key is considered secure against current threats, while 4096-bit keys provide protection against predicted future advances in computing. It is the most common key today. 

ECDSA is a variant of the elliptic curve digital signature algorithm (DSA). It provides strong security due to its smaller key sizes compared to RSA, making it effective for systems with limited bandwidth or storage. It is faster than RSA, but provides less reliable protection than Ed25519 due to certain problems in the implementation of the algorithm. 

The DSA algorithm is not recommended for use in modern systems due to the low level of security. \
The table shows a comparison of algorithms:
| Algorithm | Key size | Performance | Security | Example of use |
|-----:|---------------|---------------|---------------|---------------|
|Ed25519 | 256 bit | High | Reliable  | Modern systems, systems with limited resources |
|RSA | 2048 – 4096 bits | Average | Reliable (when using a 2048-bit key) | General Purpose Systems |
|ECDSA | 256 – 521 bits | Average | Reliable | Modern systems, systems with limited resources |
|DSA | 1024 bit | Low | Unreliable | Legacy systems |

We will consider examples of generating Ed25519 and RSA keys, the size of which we will choose 2048 bits.
### <a id="title3">3. Generation of public and private keys</a>
The OpenSSH client is already included in the core software in Windows 10/11, Ubuntu, Debian. Let's consider generating keys on a client machine using it. \
For Windows, press Win+R, type cmd. For Ubuntu/Debian, start the terminal with the keyboard shortcut Ctrl+Alt+T. \
The key generation command looks like this:
```
ssh-keygen [options]
```
As options, you can use: \
 **–t**  [ dsa | ecdsa | ed25519 | rsa ] \
Specifies the type of cryptographic algorithm for the key.
**-b** [key_size] \
Specifies the length of the key in bits. \
**-C** [commentary]\
Adds a comment to the key, helping to identify the key.  Does not affect key security. \
**-f** [file_path] \
Specifies the path and file name to save the generated keys. \ 
**-N** [key_password] \
Sets a password to protect the private key. \
**-q** \
Disables the display of messages about the key generation process. Useful in automated scenarios. \
**-v** \
Enables verbose output mode. Useful for debugging if you want to follow every step of a command. \
**-P** [old_password] \
Changes the password of the private key. In combination with the **-f** option, sets a new password for the existing private key. 

As an example, let's create an RSA key on Windows with the following parameters: \
• key length 2048 bits \
• Comment "Win-Ubuntu" \
• Private key password: ssh \
• Key Name: id_rsa2048 \
• Key location: C:\Users\jetcry\ssh_keys\ 
> [!IMPORTANT]
> The "ssh_keys" folder must be pre-created. 

Command to create a key with the specified parameters: 
```
ssh-keygen –t rsa –b 2048 –C Win-Ubuntu –N ssh –f C:\Users\jetcry\ssh_keys\id_rsa2048
```
<p align="center"><img alt="ssh keygen " src=/SSH/SSH-key-generation/static/en_image_01.png width=1024></p>

Let's take a look at the process of creating the ed25519 key without specifying parameters:
```
ssh-keygen –t ed25519
```
<p align="center"><img alt="ssh keygen ed25519" src=/SSH/SSH-key-generation/static/en_image_02.png width=1024></p>
Here we have specified the key name, password (passphrase).
The key that was created was saved in the user's root folder.
For Ububntu/Debian, the command syntax is similar. Let's create a key for Ubuntu. Let's check that it appeared in the .ssh home directory. 
<p align="center"><img alt="ssh-keygen ubuntu" src=/SSH/SSH-key-generation/static/en_image_03.png width=1024></p>
The key pairs are generated and are located in the .ssh directory of the current Ubuntu user.

### <a id="title4">4. Key Generation with PuttyGen</a>
In case you do not have OpenSSH installed, for example, on Windows 7 it is not included in the basic software set, an alternative way to create a key is to use the PuttyGen application, available for download from the official website [Putty](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html).

Select the key type and start generating it. In our case, we chose the key type – RSA, the key length is 2048 bits.
<p align="center"><img alt="Puttygen" src=/SSH/SSH-key-generation/static/en_image_04.png width=600></p>
During generation, you need to randomly move the mouse across the screen, this will create a unique key. 
<p align="center"><img alt="Puttygen_move_mouse" src=/SSH/SSH-key-generation/static/en_image_05.png width=600></p>
Once the key has been created, it can be protected with a passphrase. After that, you need to save the public and private keys, preferably create a .ssh folder for the current user beforehand, e.g. C:\Users\jetcry\.ssh
<p align="center"><img alt="Puttygen_save key" src=/SSH/SSH-key-generation/static/en_image_06.png width=600></p>
Here's how Windows displays the keys you've created:
<p align="center"><img alt="Puttygen_end" src=/SSH/SSH-key-generation/static/en_image_07.png width=600></p>
The key generation is complete. 

### <a id="title5">Conclusion</a>
1. The use of SSH keys is now a standard for ensuring information security requirements.
2. Most commonly, OpenSSH is utilized to generate keys. The command is "ssh-keygen".
3. The ssh-keygen options allow you to extensively control the parameters of the keys that are generated.
4. An alternative option is PuttyGen.
5. It is preferable to use ED25519 or RSA keys with a key length of at least 2048 bits.
