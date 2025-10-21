#!/bin/bash

echo "🧪 Testing Budget Notifications System"
echo "====================================="

# Wait for backend to be ready
echo "⏳ Waiting for backend server..."
sleep 3

BASE_URL="http://localhost:8080"

echo ""
echo "📝 Step 1: Creating test budgets..."

# Create budgets
curl -X POST $BASE_URL/budgets \
  -H "Content-Type: application/json" \
  -d '{"category":"Food","amount":5000,"period":"monthly"}' && echo "✅ Created Food budget"

curl -X POST $BASE_URL/budgets \
  -H "Content-Type: application/json" \
  -d '{"category":"Transportation","amount":2000,"period":"monthly"}' && echo "✅ Created Transportation budget"

curl -X POST $BASE_URL/budgets \
  -H "Content-Type: application/json" \
  -d '{"category":"Adventure","amount":1000,"period":"monthly"}' && echo "✅ Created Adventure budget"

curl -X POST $BASE_URL/budgets \
  -H "Content-Type: application/json" \
  -d '{"category":"Shopping","amount":3000,"period":"monthly"}' && echo "✅ Created Shopping budget"

echo ""
echo "💸 Step 2: Adding expenses to trigger notifications..."

# Safe budget expenses (Food - under 50%)
curl -X POST $BASE_URL/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Lunch","amount":500,"category":"Food","description":"Daily lunch"}' && echo "   Added: Lunch - ₹500 (Food)"

curl -X POST $BASE_URL/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Groceries","amount":1500,"category":"Food","description":"Weekly groceries"}' && echo "   Added: Groceries - ₹1500 (Food)"

# Warning budget expenses (Transportation - 70-80%)
curl -X POST $BASE_URL/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Bus Pass","amount":800,"category":"Transportation","description":"Monthly bus pass"}' && echo "   Added: Bus Pass - ₹800 (Transportation)"

curl -X POST $BASE_URL/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Uber","amount":600,"category":"Transportation","description":"Uber rides"}' && echo "   Added: Uber - ₹600 (Transportation)"

# Danger budget expenses (Adventure - over 100%)
curl -X POST $BASE_URL/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Movie","amount":500,"category":"Adventure","description":"Movie night"}' && echo "   Added: Movie - ₹500 (Adventure)"

curl -X POST $BASE_URL/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Trip","amount":1500,"category":"Adventure","description":"Weekend trip"}' && echo "   Added: Trip - ₹1500 (Adventure)"

curl -X POST $BASE_URL/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Concert","amount":2000,"category":"Adventure","description":"Concert tickets"}' && echo "   Added: Concert - ₹2000 (Adventure)"

echo ""
echo "✅ Test data created successfully!"
echo ""
echo "🔔 NOTIFICATION TESTING GUIDE:"
echo "====================================="
echo "1. Open your mobile app (npx expo start)"
echo "2. Look for the budget button (💰) in the header"
echo "3. You should see a RED ALERT BADGE with number '1'"
echo "4. Tap the budget button to see all notifications"
echo "5. Tap the insights button (📈) to see analytics"
echo ""
echo "Expected Notifications:"
echo "🚨 Adventure Over Budget! (DANGER - Red)"
echo "⚠️  Transportation Budget Warning (WARNING - Orange)"
echo "✅ Food On Track (SUCCESS - Green)"
echo ""
echo "🧪 Test completed! Check your mobile app now."
