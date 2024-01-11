FROM node:16

# docker 설치, docker cli만 사용하기 때문에 아래처럼 간단하게 했다.
RUN DOCKER_PKG="docker-20.10.9.tgz";\
    curl -fsSLO --compressed "https://download.docker.com/linux/static/stable/$(arch)/$DOCKER_PKG"; \
    tar -xf $DOCKER_PKG --strip-components 1 --directory /usr/local/bin/ docker/docker; \
    rm -f $DOCKER_PKG

RUN apt-get update;apt-get install net-tools
