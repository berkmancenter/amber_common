 #!/bin/bash
/usr/bin/flock -n -x /tmp/amber-runner-cache.lock -c  "while php /usr/local/src/amber_common/src/AmberRunner.php --action=dequeue $*; do true ; done"
