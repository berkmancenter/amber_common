 #!/bin/bash

 PIDS=`ps aux | grep AmberRunner.php | grep -v grep`
 if [ -z "$PIDS" ]; then
     while php /usr/local/src/amber_common/src/AmberRunner.php --action=dequeue $*; do true ; done
 else
     echo "AmberRunner.php already running."
 fi
