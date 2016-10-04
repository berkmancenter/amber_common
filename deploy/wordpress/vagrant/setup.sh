#!/bin/bash

if [[ -z "$1" ]]; then
	echo "RELEASE_TAG not specified. Proceeding with release of master branch"
	export RELEASE_TAG=master
else
	export RELEASE_TAG=$1
fi

if [[ -z "$2" ]]; then
	echo "Site URL not specified. Required for Wordpress. Dying now"
	exit 1
else
	export SITE_URL=$2
fi

if [[ -z "$3" ]]; then
	echo "Site admin password not specified. A Wordpress admin password will be generated"
else
	export WP_ADMIN_PASSWORD=$3
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

rm -rf /var/www/ ; cd /var; mkdir www; cd www;

cd /srv
sudo git clone git://github.com/wp-cli/wp-cli.git
cd wp-cli
sudo composer install

# Generate random passwords
MYSQL_PASSWORD=`pwgen -c -n -1 12`
WP_DB_PASSWORD=`pwgen -c -n -1 12`

if [[ -z "$WP_ADMIN_PASSWORD" ]]; then
	export WP_ADMIN_PASSWORD=`pwgen -1 8`
fi

# This is so the passwords show up in logs.
echo mysql root password: $MYSQL_PASSWORD
echo wp db password: $WP_DB_PASSWORD
echo wp admin password: $WP_ADMIN_PASSWORD
echo $MYSQL_PASSWORD > /mysql-root-pw.txt
echo $WP_DB_PASSWORD > /wp-db-pw.txt
echo $WP_ADMIN_PASSWORD > /wp-admin-pw.txt

# Set database password and prep for Drupal install
mysqladmin -u root --password=changeme password $MYSQL_PASSWORD
mysql -uroot -p$MYSQL_PASSWORD -e "CREATE DATABASE wp; GRANT ALL PRIVILEGES ON wp.* TO 'wp'@'localhost' IDENTIFIED BY '$WP_DB_PASSWORD'; FLUSH PRIVILEGES;"

# Fix apache configuration
sudo cp /vagrant/000-default.conf.sample /etc/apache2/sites-available/000-default.conf
sudo service apache2 restart

a2enmod rewrite vhost_alias

# Install Wordpress
cd /var/www/
curl -O -L http://wordpress.org/latest.tar.gz
tar -xvf latest.tar.gz
rm latest.tar.gz
cd /var/www/wordpress

/srv/wp-cli/bin/wp core config --allow-root --dbname=wp --dbuser=wp --dbpass=${WP_DB_PASSWORD} --quiet --extra-php <<PHP
define( 'WP_DEBUG', true );
PHP
# /srv/wp-cli/bin/wp core install --allow-root --url=`curl http://169.254.169.254/latest/meta-data/public-hostname` --quiet --title="Amber Wordpress" --admin_name=admin --admin_email="admin@local.dev" --admin_password="$WP_ADMIN_PASSWORD"
/srv/wp-cli/bin/wp core install --allow-root --url=$SITE_URL --quiet --title="Amber Wordpress" --admin_name=admin --admin_email="admin@local.dev" --admin_password="$WP_ADMIN_PASSWORD"

# Get Amber code
cd /usr/local/src
git clone https://github.com/berkmancenter/amber_wordpress.git
git -C /usr/local/src/amber_wordpress checkout $RELEASE_TAG
mv /usr/local/src/amber_wordpress /var/www/wordpress/wp-content/plugins/amber
cd /var/www/wordpress

# Activate the plugin
/srv/wp-cli/bin/wp plugin activate amber --allow-root

# Update permissions
chown -R www-data:www-data /var/www/

service apache2 restart

echo Wordpress admin password: $WP_ADMIN_PASSWORD

# Install any provided public keys
if [ -d "/vagrant_public_keys" ]; then cat /vagrant_public_keys/* >> /home/ubuntu/.ssh/authorized_keys ; fi

