 #!/bin/bash

 PIDS=`ps aux | grep CAYLRunner.php | grep -v grep`
 if [ -z "$PIDS" ]; then
     echo "Starting CAYLRunner.php ..."
     while php /usr/local/src/robustness_common/src/CAYLRunner.php dequeue; do true ; done
 else
     echo "CAYLRunner.php already running."
 fi
