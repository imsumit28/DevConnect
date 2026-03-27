@echo off
cd /d D:\devconnect\client
npm.cmd run dev -- --host --port 5173 >> D:\devconnect\client\dev-run.out.log 2>> D:\devconnect\client\dev-run.err.log
