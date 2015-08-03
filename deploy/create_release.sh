#!/bin/bash
#
# Create a Github release from a tag for Amber repositorites

function report () {
	echo "${1}"
	REPORT+="${1}\n"
}

# Validation messages
USAGE="Usage: create_release.sh --platform=[drupal|wordpress|nginx|apache|common|all] --version=VERSION --commit=COMMIT --description=DESCRIPTION"
ENVIRONMENT="The following environment variables must be set in order to create the release: GITHUB_ACCESS_TOKEN"

for i in "$@"
do
case $i in
    --platform=*)
    PLATFORM="${i#*=}"
    shift # past argument=value
    ;;
    --version=*)
    VERSION="${i#*=}"
    shift # past argument=value
    ;;
    --commit=*)
    COMMIT="${i#*=}"
    shift # past argument=value
    ;;
    --description=*)
    DESCRIPTION="${i#*=}"
    shift # past argument=value
    ;;
    *)
            # unknown option
    ;;
esac
done

# Make sure the correct parameters have been passed
if [[ -z "$PLATFORM" || -z "$VERSION"  || -z "$COMMIT"  || -z "$DESCRIPTION" ]]; then
	echo $USAGE
	exit 1
fi

# Make sure the credentials are available in the environment to spin up the SAWS server
if [[ -z "$GITHUB_ACCESS_TOKEN" ]]; then
	echo $ENVIRONMENT
	exit 1
fi

case $PLATFORM in
	(nginx|apache|drupal|wordpress|common)
	;;
	all)
	 	PLATFORM="drupal wordpress nginx apache common"
	;;
    *)
		echo "Invalid platform: $PLATFORM"
		exit 1            
    ;;
esac	


API_JSON=$(printf '{"tag_name": "v%s","target_commitish": "%s","name": "Version %s","body": "%s","draft": false,"prerelease": false}' $VERSION $COMMIT $VERSION "$DESCRIPTION")

for P in $PLATFORM; do
	curl --data "$API_JSON" https://api.github.com/repos/berkmancenter/amber_${P}/releases?access_token=${GITHUB_ACCESS_TOKEN}
done	