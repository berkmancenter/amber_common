robustness_common
=================
[![Build Status](https://travis-ci.org/berkmancenter/robustness_common.png?branch=master)](https://travis-ci.org/berkmancenter/robustness_common)

Code and documentation for the Internet Robustness project that's used across multiple platforms

## Sample environments

There are sample virtual machines configured for each of the Internet Robustness environments

### nginx (Vagrant)

* Install Vagrant (http://vagrantup.com)
* ```cd deploy/nginx/vagrant```
* ```vagrant up```

### Drupal (Vagrant)

* Install Vagrant (http://vagrantup.com)
* ```cd deploy/drupal/vagrant```
* ```vagrant up```

The Drupal server will be available at http://localhost:9000, with the Internet Robustness plugin enabled

### Drupal (Vagrant - AWS)

* Install Vagrant (http://vagrantup.com)
* Setup environment variables with your AWS credentials
    * AWS_ACCESS_KEY_ID
    * AWS_SECRET_ACCESS_KEY
    * AWS_KEYPAIR_NAME
    * AWS_PRIVATE_AWS_SSH_KEY_PATH
* ```cd deploy/drupal/vagrant```
* ```vagrant up --provider=aws```
* ```vagrant ssh```

### Nginx (Vagrant - AWS)

* Install Vagrant (http://vagrantup.com)
* Setup environment variables with your AWS credentials
    * AWS_ACCESS_KEY_ID
    * AWS_SECRET_ACCESS_KEY
    * AWS_KEYPAIR_NAME
    * AWS_PRIVATE_AWS_SSH_KEY_PATH
* ```cd deploy/nginx/vagrant```
* ```vagrant up --provider=aws```
* ```vagrant ssh```

### Wordpress (Vagrant - AWS)

* Install Vagrant (http://vagrantup.com)
* Setup environment variables with your AWS credentials
    * AWS_ACCESS_KEY_ID
    * AWS_SECRET_ACCESS_KEY
    * AWS_KEYPAIR_NAME
    * AWS_PRIVATE_AWS_SSH_KEY_PATH
* ```cd deploy/wordpress/vagrant```
* ```vagrant up --provider=aws```
* ```vagrant ssh```

### Apache (Vagrant - AWS)

* Install Vagrant (http://vagrantup.com)
* Setup environment variables with your AWS credentials
    * AWS_ACCESS_KEY_ID
    * AWS_SECRET_ACCESS_KEY
    * AWS_KEYPAIR_NAME
    * AWS_PRIVATE_AWS_SSH_KEY_PATH
* ```cd deploy/apache/vagrant```
* ```vagrant up --provider=aws```
* ```vagrant ssh```


