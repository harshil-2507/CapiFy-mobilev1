// capify-mobile/app/(tabs)/index.tsx

import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, TextInput, Modal, Alert, StatusBar, Dimensions, RefreshControl, Animated, ScrollView, Share } from "react-native";
import API from "../../api/axios"; // Adjust path if needed
import { Colors } from "../../theme/Colors";

const { width, height } = Dimensions.get('window');

// Expense Interface (matching Go backend response exactly)
interface Expense {
    ID: number;
    CreatedAt: string;
    UpdatedAt: string;
    DeletedAt: string | null;
    title: string;
    amount: number;
    category: string;
    description: string;
}

export default function HomeScreen() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
    const [newExpense, setNewExpense] = useState({
        title: '',
        amount: '',
        category: '',
        description: ''
    });
    
    // New state for enhanced features
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<string[]>(['All']);
    
    // Date filtering state
    const [showDateRangeModal, setShowDateRangeModal] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState<string>('All Time');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const [dateRanges] = useState<string[]>(['All Time', 'This Week', 'This Month', 'Last 30 Days', 'Custom Range']);
    
    // Charts state
    const [showChartsModal, setShowChartsModal] = useState(false);
    const [chartData, setChartData] = useState<any>(null);
    
    // Animation refs
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchExpenses();
    }, []);

    useEffect(() => {
        filterExpenses(expenses, selectedCategory, selectedDateRange);
    }, [selectedCategory, selectedDateRange, expenses, customStartDate, customEndDate]);

    const fetchExpenses = async (isRefreshing = false) => {
        try {
            if (isRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            
            // Animate fetch
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0.7,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();

            console.log("📡 Fetching expenses from API...");
            const res = await API.get("/expenses"); 
            console.log("📊 Received", res.data?.length || 0, "expenses from API");
            
            const expensesData = res.data || [];
            setExpenses(expensesData);
            
            // Extract unique categories
            const uniqueCategories = ['All', ...new Set(expensesData.map((expense: Expense) => expense.category))] as string[];
            setCategories(uniqueCategories);
            
            // Apply filtering
            filterExpenses(expensesData, selectedCategory);
            
        } catch (error) {
            console.error("❌ Failed to fetch expenses:", error);
            Alert.alert("Error", "Failed to fetch expenses. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Filter expenses by category and date
    const filterExpenses = (expensesList: Expense[], category: string, dateRange: string = selectedDateRange) => {
        let filtered = expensesList;
        
        // Filter by category
        if (category !== 'All') {
            filtered = filtered.filter(expense => expense.category === category);
        }
        
        // Filter by date range
        filtered = filterByDateRange(filtered, dateRange);
        
        setFilteredExpenses(filtered);
        generateChartData(filtered);
    };

    // Generate chart data for visualization
    const generateChartData = (expensesList: Expense[]) => {
        if (expensesList.length === 0) {
            setChartData(null);
            return;
        }

        // Category-wise spending
        const categoryData: { [key: string]: number } = {};
        expensesList.forEach(expense => {
            categoryData[expense.category] = (categoryData[expense.category] || 0) + expense.amount;
        });

        // Daily spending for last 7 days
        const last7Days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayExpenses = expensesList.filter(expense => 
                expense.CreatedAt.split('T')[0] === dateStr
            );
            const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            last7Days.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                amount: total
            });
        }

        // Monthly spending trends
        const monthlyData: { [key: string]: number } = {};
        expensesList.forEach(expense => {
            const month = new Date(expense.CreatedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            monthlyData[month] = (monthlyData[month] || 0) + expense.amount;
        });

        setChartData({
            categoryData: Object.entries(categoryData).map(([category, amount]) => ({
                category,
                amount,
                percentage: (amount / expensesList.reduce((sum, exp) => sum + exp.amount, 0)) * 100
            })),
            dailyData: last7Days,
            monthlyData: Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })),
            totalAmount: expensesList.reduce((sum, exp) => sum + exp.amount, 0),
            transactionCount: expensesList.length
        });
    };

    // Date range filtering logic
    const filterByDateRange = (expensesList: Expense[], dateRange: string): Expense[] => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (dateRange) {
            case 'This Week': {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                return expensesList.filter(expense => new Date(expense.CreatedAt) >= weekStart);
            }
            case 'This Month': {
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                return expensesList.filter(expense => new Date(expense.CreatedAt) >= monthStart);
            }
            case 'Last 30 Days': {
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);
                return expensesList.filter(expense => new Date(expense.CreatedAt) >= thirtyDaysAgo);
            }
            case 'Custom Range': {
                if (!customStartDate || !customEndDate) return expensesList;
                const startDate = new Date(customStartDate);
                const endDate = new Date(customEndDate);
                endDate.setHours(23, 59, 59, 999); // Include the entire end date
                return expensesList.filter(expense => {
                    const expenseDate = new Date(expense.CreatedAt);
                    return expenseDate >= startDate && expenseDate <= endDate;
                });
            }
            default: // 'All Time'
                return expensesList;
        }
    };

    // Pull to refresh handler
    const onRefresh = () => {
        fetchExpenses(true);
    };

    // Export functionality
    const exportExpenses = async () => {
        try {
            const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            const expensesList = expenses.map(expense => 
                `${expense.title} - ₹${expense.amount} (${expense.category})`
            ).join('\n');
            
            const exportData = `💰 EXPENSE TRACKER REPORT\n\n` +
                `📊 Total Expenses: ₹${totalAmount.toFixed(2)}\n` +
                `📝 Total Transactions: ${expenses.length}\n\n` +
                `📋 EXPENSE DETAILS:\n${expensesList}\n\n` +
                `Generated on: ${new Date().toLocaleDateString()}`;

            await Share.share({
                message: exportData,
                title: 'Expense Tracker Report'
            });
        } catch (error) {
            console.error('Export failed:', error);
            Alert.alert('Export Failed', 'Unable to export expenses');
        }
    };

    const addExpense = async () => {
        // Validation
        if (!newExpense.title.trim()) {
            Alert.alert("Validation Error", "Please enter a title for the expense.");
            return;
        }
        if (!newExpense.amount.trim() || isNaN(Number(newExpense.amount))) {
            Alert.alert("Validation Error", "Please enter a valid amount.");
            return;
        }

        try {
            const expenseData = {
                title: newExpense.title.trim(),
                amount: parseFloat(newExpense.amount),
                category: newExpense.category.trim(),
                description: newExpense.description.trim()
            };

            await API.post("/expenses", expenseData);
            
            // Reset form
            setNewExpense({ title: '', amount: '', category: '', description: '' });
            setShowAddModal(false);
            
            // Animated refresh
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                slideAnim.setValue(0);
            });
            
            // Refresh expenses list
            fetchExpenses();
            
            Alert.alert("Success", "Expense added successfully!");
        } catch (error) {
            console.error("❌ Failed to add expense:", error);
            Alert.alert("Error", "Failed to add expense. Please try again.");
        }
    };

    const deleteExpense = async (expense: Expense) => {
        console.log("🗑️ Delete button pressed for expense:", expense.title, "ID:", expense.ID);
        setDeletingExpense(expense);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingExpense) return;
        
        try {
            console.log("🚀 Sending DELETE request for expense ID:", deletingExpense.ID);
            const response = await API.delete(`/expenses/${deletingExpense.ID}`);
            console.log("✅ Delete response:", response.data);
            
            setShowDeleteModal(false);
            setDeletingExpense(null);
            fetchExpenses(); // Refresh the list
            Alert.alert("Success", "Expense deleted successfully!");
        } catch (error) {
            console.error("❌ Failed to delete expense:", error);
            if (error instanceof Error) {
                console.error("🔍 Error message:", error.message);
            }
            Alert.alert("Error", "Failed to delete expense. Please try again.");
        }
    };

    const startEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
        setNewExpense({
            title: expense.title,
            amount: expense.amount.toString(),
            category: expense.category,
            description: expense.description
        });
        setShowEditModal(true);
    };

    const updateExpense = async () => {
        if (!editingExpense) return;

        // Validation
        if (!newExpense.title.trim()) {
            Alert.alert("Validation Error", "Please enter a title for the expense.");
            return;
        }
        if (!newExpense.amount.trim() || isNaN(Number(newExpense.amount))) {
            Alert.alert("Validation Error", "Please enter a valid amount.");
            return;
        }

        try {
            const expenseData = {
                title: newExpense.title.trim(),
                amount: parseFloat(newExpense.amount),
                category: newExpense.category.trim(),
                description: newExpense.description.trim()
            };

            await API.put(`/expenses/${editingExpense.ID}`, expenseData);
            
            // Reset form
            setNewExpense({ title: '', amount: '', category: '', description: '' });
            setEditingExpense(null);
            setShowEditModal(false);
            
            // Animated refresh
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                slideAnim.setValue(0);
            });
            
            // Refresh expenses list
            fetchExpenses();
            
            Alert.alert("Success", "Expense updated successfully!");
        } catch (error) {
            console.error("❌ Failed to update expense:", error);
            Alert.alert("Error", "Failed to update expense. Please try again.");
        }
    };

    // --- RENDER FUNCTIONS ---

    const getCategoryIcon = () => {
        return '�'; // Formal, generalized expense icon
    };

    const renderExpenseItem = ({ item }: { item: Expense }) => (
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>{getCategoryIcon()}</Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.expenseTitle}>{item.title}</Text>
                <Text style={styles.expenseCategory}>{item.category}</Text>
            </View>
            <View style={styles.cardRight}>
                <Text style={styles.expenseAmount}>
                    ₹{item.amount ? item.amount.toFixed(2) : '0.00'}
                </Text>
                <View style={styles.actionButtons}>
                    <TouchableOpacity 
                        style={styles.editButton}
                        onPress={() => startEditExpense(item)}
                    >
                        <Text style={styles.editButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => deleteExpense(item)}
                    >
                        <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.accent} />
                <Text style={{ marginTop: 10 }}>Loading Expenses from Go Backend...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
            
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.title}>💰 Expense Tracker</Text>
                        <Text style={styles.subtitle}>Track your finances with ease</Text>
                    </View>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity style={styles.headerButton} onPress={() => setShowChartsModal(true)}>
                            <Text style={styles.headerButtonText}>📊</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerButton} onPress={() => setShowDateRangeModal(true)}>
                            <Text style={styles.headerButtonText}>📅</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerButton} onPress={exportExpenses}>
                            <Text style={styles.headerButtonText}>📤</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* Date Range Indicator */}
                {selectedDateRange !== 'All Time' && (
                    <View style={styles.dateRangeIndicator}>
                        <Text style={styles.dateRangeText}>� {selectedDateRange}</Text>
                        <TouchableOpacity onPress={() => setSelectedDateRange('All Time')}>
                            <Text style={styles.clearDateRange}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}
                
                {/* Filter Buttons */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterContainer}
                    contentContainerStyle={styles.filterContent}
                >
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.filterButton,
                                selectedCategory === category && styles.filterButtonActive
                            ]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            <Text style={[
                                styles.filterButtonText,
                                selectedCategory === category && styles.filterButtonTextActive
                            ]}>
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            
            {/* Summary Card */}
            {filteredExpenses.length > 0 && (
                <Animated.View style={[styles.summaryCard, { opacity: fadeAnim }]}>
                    <Text style={styles.summaryLabel}>
                        {selectedCategory === 'All' ? 'Total Expenses' : `${selectedCategory} Expenses`}
                        {selectedDateRange !== 'All Time' && ` (${selectedDateRange})`}
                    </Text>
                    <Text style={styles.summaryAmount}>
                        ₹{filteredExpenses.reduce((total, expense) => total + expense.amount, 0).toFixed(2)}
                    </Text>
                    <Text style={styles.summaryCount}>
                        {filteredExpenses.length} transactions
                        {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                    </Text>
                    
                    {/* Quick Stats */}
                    {selectedCategory === 'All' && expenses.length > 0 && (
                        <View style={styles.quickStats}>
                            <Text style={styles.quickStatsText}>
                                📊 {categories.length - 1} categories • 
                                💰 Avg: ₹{(expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length).toFixed(0)}
                            </Text>
                        </View>
                    )}
                </Animated.View>
            )}

            {/* Add Expense Button */}
            <TouchableOpacity 
                style={styles.addButton} 
                onPress={() => setShowAddModal(true)}
            >
                <Text style={styles.addButtonText}>+ Add Expense</Text>
            </TouchableOpacity>

            {filteredExpenses.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateIcon}>
                        {selectedCategory === 'All' ? '📊' : '🔍'}
                    </Text>
                    <Text style={styles.emptyStateTitle}>
                        {selectedCategory === 'All' ? 'No Expenses Yet' : `No ${selectedCategory} Expenses`}
                    </Text>
                    <Text style={styles.emptyStateMessage}>
                        {selectedCategory === 'All' 
                            ? 'Start tracking your finances by adding your first expense!'
                            : `No expenses found in ${selectedCategory} category. Try selecting a different category or add a new expense.`
                        }
                    </Text>
                </View>
            ) : (
                <Animated.FlatList
                    data={filteredExpenses}
                    keyExtractor={(item) => item.ID.toString()}
                    renderItem={renderExpenseItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.accent]}
                            tintColor={Colors.accent}
                            progressBackgroundColor={Colors.surface}
                        />
                    }
                    style={{ transform: [{ translateY: slideAnim }] }}
                />
            )}

            {/* Add Expense Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Add New Expense</Text>
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Expense Title (e.g., Coffee)"
                        value={newExpense.title}
                        onChangeText={(text) => setNewExpense({...newExpense, title: text})}
                    />
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Amount (e.g., 350)"
                        value={newExpense.amount}
                        keyboardType="numeric"
                        onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
                    />
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Category (e.g., Food, Transportation)"
                        value={newExpense.category}
                        onChangeText={(text) => setNewExpense({...newExpense, category: text})}
                    />
                    
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Description (optional)"
                        value={newExpense.description}
                        multiline
                        numberOfLines={3}
                        onChangeText={(text) => setNewExpense({...newExpense, description: text})}
                    />
                    
                    <View style={styles.modalButtons}>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.cancelButton]} 
                            onPress={() => setShowAddModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.saveButton]} 
                            onPress={addExpense}
                        >
                            <Text style={styles.saveButtonText}>Add Expense</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Edit Expense Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Edit Expense</Text>
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Expense Title (e.g., Coffee)"
                        value={newExpense.title}
                        onChangeText={(text) => setNewExpense({...newExpense, title: text})}
                    />
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Amount (e.g., 350)"
                        value={newExpense.amount}
                        keyboardType="numeric"
                        onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
                    />
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Category (e.g., Food, Transportation)"
                        value={newExpense.category}
                        onChangeText={(text) => setNewExpense({...newExpense, category: text})}
                    />
                    
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Description (optional)"
                        value={newExpense.description}
                        multiline
                        numberOfLines={3}
                        onChangeText={(text) => setNewExpense({...newExpense, description: text})}
                    />
                    
                    <View style={styles.modalButtons}>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.cancelButton]} 
                            onPress={() => {
                                setShowEditModal(false);
                                setEditingExpense(null);
                                setNewExpense({ title: '', amount: '', category: '', description: '' });
                            }}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.saveButton]} 
                            onPress={updateExpense}
                        >
                            <Text style={styles.saveButtonText}>Update Expense</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={showDeleteModal}
                animationType="fade"
                transparent={true}
            >
                <View style={styles.deleteModalOverlay}>
                    <View style={styles.deleteModalContainer}>
                        <Text style={styles.deleteModalTitle}>Delete Expense</Text>
                        <Text style={styles.deleteModalMessage}>
                            Are you sure you want to delete "{deletingExpense?.title}"?
                        </Text>
                        <Text style={styles.deleteModalSubtext}>
                            This action cannot be undone.
                        </Text>
                        
                        <View style={styles.deleteModalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]} 
                                onPress={() => {
                                    console.log("❌ Delete cancelled");
                                    setShowDeleteModal(false);
                                    setDeletingExpense(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.deleteConfirmButton]} 
                                onPress={confirmDelete}
                            >
                                <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Date Range Filter Modal */}
            <Modal
                visible={showDateRangeModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>📅 Filter by Date Range</Text>
                    
                    <ScrollView>
                        {dateRanges.map((range) => (
                            <TouchableOpacity
                                key={range}
                                style={[
                                    styles.dateRangeOption,
                                    selectedDateRange === range && styles.dateRangeOptionActive
                                ]}
                                onPress={() => {
                                    setSelectedDateRange(range);
                                    if (range !== 'Custom Range') {
                                        setShowDateRangeModal(false);
                                    }
                                }}
                            >
                                <Text style={[
                                    styles.dateRangeOptionText,
                                    selectedDateRange === range && styles.dateRangeOptionTextActive
                                ]}>
                                    {range}
                                </Text>
                                {selectedDateRange === range && <Text style={styles.checkmark}>✓</Text>}
                            </TouchableOpacity>
                        ))}
                        
                        {selectedDateRange === 'Custom Range' && (
                            <View style={styles.customDateRange}>
                                <Text style={styles.customDateLabel}>Start Date</Text>
                                <TextInput
                                    style={styles.dateInput}
                                    placeholder="YYYY-MM-DD"
                                    value={customStartDate}
                                    onChangeText={setCustomStartDate}
                                />
                                
                                <Text style={styles.customDateLabel}>End Date</Text>
                                <TextInput
                                    style={styles.dateInput}
                                    placeholder="YYYY-MM-DD"
                                    value={customEndDate}
                                    onChangeText={setCustomEndDate}
                                />
                            </View>
                        )}
                    </ScrollView>
                    
                    <View style={styles.modalButtons}>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.cancelButton]} 
                            onPress={() => setShowDateRangeModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.saveButton]} 
                            onPress={() => setShowDateRangeModal(false)}
                        >
                            <Text style={styles.saveButtonText}>Apply Filter</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Charts Modal */}
            <Modal
                visible={showChartsModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>📊 Expense Analytics</Text>
                    
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {chartData ? (
                            <>
                                {/* Summary Stats */}
                                <View style={styles.chartSummary}>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statValue}>₹{chartData.totalAmount.toFixed(2)}</Text>
                                        <Text style={styles.statLabel}>Total Spent</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statValue}>{chartData.transactionCount}</Text>
                                        <Text style={styles.statLabel}>Transactions</Text>
                                    </View>
                                    <View style={styles.statCard}>
                                        <Text style={styles.statValue}>₹{(chartData.totalAmount / chartData.transactionCount).toFixed(0)}</Text>
                                        <Text style={styles.statLabel}>Average</Text>
                                    </View>
                                </View>

                                {/* Category Breakdown */}
                                <View style={styles.chartSection}>
                                    <Text style={styles.chartSectionTitle}>Category Breakdown</Text>
                                    {chartData.categoryData.map((item: any, index: number) => (
                                        <View key={item.category} style={styles.categoryItem}>
                                            <View style={styles.categoryInfo}>
                                                <Text style={styles.categoryName}>{item.category}</Text>
                                                <Text style={styles.categoryAmount}>₹{item.amount.toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.progressContainer}>
                                                <View 
                                                    style={[
                                                        styles.progressBar, 
                                                        { 
                                                            width: `${item.percentage}%`,
                                                            backgroundColor: `hsl(${(index * 60) % 360}, 70%, 60%)`
                                                        }
                                                    ]} 
                                                />
                                            </View>
                                            <Text style={styles.percentage}>{item.percentage.toFixed(1)}%</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Daily Spending (Last 7 Days) */}
                                <View style={styles.chartSection}>
                                    <Text style={styles.chartSectionTitle}>Daily Spending (Last 7 Days)</Text>
                                    <View style={styles.barChart}>
                                        {chartData.dailyData.map((day: any, index: number) => {
                                            const maxAmount = Math.max(...chartData.dailyData.map((d: any) => d.amount));
                                            const height = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
                                            
                                            return (
                                                <View key={index} style={styles.barContainer}>
                                                    <View style={styles.barWrapper}>
                                                        <View 
                                                            style={[
                                                                styles.bar, 
                                                                { 
                                                                    height: `${height}%`,
                                                                    backgroundColor: Colors.accent 
                                                                }
                                                            ]} 
                                                        />
                                                    </View>
                                                    <Text style={styles.barLabel}>{day.date}</Text>
                                                    <Text style={styles.barAmount}>₹{day.amount}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={styles.noDataContainer}>
                                <Text style={styles.noDataText}>📊</Text>
                                <Text style={styles.noDataTitle}>No Data Available</Text>
                                <Text style={styles.noDataMessage}>Add some expenses to see analytics</Text>
                            </View>
                        )}
                    </ScrollView>
                    
                    <TouchableOpacity 
                        style={[styles.modalButton, styles.saveButton, { margin: 20 }]} 
                        onPress={() => setShowChartsModal(false)}
                    >
                        <Text style={styles.saveButtonText}>Close</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

// --- STYLING (Capify Theme) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: Colors.background,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    headerButton: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    headerButtonText: {
        fontSize: 16,
    },
    dateRangeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.accent,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 10,
    },
    dateRangeText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    clearDateRange: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    // Legacy export button styles (keeping for compatibility)
    exportButton: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    exportButtonText: {
        fontSize: 18,
    },
    // Filter Styles
    filterContainer: {
        marginTop: 10,
    },
    filterContent: {
        paddingRight: 20,
    },
    filterButton: {
        backgroundColor: Colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterButtonActive: {
        backgroundColor: Colors.accent,
        borderColor: Colors.accent,
    },
    filterButtonText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    filterButtonTextActive: {
        color: '#FFFFFF',
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: Colors.primary,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: 20,
    },
    secondaryText: {
        color: Colors.textSecondary,
    },
    // Empty State Styles
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyStateIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.primary,
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyStateMessage: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    // Summary Card Styles
    summaryCard: {
        backgroundColor: Colors.card,
        marginHorizontal: 20,
        marginBottom: 10,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    summaryLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        fontWeight: '600',
    },
    summaryAmount: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.accent,
        marginBottom: 4,
        textShadowColor: 'rgba(0, 212, 170, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    summaryCount: {
        fontSize: 13,
        color: Colors.textTertiary,
        fontWeight: '500',
    },
    quickStats: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    quickStatsText: {
        fontSize: 12,
        color: Colors.textTertiary,
        textAlign: 'center',
        fontWeight: '500',
    },
    // Enhanced Dark Theme Card
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: 16,
        marginHorizontal: 20,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    categoryIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    categoryIcon: {
        fontSize: 24,
    },
    cardContent: {
        flex: 1,
    },
    expenseTitle: { 
        fontSize: 18, 
        fontWeight: "700", 
        color: Colors.primary,
        marginBottom: 4,
    },
    expenseAmount: { 
        fontSize: 20,
        fontWeight: "800", 
        color: Colors.accent,
        textShadowColor: 'rgba(0, 212, 170, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    expenseCategory: { 
        fontSize: 13,
        color: Colors.textSecondary, 
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '500',
    },
    // Enhanced Add Button (Floating Action Button Style)
    addButton: {
        backgroundColor: Colors.accent,
        padding: 18,
        margin: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 170, 0.3)',
        transform: [{ scale: 1 }],
    },
    addButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 17,
        letterSpacing: 0.5,
    },
    // Enhanced Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 20,
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.primary,
        textAlign: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 14,
        padding: 18,
        marginBottom: 16,
        fontSize: 16,
        color: Colors.primary,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
        gap: 15,
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cancelButtonText: {
        color: Colors.textSecondary,
        fontWeight: '700',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: Colors.accent,
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    // Action buttons styles
    cardRight: {
        alignItems: 'flex-end',
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    editButton: {
        backgroundColor: Colors.info,
        borderRadius: 22,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.info,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    editButtonText: {
        fontSize: 18,
    },
    deleteButton: {
        backgroundColor: Colors.error,
        borderRadius: 22,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.error,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    deleteButtonText: {
        fontSize: 18,
    },
    // Enhanced Delete Modal Styles
    deleteModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 15, 35, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteModalContainer: {
        backgroundColor: Colors.card,
        borderRadius: 20,
        padding: 28,
        margin: 20,
        width: '85%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    deleteModalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.error,
        textAlign: 'center',
        marginBottom: 16,
    },
    deleteModalMessage: {
        fontSize: 17,
        color: Colors.primary,
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 24,
    },
    deleteModalSubtext: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    deleteModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    deleteConfirmButton: {
        backgroundColor: Colors.error,
        shadowColor: Colors.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    deleteConfirmButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    
    // Date Range Modal Styles
    dateRangeOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    dateRangeOptionActive: {
        backgroundColor: Colors.accent,
        borderColor: Colors.accent,
    },
    dateRangeOptionText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: '600',
    },
    dateRangeOptionTextActive: {
        color: '#FFFFFF',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    customDateRange: {
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    customDateLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    dateInput: {
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: Colors.primary,
    },
    
    // Charts Modal Styles
    chartSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.accent,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '600',
    },
    chartSection: {
        marginBottom: 24,
    },
    chartSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 16,
    },
    categoryItem: {
        marginBottom: 12,
    },
    categoryInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: '600',
    },
    categoryAmount: {
        fontSize: 16,
        color: Colors.accent,
        fontWeight: '700',
    },
    progressContainer: {
        height: 8,
        backgroundColor: Colors.surface,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    percentage: {
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'right',
        fontWeight: '500',
    },
    barChart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
        paddingVertical: 10,
    },
    barContainer: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 2,
    },
    barWrapper: {
        height: 80,
        justifyContent: 'flex-end',
        width: '100%',
    },
    bar: {
        width: '100%',
        minHeight: 2,
        borderRadius: 2,
    },
    barLabel: {
        fontSize: 10,
        color: Colors.textSecondary,
        marginTop: 4,
        fontWeight: '600',
    },
    barAmount: {
        fontSize: 10,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    noDataContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    noDataText: {
        fontSize: 64,
        marginBottom: 16,
    },
    noDataTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 8,
    },
    noDataMessage: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
