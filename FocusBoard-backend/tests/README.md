# FocusBoard Test Suite

## Prerequisites

1. Backend server running on `http://localhost:3000`
2. ML service running on `http://localhost:5001` (use the root `ml-service` FastAPI service)
3. MongoDB connected

## Available Tests

### 1. Real Data Integration Test
```bash
node tests/real-data-test.js
```
- Creates test categories (Development, Design, Communication, Research, Entertainment)
- Creates sample activities with different apps
- Verifies categorization is working
- Displays results

### 2. Performance Test (150+ Activities)
```bash
node tests/performance-bulk-test.js
```
- Creates 150 activities in batches
- Measures creation performance
- Tests fetch performance with various filters
- Checks categorization rate

### 3. 3-Tier Categorization Test
```bash
node tests/3-tier-comprehensive-test.js
```
- Tests rule-based categorization
- Tests ML embedding fallback
- Tests NSFW detection
- Comprehensive system validation

### 4. Run All Tests
```bash
./tests/run-all-tests.sh
```
Runs all tests in sequence with status reporting.


### 6. Seed Production Data
```bash
export BACKEND_URL=https://your-backend.up.railway.app
node tests/seed-production.js
```
Seeds initial categories to production database.

## SMTP Configuration

To enable email alerts for NSFW content:

1. Copy `.env.example` to `.env`
2. Configure SMTP settings:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=FocusBoard <noreply@focusboard.app>
PARENT_EMAIL=parent@example.com
```

3. For Gmail, create an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Generate password for "Mail"

## Test Results

Expected outcomes:
- ✓ All categories created successfully
- ✓ Activities categorized automatically
- ✓ Performance: <100ms per activity creation
- ✓ Fetch performance: <500ms for 150 activities
- ✓ Categorization rate: >80%
- ✓ NSFW detection working
- ✓ Email alerts sent (if SMTP configured)
