# 🏗️ CapiFy Multi-User Architecture

## 🎯 Splitwise Clone Features Breakdown

### **Core Splitwise Features to Implement:**

#### 1. **👥 User & Group Management**
```
User Features:
├── Email/password authentication
├── User profiles with avatars
├── Friend connections
└── Activity tracking

Group Features:
├── Create/join groups
├── Group avatars & descriptions
├── Member management (add/remove)
├── Group settings & permissions
└── Currency selection per group
```

#### 2. **💰 Expense Management**
```
Expense Types:
├── Individual expenses (existing)
├── Shared group expenses (new)
├── Recurring expenses
└── Bill uploads with OCR

Splitting Options:
├── Equal split (divide by N people)
├── Exact amounts (custom per person)
├── Percentages (% based split)
├── Shares (ratio-based split)
└── "By shares" (custom ratios)
```

#### 3. **⚖️ Balance Calculation**
```
Balance Features:
├── Real-time balance updates
├── "You owe" vs "You are owed"
├── Net balance per person
├── Simplified debt calculation
├── Multi-group balance aggregation
└── Historical balance tracking
```

#### 4. **💸 Settlement System**
```
Settlement Features:
├── Record payments between users
├── Mark expenses as "settled"
├── Payment method tracking
├── Settlement confirmations
├── Dispute resolution
└── Settlement history
```

## 🗄️ **Database Schema Evolution**

### **New Tables for Multi-User System:**

```sql
-- Users table (authentication & profiles)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups table (expense sharing groups)
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url VARCHAR(500),
    currency VARCHAR(3) DEFAULT 'INR',
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group memberships (many-to-many)
CREATE TABLE group_memberships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id)
);

-- Update existing expenses table
ALTER TABLE expenses ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE expenses ADD COLUMN group_id INTEGER REFERENCES groups(id);
ALTER TABLE expenses ADD COLUMN is_shared BOOLEAN DEFAULT false;

-- Shared expenses (group expenses)
CREATE TABLE shared_expenses (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    paid_by INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    receipt_url VARCHAR(500),
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense splits (who owes what)
CREATE TABLE expense_splits (
    id SERIAL PRIMARY KEY,
    shared_expense_id INTEGER REFERENCES shared_expenses(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(12,2) NOT NULL,
    split_type VARCHAR(20) DEFAULT 'equal', -- 'equal', 'exact', 'percentage'
    percentage DECIMAL(5,2), -- for percentage splits
    is_settled BOOLEAN DEFAULT false,
    settled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User balances (who owes whom)
CREATE TABLE user_balances (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    debtor_id INTEGER REFERENCES users(id), -- who owes
    creditor_id INTEGER REFERENCES users(id), -- who is owed
    amount DECIMAL(12,2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, debtor_id, creditor_id)
);

-- Settlements (payment records)
CREATE TABLE settlements (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    payer_id INTEGER REFERENCES users(id), -- who paid
    payee_id INTEGER REFERENCES users(id), -- who received
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50), -- 'cash', 'upi', 'bank_transfer', etc.
    reference_number VARCHAR(100), -- transaction ID
    note TEXT,
    settled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity feed (group activities)
CREATE TABLE group_activities (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    activity_type VARCHAR(50), -- 'expense_added', 'payment_made', 'user_joined', etc.
    description TEXT,
    metadata JSONB, -- additional activity data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 **API Endpoints Structure**

### **Authentication APIs:**
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
POST   /api/auth/refresh           # Refresh JWT token
GET    /api/auth/me                # Get current user
PUT    /api/auth/profile           # Update user profile
POST   /api/auth/forgot-password   # Password reset request
POST   /api/auth/reset-password    # Reset password
```

### **Group Management APIs:**
```
GET    /api/groups                 # List user's groups
POST   /api/groups                 # Create new group
GET    /api/groups/:id             # Get group details
PUT    /api/groups/:id             # Update group
DELETE /api/groups/:id             # Delete group
GET    /api/groups/:id/members     # Get group members
POST   /api/groups/:id/members     # Add member to group
DELETE /api/groups/:id/members/:userId # Remove member
GET    /api/groups/:id/activities  # Group activity feed
```

### **Shared Expense APIs:**
```
GET    /api/groups/:id/expenses    # List group expenses
POST   /api/groups/:id/expenses    # Create shared expense
GET    /api/expenses/:id           # Get expense details
PUT    /api/expenses/:id           # Update expense
DELETE /api/expenses/:id           # Delete expense
GET    /api/expenses/:id/splits    # Get expense splits
PUT    /api/expenses/:id/splits    # Update splits
```

### **Balance & Settlement APIs:**
```
GET    /api/groups/:id/balances    # Get group balances
GET    /api/users/:id/balances     # Get user's overall balances
POST   /api/settlements            # Record a settlement
GET    /api/settlements/:id        # Get settlement details
GET    /api/groups/:id/settlements # Group settlement history
PUT   /api/settlements/:id/confirm # Confirm settlement
```

## 🎨 **Frontend Screen Structure**

### **New Screens to Add:**
```
📱 Authentication Screens:
├── /auth/login
├── /auth/register
├── /auth/forgot-password
└── /auth/profile

🏠 Main App Screens:
├── /groups (list of groups)
├── /groups/create
├── /groups/[id] (group details)
├── /groups/[id]/add-expense
├── /groups/[id]/balances
├── /groups/[id]/settle
└── /groups/[id]/settings

💰 Enhanced Expense Screens:
├── Current individual expenses (existing)
├── Group expenses (new)
├── Expense splitting interface
└── Settlement recording
```

## 🔄 **Data Flow Architecture**

### **User Journey Flow:**
```
1. User Registration/Login
   ↓
2. Create/Join Groups
   ↓
3. Add Shared Expenses
   ↓
4. Configure Expense Splits
   ↓
5. View Balances & Debts
   ↓
6. Record Settlements
   ↓
7. Track Activity & History
```

### **Balance Calculation Logic:**
```javascript
// Simplified balance calculation algorithm
function calculateGroupBalances(groupId) {
    const expenses = getSharedExpenses(groupId);
    const balances = new Map(); // user_id -> balance
    
    expenses.forEach(expense => {
        const paidBy = expense.paid_by;
        const splits = expense.splits;
        
        // Creditor gets positive balance
        balances.set(paidBy, (balances.get(paidBy) || 0) + expense.amount);
        
        // Debtors get negative balance
        splits.forEach(split => {
            if (split.user_id !== paidBy) {
                balances.set(split.user_id, (balances.get(split.user_id) || 0) - split.amount);
            }
        });
    });
    
    return optimizeDebts(balances); // Minimize number of transactions
}
```

## 🚀 **Implementation Strategy**

### **Phase 3.1: Foundation (Week 1-2)**
1. Set up authentication system
2. Create user registration/login
3. Implement JWT middleware
4. Build user profile management

### **Phase 3.2: Groups (Week 3-4)**  
1. Group creation and management
2. Member invitation system
3. Group permissions
4. Basic group dashboard

### **Phase 3.3: Shared Expenses (Week 5-6)**
1. Shared expense creation
2. Expense splitting interfaces
3. Split calculation logic
4. Expense history per group

### **Phase 3.4: Balances (Week 7-8)**
1. Balance calculation engine
2. Debt optimization algorithm
3. Balance dashboard UI
4. Settlement recording

### **Phase 3.5: Polish (Week 9-10)**
1. Activity feeds
2. Notifications
3. Performance optimization
4. Testing and bug fixes

This architecture will create a robust Splitwise-like system integrated into CapiFy. Ready to start with Phase 3.1 authentication system?
