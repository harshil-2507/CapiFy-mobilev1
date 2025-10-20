// capify-mobile/app/(tabs)/index.tsx

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from "react-native";
import API from "../../api/axios"; // Adjust path if needed
import { Colors } from "../../theme/Colors";

// Sample Expense Interface (to match Go backend fields)
interface Expense {
    ID: number;
    title: string;
    amount: number;
    category: string;
    description: string;
}

export default function HomeScreen() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            // 💡 Calls your Go Backend: GET http://localhost:8080/expenses
            const res = await API.get("/expenses"); 
            
            // Note: Data from Go backend is an array of expense objects
            setExpenses(res.data);
        } catch (error) {
            console.error("Failed to fetch expenses:", error);
            // Optional: Show an alert to the user
        } finally {
            setLoading(false);
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

            {expenses.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.secondaryText}>No expenses logged yet.</Text>
                    <Text style={styles.secondaryText}>Try adding one via curl or Postman!</Text>
                </View>
            ) : (
                <FlatList
                    data={expenses}
                    keyExtractor={(item) => item.ID.toString()}
                    renderItem={renderExpenseItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
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
});