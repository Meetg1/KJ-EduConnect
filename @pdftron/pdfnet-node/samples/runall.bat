@echo off
for /D %%s in (*) do (
    if exist %%s\NODEJS\%%~nxs.js (
        cd %%s\NODEJS
        echo %%s starting...
        call node %%~nxs.js
        cd ..\..
        echo %%s finished.
        pause
    )
)

echo Run all tests finished.
