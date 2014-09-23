#!/bin/bash
ps aux |grep node|grep app|awk '{print $2}' |xargs kill
cd /home/joker/server/earn-money
nohup node app &
