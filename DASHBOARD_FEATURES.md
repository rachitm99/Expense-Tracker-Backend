# Dashboard Features - Flutter App Parity

This document explains the new dashboard implementation that matches the Flutter app's behavior.

## Key Features Implemented

### 1. Total Wealth Calculation with Pending EMIs

The dashboard now prominently displays **TOTAL WEALTH** using the formula:
```
Total Wealth = Total Income - Total Expenses - Pending EMIs (Current + Next Month)
```

**Why this matters:**
- Pending EMIs for the **current month** and **next month** are deducted from your wealth
- This gives you a realistic view of your available funds after accounting for upcoming EMI obligations
- The wealth display shows ₹ with 2 decimal places for precision

**Display Format:**
```
TOTAL WEALTH
₹12,345.67

Income: ₹50,000.00  Expenses: ₹25,000.00  Pending EMIs: ₹12,654.33
```

### 2. Pending EMI Virtual Items

Pending EMIs are shown as **orange cards** in the month view:

**Visual Design:**
- **Orange background** with orange border (left side)
- Shows "Pending EMI" as the title
- Displays loan name and amount
- Shows due date as "Due 1 [Month]" (EMIs are always due on the 1st)

**Example:**
```
┌──────────────────────────────────────┐
│ Pending EMI                 ₹5,000.00│
│ Loan: Home Loan                      │
│ Due 1 Jan                            │
└──────────────────────────────────────┘
```

### 3. Transactions Grouped by Month

Transactions are organized by month with:
- **Month header:** "January 2026" format (large, bold)
- **Newest months first** at the top
- **Mix of transactions and pending EMIs** in each month section
- **Color coding:**
  - Green (+) for income
  - Red (-) for expenses
  - Orange for pending EMIs

### 4. Loan Management with EMI Summary

The loans page (`/loans`) now features:

#### EMI Summary Card at Top
Shows the total EMI amount due in the next month with **urgency-based colors:**

| Days Until Due | Color | Example |
|----------------|-------|---------|
| >= 16 days | Blue | Calm, plenty of time |
| 8-15 days | Yellow | Attention needed |
| 4-7 days | Orange | Action required soon |
| 1-3 days | Red (light) | Urgent |
| Overdue | Red (dark) | OVERDUE label |

**Display Format:**
```
┌────────────────────────────────────────┐
│ NEXT MONTH EMI (Jan 2026)             │
│                                        │
│ ₹15,000.00                             │
│                                        │
│ Due in 5 days                          │
└────────────────────────────────────────┘
```

#### Individual Loan Cards
Each loan shows:
- Loan name and start date
- Principal, interest rate, EMI amount, total interest
- Progress bar (visual representation of paid EMIs)
- "X / Y paid" indicator
- **"Mark as Paid" button** for next unpaid EMI

### 5. Mark EMI Paid Flow

When you click "Mark as Paid":
1. The system calls `POST /api/loans/:id/pay` with the month number
2. This marks the EMI payment as paid in the loan record
3. **Creates a real expense transaction** with:
   - Category: "EMI Payment - [Loan Name]"
   - Amount: EMI amount
   - Date: Current date
   - Type: Expense
4. The pending EMI disappears from the dashboard
5. Total Wealth updates automatically
6. Loan progress bar advances

## Technical Implementation

### New Utility Functions (`lib/utils.ts`)

```typescript
// Get all pending EMIs for current and next month
getPendingEMIs(loans): PendingEMI[]

// Calculate total pending EMI amount
calculateTotalPendingEMI(loans): number
```

### Dashboard Data Flow

1. **Fetch Data:** Loads both transactions and loans on page load
2. **Calculate Pending EMIs:** Uses `getPendingEMIs()` to get virtual EMI items
3. **Merge Items:** Combines transactions and pending EMIs into one list
4. **Group by Month:** Groups all items by their monthKey
5. **Display:** Renders each month with all its items (transactions + pending EMIs)

### Pending EMI Type

```typescript
interface PendingEMI {
  id: string;              // "pending-{loanId}-{monthNumber}"
  loanId: string;          // Reference to loan
  loanName: string;        // Display name
  amount: number;          // EMI amount
  date: string;            // ISO date (always 1st of month)
  monthKey: string;        // "2026-01" format
  monthNumber: number;     // Payment number in loan schedule
  isPending: true;         // Flag to identify as pending EMI
}
```

## API Integration

The implementation uses these endpoints:

- `GET /api/transactions` - Fetch all transactions
- `GET /api/loans` - Fetch all loans with payment schedules
- `POST /api/loans/:id/pay` - Mark EMI as paid (creates transaction)
- `POST /api/transactions` - Add income/expense

## Visual Consistency with Flutter App

The web dashboard now matches the Flutter app's:
- **Total Wealth prominence** - Large, centered display
- **Color scheme** - Green for income, red for expense, orange for pending
- **Month grouping** - Single divider per month
- **Pending EMI display** - Orange cards with loan details
- **EMI urgency indicators** - Color-coded based on days until due
- **Wealth calculation logic** - Includes pending EMIs for accurate balance

## User Experience Benefits

1. **Realistic Balance:** See your actual available funds after accounting for upcoming EMIs
2. **Visual Alerts:** Orange pending EMI cards stand out in the timeline
3. **Urgency Awareness:** Color-coded EMI summary shows how urgent upcoming payments are
4. **Simple Payment Flow:** One-click "Mark as Paid" converts pending EMI to expense
5. **Consistent Experience:** Web and mobile app show the same information in the same way

## Testing the Features

### Test Scenario 1: Create a Loan
1. Go to `/loans` page
2. Click "Add New Loan"
3. Enter: Name="Car Loan", Principal=100000, Rate=10%, Duration=12 months
4. Submit
5. **Expected:** Loan appears with 12 unpaid EMIs, EMI summary card shows next month total

### Test Scenario 2: View Pending EMIs
1. Go to dashboard (`/`)
2. **Expected:** 
   - Orange "Pending EMI" card appears in current month section
   - Another orange card in next month section (if applicable)
   - Total Wealth is reduced by the pending EMI amounts

### Test Scenario 3: Mark EMI Paid
1. Go to `/loans` page
2. Click "Mark as Paid" on first unpaid EMI
3. **Expected:**
   - EMI marked as paid in loan
   - Progress bar advances
   - Go back to dashboard - pending EMI card disappears
   - New expense transaction appears with "EMI Payment - Car Loan"
   - Total Wealth increases (EMI no longer pending)

### Test Scenario 4: Multiple Loans
1. Add 2-3 different loans
2. Go to dashboard
3. **Expected:**
   - Multiple orange pending EMI cards in current/next month
   - Total Wealth reflects sum of all pending EMIs
   - EMI summary card shows total of all next month EMIs

## Maintenance Notes

- Pending EMIs are **virtual items** - they don't exist in the database until paid
- Pending EMI calculation runs on every page load (fast, no caching needed)
- Only current month and next month EMIs affect Total Wealth
- Future EMIs (2+ months away) are not shown on dashboard
- When an EMI is paid, it becomes a real expense transaction with proper category

## Future Enhancements

Potential improvements:
- Add ability to pay EMIs from dashboard (not just loans page)
- Show EMI history/payment timeline
- Add notifications for upcoming EMIs
- Allow partial EMI payments
- Add EMI payment reminders
