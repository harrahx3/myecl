#!/bin/bash
# Writes the configuration file of the application

fill(){
    echo -n "$1 [$2]: "
    read $3
    if [[ -z ${!3} ]]
    then
        eval $3="$2"
    fi
}

# Asks for parameters
manual(){
    echo "-----------------------"
    fill "Listening URL" "localhost" LURL
    fill "Listening port" "80" LPORT
    fill "Service URL" "localhost" URL
    fill "Service port" "80" PORT
    fill "Protocole" "http" HTTP
    fill "Root path" "$(pwd)" ROOT_PATH
    fill "Database host" "localhost" DB_HOST
    fill "Database client" "localhost" DB_CLIENT
    echo "-----------------------"
    echo "Initialisation complete."
    echo "-----------------------"
    database
}

# Asks for database configuration
database(){
    echo "Database configuration"
    echo "-----------------------"
    echo -n "Create database and user ? (y/n)"
    read conf
    if [[ "$conf" == "y" ]] || [[ "$conf" == "Y" ]]; then
        echo "I need to execute a sudo command. If it fails, execute as sudo"
        echo "Enter your mysql password"
        mysql -h $DB_HOST -u root -p -e "CREATE DATABASE IF NOT EXISTS myicl; GRANT USAGE ON *.* TO 'moby'@'$DB_CLIENT' IDENTIFIED BY 'moby'; GRANT ALL PRIVILEGES ON myicl.* TO 'moby'@'$DB_CLIENT';" 
    fi
}

# Entry point
# Selects between configuration mode
echo "MyECL app configuration"
echo "-----------------------"
echo -n "Use a default configuration ? (y/n) "
read conf
if [[ "$conf" == "y" ]] || [[ "$conf" == "Y" ]]; then
    echo -n "Production / Development / Local ? (p/d/l/other)"
    read conf
    if [[ "$conf" == "p" ]] || [[ "$conf" == "P" ]]; then
        LURL="172.18.24.170"
        LPORT=80
        URL="156.18.24.171"
        PORT=80
        HTTP="http"
        ROOT_PATH=/srv/web/myecl
        DB_HOST="172.18.24.169"
        DB_CLIENT="172.18.24.170"
        echo "-----------------------"
    elif [[ "$conf" == "d" ]] || [[ "$conf" == "D" ]]; then
        LURL="172.18.24.173"
        LPORT=80
        URL="156.18.24.171"
        PORT=8080
        HTTP="http"
        ROOT_PATH=/srv/web/myecl
        DB_HOST="172.18.24.172"
        DB_CLIENT="172.18.24.173"
        echo "-----------------------"
        echo "Initialisation complete."
        echo "-----------------------"
        database
    elif [[ "$conf" == "l" ]] || [[ "$conf" == "L" ]]; then
        LURL="localhost"
        LPORT=8080
        URL="localhost"
        PORT=80
        HTTP="http"
        ROOT_PATH=$(pwd)
        DB_HOST="localhost"
        DB_CLIENT="localhost"
        echo "-----------------------"
        echo "Initialisation complete."
        echo "-----------------------"
        database
    else
        manual
    fi
else
    manual
fi

# Outputs file
cat <<EOF | sed "s?@URL?$URL?g" | sed "s?@LURL?$LURL?g" | sed "s?@ROOT_PATH?$ROOT_PATH?g" | sed "s?@PORT?$PORT?g" | sed "s?@LPORT?$LPORT?g" | sed "s?@DB_HOST?$DB_HOST?g" | sed "s?@HTTP?$HTTP?g" > $ROOT_PATH/config.json
{
    "port": @LPORT,
    "url": "@LURL",
    
    "root_path": "@ROOT_PATH",

    "token_life": 600,
    "session_life": 3600,
    "jwt": "secret",

    "database": {
      "host": "@DB_HOST",
      "user": "moby",
      "password": "moby",
      "database": "myicl"
    },

    "tables": [
        {
            "name": "core_user",
            "schema": {
                "id": "INT PRIMARY KEY NOT NULL AUTO_INCREMENT",
                "login": "VARCHAR(12)",
                "password": "VARCHAR(60)",
                "name": "VARCHAR(32)",
                "firstname": "VARCHAR(64)",
                "nick": "VARCHAR(20)",
                "birth": "DATE",
                "promo": "INT",
                "floor": "VARCHAR(5)",
                "email": "TEXT",
                "picture": "TEXT",
                "online": "BOOLEAN",
                "last_seen": "DATETIME"
            }
        },
        {
            "name": "core_membership",
            "schema": {
                "id": "INT PRIMARY KEY NOT NULL AUTO_INCREMENT",
                "id_user": "INT NOT NULL",
                "id_group": "INT NOT NULL",
                "position": "VARCHAR(50)",
                "term": "VARCHAR(50)"
            }
        },
        {
            "name": "core_group",
            "schema": {
                "id": "INT PRIMARY KEY NOT NULL AUTO_INCREMENT",
                "name": "VARCHAR(127) UNIQUE",
                "description": "TEXT"
            },
            "init": [
                "REPLACE INTO core_group (id, name, description) VALUES (1, 'admin', 'Administrateurs du site');",
                "UPDATE core_group SET id = 1 WHERE name = 'admin';",
                "REPLACE INTO core_group (id, name, description) VALUES (2, 'ecl', 'Centraliens de Lyon');",
                "UPDATE core_group SET id = 2 WHERE name = 'ecl';"
            ]
        },
        {
            "name": "core_token",
            "schema": {
                "token": "VARCHAR(256)",
                "login": "VARCHAR(12)",
                "time": "BIGINT UNSIGNED"
            }
        }
    ],
    
    "cas_config": {
        "cas_url": "https://cas.ec-lyon.fr/cas",
        "service_url": "@HTTP://@URL:@PORT",
        "cas_version": "2.0",
        "session_name": "login_dsi",
        "session_info": "user_data"
    }
}
EOF

echo "-----------------------"
echo "File output successfully"
echo "-----------------------"

echo ""
echo "-----------------------"
echo "Updating npm"

# Updates npm
npm install

echo "-----------------------"
echo "Update complete"
echo "-----------------------"
echo "Done."