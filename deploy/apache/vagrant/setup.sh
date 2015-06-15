#!/bin/bash

if [[ -z "$1" ]]; then
	echo "RELEASE_TAG not specified. Proceeding with release of master branch"
	export RELEASE_TAG=master
else
	export RELEASE_TAG=$1
fi	

# Install prerequisites
sudo apt-get update
sudo apt-get -y install git make curl libpcre3 libpcre3-dev sqlite3 libsqlite3-dev php5-cli php5-common php5-sqlite php5-curl php5-fpm zlib1g-dev apache2 apache2-dev libapache2-mod-php5

# Get code
cd /usr/local/src
git clone https://github.com/berkmancenter/amber_common.git
git -C /usr/local/src/amber_common checkout $RELEASE_TAG
git clone https://github.com/berkmancenter/amber_apache.git
git -C /usr/local/src/amber_apache checkout $RELEASE_TAG

# Build module
cd /usr/local/src/amber_apache/
apxs -i -a -c mod_amber.c -lsqlite3 -lpcre

# Configure apache
cp /usr/local/src/amber_apache/amber.conf /etc/apache2/conf-available
/usr/sbin/a2enmod rewrite
/usr/sbin/a2enmod substitute
/usr/sbin/a2enconf amber.conf

# Disable the deflate module, because the default configuration has this
# run BEFORE the substitute filter, which prevents the substitution from working
/usr/sbin/a2dismod deflate

# Install a new virtual site with our mod_rewrite rules enabled
cp /vagrant/001-default-amber.conf /etc/apache2/sites-available
/usr/sbin/a2dissite 000-default
/usr/sbin/a2ensite 001-default-amber

service apache2 reload

# Amber configuration - Setup the database
mkdir /var/lib/amber
sqlite3 /var/lib/amber/amber.db < /usr/local/src/amber_common/src/amber.sql

# Amber configuration - Setup the cache directory
mkdir /var/www/html/amber
mkdir /var/www/html/amber/cache

# Amber configuration - Setup the admin control panel 
# (Link instead of copying so that we can reference files in the parent directory)
ln -s /usr/local/src/amber_common/src/admin /var/www/html/amber/admin
mkdir /etc/amber
cp /usr/local/src/amber_common/src/amber-apache.ini /etc/amber

# Amber configuration - Install the Amber CSS and Javascript
cp -r /usr/local/src/amber_common/src/css /usr/local/src/amber_common/src/js /var/www/html/amber

# Update permissions
chgrp -R www-data /var/lib/amber /var/www/html/amber
chmod -R g+w /var/lib/amber /var/www/html/amber/cache
chmod +x /usr/local/src/amber_common/deploy/apache/vagrant/cron-cache.sh /usr/local/src/amber_common/deploy/apache/vagrant/cron-check.sh

# Schedule cron job
cat > /etc/cron.d/amber << EOF
*/5 * * * * www-data /bin/sh /usr/local/src/amber_common/deploy/apache/vagrant/cron-cache.sh --ini=/etc/amber/amber-apache.ini 2>> /var/log/amber >> /var/log/amber
15 3 * * *  www-data /bin/sh /usr/local/src/amber_common/deploy/apache/vagrant/cron-check.sh --ini=/etc/amber/amber-apache.ini 2>> /var/log/amber >> /var/log/amber
EOF

# Setup permissions for cron job logs
touch /var/log/amber
chown www-data /var/log/amber
chgrp www-data /var/log/amber

# Install any provided public keys
if [ -d "/vagrant_public_keys" ]; then cat /vagrant_public_keys/* >> /home/ubuntu/.ssh/authorized_keys ; fi

