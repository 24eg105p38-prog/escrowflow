#!/usr/bin/env bash
# ==============================================================================
# EscrowFlow - Startup Script
# A Milestone-Based Escrow Tracking Platform for Freelance Project Contracts
# Author: Gade Vinay | Roll No: 24EG105P38 | Anurag University (CSE-P)
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/backend"

echo "======================================================================"
echo "           🚀 Starting EscrowFlow Platform (Spring Boot & React)      "
echo "======================================================================"
echo "Student: Gade Vinay | Roll: 24EG105P38 | Anurag University (CSE-P)"
echo "----------------------------------------------------------------------"
echo "Checking Environment..."

if ! command -v java &> /dev/null; then
    echo "❌ Error: Java is not installed or not in PATH."
    exit 1
fi

JAVA_VER=$(java -version 2>&1 | head -n 1)
echo "✓ Java detected: $JAVA_VER"

if ! command -v mvn &> /dev/null; then
    echo "❌ Error: Maven is not installed or not in PATH."
    exit 1
fi

echo "✓ Maven detected: $(mvn -version 2>&1 | head -n 1)"
echo ""
echo "ℹ️  Database Mode: In-Memory H2 with MySQL Compatibility Mode"
echo "   (Zero configuration required, schema & sample data loaded automatically)"
echo ""
echo "Demo Accounts Ready to Test:"
echo "   1. Client:      client@escrowflow.com      (Password: password123)"
echo "   2. Freelancer:  freelancer@escrowflow.com  (Password: password123)"
echo "   3. Admin:       admin@escrowflow.com       (Password: password123)"
echo ""
echo "Starting Spring Boot application on http://localhost:8080 ..."
echo "======================================================================"

mvn spring-boot:run
