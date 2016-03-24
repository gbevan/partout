Firefox SSL Certificate Import Notes
====================================

For testing firefox access to API and UI https ports.

Gentoo
------

    dev-libs nss +utils

### List existing certs in firefox profile:

    certutil -L -d path-to-profile

### Add cert to firefox profile:

    certutil -A -n "Cert Name" -t "CT,C,C" -i certfile.crt -d path-to-profile

e.g.:

    certutil -A -n "Partout root" -t "CT,C,C" -i ~/Documents/Brackets/partout/etc/ssl/root_ca.crt -d .
    certutil -A -n "Partout intermediate" -t "CT,C,C" -i ~/Documents/Brackets/partout/etc/ssl/intermediate_ca.crt -d .

### Delete certificate from profile:

    certutil -D -n cert-name -d path-to-profile

### For curl, add these to system wide certs:

    ll /usr/share/ca-certificates/partout/
    total 8
    drwxr-xr-x 1 root root 92 Mar 24 11:32 .
    drwxr-xr-x 1 root root 70 Oct 15 11:47 ..
    lrwxrwxrwx 1 root root 64 Mar 24 11:32 partout_intermediate_ca.crt -> /home/bev/Documents/Brackets/partout/etc/ssl/intermediate_ca.crt
    lrwxrwxrwx 1 root root 56 Mar 24 11:32 partout_root_ca.crt -> /home/bev/Documents/Brackets/partout/etc/ssl/root_ca.crt

add to /etc/ca-certificates.conf:

    partout/partout_root_ca.crt
    partout/partout_intermediate_ca.crt

run update-ca-certificates

    update-ca-certificates
