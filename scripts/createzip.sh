#!/bin/bash

imageRepo=registry.nextlabs.com
imageName=nextlabs-policy-validator

InternalRepo=registry.nextlabs.com

if [[ "$ACTION" == "BUILD" ]]; then

    [ "X${WORKSPACE}" = "X" ] && echo "ERROR: WORKSPACE variable not set!" && exit -1
    [ "X${NLEXTERNALDIR2}" = "X" ] && echo "ERROR: NLEXTERNALDIR2 variable not set!" && exit -1

    echo "################################################################################"
    echo "## Building Policy Validator package"
    echo "################################################################################"
    echo

    DEPLOY_FOLDER=${WORKSPACE}/deploy/PolicyValidator/${IMAGE_TAG}
    BUILD_DATE_LONG=$(date +"%Y%m%d%H%M" | tr -d -c [:digit:])
    PKG_NONPORTABLE_FILENAME=${WORKSPACE}/deploy/PolicyValidator_NonPortable_${IMAGE_TAG}-$BUILD_NUMBER.zip
    PKG_PORTABLE_FILENAME=${WORKSPACE}/deploy/PolicyValidator_Portable_${IMAGE_TAG}-$BUILD_NUMBER.zip

    echo "INFO: Deploy folder: ${DEPLOY_FOLDER}"
    rm -rf ${WORKSPACE}/deploy
    mkdir -p ${DEPLOY_FOLDER}/logs
    mkdir -p ${DEPLOY_FOLDER}/lib
    mkdir -p ${DEPLOY_FOLDER}/data/working
    mkdir -p ${DEPLOY_FOLDER}/data/config
    mkdir -p ${DEPLOY_FOLDER}/node_modules
    mkdir -p ${DEPLOY_FOLDER}/public/ui/app
    mkdir -p ${DEPLOY_FOLDER}/public/ui/config
    mkdir -p ${DEPLOY_FOLDER}/public/ui/css
    mkdir -p ${DEPLOY_FOLDER}/public/ui/lib
    mkdir -p ${DEPLOY_FOLDER}/certs
    mkdir -p ${DEPLOY_FOLDER}/backup/data/config
    mkdir -p ${DEPLOY_FOLDER}/backup/data/working

    echo
    echo "################################################################################"
    echo "## Copying required files to deploy folder"
    echo "################################################################################"
    echo

    cp ${WORKSPACE}/server.js ${DEPLOY_FOLDER}/
    cp ${WORKSPACE}/package.json ${DEPLOY_FOLDER}/
    cp ${WORKSPACE}/installService.js ${DEPLOY_FOLDER}/
    cp ${WORKSPACE}/uninstallService.js ${DEPLOY_FOLDER}/
    cp ${WORKSPACE}/index.html ${DEPLOY_FOLDER}/
    cp -r ${WORKSPACE}/data/working ${DEPLOY_FOLDER}/data/
    cd ${WORKSPACE}/data/working/
    cp -r . ${DEPLOY_FOLDER}/backup/data/working
    cp -r ${WORKSPACE}/data/config ${DEPLOY_FOLDER}/data/
    cp ${WORKSPACE}/data/config/*.* ${DEPLOY_FOLDER}/backup/data/config/
    cp -r ${WORKSPACE}/lib ${DEPLOY_FOLDER}/
    cp -r ${WORKSPACE}/public/ui/app ${DEPLOY_FOLDER}/public/ui/
    cp -r ${WORKSPACE}/public/ui/config ${DEPLOY_FOLDER}/public/ui/
    cp -r ${WORKSPACE}/public/ui/css ${DEPLOY_FOLDER}/public/ui/
    cp -r ${WORKSPACE}/public/ui/lib ${DEPLOY_FOLDER}/public/ui/
    cp -r ${WORKSPACE}/certs ${DEPLOY_FOLDER}/
    cp ${WORKSPACE}/public/index.html ${DEPLOY_FOLDER}/public/
    cp ${WORKSPACE}/public/ui/package.json ${DEPLOY_FOLDER}/public/ui/

    {
        echo "#NextLabs Policy Validator"
        echo "nextlabs.pv.version=$IMAGE_TAG"
        echo "nextlabs.pv.image-build=$BUILD_NUMBER"
    } \
        >$DEPLOY_FOLDER/version.txt

    # Convert to dos format
    unix2dos $DEPLOY_FOLDER/version.txt

    echo
    echo "################################################################################"
    echo "## Creating archive of Non Portable version..."
    echo "################################################################################"
    echo
    cd ${DEPLOY_FOLDER}/
    zip -r -b . ${PKG_NONPORTABLE_FILENAME} *

    echo
    echo "################################################################################"
    echo "## Downloading NPM modules for portable version..."
    echo "################################################################################"
    echo
    cd ${DEPLOY_FOLDER}/

    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "OS is linux"
        /opt/nodejs/bin/npm install
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "OS is darwin"
    elif [[ "$OSTYPE" == "cygwin" ]]; then
        echo "OS is cywin"
        ${NLEXTERNALDIR2}/nodejs/12.16.3/win-x64/npm install
    elif [[ "$OSTYPE" == "msys" ]]; then
        echo "OS is mysys"
    elif [[ "$OSTYPE" == "win32" ]]; then
        echo "OS is windows"
        ${NLEXTERNALDIR2}/nodejs/12.16.3/win-x64/npm install
    elif [[ "$OSTYPE" == "freebsd"* ]]; then
        echo "OS is freebsd"
    else
        echo "Unknow OS"
    fi

    echo "Copy node_modules for windows"
    cp -r -n -v ${WORKSPACE}/node_modules_win/* ${DEPLOY_FOLDER}/node_modules/
    cp ${NLEXTERNALDIR2}/nodejs/12.16.3/win-x64/node.exe ${DEPLOY_FOLDER}/

    echo
    echo "################################################################################"
    echo "## Creating archive of Portable version..."
    echo "################################################################################"
    echo
    cd ${DEPLOY_FOLDER}/
    zip -r -b . ${PKG_PORTABLE_FILENAME} *

    #remove windows node.exe
    rm -f ${DEPLOY_FOLDER}/node.exe

    cp ${NLEXTERNALDIR2}/nodejs/12.16.3/linux-x64/bin/node ${DEPLOY_FOLDER}/

    #find . -type f -name '*.js' -print0 | xargs -0 dos2unix

    find . -type f -name '*.json' -print0 | xargs -0 dos2unix

    # For arbitrary user support
    cp -v ../../../scripts/start.sh .
    cp -v ../../../docker-package.json .
    mv -v docker-package.json package.json
    sudo chgrp -R 0 ../../../data/
    sudo chmod -R g+rwX ../../../data/
    sudo chgrp -R 0 ../$IMAGE_TAG
    sudo chmod -R g+rwX ../$IMAGE_TAG
    sudo chmod -R -v g+x start.sh
    sudo chmod -R -v g+x node

    cd ${WORKSPACE}

    # Force remove existing images
    if [ ! -z $(docker images --filter=reference="$imageRepo/$imageName" -q) ]; then
        echo "Removing old image!"
        docker rmi -f $(docker images --filter=reference="$imageRepo/$imageName" -q)
    fi

    # Docker build
    docker build --build-arg IMAGE_TAG=$IMAGE_TAG --build-arg IMAGE_BUILD=$BUILD_NUMBER -f Dockerfile -t $imageRepo/$imageName:$IMAGE_TAG .

    # for local just do a docker save instead of publish to AWS
    if [[ "$TARGET" == "DEV" ]]; then

        echo "Saving image tar file to ${WORKSPACE}/deploy/$imageName-$IMAGE_TAG.tar"
        docker save $imageRepo/$imageName:$IMAGE_TAG >${WORKSPACE}/deploy/$imageName-$IMAGE_TAG.tar

    else

        echo "Saving image tar file to ${WORKSPACE}/deploy/$imageName-$IMAGE_TAG.tar"
        docker save $imageRepo/$imageName:$IMAGE_TAG >${WORKSPACE}/deploy/$imageName-$IMAGE_TAG.tar

        echo "####################### Start to copy $BUILD_TYPE Folder ########################"
        echo "Copy zip release to  $BUILD_TYPE "

        Publish_Path=RESTPolicyValidator/$IMAGE_TAG/$BUILD_NUMBER/

        sudo mkdir -p $SDRIVE/build/$BUILD_TYPE/$Publish_Path

        sudo cp $PKG_NONPORTABLE_FILENAME $SDRIVE/build/$BUILD_TYPE/$Publish_Path

        sudo cp $PKG_PORTABLE_FILENAME $SDRIVE/build/$BUILD_TYPE/$Publish_Path

        echo "Copy tar release to $BUILD_TYPE "

        sudo cp ${WORKSPACE}/deploy/$imageName-$IMAGE_TAG.tar $SDRIVE/build/$BUILD_TYPE/$Publish_Path

        echo "Successfully Published to Build/$BUILD_TYPE PATH $SDRIVE/build/$BUILD_TYPE/$Publish_Path/$imageName-$IMAGE_TAG.tar"


        LATEST_DOCKER_IMAGE_TAG=$(docker images --filter=reference="$imageRepo/$imageName" -a --format "{{.Tag}}")

        echo "LATEST DOCKER IMAGE: $LATEST_DOCKER_IMAGE_TAG"

        LATEST_BUILD_NO_FROM_IMAGE=$(docker image inspect $imageRepo/$imageName:$LATEST_DOCKER_IMAGE_TAG|grep summary)

        echo "Publish for following build number :" $LATEST_BUILD_NO_FROM_IMAGE

        docker tag $imageRepo/$imageName:$LATEST_DOCKER_IMAGE_TAG $InternalRepo/platform/$imageName:$LATEST_DOCKER_IMAGE_TAG
        docker login -u cr -p "y%pEA9^;)d" $InternalRepo
        docker push $InternalRepo/platform/$imageName:$LATEST_DOCKER_IMAGE_TAG

        echo "Successfully Pushed to Internal Docker Registry"
        echo "Registry console login URL: https://registry.nextlabs.com/"
        
        ######################################## END OF BUILD ##############################################################################
        ######################################## END OF BUILD ##############################################################################
        ######################################## END OF BUILD ##############################################################################
        ######################################## END OF BUILD ##############################################################################

    fi


fi

echo "Build complete successfully."
