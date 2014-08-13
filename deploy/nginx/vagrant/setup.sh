# Install prerequisites
sudo apt-get update
sudo apt-get -y install git make curl libpcre3 libpcre3-dev sqlite3 libsqlite3-dev php5-cli php5-common php5-sqlite php5-curl php5-fpm zlib1g-dev

# Get code
cd /usr/local/src
git clone https://github.com/berkmancenter/robustness_common.git
git clone https://github.com/berkmancenter/robustness_nginx.git
git clone https://github.com/yaoweibin/ngx_http_substitutions_filter_module

# Build nginx
curl http://nginx.org/download/nginx-1.6.0.tar.gz > nginx-1.6.0.tar.gz
tar xzf nginx-1.6.0.tar.gz
cd nginx-1.6.0
./configure --add-module=../ngx_http_substitutions_filter_module --add-module=../robustness_nginx
make
sudo make install

# Amber configuration - Install template nginx configuration file
cp /vagrant/nginx.conf.sample /usr/local/nginx/conf/nginx.conf

# Amber configuration - Install the amber-specific nginx configuration file
cp /usr/local/src/robustness_nginx/amber.conf /usr/local/nginx/conf

# Amber configuration - Setup the database
mkdir /var/lib/amber
sqlite3 /var/lib/amber/amber.db < /usr/local/src/robustness_common/src/amber.sql

# Amber configuration - Setup the cache directory
mkdir /usr/local/nginx/html/amber
mkdir /usr/local/nginx/html/amber/cache

# Amber configuration - Setup the admin control panel
ln -s /usr/local/src/robustness_common/src/admin /usr/local/nginx/html/amber/admin

# Amber configuration - Install the Amber CSS and Javascript
cp -r /usr/local/src/robustness_common/src/css /usr/local/src/robustness_common/src/js /usr/local/nginx/html/amber

# Update permissions
chgrp -R www-data /var/lib/amber /usr/local/nginx/html/amber
chmod -R g+w /var/lib/amber /usr/local/nginx/html/amber/cache
chmod +x /usr/local/src/robustness_common/deploy/nginx/vagrant/cron-cache.sh /usr/local/src/robustness_common/deploy/nginx/vagrant/cron-check.sh

# Schedule cron job
cat > /etc/cron.d/amber << EOF
*/5 * * * * www-data /bin/sh /usr/local/src/robustness_common/deploy/nginx/vagrant/cron-cache.sh --ini=/usr/local/src/robustness_common/src/amber.ini 2>> /var/log/amber >> /var/log/amber
15 3 * * *  www-data /bin/sh /usr/local/src/robustness_common/deploy/nginx/vagrant/cron-check.sh --ini=/usr/local/src/robustness_common/src/amber.ini 2>> /var/log/amber >> /var/log/amber
EOF

# Setup permissions for cron job logs
touch /var/log/amber
chown www-data /var/log/amber
chgrp www-data /var/log/amber

# Start nginx
/usr/local/nginx/sbin/nginx