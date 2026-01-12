# Testing Checklist

Use this checklist to verify all features are working correctly.

## 🚀 Setup

- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created with proper values
- [ ] Development server running (`npm run dev`)
- [ ] Can access http://localhost:3000

## 🔐 Authentication

### Registration
- [ ] Can access `/auth` page
- [ ] Can switch to registration form
- [ ] Email validation works (rejects invalid emails)
- [ ] Password validation works (min 8 characters)
- [ ] Registration succeeds with valid credentials
- [ ] Error shown for duplicate email
- [ ] After registration, switches to login form

### Login
- [ ] Can enter email and password
- [ ] Login succeeds with correct credentials
- [ ] Error shown for incorrect credentials
- [ ] Redirects to dashboard after successful login
- [ ] Session cookie is set

### Session Management
- [ ] Dashboard requires authentication (redirects to `/auth` if not logged in)
- [ ] Loans page requires authentication
- [ ] Session persists across page refreshes
- [ ] Can logout successfully
- [ ] After logout, redirected to `/auth`
- [ ] After logout, cannot access protected pages

## 💰 Transactions (Dashboard)

### Viewing Transactions
- [ ] Dashboard loads successfully
- [ ] Total wealth displayed correctly
- [ ] Total income displayed in green
- [ ] Total expenses displayed in red
- [ ] Transactions grouped by month
- [ ] Month dividers show correct month/year
- [ ] Transactions sorted by date (newest first)
- [ ] Income shows with green "+" prefix
- [ ] Expenses show with red "-" prefix

### Adding Income
- [ ] Click "Add Income" button opens dialog
- [ ] Amount field accepts numbers
- [ ] Category field required
- [ ] Note field optional
- [ ] Date field defaults to today
- [ ] Can select different date
- [ ] Submit creates transaction
- [ ] Dialog closes on success
- [ ] Dashboard updates with new transaction
- [ ] Total wealth updates correctly

### Adding Expense
- [ ] Click "Add Expense" button opens dialog
- [ ] Can create expense transaction
- [ ] Expense shows with negative amount
- [ ] Total wealth decreases correctly

### Empty State
- [ ] Empty state shown when no transactions
- [ ] Shows helpful message
- [ ] Shows wallet icon

## 💳 Loans

### Navigation
- [ ] Can navigate to Loans page from dashboard
- [ ] Can navigate back to dashboard from Loans page
- [ ] Logout button works on Loans page

### Viewing Loans
- [ ] Empty state shown when no loans
- [ ] Loans list displayed correctly
- [ ] Each loan shows all details (name, principal, rate, EMI, etc.)
- [ ] Progress bar shows correct percentage
- [ ] Paid/total count correct

### Next EMI Alert
- [ ] Shows when loans exist with unpaid EMIs
- [ ] Displays correct loan name
- [ ] Shows correct EMI amount
- [ ] Shows correct due date
- [ ] Color changes based on urgency:
  - [ ] Blue for >21 days
  - [ ] Yellow for 14-21 days
  - [ ] Orange for 7-14 days
  - [ ] Red for <7 days or overdue

### Adding Loan
- [ ] Click "Add Loan" opens dialog
- [ ] All fields required
- [ ] Loan name accepts text
- [ ] Principal accepts positive numbers
- [ ] Interest rate accepts numbers (including 0)
- [ ] Duration accepts positive integers
- [ ] Start date field works
- [ ] Submit creates loan
- [ ] EMI amount calculated automatically
- [ ] Total interest calculated automatically
- [ ] Payment schedule generated
- [ ] Dialog closes on success
- [ ] Loans page updates

### Marking EMI as Paid
- [ ] "Mark as Paid" button shown for next unpaid EMI
- [ ] Clicking marks EMI as paid
- [ ] Progress bar updates
- [ ] Next EMI becomes available
- [ ] When all paid, shows completion message

### Deleting Loan
- [ ] Delete button (trash icon) visible
- [ ] Confirmation dialog appears
- [ ] Can cancel deletion
- [ ] Can confirm deletion
- [ ] Loan removed from list
- [ ] Next EMI alert updates

## 🔄 API Testing

### Authentication Endpoints

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```
- [ ] Returns 200 with success and userId
- [ ] Returns 400 for duplicate email
- [ ] Returns 400 for invalid email
- [ ] Returns 400 for short password

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}' \
  -c cookies.txt
```
- [ ] Returns 200 with sessionId and userId
- [ ] Sets session cookie
- [ ] Returns 401 for wrong password
- [ ] Returns 401 for non-existent email

**Session:**
```bash
curl http://localhost:3000/api/auth/session -b cookies.txt
```
- [ ] Returns authenticated user data
- [ ] Returns 401 without cookie

**Logout:**
```bash
curl -X POST http://localhost:3000/api/auth/logout -b cookies.txt
```
- [ ] Returns success
- [ ] Clears session cookie

### Transaction Endpoints

**Get All:**
```bash
curl http://localhost:3000/api/transactions -b cookies.txt
```
- [ ] Returns array of transactions
- [ ] Returns 401 without auth

**Create:**
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"amount":100,"category":"Test","date":"2026-01-12","isIncome":false}'
```
- [ ] Returns 201 with transaction
- [ ] Auto-generates ID
- [ ] Auto-sets monthKey
- [ ] Returns 400 for invalid data

**Update:**
```bash
curl -X PUT http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"id":"trans_id","amount":150,"category":"Updated","date":"2026-01-12","isIncome":false}'
```
- [ ] Returns updated transaction
- [ ] Updates updatedAt timestamp

**Delete:**
```bash
curl -X DELETE http://localhost:3000/api/transactions/trans_id -b cookies.txt
```
- [ ] Returns success
- [ ] Transaction removed

**Sync:**
```bash
curl "http://localhost:3000/api/transactions/sync?lastSync=2026-01-01T00:00:00.000Z" -b cookies.txt
```
- [ ] Returns transactions since timestamp
- [ ] Returns deleted IDs
- [ ] Returns new syncTimestamp

### Loan Endpoints

**Get All:**
```bash
curl http://localhost:3000/api/loans -b cookies.txt
```
- [ ] Returns array of loans

**Create:**
```bash
curl -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Test Loan","principal":10000,"interestRate":10,"durationMonths":12,"startDate":"2026-01-01"}'
```
- [ ] Returns 201 with loan
- [ ] EMI calculated correctly
- [ ] Total interest calculated
- [ ] Payment schedule generated

**Pay EMI:**
```bash
curl -X POST http://localhost:3000/api/loans/loan_id/pay \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"monthNumber":1}'
```
- [ ] Marks payment as paid
- [ ] Sets paidDate

**Delete:**
```bash
curl -X DELETE http://localhost:3000/api/loans/loan_id -b cookies.txt
```
- [ ] Returns success
- [ ] Loan removed

**Sync:**
```bash
curl "http://localhost:3000/api/loans/sync?lastSync=2026-01-01T00:00:00.000Z" -b cookies.txt
```
- [ ] Returns loans since timestamp

### Bulk Sync Endpoint

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "lastSyncTimestamp":"2026-01-01T00:00:00.000Z",
    "changes":{
      "transactions":{"new":[],"updated":[],"deleted":[]},
      "loans":{"new":[],"updated":[],"deleted":[]}
    }
  }'
```
- [ ] Accepts sync request
- [ ] Returns server changes
- [ ] Returns new syncTimestamp

## 📁 File Storage

### Data Directory
- [ ] `data/` directory created on first use
- [ ] `data/users.json` created
- [ ] `data/sessions.json` created
- [ ] User-specific directories created (`data/users/{userId}/`)
- [ ] `transactions.json` in user directory
- [ ] `loans.json` in user directory
- [ ] `deleted.json` in user directory

### Data Integrity
- [ ] Transactions persist after restart
- [ ] Loans persist after restart
- [ ] Sessions persist after restart
- [ ] User data isolated per user
- [ ] Multiple users can coexist

## 🎨 UI/UX

### Responsiveness
- [ ] Works on desktop (1920x1080)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] No horizontal scrolling
- [ ] Buttons sized appropriately
- [ ] Text readable at all sizes

### Visual Design
- [ ] Colors match specification (green, red, purple, blue)
- [ ] Gradients render correctly
- [ ] Shadows visible
- [ ] Rounded corners consistent
- [ ] Icons display correctly
- [ ] Loading states visible

### Interactions
- [ ] Buttons show hover effects
- [ ] Dialogs can be closed with Cancel
- [ ] Dialogs can be closed with X button (if implemented)
- [ ] Form validation messages clear
- [ ] Success feedback provided
- [ ] Error messages helpful

## 🔒 Security

### Password Security
- [ ] Passwords not visible in UI (type="password")
- [ ] Passwords not logged to console
- [ ] Passwords hashed in storage
- [ ] Cannot reverse engineer passwords

### Session Security
- [ ] Session IDs random and unpredictable
- [ ] Session cookies httpOnly
- [ ] Session cookies secure (in production)
- [ ] Sessions expire after 30 days
- [ ] Old sessions cleaned up

### API Security
- [ ] All protected endpoints require auth
- [ ] Cannot access other users' data
- [ ] SQL injection not possible (no SQL used)
- [ ] XSS prevented (React escapes by default)

## 📊 Data Validation

### Input Validation
- [ ] Negative amounts rejected
- [ ] Empty strings rejected for required fields
- [ ] Invalid dates rejected
- [ ] Invalid email formats rejected
- [ ] Type mismatches rejected (string instead of number)

### Error Handling
- [ ] API errors show user-friendly messages
- [ ] Network errors handled gracefully
- [ ] Invalid responses handled
- [ ] Unexpected errors don't crash app

## 🚀 Performance

### Load Times
- [ ] Dashboard loads in <2 seconds
- [ ] API requests complete in <500ms
- [ ] No excessive re-renders
- [ ] Smooth scrolling

### Data Handling
- [ ] Can handle 100+ transactions
- [ ] Can handle 10+ loans
- [ ] No memory leaks
- [ ] State updates efficient

## 📱 Mobile Integration Simulation

Use these steps to simulate mobile app behavior:

### Headers Test
```bash
# Test Bearer token authentication (mobile app style)
curl http://localhost:3000/api/transactions \
  -H "Authorization: Bearer your_session_id_here"
```
- [ ] Works with Bearer token
- [ ] Same result as cookie auth

### Sync Simulation
1. Create transactions in browser
2. Call sync API with old timestamp
3. Verify new transactions returned
4. Create transaction via API
5. Refresh browser
6. Verify transaction appears

## 🐛 Bug Checks

Common issues to verify are fixed:

- [ ] No "Cannot read property of undefined" errors
- [ ] No infinite loops
- [ ] No CORS errors (if testing from different origin)
- [ ] No TypeScript errors in console
- [ ] No React warnings in console
- [ ] No 404 errors for API routes
- [ ] Date formatting consistent

## 📦 Build & Deploy

### Local Build
```bash
npm run build
```
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build output looks correct

### Production Mode
```bash
npm run build
npm start
```
- [ ] App runs in production mode
- [ ] All features work
- [ ] Performance acceptable

### Environment Variables
- [ ] Works with `.env.local`
- [ ] Works with `.env.production`
- [ ] Errors if variables missing

## 📝 Documentation

- [ ] README.md clear and complete
- [ ] API.md has all endpoints documented
- [ ] QUICKSTART.md easy to follow
- [ ] DEPLOYMENT.md has deployment steps
- [ ] Code comments where needed
- [ ] Type definitions accurate

---

## Test Results Summary

**Date:** _____________

**Tester:** _____________

**Total Tests:** _____________

**Passed:** _____________

**Failed:** _____________

**Critical Issues:** _____________

**Notes:**

_____________________________________________

_____________________________________________

_____________________________________________

---

## Sign-Off

All critical features tested and working:

**Tested by:** _________________ **Date:** _____________

**Approved by:** _________________ **Date:** _____________

---

**Happy Testing! 🧪**
