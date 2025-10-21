package utils

import (
	"crypto/rand"
	"crypto/subtle"
	"errors"
	"fmt"

	"golang.org/x/crypto/argon2"
)

// PIN hashing parameters
const (
	saltLength   = 16
	keyLength    = 32
	argonTime    = 1
	argonMemory  = 64 * 1024
	argonThreads = 4
)

// HashPIN hashes a PIN using Argon2id
func HashPIN(pin string) (string, error) {
	// Validate PIN
	if len(pin) != 4 {
		return "", errors.New("PIN must be exactly 4 digits")
	}

	// Generate a random salt
	salt := make([]byte, saltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	// Hash the PIN
	hash := argon2.IDKey([]byte(pin), salt, argonTime, argonMemory, argonThreads, keyLength)

	// Encode salt and hash as hex and combine
	return fmt.Sprintf("%x:%x", salt, hash), nil
}

// VerifyPIN verifies a PIN against its hash
func VerifyPIN(pin, hashedPIN string) (bool, error) {
	// Validate PIN
	if len(pin) != 4 {
		return false, errors.New("PIN must be exactly 4 digits")
	}

	// Parse the stored hash
	var salt, hash []byte
	if _, err := fmt.Sscanf(hashedPIN, "%x:%x", &salt, &hash); err != nil {
		return false, err
	}

	// Hash the provided PIN with the same salt
	testHash := argon2.IDKey([]byte(pin), salt, argonTime, argonMemory, argonThreads, keyLength)

	// Compare hashes using constant-time comparison
	return subtle.ConstantTimeCompare(hash, testHash) == 1, nil
}

// ValidatePIN checks if a PIN is valid (4 digits, no patterns)
func ValidatePIN(pin string) error {
	if len(pin) != 4 {
		return errors.New("PIN must be exactly 4 digits")
	}

	// Check if all characters are digits
	for _, char := range pin {
		if char < '0' || char > '9' {
			return errors.New("PIN must contain only digits")
		}
	}

	// Check for weak patterns
	if isWeakPIN(pin) {
		return errors.New("PIN is too weak. Avoid sequences like 1234, 1111, or 1212")
	}

	return nil
}

// isWeakPIN checks for common weak PIN patterns
func isWeakPIN(pin string) bool {
	// Check for repeated digits (1111, 2222, etc.)
	if pin[0] == pin[1] && pin[1] == pin[2] && pin[2] == pin[3] {
		return true
	}

	// Check for sequential patterns (1234, 4321, etc.)
	weakPatterns := []string{
		"1234", "2345", "3456", "4567", "5678", "6789", "7890",
		"4321", "5432", "6543", "7654", "8765", "9876", "0987",
		"1212", "2323", "3434", "4545", "5656", "6767", "7878", "8989", "9090",
		"0123", "9876", "1357", "2468", "0000",
	}

	for _, pattern := range weakPatterns {
		if pin == pattern {
			return true
		}
	}

	return false
}

// GenerateRandomPIN generates a random 4-digit PIN for testing
func GenerateRandomPIN() (string, error) {
	bytes := make([]byte, 2)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	// Convert to 4-digit PIN
	pin := fmt.Sprintf("%04d", int(bytes[0])<<8+int(bytes[1])%10000)

	// Ensure it's not a weak PIN
	if isWeakPIN(pin) {
		return GenerateRandomPIN() // Recursive call if weak
	}

	return pin, nil
}
