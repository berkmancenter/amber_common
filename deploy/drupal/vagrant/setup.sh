#!/bin/bash

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
mv /usr/local/src/amber_drupal/amber /var/www/sites/all/modules

/vagrant/start.sh

service apache2 restart

