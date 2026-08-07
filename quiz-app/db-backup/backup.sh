#!/bin/bash

source "/home/robotoo/Documents/quiz-app/server/.env"

# Maak een variabele met de datum van vandaag (gebruik _ en - ipv : en , voor veilige bestandsnamen)
VANDAAG=$(date +%Y-%m-%d_%H-%M-%S)
DAG_VAN_DE_WEEK=$(date +%u)   # 1 (maandag) t/m 7 (zondag)
DAG_VAN_DE_MAAND=$(date +%d)  # 01 t/m 31

# Definieer de MAPPEN (dit is nodig voor het 'find' commando om in te zoeken)
DIR_DAGELIJKS="/home/robotoo/Documents/quiz-app/db-backup/backups/daily"
DIR_WEEK="/home/robotoo/Documents/quiz-app/db-backup/backups/weekly"
DIR_MAAND="/home/robotoo/Documents/quiz-app/db-backup/backups/monthly"

# Zorg dat de mappen bestaan (voorkomt foutmeldingen als ze nog niet handmatig zijn aangemaakt)
mkdir -p "$DIR_DAGELIJKS" "$DIR_WEEK" "$DIR_MAAND"

# Definieer de volledige paden inclusief bestandsnaam voor de mongodump en kopieer-acties
BACKUP_DAGELIJKS="$DIR_DAGELIJKS/$VANDAAG.gz"
BACKUP_WEEK="$DIR_WEEK/$VANDAAG.gz"
BACKUP_MAAND="$DIR_MAAND/$VANDAAG.gz"

# 1. Maak de dagelijkse backup
/usr/bin/mongodump --uri="$ATLAS_URI_BACKUP" --archive="$BACKUP_DAGELIJKS" --gzip

# 2. Is het zondag? Kopieer het bestand dan ook naar de wekelijkse map
if [ "$DAG_VAN_DE_WEEK" = "7" ]; then
    cp "$BACKUP_DAGELIJKS" "$BACKUP_WEEK"
fi

# 3. Is het de 1e van de maand? Kopieer het bestand dan ook naar de maandelijkse map
if [ "$DAG_VAN_DE_MAAND" = "01" ]; then
    cp "$BACKUP_DAGELIJKS" "$BACKUP_MAAND"
fi

# 4. Slim Opruimen (verwijder bestanden ouder dan de opgegeven dagen uit hun respectievelijke mappen)
find "$DIR_DAGELIJKS" -type f -name "*.gz" -mtime +8 -delete
find "$DIR_WEEK" -type f -name "*.gz" -mtime +15 -delete
find "$DIR_MAAND" -type f -name "*.gz" -mtime +61 -delete