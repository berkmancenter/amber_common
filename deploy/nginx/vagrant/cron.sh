 #!/bin/bash

 PIDS=`ps aux | grep CAYLRunner.php | grep -v grep`
 if [ -z "$PIDS" ]; then
     echo "Starting CAYLRunner.php ..."
     php /usr/local/src/robustness_common/src/CAYLRunner.php
 else
     echo "CAYLRunner.php already running."
 fi
