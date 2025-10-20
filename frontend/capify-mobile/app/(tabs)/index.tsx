// capify-mobile/app/(tabs)/index.tsx

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, TextInput, Modal, Alert } from "react-native";
import API from "../../api/axios"; // Adjust path if needed
import { Colors } from "../../theme/Colors";

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
    const [newExpense, setNewExpense] = useState({
        title: '',
        amount: '',
        category: '',
        description: ''
    });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const res = await API.get("/expenses"); 
            setExpenses(res.data || []);
        } catch (error) {
            console.error("❌ Failed to fetch expenses:", error);
            Alert.alert("Error", "Failed to fetch expenses. Please try again.");
        } finally {
            setLoading(false);
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
            
            // Refresh expenses list
            fetchExpenses();
            
            Alert.alert("Success", "Expense added successfully!");
        } catch (error) {
            console.error("❌ Failed to add expense:", error);
            Alert.alert("Error", "Failed to add expense. Please try again.");
        }
    };

    // --- RENDER FUNCTIONS ---

    const renderExpenseItem = ({ item }: { item: Expense }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <Text style={styles.expenseTitle}>{item.title}</Text>
                <Text style={styles.expenseCategory}>{item.category}</Text>
            </View>
            {/* Display amount in Capify accent color */}
            <Text style={styles.expenseAmount}>
                ₹{item.amount ? item.amount.toFixed(2) : '0.00'}
            </Text>
        </View>
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
            <Text style={styles.title}>Expense Tracker</Text>
            
            {/* Add Expense Button */}
            <TouchableOpacity 
                style={styles.addButton} 
                onPress={() => setShowAddModal(true)}
            >
                <Text style={styles.addButtonText}>+ Add Expense</Text>
            </TouchableOpacity>

            {expenses.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.secondaryText}>No expenses logged yet.</Text>
                    <Text style={styles.secondaryText}>Add your first expense above!</Text>
                </View>
            ) : (
                <FlatList
                    data={expenses}
                    keyExtractor={(item) => item.ID.toString()}
                    renderItem={renderExpenseItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
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
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.primary,
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 15,
    },
    secondaryText: {
        color: Colors.secondaryText,
    },
    // Capify-style Card
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: 16, // Rounded corners
        marginHorizontal: 20,
        padding: 15,
        marginBottom: 10,
        shadowColor: Colors.primary, // Dark shadow for depth
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5, // Android shadow
    },
    cardContent: {
        flex: 1,
    },
    expenseTitle: { 
        fontSize: 17, 
        fontWeight: "600", 
        color: Colors.primary 
    },
    expenseAmount: { 
        fontSize: 18,
        fontWeight: "bold", 
        color: Colors.accent, // Capify Green Accent
    },
    expenseCategory: { 
        fontSize: 14,
        color: Colors.secondaryText, 
        marginTop: 4 
    },
    // Add Expense Button
    addButton: {
        backgroundColor: Colors.accent,
        padding: 15,
        margin: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
        textAlign: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    input: {
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
        color: Colors.primary,
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
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cancelButtonText: {
        color: Colors.primary,
        fontWeight: '600',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: Colors.accent,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});