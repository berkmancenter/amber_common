[![Build Status](https://travis-ci.org/berkmancenter/amber_common.png?branch=master)](https://travis-ci.org/berkmancenter/amber_common)

# Contents

* Any code that is shared across the different platform-specific Amber implementations
* Scripts to deploy sample websites to AWS with Amber intalled for each of the Amber plaforms (Drupal, Wordpress, Nginx, Apache)
* Integration test suites for each platform

## Deployment Requirements

* Vagrant
* Vagrant AWS provider. To install:
```
vagrant plugin install vagrant-aws
vagrant box add dummy https://github.com/mitchellh/vagrant-aws/raw/master/dummy.box
```
* AWS command-line tools (if automatically assigning IP addresses)
* AWS credentials in the following environment variables
    * AWS_ACCESS_KEY_ID
    * AWS_ACCESS_KEY (same as AWS_ACCESS_KEY_ID)
    * AWS_SECRET_ACCESS_KEY
    * AWS_SECRET_KEY (same as AWS_SECRET_ACCESS_KEY)
    * AWS_KEYPAIR_NAME
    * AWS_PRIVATE_AWS_SSH_KEY_PATH
* (Optional) Additional environment variables
    * AMBER_PUBLIC_KEY_DIR => Directory containing public SSH keys to be copied to ```authorized_keys``` on the new server, to allow SSH login
    * AMBER_drupal_ELASTIC_IP => AWS Elastic IP to assign to the Drupal server
    * AMBER_wordpress_ELASTIC_IP => AWS Elastic IP to assign to the Wordpress server
    * AMBER_apache_ELASTIC_IP => AWS Elastic IP to assign to the Apache server
    * AMBER_nginx_ELASTIC_IP => AWS Elastic IP to assign to the Nginx server

## Deployment

```deploy.sh --platform=[drupal|wordpress|nginx|apache|all] --release=RELEASE --site-password=[PASSWORD]```

Where:

* ```RELEASE``` is the version of the code to deploy - a git tag/hash/branch from the relevant Github repository; and
* ```PASSWORD``` is the CMS admin password to set on the new site (Drupal and Wordpress only)

## Test Suite Requirements

* CasperJS 1.1 - (http://casperjs.readthedocs.org/en/latest/installation.html)

## Test Suite Execution

Copy ```config.js.sample``` to ```config.js``` and update the ```servers``` variable with the IP addresses of the target servers for each plaform, and the ```passwords``` variable with the admin passwords for the Drupal and Wordpress sites.

Run tests for each platform
```
cd test
casperjs test nginx-precache.js apache-precache.js drupal.js wordpress.js --includes=config.js,ws-include.js
```

Wait 10 minutes for automated caching to complete on the web servers, and then run the final tests:

```
casperjs test nginx-postcache.js apache-postcache.js --includes=config.js,ws-include.js
```

## Creating Github releases

```create_release.sh --platform=[drupal|wordpress|nginx|apache|common|all] --version=VERSION --commit=COMMIT --description=DESCRIPTION```

Where:

* ```VERSION``` is the version number of the release (e.g. 1.2); and
* ```COMMIT``` is the version of the code to use for the release - a git tag/hash/branch from the relevant Github repository; and
* ```DESCRIPTION``` is the text to be used for the release description






