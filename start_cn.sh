#!/bin/bash
ps aux |grep node|grep cn_app|awk '{print $2}' |xargs kill
cd /home/joker/earn
nohup node cn_app 1>> nohup.cn.out 2>&1 &
ps aux|grep tail |grep 'nohup.cn.out'|awk '{print $2}' |xargs kill 
tail -f nohup.cn.out &
