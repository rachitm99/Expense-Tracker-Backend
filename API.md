# API Documentation - Expense Tracker

Complete REST API reference for the Expense Tracker backend.

## Base URL

**Development:** `http://localhost:3000/api`  
**Production:** `https://your-domain.vercel.app/api`

## Authentication

All API endpoints (except auth endpoints) require authentication via:
- **Cookie**: `session={sessionId}` (automatically set for web)
- **Header**: `Authorization: Bearer {sessionId}` (recommended for mobile apps)

---

## 📍 Endpoints

### Authentication

#### 1. Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "mypassword123"
}
```

**Validation:**
- Email must be valid email format
- Password must be at least 8 characters
- Email must be unique (not already registered)

**Response (200 OK):**
```json
{
  "success": true,
  "userId": "abc123xyz"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Email already registered"
}
```

---

#### 2. Login

Authenticate and create a session.

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "mypassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "sessionId": "session_abc123",
  "userId": "user_xyz789"
}
```

**Headers:** Sets `session` cookie for web clients.

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid email or password"
}
```

---

#### 3. Get Session

Check if current session is valid.

**Endpoint:** `GET /auth/session`

**Authentication Required:** Yes

**Response (200 OK):**
```json
{
  "authenticated": true,
  "userId": "user_123",
  "email": "user@example.com"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

---

#### 4. Logout

End the current session.

**Endpoint:** `POST /auth/logout`

**Authentication Required:** Optional (works even without valid session)

**Response (200 OK):**
```json
{
  "success": true
}
```

**Headers:** Clears `session` cookie.

---

### Transactions

#### 5. Get All Transactions

Retrieve all transactions for the authenticated user.

**Endpoint:** `GET /transactions`

**Authentication Required:** Yes

**Response (200 OK):**
```json
{
  "transactions": [
    {
      "id": "trans_abc123",
      "userId": "user_xyz",
      "amount": 5000,
      "category": "Salary",
      "note": "Monthly salary payment",
      "date": "2026-01-12T00:00:00.000Z",
      "monthKey": "2026-01",
      "isIncome": true,
      "createdAt": "2026-01-12T10:30:00.000Z",
      "updatedAt": "2026-01-12T10:30:00.000Z"
    },
    {
      "id": "trans_def456",
      "userId": "user_xyz",
      "amount": 1500,
      "category": "Groceries",
      "note": null,
      "date": "2026-01-11T00:00:00.000Z",
      "monthKey": "2026-01",
      "isIncome": false,
      "createdAt": "2026-01-11T18:20:00.000Z",
      "updatedAt": "2026-01-11T18:20:00.000Z"
    }
  ]
}
```

---

#### 6. Create Transaction

Add a new transaction.

**Endpoint:** `POST /transactions`

**Authentication Required:** Yes

**Request:**
```json
{
  "amount": 5000,
  "category": "Salary",
  "note": "Monthly salary",
  "date": "2026-01-12T00:00:00.000Z",
  "isIncome": true
}
```

**Fields:**
- `amount` (number, required): Transaction amount (must be positive)
- `category` (string, required): Category name
- `note` (string, optional): Additional notes
- `date` (string, required): ISO date string
- `isIncome` (boolean, required): true for income, false for expense

**Response (201 Created):**
```json
{
  "transaction": {
    "id": "trans_new123",
    "userId": "user_xyz",
    "amount": 5000,
    "category": "Salary",
    "note": "Monthly salary",
    "date": "2026-01-12T00:00:00.000Z",
    "monthKey": "2026-01",
    "isIncome": true,
    "createdAt": "2026-01-12T12:00:00.000Z",
    "updatedAt": "2026-01-12T12:00:00.000Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid input",
  "details": [
    {
      "path": ["amount"],
      "message": "Expected number, received string"
    }
  ]
}
```

---

#### 7. Update Transaction

Modify an existing transaction.

**Endpoint:** `PUT /transactions`

**Authentication Required:** Yes

**Request:**
```json
{
  "id": "trans_abc123",
  "amount": 5500,
  "category": "Salary (Bonus)",
  "note": "Updated with bonus",
  "date": "2026-01-12T00:00:00.000Z",
  "isIncome": true
}
```

**Response (200 OK):**
```json
{
  "transaction": {
    "id": "trans_abc123",
    "userId": "user_xyz",
    "amount": 5500,
    "category": "Salary (Bonus)",
    "note": "Updated with bonus",
    "date": "2026-01-12T00:00:00.000Z",
    "monthKey": "2026-01",
    "isIncome": true,
    "createdAt": "2026-01-12T10:30:00.000Z",
    "updatedAt": "2026-01-12T13:00:00.000Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "error": "Transaction not found"
}
```

---

#### 8. Delete Transaction

Remove a transaction.

**Endpoint:** `DELETE /transactions/{id}`

**Authentication Required:** Yes

**Parameters:**
- `id` (path): Transaction ID

**Response (200 OK):**
```json
{
  "success": true
}
```

---

#### 9. Sync Transactions

Get all transaction changes since a specific timestamp.

**Endpoint:** `GET /transactions/sync?lastSync={timestamp}`

**Authentication Required:** Yes

**Query Parameters:**
- `lastSync` (optional): ISO timestamp. Defaults to "1970-01-01" (returns all)

**Example:**
```
GET /transactions/sync?lastSync=2026-01-11T00:00:00.000Z
```

**Response (200 OK):**
```json
{
  "transactions": [
    {
      "id": "trans_new",
      "userId": "user_xyz",
      "amount": 200,
      "category": "Snacks",
      "note": null,
      "date": "2026-01-11T00:00:00.000Z",
      "monthKey": "2026-01",
      "isIncome": false,
      "createdAt": "2026-01-11T15:00:00.000Z",
      "updatedAt": "2026-01-11T15:00:00.000Z"
    }
  ],
  "deleted": ["trans_old123"],
  "syncTimestamp": "2026-01-12T14:00:00.000Z"
}
```

**Use Case:** Incremental sync for mobile apps.

---

### Loans

#### 10. Get All Loans

Retrieve all loans for the authenticated user.

**Endpoint:** `GET /loans`

**Authentication Required:** Yes

**Response (200 OK):**
```json
{
  "loans": [
    {
      "id": "loan_abc123",
      "userId": "user_xyz",
      "name": "Home Loan",
      "principal": 1000000,
      "interestRate": 8.5,
      "durationMonths": 240,
      "startDate": "2026-01-01T00:00:00.000Z",
      "emiAmount": 8678.23,
      "totalInterest": 1082775.2,
      "payments": [
        {
          "monthNumber": 1,
          "isPaid": true,
          "paidDate": "2026-01-05T10:00:00.000Z"
        },
        {
          "monthNumber": 2,
          "isPaid": false
        }
      ],
      "createdAt": "2026-01-01T10:00:00.000Z",
      "updatedAt": "2026-01-05T10:00:00.000Z"
    }
  ]
}
```

---

#### 11. Create Loan

Add a new loan with automatic EMI calculation.

**Endpoint:** `POST /loans`

**Authentication Required:** Yes

**Request:**
```json
{
  "name": "Car Loan",
  "principal": 500000,
  "interestRate": 7.5,
  "durationMonths": 60,
  "startDate": "2026-01-01T00:00:00.000Z"
}
```

**Fields:**
- `name` (string, required): Loan name/description
- `principal` (number, required): Loan amount (must be positive)
- `interestRate` (number, required): Annual interest rate (percentage, can be 0)
- `durationMonths` (number, required): Loan duration in months
- `startDate` (string, required): ISO date string

**Response (201 Created):**
```json
{
  "loan": {
    "id": "loan_new123",
    "userId": "user_xyz",
    "name": "Car Loan",
    "principal": 500000,
    "interestRate": 7.5,
    "durationMonths": 60,
    "startDate": "2026-01-01T00:00:00.000Z",
    "emiAmount": 10006.65,
    "totalInterest": 100399.0,
    "payments": [
      { "monthNumber": 1, "isPaid": false },
      { "monthNumber": 2, "isPaid": false },
      ...
    ],
    "createdAt": "2026-01-12T12:00:00.000Z",
    "updatedAt": "2026-01-12T12:00:00.000Z"
  }
}
```

**EMI Formula:**
```
EMI = [P × r × (1+r)^n] / [(1+r)^n - 1]

Where:
P = Principal
r = Monthly interest rate (annual rate / 12 / 100)
n = Duration in months
```

---

#### 12. Update Loan

Modify an existing loan.

**Endpoint:** `PUT /loans`

**Authentication Required:** Yes

**Request:**
```json
{
  "id": "loan_abc123",
  "name": "Updated Home Loan",
  "principal": 1000000,
  "interestRate": 8.0,
  "durationMonths": 240,
  "startDate": "2026-01-01T00:00:00.000Z",
  "emiAmount": 8678.23,
  "totalInterest": 1082775.2,
  "payments": [...]
}
```

**Response (200 OK):**
```json
{
  "loan": { ... }
}
```

---

#### 13. Mark EMI as Paid

Record an EMI payment.

**Endpoint:** `POST /loans/{loanId}/pay`

**Authentication Required:** Yes

**Parameters:**
- `loanId` (path): Loan ID

**Request:**
```json
{
  "monthNumber": 2
}
```

**Response (200 OK):**
```json
{
  "loan": {
    "id": "loan_abc123",
    ...
    "payments": [
      { "monthNumber": 1, "isPaid": true, "paidDate": "2026-01-05T10:00:00.000Z" },
      { "monthNumber": 2, "isPaid": true, "paidDate": "2026-01-12T15:30:00.000Z" },
      { "monthNumber": 3, "isPaid": false }
    ],
    "updatedAt": "2026-01-12T15:30:00.000Z"
  }
}
```

---

#### 14. Delete Loan

Remove a loan and all its payment records.

**Endpoint:** `DELETE /loans/{id}`

**Authentication Required:** Yes

**Response (200 OK):**
```json
{
  "success": true
}
```

---

#### 15. Sync Loans

Get all loan changes since a specific timestamp.

**Endpoint:** `GET /loans/sync?lastSync={timestamp}`

**Authentication Required:** Yes

**Query Parameters:**
- `lastSync` (optional): ISO timestamp

**Response (200 OK):**
```json
{
  "loans": [...],
  "deleted": ["loan_old123"],
  "syncTimestamp": "2026-01-12T16:00:00.000Z"
}
```

---

### Bulk Sync

#### 16. Bulk Sync (Multi-Device Sync)

Main endpoint for synchronizing all data between devices.

**Endpoint:** `POST /sync`

**Authentication Required:** Yes

**Request:**
```json
{
  "lastSyncTimestamp": "2026-01-11T00:00:00.000Z",
  "changes": {
    "transactions": {
      "new": [
        {
          "id": "trans_local_1",
          "amount": 500,
          "category": "Snacks",
          "note": null,
          "date": "2026-01-11T12:00:00.000Z",
          "monthKey": "2026-01",
          "isIncome": false,
          "createdAt": "2026-01-11T12:00:00.000Z",
          "updatedAt": "2026-01-11T12:00:00.000Z"
        }
      ],
      "updated": [
        {
          "id": "trans_existing",
          "amount": 600,
          "category": "Updated Category",
          ...
        }
      ],
      "deleted": ["trans_deleted_1", "trans_deleted_2"]
    },
    "loans": {
      "new": [...],
      "updated": [...],
      "deleted": [...]
    }
  }
}
```

**Response (200 OK):**
```json
{
  "syncTimestamp": "2026-01-12T16:30:00.000Z",
  "changes": {
    "transactions": [
      {
        "id": "trans_from_server",
        "amount": 1000,
        ...
      }
    ],
    "loans": [...],
    "deletedTransactions": ["trans_server_deleted"],
    "deletedLoans": []
  }
}
```

**Flow:**
1. Client sends `lastSyncTimestamp` and all local changes since that time
2. Server applies client changes (using last-write-wins)
3. Server retrieves all changes since client's `lastSyncTimestamp`
4. Server returns new `syncTimestamp` and all server changes
5. Client applies server changes (overwriting conflicts)
6. Client updates its `lastSyncTimestamp`

**Conflict Resolution:**
- Last-write-wins based on `updatedAt` timestamp
- Server changes always take precedence when applied on client
- Deleted items tracked separately to handle deletions across devices

---

## Error Responses

### 400 Bad Request

Invalid input or validation error.

```json
{
  "error": "Invalid input",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email"
    }
  ]
}
```

### 401 Unauthorized

Missing or invalid authentication.

```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found

Resource not found.

```json
{
  "error": "Transaction not found"
}
```

### 500 Internal Server Error

Server error.

```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding rate limiting middleware.

---

## Data Types

### Transaction

```typescript
{
  id: string;              // Unique ID
  userId: string;          // Owner user ID
  amount: number;          // Transaction amount (positive)
  category: string;        // Category name
  note?: string;           // Optional notes
  date: string;            // ISO date
  monthKey: string;        // "YYYY-MM" format
  isIncome: boolean;       // true = income, false = expense
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
}
```

### Loan

```typescript
{
  id: string;
  userId: string;
  name: string;            // Loan name
  principal: number;       // Loan amount
  interestRate: number;    // Annual rate (%)
  durationMonths: number;  // Loan duration
  startDate: string;       // ISO date
  emiAmount: number;       // Calculated EMI
  totalInterest: number;   // Calculated total interest
  payments: LoanPayment[]; // Payment schedule
  createdAt: string;
  updatedAt: string;
}
```

### LoanPayment

```typescript
{
  monthNumber: number;     // 1, 2, 3, ...
  isPaid: boolean;         // Payment status
  paidDate?: string;       // ISO timestamp (if paid)
}
```

---

## Best Practices

### 1. Always Store Session ID Securely
- Use secure storage (KeyChain on iOS, KeyStore on Android)
- Never log session IDs

### 2. Implement Retry Logic
- Network requests can fail
- Implement exponential backoff

### 3. Sync Regularly
- Sync on app startup
- Sync after local changes
- Background sync when app becomes active

### 4. Handle Conflicts Gracefully
- Server always wins in current implementation
- Consider showing user a notification when conflicts occur

### 5. Validate Data Locally
- Don't rely solely on server validation
- Validate before sending to reduce errors

---

## Example Implementations

### Sync in Flutter

```dart
class SyncService {
  final ApiService api;
  final LocalDatabase db;
  
  Future<void> sync() async {
    final lastSync = await db.getLastSyncTimestamp();
    final localChanges = await db.getChangesSince(lastSync);
    
    final response = await api.syncAll(SyncRequest(
      lastSyncTimestamp: lastSync,
      changes: localChanges,
    ));
    
    // Apply server changes
    await db.applyTransactions(response.changes.transactions);
    await db.applyLoans(response.changes.loans);
    await db.deleteTransactions(response.changes.deletedTransactions);
    await db.deleteLoans(response.changes.deletedLoans);
    
    // Update sync timestamp
    await db.saveLastSyncTimestamp(response.syncTimestamp);
  }
}
```

### Authentication in React Native

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  async login(email, password) {
    const response = await fetch('https://api.example.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      await AsyncStorage.setItem('sessionId', data.sessionId);
      await AsyncStorage.setItem('userId', data.userId);
      return true;
    }
    
    throw new Error(data.error);
  }
  
  async getAuthHeader() {
    const sessionId = await AsyncStorage.getItem('sessionId');
    return sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {};
  }
}
```

---

**Last Updated:** January 12, 2026
