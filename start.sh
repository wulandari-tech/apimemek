#!/bin/bash

# Warna
NOCOLOR='\033[0m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
LIGHTGREEN='\033[1;32m'

while :
do
    clear
    echo -e "${CYAN}"
    cat << "EOF"
  [ GEFORCE REST ]
     ╭───────╮
     │ ◉   ◉ │
     │   ▿   │
     ╰───────╯
EOF

    echo -e "${YELLOW}  > Starting server..."
    echo -e "${LIGHTGREEN}"

    node index.js
    sleep 1
done