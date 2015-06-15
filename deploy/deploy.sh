#!/bin/bash
#
# Spin up test servers for Amber on AWS
# AWS command-line tools required if setting elastic IP addresses automatically

function report () {
	echo "${1}"
	REPORT+="${1}\n"
}

# Validation messages
USAGE="Usage: deploy.sh --platform=[drupal|wordpress|nginx|apache|all] --release=RELEASE"
ENVIRONMENT="The following environment variables must be set in order to spin up the AWS instance: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_KEYPAIR_NAME"

# Get absolute path to the script
pushd `dirname $0` > /dev/null
SCRIPT_DIR=`pwd`
popd > /dev/null

# Save current path
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

# Make sure the credentials are available in the environment to spin up the SAWS server
if [[ -z "$AWS_ACCESS_KEY_ID" || -z "$AWS_SECRET_ACCESS_KEY" || -z "$AWS_KEYPAIR_NAME" ]]; then
	echo $ENVIRONMENT
	exit 1
fi

if [[ -z "$AMBER_PUBLIC_KEY_DIR" ]]; then
	report "Notice: The AMBER_PUBLIC_KEY_DIR environment variable is not set. Public keys from that directory will not be copied to the server"
fi

# Validate the platform(s) to which to install
case $PLATFORM in
	(drupal|wordpress|nginx|apache)
	;;
	all)
	 	PLATFORM="drupal wordpress nginx apache"
	;;
    *)
		echo "Invalid platform: $PLATFORM"
		exit 1            
    ;;
esac	


report "====================="
report " Release for $PLATFORM"
report "====================="

for P in $PLATFORM; do
	cd $SCRIPT_DIR/$P/vagrant
	find .vagrant -name id -exec rm {} \;
	RELEASE_TAG=$RELEASE vagrant up --provider=aws
	INSTANCE_ID=$(<`find .vagrant -name id`)

	# Set the IP address for the new server to the elastic IP defined in $AMBER_[platform]_ELASTIC_IP
	IP=AMBER_${P}_ELASTIC_IP
	type ec2-associate-address >/dev/null 2>/dev/null && test "${!IP}" && ec2-associate-address ${!IP} --instance $INSTANCE_ID
	report "Server available with $P release $RELEASE and instance id: $INSTANCE_ID and IP: ${!IP}"
done
	
popd . > /dev/null

echo -e $REPORT

