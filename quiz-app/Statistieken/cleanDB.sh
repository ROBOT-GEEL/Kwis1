#!/bin/bash

# Definieer het absolute pad naar je .env bestand
ENV_FILE="/home/robotoo/Documents/quiz-app/server/.env"

# Controleer of het bestand op dit exacte pad bestaat
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
else
  echo "Fout: .env bestand niet gevonden op $ENV_FILE!"
  exit 1
fi

echo "Starten met clearen van de resultaten..."

mongosh "$ATLAS_URI_BACKUP" <<'EOF'

db.results.deleteMany({ questionId: { $ne: 33 } })
db.results.find()

EOF

echo "Klaar!"
