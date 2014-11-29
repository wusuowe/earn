#!/bin/bash
ps aux |grep node|grep en_app|awk '{print $2}' |xargs kill
cd /home/joker/earn
nohup node en_app 1>> nohup.en.out 2>&1 &
ps aux|grep tail |grep 'nohup.en.out'|awk '{print $2}' |xargs kill
tail -f nohup.en.out &
