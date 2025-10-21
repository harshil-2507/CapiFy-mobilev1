#!/bin/bash

# Test script for local development
export GIN_MODE=debug
export PORT=8000
export DB_MOCK=true  # Use mock database mode for local testing

# For real PostgreSQL testing, uncomment these and set DB_MOCK=false:
# export DB_MOCK=false
# export PGSSLMODE=disable
# export PGHOST=localhost
# export PGPORT=5432
# export PGUSER=postgres
# export PGPASSWORD=your_password
# export PGDATABASE=finance

# For Railway testing, uncomment the line below instead:
# export DATABASE_URL="postgres://username:password@host:port/database?sslmode=require"

echo "🧪 Testing CapiFy Backend with Railway-like environment..."
echo "PORT: $PORT"
echo "GIN_MODE: $GIN_MODE"
echo "PGSSLMODE: $PGSSLMODE"

# Build and run
go build -o main . && ./main
