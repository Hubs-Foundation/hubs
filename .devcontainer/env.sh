#!/bin/bash
set -ex
THISDIR=$(pwd)

source .env

array_length=${#SOURCE[@]}

function replace_vars_in_files() {
    FILE=$1

    for ((i = 0; i < array_length; i++)); do

        IFS="=" read -r NAME VALUE <<<"${SOURCE[i]}"
        echo "$NAME $VALUE $FILE"
        sed -i "s/\${${NAME}}/${VALUE//\//\\/}/g" $FILE
    done
}

for ((i = 0; i < array_length; i++)); do
    export ${SOURCE[i]}
    echo "${SOURCE[i]}"
done

cd $THISDIR
