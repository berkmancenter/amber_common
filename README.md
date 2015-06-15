amber_common
=================
[![Build Status](https://travis-ci.org/berkmancenter/amber_common.png?branch=master)](https://travis-ci.org/berkmancenter/amber_common)

# Contents

* Any code that is shared across the different platform-specific Amber implementations
* Scripts to deploy sample websites to AWS with Amber intalled for each of the Amber plaforms (Drupal, Wordpress, Nginx, Apache)

## Requirements

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

```deploy.sh --platform=[drupal|wordpress|nginx|apache|all] --release=RELEASE```

Where ```RELEASE``` is the version of the code to deploy - a git tag/hash/branch from the relevant Github repository



