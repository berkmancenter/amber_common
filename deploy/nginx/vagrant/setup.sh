# Install prerequisites
sudo apt-get update
sudo apt-get -y install git make curl libpcre3 libpcre3-dev sqlite3 libsqlite3-dev php5-cli php5-common php5-sqlite php5-curl zlib1g-dev

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

# CAYL configuration
cp /vagrant/nginx.conf.sample /usr/local/nginx/conf/nginx.conf
cp /usr/local/src/robustness_nginx/amber.conf /usr/local/nginx/conf

mkdir /var/lib/amber
sqlite3 /var/lib/amber/amber.db < /usr/local/src/robustness_nginx/amber.sql

mkdir /usr/local/nginx/html/amber
mkdir /usr/local/nginx/html/amber/cache
cp -r /usr/local/src/robustness_nginx/css /usr/local/src/robustness_nginx/js /usr/local/nginx/html/amber

# Update permissions
chgrp -R www-data /var/lib/amber /usr/local/nginx/html/amber/cache
chmod -R g+w /var/lib/amber /usr/local/nginx/html/amber/cache
chmod +x /usr/local/src/robustness_common/deploy/nginx/vagrant/cron.sh

# Schedule cron job
echo "*/5 * * * * www-data /bin/sh /usr/local/src/robustness_common/deploy/nginx/vagrant/cron.sh" > /etc/cron.d/amber

# Start nginx
/usr/local/nginx/sbin/nginx