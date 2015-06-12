#!/bin/bash
 
# Generate random passwords 
DRUPAL_DB="drupal"
MYSQL_PASSWORD=`pwgen -c -n -1 12`
DRUPAL_DB_PASSWORD=`pwgen -c -n -1 12`
DRUPAL_ADMIN_PASSWORD=`pwgen -1 8`

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

# Set Drupal admin password
drush user-password admin --password=$DRUPAL_ADMIN_PASSWORD

# Install any provided public keys
cat /vagrant_public_keys/* >> /home/ubuntu/.ssh/authorized_keys 