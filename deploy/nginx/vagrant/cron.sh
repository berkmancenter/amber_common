 #!/bin/bash

 PIDS=`ps aux | grep AmberRunner.php | grep -v grep`
 if [ -z "$PIDS" ]; then
     echo "Starting AmberRunner.php ..."
     while php /usr/local/src/robustness_common/src/AmberRunner.php dequeue; do true ; done
 else
     echo "AmberRunner.php already running."
 fi
