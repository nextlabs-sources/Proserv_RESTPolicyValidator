#!/bin/bash

export USER_ID=$(id -u)
export GROUP_ID=$(id -g)
envsubst < ${HOME}/passwd.template > /tmp/passwd
export LD_PRELOAD=/usr/lib64/libnss_wrapper.so
export NSS_WRAPPER_PASSWD=/tmp/passwd
export NSS_WRAPPER_GROUP=/etc/group

echo "Checking NEXTLABS_PV_SSL_CC_CERTIFICATE param"
echo ${NEXTLABS_PV_SSL_CC_CERTIFICATE} | base64 -d >> ${NEXTLABS_PV_HOME}/certs/ca.crt
export NODE_EXTRA_CA_CERTS=${NEXTLABS_PV_HOME}/certs/ca.crt

echo "Checking NEXTLABS_PV_TLS_CERTIFICATE param"
# For SSL cert
if [ "${NEXTLABS_PV_TLS_CERTIFICATE+set}" = set ]; then
    rm -f ${NEXTLABS_PV_HOME}/certs/ssl.crt
    echo ${NEXTLABS_PV_TLS_CERTIFICATE} | base64 -d >> ${NEXTLABS_PV_HOME}/certs/ssl.crt
fi

echo "Checking NEXTLABS_PV_TLS_KEY param"
# For SSL private key
if [ "${NEXTLABS_PV_TLS_KEY+set}" = set ]; then
    rm -f ${NEXTLABS_PV_HOME}/certs/ssl.key
    echo ${NEXTLABS_PV_TLS_KEY} | base64 -d >> ${NEXTLABS_PV_HOME}/certs/ssl.key
fi

sed -i -e "s/\${NEXTLABS_PV_PDP_PROTOCOL}/$NEXTLABS_PV_PDP_PROTOCOL/" -e "s/\${NEXTLABS_PV_PDP_HOST}/$NEXTLABS_PV_PDP_HOST/" -e "s/\${NEXTLABS_PV_PDP_PORT}/$NEXTLABS_PV_PDP_PORT/" -e "s/\${NEXTLABS_PV_CC_HOST}/$NEXTLABS_PV_CC_HOST/" -e "s/\${NEXTLABS_PV_CC_PORT}/$NEXTLABS_PV_CC_PORT/" ${NEXTLABS_PV_HOME}/data/config/config.json

${NEXTLABS_PV_HOME}/node --max-old-space-size=2048 server.js