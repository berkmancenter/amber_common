 #!/bin/bash
/usr/bin/flock -n -x /tmp/amber-runner-check.lock -c  "php /usr/local/src/amber_common/src/AmberRunner.php --action=check $*"
