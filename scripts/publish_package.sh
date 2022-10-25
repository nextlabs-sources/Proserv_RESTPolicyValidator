# This script publishes installers and build artifacts to s:/build

RESTPolicyValidatorDocker_VERSION=3.3

[ "X${WORKSPACE}" = "X" ] && echo "ERROR: WORKSPACE variable not set!" && exit -1
[ "X${BUILD_NUMBER}" = "X" ] && echo "ERROR: BUILD_NUMBER variable not set!" && exit -1

LOG_FILE=${WORKSPACE}/buildRelease.log
BUILD_MANIFEST_FILE=${WORKSPACE}/build.manifest

(
set -x
# Extract Perforce Workspace and Hudson info (only if running on Hudson)
if [ -f ../config.xml ]; then
	${WORKSPACE}/scripts/getGitWorkspaceInfo.pl ../config.xml
fi

#
# Map drives
#
# IMPORTANT: Drive mapping is used to deal with space in directory name such as "Program Files"
# that Cygwin and other programs cannot handle readily.

echo "Drive Mapping Before:"
set -x
subst
net use

# When running in Tomcat as SYSTEM user, s:/ is mapped to \\nextlabs.com\share instead of \\nextlabs.com\share\data.
# Drive mapping may be done using subst or net use. It needs to be deleted using the correct command.
# The output from subst may look like the following when mapped using subst. Mapping will not
# be shown if mapped using net use. Similarly, net use does not show mappings done using subst.
#	S:\: => UNC\nextlabs.com\share\data

if [ "$BUILD_WITHOUT_S_DRIVE" == "" ] || [ $BUILD_WITHOUT_S_DRIVE -eq 0 ]; then
	[ `subst | grep -ic S:` -ne 0 ] && subst S: /D
	[ `net use | grep -ic S:` -ne 0 ] && net use S: /D

	net use s: "\\\\nextlabs.com\\share\\data"
fi
set +x

echo "Drive Mapping After:"
set -x
subst
net use
set +x

REPOSITORY_ROOT=s:/build/release_candidate

BODA_DIR="${REPOSITORY_ROOT}/RESTPolicyValidatorDocker/${RESTPolicyValidatorDocker_VERSION}/"

# Publish packages and artifacts to BODA only if PUBLISH_TO_BODA environment variable is set (set in Jenkins build process)
if [ "X${PUBLISH_TO_BODA}" = "XYes" -o "X${PUBLISH_TO_BODA}" = "Xyes" -o "X${PUBLISH_TO_BODA}" = "XYES" -o "X${PUBLISH_TO_BODA}" = "X1" ]
then
	echo "################################################################################"
	echo "## Copying RESTPolicyValidatorDocker packages to BODA_DIR..."
	echo "################################################################################"
	echo
	mkdir -p ${BODA_DIR}/${BUILD_NUMBER}
	PKGS=$(cd ${WORKSPACE}/ ; echo PolicyValidator_*.zip)
	cd ${WORKSPACE}/
	cp -f deploy/PolicyValidator_*.zip ${BODA_DIR}/${BUILD_NUMBER}/

	echo "[BUILD MANIFEST]   Product Name       : REST Policy Validator"
	echo "[BUILD MANIFEST]   Installer Location : ${BODA_DIR}/${BUILD_NUMBER}"

	echo "[BUILD MANIFEST]   Packages  : "
	echo "[BUILD MANIFEST]   ${PKGS}"
fi

# Create and publish build manifest
${WORKSPACE}/scripts/createBuildManifest.pl $LOG_FILE > $BUILD_MANIFEST_FILE || exit $?
# Publish packages and artifacts to BODA only if PUBLISH_TO_BODA environment variable is set (set in Jenkins build process)
if [ "X${PUBLISH_TO_BODA}" = "XYes" -o "X${PUBLISH_TO_BODA}" = "Xyes" -o "X${PUBLISH_TO_BODA}" = "XYES" -o "X${PUBLISH_TO_BODA}" = "X1" ]
then
	cp -f ${BUILD_MANIFEST_FILE} ${BODA_DIR}/${BUILD_NUMBER}/ || exit $?
fi
) 2>&1 | tee $LOG_FILE

set +x

echo
echo
echo "####################### BUILD MANIFEST CONTENTS ########################"
cat ${BUILD_MANIFEST_FILE}
echo "########################################################################"
exit ${PIPESTATUS[0]}
