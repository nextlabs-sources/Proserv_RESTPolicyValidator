FROM registry.access.redhat.com/ubi8/ubi-minimal:8.6-902 as stage1

ARG VERSION=latest
ARG APP_DISPLAY_NAME=nextlabs-policy-validator
ARG BUILD_NUMBER=0

LABEL org.opencontainers.image.title="NextLabs - ${APP_DISPLAY_NAME}" \
      org.opencontainers.image.description="NextLabs - ${APP_DISPLAY_NAME} (${VERSION}+${BUILD_NUMBER})" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.vendor="NextLabs" \
      org.opencontainers.image.authors="devops@nextlabs.com"

RUN microdnf update -y \
    && microdnf install -y \
    nss_wrapper gettext tar procps-ng shadow-utils bind-utils \
    && microdnf remove -y \
    geolite2-country geolite2-city \
    && microdnf clean all \
    && rm -rf /var/cache/yum \
    && ln -sf /usr/share/zoneinfo/PST8PDT /etc/localtime \
    && mkdir /licenses \
    && rm -rf /usr/share/doc
    
FROM stage1

LABEL org.opencontainers.image.title="NextLabs - ${APP_DISPLAY_NAME}" \
      org.opencontainers.image.description="NextLabs - ${APP_DISPLAY_NAME} (${VERSION}+${BUILD_NUMBER})" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.vendor="NextLabs" \
      org.opencontainers.image.authors="devops@nextlabs.com"

ENV NEXTLABS_PV_HOME=/opt/policyvalidator

COPY ./nextlabs-policy-validator ${NEXTLABS_PV_HOME}
COPY passwd.template ${HOME}
COPY licensing.txt /licenses

WORKDIR ${NEXTLABS_PV_HOME}

RUN chmod +x start.sh
ENTRYPOINT ["./start.sh"]