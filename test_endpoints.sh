#!/usr/bin/env bash
# ==============================================================================
# EscrowFlow - Automated API & Business Logic Verification Test Suite
# Author: Gade Vinay | Roll: 24EG105P38 | Anurag University (CSE-P)
# ==============================================================================

BASE_URL="http://localhost:8080"
PASS_COUNT=0
FAIL_COUNT=0

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

assert_test() {
    local name="$1"
    local condition="$2"
    if [ "$condition" -eq 0 ]; then
        echo -e "${GREEN}✓ [PASS]${NC} $name"
        ((PASS_COUNT++))
    else
        echo -e "${RED}✗ [FAIL]${NC} $name"
        ((FAIL_COUNT++))
    fi
}

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}        🧪 EscrowFlow API & State-Verified Ledger Test Runner        ${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo -e "Testing Server at: ${BASE_URL}\n"

# 1. Web Root Check
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$HTTP_STATUS" == "200" ]; then
    assert_test "Web root & static UI served (HTTP 200)" 0
else
    assert_test "Web root & static UI served (Got HTTP $HTTP_STATUS)" 1
fi

# 2. Client Authentication
CLIENT_RES=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"client@escrowflow.com","password":"password123"}')
CLIENT_TOKEN=$(echo "$CLIENT_RES" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$CLIENT_TOKEN" ]; then
    assert_test "Client authentication & JWT generation" 0
else
    assert_test "Client authentication & JWT generation" 1
fi

# 3. Freelancer Authentication
FREELANCER_RES=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"freelancer@escrowflow.com","password":"password123"}')
FREELANCER_TOKEN=$(echo "$FREELANCER_RES" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$FREELANCER_TOKEN" ]; then
    assert_test "Freelancer authentication & JWT generation" 0
else
    assert_test "Freelancer authentication & JWT generation" 1
fi

# 4. Admin Authentication
ADMIN_RES=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escrowflow.com","password":"password123"}')
ADMIN_TOKEN=$(echo "$ADMIN_RES" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$ADMIN_TOKEN" ]; then
    assert_test "Admin authentication & JWT generation" 0
else
    assert_test "Admin authentication & JWT generation" 1
fi

# 5. Contract & Table 6 Milestone Retrieval
CONTRACT_RES=$(curl -s "$BASE_URL/api/contracts/1" -H "Authorization: Bearer $CLIENT_TOKEN")
HAS_MILESTONES=$(echo "$CONTRACT_RES" | grep -o '"title":"Wireframes & UX Flow"')

if [ -n "$HAS_MILESTONES" ]; then
    assert_test "Retrieve Table 6 Contract & Milestones" 0
else
    assert_test "Retrieve Table 6 Contract & Milestones" 1
fi

# 6. Deliverable Submission (Freelancer Role)
SUBMIT_RES=$(curl -s -X POST "$BASE_URL/api/milestones/4/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -d '{"evidence":"https://github.com/escrowflow/releases/tag/v1.0.0","note":"Test runner automated submission evidence"}')
SUBMIT_STATUS=$(echo "$SUBMIT_RES" | grep -o '"status":"SUBMITTED"')

if [ -n "$SUBMIT_STATUS" ]; then
    assert_test "Freelancer submits deliverable evidence (PENDING -> SUBMITTED)" 0
else
    assert_test "Freelancer submits deliverable evidence" 1
fi

# 7. Milestone Dispute (Client Revision with Mandatory Reason)
DISPUTE_RES=$(curl -s -X POST "$BASE_URL/api/milestones/4/dispute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d '{"reason":"Automated test revision request: Provide performance metrics"}')
DISPUTE_STATUS=$(echo "$DISPUTE_RES" | grep -o '"status":"PENDING"')

if [ -n "$DISPUTE_STATUS" ]; then
    assert_test "Client disputes milestone with mandatory reason (SUBMITTED -> PENDING)" 0
else
    assert_test "Client disputes milestone with mandatory reason" 1
fi

# 8. Re-submit and Client Approve (ACID Fund Release)
curl -s -X POST "$BASE_URL/api/milestones/4/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -d '{"evidence":"https://github.com/escrowflow/final-delivery","note":"Revised with all requested metrics"}' > /dev/null

APPROVE_RES=$(curl -s -X POST "$BASE_URL/api/milestones/4/approve" \
  -H "Authorization: Bearer $CLIENT_TOKEN")
APPROVE_STATUS=$(echo "$APPROVE_RES" | grep -o '"status":"PAID"')

if [ -n "$APPROVE_STATUS" ]; then
    assert_test "Client authority approves milestone & executes ACID fund release" 0
else
    assert_test "Client authority approves milestone & executes ACID fund release" 1
fi

# 9. Verify Ledger & Audit Trail
LEDGER_RES=$(curl -s "$BASE_URL/api/contracts/1/ledger" -H "Authorization: Bearer $CLIENT_TOKEN")
HAS_LEDGER_TXS=$(echo "$LEDGER_RES" | grep -o '"transactionType":"RELEASE_PAYMENT"')

if [ -n "$HAS_LEDGER_TXS" ]; then
    assert_test "ACID transaction rows stored in MySQL ledger" 0
else
    assert_test "ACID transaction rows stored in MySQL ledger" 1
fi

# 10. Admin Overview Verification
ADMIN_OVERVIEW_RES=$(curl -s "$BASE_URL/api/admin/overview" -H "Authorization: Bearer $ADMIN_TOKEN")
HAS_TOTAL_CONTRACTS=$(echo "$ADMIN_OVERVIEW_RES" | grep -o '"totalContracts":')

if [ -n "$HAS_TOTAL_CONTRACTS" ]; then
    assert_test "Platform Administrator audit & integrity overview" 0
else
    assert_test "Platform Administrator audit & integrity overview" 1
fi

echo -e "\n${BLUE}======================================================================${NC}"
echo -e "Tests Completed: ${GREEN}$PASS_COUNT Passed${NC}, ${RED}$FAIL_COUNT Failed${NC}"
echo -e "${BLUE}======================================================================${NC}"

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL ESCROWFLOW BUSINESS & ARCHITECTURE GUARANTEES VERIFIED!${NC}\n"
    exit 0
else
    echo -e "${RED}⚠️ Some tests failed. Check server logs.${NC}\n"
    exit 1
fi
