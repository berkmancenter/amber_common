#!/bin/bash

if [[ -z "$1" ]]; then
	echo "RELEASE_TAG not specified. Proceeding with release of master branch"
	export RELEASE_TAG=master
else
	export RELEASE_TAG=$1
fi	

if [[ -z "$2" ]]; then
	echo "Site admin password not specified. A Drupal admin password will be generated"
else
	export DRUPAL_ADMIN_PASSWORD=$2
fi	

# Make mysql-install non-interactive, so it doesn't prompt for password
export DEBIAN_FRONTEND=noninteractive
sudo debconf-set-selections <<< 'mysql-server mysql-server/root_password password changeme'
sudo debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password changeme'

# Install prerequisites
sudo apt-get update
sudo apt-get -y install git mysql-client mysql-server apache2 libapache2-mod-php5 pwgen python-setuptools vim-tiny php5-mysql php-apc php5-gd php5-curl php5-memcache memcached mc curl sendmail

sed -i "s/^bind-address/#bind-address/" /etc/mysql/my.cnf
echo "extension=php_pdo_mysql.dll" | sudo tee -a /etc/php5/apache2/php.ini

curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin
mv /usr/local/bin/composer.phar /usr/local/bin/composer
composer global require drush/drush:6.* 
ln -sf ~/.composer/vendor/bin/drush  /usr/local/bin

cp /vagrant/robustness.mk /var/robustness.mk
rm -rf /var/www/ ; cd /var; mkdir www; cd www; drush make /var/robustness.mk -y 
chmod a+w /var/www/sites/default ; mkdir /var/www/sites/default/files ; chown -R www-data:www-data /var/www/
chmod 755 /vagrant/start.sh

# Get Amber code
cd /usr/local/src
git clone https://github.com/berkmancenter/amber_drupal.git
git -C /usr/local/src/amber_drupal checkout $RELEASE_TAG
mv /usr/local/src/amber_drupal/amber /var/www/sites/all/modules

# Generate random passwords 
DRUPAL_DB="drupal"
MYSQL_PASSWORD=`pwgen -c -n -1 12`
DRUPAL_DB_PASSWORD=`pwgen -c -n -1 12`

if [[ -z "$DRUPAL_ADMIN_PASSWORD" ]]; then
	export DRUPAL_ADMIN_PASSWORD=`pwgen -1 8`
fi	

# This is so the passwords show up in logs. 
echo mysql root password: $MYSQL_PASSWORD
echo drupal database password: $DRUPAL_DB_PASSWORD
echo drupal admin password: $DRUPAL_ADMIN_PASSWORD
echo $MYSQL_PASSWORD > /mysql-root-pw.txt
echo $DRUPAL_DB_PASSWORD > /drupal-db-pw.txt
echo $DRUPAL_ADMIN_PASSWORD > /drupal-admin-pw.txt

# Set database password and prep for Drupal install
mysqladmin -u root --password=changeme password $MYSQL_PASSWORD 
mysql -uroot -p$MYSQL_PASSWORD -e "CREATE DATABASE drupal; GRANT ALL PRIVILEGES ON drupal.* TO 'drupal'@'localhost' IDENTIFIED BY '$DRUPAL_DB_PASSWORD'; FLUSH PRIVILEGES;"

sed -i 's/AllowOverride None/AllowOverride All/' /etc/apache2/sites-available/*default*
sed -i 's/DocumentRoot \/var\/www\/html/DocumentRoot \/var\/www/' /etc/apache2/sites-available/*default*

a2enmod rewrite vhost_alias

# Install Drupal
cd /var/www/
drush site-install standard -y --account-name=admin --account-pass=admin --db-url="mysqli://drupal:${DRUPAL_DB_PASSWORD}@localhost:3306/drupal"     

# Fix apache configuration
sudo cp /vagrant/000-default.conf.sample /etc/apache2/sites-available/000-default.conf
sudo service apache2 restart

# Install CAYL, and configure the CAYL filter for the full_html and filtered_html text formats
drush en amber -y

mysql -uroot -p$MYSQL_PASSWORD -D drupal -e "INSERT INTO filter (format, module, name, weight, status, settings) VALUES ('full_html', 'amber', 'filter_amber', 50, 1, X'613A303A7B7D');"
mysql -uroot -p$MYSQL_PASSWORD -D drupal -e "INSERT INTO filter (format, module, name, weight, status, settings) VALUES ('filtered_html', 'amber', 'filter_amber', 50, 1, X'613A303A7B7D');"
drush cc all -y

# Set default action for available links to hover
drush vset amber_available_action 1
drush vset amber_available_action_hover 0

# Disable the overlay module, since it causes problems with automated integration testing
drush dis overlay -y

# Set Drupal admin password
drush user-password admin --password=$DRUPAL_ADMIN_PASSWORD

# Install latest AWS library into Drupal
cd /var/www/sites/all/libraries
mkdir aws
cd aws
wget https://github.com/aws/aws-sdk-php/releases/download/$(curl -s https://api.github.com/repos/aws/aws-sdk-php/releases | grep tag_name | head -n 1 | cut -d '"' -f 4)/aws.zip
unzip aws.zip
rim aws.zip

service apache2 restart

# Install any provided public keys
if [ -d "/vagrant_public_keys" ]; then cat /vagrant_public_keys/* >> /home/ubuntu/.ssh/authorized_keys ; fi
