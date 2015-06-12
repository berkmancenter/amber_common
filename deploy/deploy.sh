#!/bin/bash
#
# Spin up test servers for Amber on AWS

USAGE="Usage: deploy.sh --platform=[drupal|wordpress|nginx|apache|all] --release=RELEASE"
ENVIRONMENT="The following environment variables must be set in order to spin up the AWS instance: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_KEYPAIR_NAME"
SCRIPT_DIR=`dirname $0`
pushd . > /dev/null

for i in "$@"
do
case $i in
    --platform=*)
    PLATFORM="${i#*=}"
    shift # past argument=value
    ;;
    --release=*)
    RELEASE="${i#*=}"
    shift # past argument=value
    ;;
    *)
            # unknown option
    ;;
esac
done

# Make sure the correct parameters have been passed
if [[ -z "$PLATFORM" || -z "$RELEASE" ]]; then
	echo $USAGE
	exit 1
fi

# Make sure the credentials are set to spin up the SAWS server
if [[ -z "$AWS_ACCESS_KEY_ID" || -z "$AWS_SECRET_ACCESS_KEY" || -z "$AWS_KEYPAIR_NAME" ]]; then
	echo $ENVIRONMENT
	exit 1
fi

if [[ -z "$AMBER_PUBLIC_KEY_DIR" ]]; then
	echo "Notice: The AMBER_PUBLIC_KEY_DIR environment variable is not set. Public keys from that directory will not be copied to the server"
fi

case $PLATFORM in
	(drupal|wordpress|nginx|apache)
		cd $SCRIPT_DIR/$PLATFORM/vagrant
		find .vagrant -name id -exec rm {} \;
		RELEASE_TAG=$RELEASE vagrant up --provider=aws
		INSTANCE_ID=$(<`find .vagrant -name id`)
		echo $PLATFORM server available with instance id: $INSTANCE_ID
	;;

esac	
	
popd . > /dev/null