#!/bin/bash
set -e

# PostgreSQL 서버에 접속
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- test_db가 없는 경우에만 생성
    SELECT 'CREATE DATABASE test_db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'test_db')\gexec

    \c test_db

EOSQL