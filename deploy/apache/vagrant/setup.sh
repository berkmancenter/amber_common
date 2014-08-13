# Install prerequisites
sudo apt-get update
sudo apt-get -y install git make curl libpcre3 libpcre3-dev sqlite3 libsqlite3-dev php5-cli php5-common php5-sqlite php5-curl php5-fpm zlib1g-dev apache2 apache2-dev

# Get code
cd /usr/local/src
git clone https://github.com/berkmancenter/robustness_common.git
git clone https://github.com/berkmancenter/robustness_apache.git

# Build module
cd /usr/local/src/robustness_apache/
apxs -i -a -c mod_amber.c -lsqlite3 -lpcre

# Configure apache
cp /usr/local/src/robustness_apache/amber.conf /etc/apache2/conf-available
/usr/sbin/a2enmod rewrite
/usr/sbin/a2enmod substitute
/usr/sbin/a2enconf amber.conf
service apache2 reload

# Amber configuration - Setup the database
mkdir /var/lib/amber
sqlite3 /var/lib/amber/amber.db < /usr/local/src/robustness_common/src/amber.sql

# Amber configuration - Setup the cache directory
mkdir /var/www/html/amber
mkdir /var/www/html/amber/cache

# Amber configuration - Setup the admin control panel
cp -r /usr/local/src/robustness_common/src/admin /var/www/html/amber

# Amber configuration - Install the Amber CSS and Javascript
cp -r /usr/local/src/robustness_common/src/css /usr/local/src/robustness_common/src/js /var/www/html/amber

# Update permissions
chgrp -R www-data /var/lib/amber /var/www/html/amber
chmod -R g+w /var/lib/amber /var/www/html/amber/cache
chmod +x /usr/local/src/robustness_common/deploy/apache/vagrant/cron-cache.sh /usr/local/src/robustness_common/deploy/apache/vagrant/cron-check.sh

# Schedule cron job
cat > /etc/cron.d/amber << EOF
*/5 * * * * www-data /bin/sh /usr/local/src/robustness_common/deploy/apache/vagrant/cron-cache.sh --ini=/usr/local/src/robustness_common/src/amber-apache.ini 2>> /var/log/amber >> /var/log/amber
15 3 * * *  www-data /bin/sh /usr/local/src/robustness_common/deploy/apache/vagrant/cron-check.sh --ini=/usr/local/src/robustness_common/src/amber-apache.ini 2>> /var/log/amber >> /var/log/amber
EOF

# Setup permissions for cron job logs
touch /var/log/amber
chown www-data /var/log/amber
chgrp www-data /var/log/amber
