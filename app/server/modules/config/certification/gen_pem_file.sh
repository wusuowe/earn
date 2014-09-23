#!/bin/bash
openssl x509 -in aps_development.cer -inform der -out PushChatCert.pem
openssl pkcs12 -nocerts -out PushChatKey.pem -in aps_development.p12 

#password:earn123
