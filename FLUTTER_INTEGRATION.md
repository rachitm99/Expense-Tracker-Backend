# Flutter Integration Guide

Complete guide for integrating the Expense Tracker backend with your Flutter app.

## 📦 Dependencies

Add to your `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.2.0
  shared_preferences: ^2.2.2
  intl: ^0.19.0

  # For local storage (choose one)
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  # OR
  sqflite: ^2.3.0
```

## 🏗 Project Structure

```
lib/
├── models/
│   ├── transaction.dart
│   ├── loan.dart
│   └── sync_response.dart
├── services/
│   ├── api_service.dart
│   ├── auth_service.dart
│   ├── sync_service.dart
│   └── storage_service.dart
├── providers/
│   ├── auth_provider.dart
│   ├── transaction_provider.dart
│   └── loan_provider.dart
└── screens/
    ├── auth/
    │   ├── login_screen.dart
    │   └── register_screen.dart
    ├── home/
    │   └── dashboard_screen.dart
    └── loans/
        └── loans_screen.dart
```

## 📝 Models

### transaction.dart

```dart
class Transaction {
  final String id;
  final String userId;
  final double amount;
  final String category;
  final String? note;
  final DateTime date;
  final String monthKey;
  final bool isIncome;
  final DateTime createdAt;
  final DateTime updatedAt;

  Transaction({
    required this.id,
    required this.userId,
    required this.amount,
    required this.category,
    this.note,
    required this.date,
    required this.monthKey,
    required this.isIncome,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'],
      userId: json['userId'],
      amount: json['amount'].toDouble(),
      category: json['category'],
      note: json['note'],
      date: DateTime.parse(json['date']),
      monthKey: json['monthKey'],
      isIncome: json['isIncome'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'amount': amount,
      'category': category,
      'note': note,
      'date': date.toIso8601String(),
      'monthKey': monthKey,
      'isIncome': isIncome,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  static String generateMonthKey(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}';
  }
}
```

### loan.dart

```dart
class LoanPayment {
  final int monthNumber;
  final bool isPaid;
  final DateTime? paidDate;

  LoanPayment({
    required this.monthNumber,
    required this.isPaid,
    this.paidDate,
  });

  factory LoanPayment.fromJson(Map<String, dynamic> json) {
    return LoanPayment(
      monthNumber: json['monthNumber'],
      isPaid: json['isPaid'],
      paidDate: json['paidDate'] != null 
          ? DateTime.parse(json['paidDate']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'monthNumber': monthNumber,
      'isPaid': isPaid,
      'paidDate': paidDate?.toIso8601String(),
    };
  }
}

class Loan {
  final String id;
  final String userId;
  final String name;
  final double principal;
  final double interestRate;
  final int durationMonths;
  final DateTime startDate;
  final double emiAmount;
  final double totalInterest;
  final List<LoanPayment> payments;
  final DateTime createdAt;
  final DateTime updatedAt;

  Loan({
    required this.id,
    required this.userId,
    required this.name,
    required this.principal,
    required this.interestRate,
    required this.durationMonths,
    required this.startDate,
    required this.emiAmount,
    required this.totalInterest,
    required this.payments,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Loan.fromJson(Map<String, dynamic> json) {
    return Loan(
      id: json['id'],
      userId: json['userId'],
      name: json['name'],
      principal: json['principal'].toDouble(),
      interestRate: json['interestRate'].toDouble(),
      durationMonths: json['durationMonths'],
      startDate: DateTime.parse(json['startDate']),
      emiAmount: json['emiAmount'].toDouble(),
      totalInterest: json['totalInterest'].toDouble(),
      payments: (json['payments'] as List)
          .map((p) => LoanPayment.fromJson(p))
          .toList(),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'name': name,
      'principal': principal,
      'interestRate': interestRate,
      'durationMonths': durationMonths,
      'startDate': startDate.toIso8601String(),
      'emiAmount': emiAmount,
      'totalInterest': totalInterest,
      'payments': payments.map((p) => p.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
```

## 🔐 Authentication Service

### auth_service.dart

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String baseUrl = 'https://your-api.vercel.app/api';
  
  // Store session ID
  Future<void> _saveSession(String sessionId, String userId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('sessionId', sessionId);
    await prefs.setString('userId', userId);
  }
  
  // Get session ID
  Future<String?> getSessionId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('sessionId');
  }
  
  // Get user ID
  Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('userId');
  }
  
  // Clear session
  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('sessionId');
    await prefs.remove('userId');
  }
  
  // Register
  Future<bool> register(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Register error: $e');
      return false;
    }
  }
  
  // Login
  Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _saveSession(data['sessionId'], data['userId']);
        return true;
      }
      
      return false;
    } catch (e) {
      print('Login error: $e');
      return false;
    }
  }
  
  // Logout
  Future<void> logout() async {
    try {
      final sessionId = await getSessionId();
      if (sessionId != null) {
        await http.post(
          Uri.parse('$baseUrl/auth/logout'),
          headers: {
            'Authorization': 'Bearer $sessionId',
          },
        );
      }
    } finally {
      await clearSession();
    }
  }
  
  // Check if logged in
  Future<bool> isLoggedIn() async {
    final sessionId = await getSessionId();
    if (sessionId == null) return false;
    
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/session'),
        headers: {
          'Authorization': 'Bearer $sessionId',
        },
      );
      
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
  
  // Get auth headers
  Future<Map<String, String>> getAuthHeaders() async {
    final sessionId = await getSessionId();
    return {
      'Content-Type': 'application/json',
      if (sessionId != null) 'Authorization': 'Bearer $sessionId',
    };
  }
}
```

## 🌐 API Service

### api_service.dart

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/transaction.dart';
import '../models/loan.dart';
import 'auth_service.dart';

class ApiService {
  static const String baseUrl = 'https://your-api.vercel.app/api';
  final AuthService _authService = AuthService();
  
  // Get Transactions
  Future<List<Transaction>> getTransactions() async {
    final headers = await _authService.getAuthHeaders();
    
    final response = await http.get(
      Uri.parse('$baseUrl/transactions'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['transactions'] as List)
          .map((t) => Transaction.fromJson(t))
          .toList();
    }
    
    throw Exception('Failed to load transactions');
  }
  
  // Create Transaction
  Future<Transaction> createTransaction({
    required double amount,
    required String category,
    String? note,
    required DateTime date,
    required bool isIncome,
  }) async {
    final headers = await _authService.getAuthHeaders();
    
    final response = await http.post(
      Uri.parse('$baseUrl/transactions'),
      headers: headers,
      body: jsonEncode({
        'amount': amount,
        'category': category,
        'note': note,
        'date': date.toIso8601String(),
        'isIncome': isIncome,
      }),
    );
    
    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return Transaction.fromJson(data['transaction']);
    }
    
    throw Exception('Failed to create transaction');
  }
  
  // Delete Transaction
  Future<void> deleteTransaction(String id) async {
    final headers = await _authService.getAuthHeaders();
    
    final response = await http.delete(
      Uri.parse('$baseUrl/transactions/$id'),
      headers: headers,
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to delete transaction');
    }
  }
  
  // Get Loans
  Future<List<Loan>> getLoans() async {
    final headers = await _authService.getAuthHeaders();
    
    final response = await http.get(
      Uri.parse('$baseUrl/loans'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['loans'] as List)
          .map((l) => Loan.fromJson(l))
          .toList();
    }
    
    throw Exception('Failed to load loans');
  }
  
  // Create Loan
  Future<Loan> createLoan({
    required String name,
    required double principal,
    required double interestRate,
    required int durationMonths,
    required DateTime startDate,
  }) async {
    final headers = await _authService.getAuthHeaders();
    
    final response = await http.post(
      Uri.parse('$baseUrl/loans'),
      headers: headers,
      body: jsonEncode({
        'name': name,
        'principal': principal,
        'interestRate': interestRate,
        'durationMonths': durationMonths,
        'startDate': startDate.toIso8601String(),
      }),
    );
    
    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return Loan.fromJson(data['loan']);
    }
    
    throw Exception('Failed to create loan');
  }
  
  // Pay EMI
  Future<Loan> payEMI(String loanId, int monthNumber) async {
    final headers = await _authService.getAuthHeaders();
    
    final response = await http.post(
      Uri.parse('$baseUrl/loans/$loanId/pay'),
      headers: headers,
      body: jsonEncode({
        'monthNumber': monthNumber,
      }),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return Loan.fromJson(data['loan']);
    }
    
    throw Exception('Failed to pay EMI');
  }
  
  // Delete Loan
  Future<void> deleteLoan(String id) async {
    final headers = await _authService.getAuthHeaders();
    
    final response = await http.delete(
      Uri.parse('$baseUrl/loans/$id'),
      headers: headers,
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to delete loan');
    }
  }
}
```

## 🔄 Sync Service

### sync_service.dart

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/transaction.dart';
import '../models/loan.dart';
import 'auth_service.dart';

class SyncService {
  static const String baseUrl = 'https://your-api.vercel.app/api';
  final AuthService _authService = AuthService();
  
  // Get last sync timestamp
  Future<DateTime> getLastSyncTimestamp() async {
    final prefs = await SharedPreferences.getInstance();
    final timestamp = prefs.getString('lastSyncTimestamp');
    
    if (timestamp == null) {
      return DateTime(1970, 1, 1); // Unix epoch
    }
    
    return DateTime.parse(timestamp);
  }
  
  // Save last sync timestamp
  Future<void> saveLastSyncTimestamp(DateTime timestamp) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('lastSyncTimestamp', timestamp.toIso8601String());
  }
  
  // Sync all data
  Future<void> syncAll({
    required List<Transaction> localTransactions,
    required List<Loan> localLoans,
    required Function(List<Transaction>, List<Loan>) onServerChanges,
  }) async {
    final headers = await _authService.getAuthHeaders();
    final lastSync = await getLastSyncTimestamp();
    
    // Gather local changes
    final newTransactions = localTransactions
        .where((t) => t.createdAt.isAfter(lastSync))
        .toList();
    
    final updatedTransactions = localTransactions
        .where((t) => t.updatedAt.isAfter(lastSync) && 
                     t.createdAt.isBefore(lastSync))
        .toList();
    
    // Similar for loans...
    
    // Build sync request
    final syncRequest = {
      'lastSyncTimestamp': lastSync.toIso8601String(),
      'changes': {
        'transactions': {
          'new': newTransactions.map((t) => t.toJson()).toList(),
          'updated': updatedTransactions.map((t) => t.toJson()).toList(),
          'deleted': [], // Track deleted IDs separately
        },
        'loans': {
          'new': [],
          'updated': [],
          'deleted': [],
        },
      },
    };
    
    // Send sync request
    final response = await http.post(
      Uri.parse('$baseUrl/sync'),
      headers: headers,
      body: jsonEncode(syncRequest),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      
      // Parse server changes
      final serverTransactions = (data['changes']['transactions'] as List)
          .map((t) => Transaction.fromJson(t))
          .toList();
      
      final serverLoans = (data['changes']['loans'] as List)
          .map((l) => Loan.fromJson(l))
          .toList();
      
      // Apply server changes (callback to update local storage)
      await onServerChanges(serverTransactions, serverLoans);
      
      // Update sync timestamp
      final newSyncTimestamp = DateTime.parse(data['syncTimestamp']);
      await saveLastSyncTimestamp(newSyncTimestamp);
    } else {
      throw Exception('Sync failed');
    }
  }
}
```

## 📱 Usage Examples

### Login Screen

```dart
class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _authService = AuthService();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  
  Future<void> _login() async {
    setState(() => _isLoading = true);
    
    final success = await _authService.login(
      _emailController.text,
      _passwordController.text,
    );
    
    setState(() => _isLoading = false);
    
    if (success) {
      Navigator.pushReplacementNamed(context, '/dashboard');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Login failed')),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: _emailController,
              decoration: InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
            ),
            SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _login,
              child: _isLoading 
                  ? CircularProgressIndicator()
                  : Text('Login'),
            ),
          ],
        ),
      ),
    );
  }
}
```

### Dashboard with Transactions

```dart
class DashboardScreen extends StatefulWidget {
  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _apiService = ApiService();
  List<Transaction> _transactions = [];
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _loadTransactions();
  }
  
  Future<void> _loadTransactions() async {
    try {
      final transactions = await _apiService.getTransactions();
      setState(() {
        _transactions = transactions;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load transactions')),
      );
    }
  }
  
  Future<void> _addTransaction() async {
    // Show dialog to add transaction
    // Then call _apiService.createTransaction()
    // Finally reload transactions
  }
  
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    
    final income = _transactions
        .where((t) => t.isIncome)
        .fold(0.0, (sum, t) => sum + t.amount);
    
    final expenses = _transactions
        .where((t) => !t.isIncome)
        .fold(0.0, (sum, t) => sum + t.amount);
    
    final wealth = income - expenses;
    
    return Scaffold(
      appBar: AppBar(title: Text('Expense Tracker')),
      body: Column(
        children: [
          // Wealth display
          Container(
            padding: EdgeInsets.all(24),
            color: Colors.purple,
            child: Column(
              children: [
                Text('Total Wealth', style: TextStyle(color: Colors.white)),
                Text(
                  '₹${wealth.toStringAsFixed(0)}',
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          
          // Transactions list
          Expanded(
            child: ListView.builder(
              itemCount: _transactions.length,
              itemBuilder: (context, index) {
                final transaction = _transactions[index];
                return ListTile(
                  title: Text(transaction.category),
                  subtitle: Text(transaction.note ?? ''),
                  trailing: Text(
                    '${transaction.isIncome ? '+' : '-'}₹${transaction.amount}',
                    style: TextStyle(
                      color: transaction.isIncome ? Colors.green : Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addTransaction,
        child: Icon(Icons.add),
      ),
    );
  }
}
```

## 🔄 Automatic Sync

### Implement Background Sync

```dart
class SyncManager {
  final SyncService _syncService = SyncService();
  Timer? _syncTimer;
  
  void startAutoSync() {
    // Sync every 5 minutes
    _syncTimer = Timer.periodic(Duration(minutes: 5), (_) {
      performSync();
    });
  }
  
  void stopAutoSync() {
    _syncTimer?.cancel();
  }
  
  Future<void> performSync() async {
    // Get local data from Hive/SQLite
    final localTransactions = await getLocalTransactions();
    final localLoans = await getLocalLoans();
    
    try {
      await _syncService.syncAll(
        localTransactions: localTransactions,
        localLoans: localLoans,
        onServerChanges: (transactions, loans) async {
          // Update local storage with server changes
          await saveTransactions(transactions);
          await saveLoans(loans);
        },
      );
      
      print('Sync successful');
    } catch (e) {
      print('Sync failed: $e');
    }
  }
}
```

## 🎯 Best Practices

1. **Error Handling**: Always wrap API calls in try-catch
2. **Loading States**: Show loading indicators during API calls
3. **Offline Support**: Store data locally, sync when online
4. **Retry Logic**: Implement exponential backoff for failed requests
5. **Token Refresh**: Check session validity periodically
6. **Data Validation**: Validate inputs before sending to API

## 🔧 Configuration

Create `lib/config/api_config.dart`:

```dart
class ApiConfig {
  // Change this to your deployed URL
  static const String baseUrl = 'https://your-app.vercel.app/api';
  
  // For development
  static const String devBaseUrl = 'http://localhost:3000/api';
  
  // Use dev URL in debug mode
  static String get activeBaseUrl {
    return const bool.fromEnvironment('dart.vm.product')
        ? baseUrl
        : devBaseUrl;
  }
}
```

---

**You're now ready to integrate the backend with your Flutter app!** 🚀

For more details, see the [API documentation](../API.md).
