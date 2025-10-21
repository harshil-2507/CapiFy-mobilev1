package utils

import (
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"os"
	"regexp"
	"strings"

	"github.com/twilio/twilio-go"
	twilioApi "github.com/twilio/twilio-go/rest/api/v2010"
)

// GenerateOTP generates a 6-digit OTP
func GenerateOTP() string {
	otp := ""
	for i := 0; i < 6; i++ {
		n, _ := rand.Int(rand.Reader, big.NewInt(10))
		otp += fmt.Sprintf("%d", n)
	}
	return otp
}

// ValidateMobileNumber validates Indian mobile number format
func ValidateMobileNumber(mobile string) bool {
	// Remove all non-digit characters
	re := regexp.MustCompile(`\D`)
	mobile = re.ReplaceAllString(mobile, "")

	// Check if it's a valid Indian mobile number
	// Indian mobile numbers: 10 digits starting with 6,7,8,9
	// Or with country code: +91 or 91
	if len(mobile) == 10 {
		return regexp.MustCompile(`^[6-9]\d{9}$`).MatchString(mobile)
	}

	if len(mobile) == 12 && strings.HasPrefix(mobile, "91") {
		return regexp.MustCompile(`^91[6-9]\d{9}$`).MatchString(mobile)
	}

	if len(mobile) == 13 && strings.HasPrefix(mobile, "+91") {
		mobile = strings.TrimPrefix(mobile, "+")
		return regexp.MustCompile(`^91[6-9]\d{9}$`).MatchString(mobile)
	}

	return false
}

// NormalizeMobileNumber normalizes mobile number to standard format
func NormalizeMobileNumber(mobile string) string {
	// Remove all non-digit characters
	re := regexp.MustCompile(`\D`)
	mobile = re.ReplaceAllString(mobile, "")

	// Add country code if not present
	if len(mobile) == 10 && regexp.MustCompile(`^[6-9]\d{9}$`).MatchString(mobile) {
		return "+91" + mobile
	}

	if len(mobile) == 12 && strings.HasPrefix(mobile, "91") {
		return "+" + mobile
	}

	if strings.HasPrefix(mobile, "+91") {
		return mobile
	}

	return mobile
}

// SMSService interface for different SMS providers
type SMSService interface {
	SendOTP(mobile, otp string) error
}

// TwilioSMSService implements SMSService using Twilio
type TwilioSMSService struct {
	client    *twilio.RestClient
	fromPhone string
}

// NewTwilioSMSService creates a new Twilio SMS service
func NewTwilioSMSService() *TwilioSMSService {
	accountSid := os.Getenv("TWILIO_ACCOUNT_SID")
	authToken := os.Getenv("TWILIO_AUTH_TOKEN")
	fromPhone := os.Getenv("TWILIO_PHONE_NUMBER")

	if accountSid == "" || authToken == "" || fromPhone == "" {
		log.Println("⚠️  Twilio credentials not found, using mock SMS service")
		return nil
	}

	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username: accountSid,
		Password: authToken,
	})

	return &TwilioSMSService{
		client:    client,
		fromPhone: fromPhone,
	}
}

// SendOTP sends OTP via Twilio SMS
func (t *TwilioSMSService) SendOTP(mobile, otp string) error {
	if t == nil || t.client == nil {
		// Mock SMS for development
		log.Printf("📱 [MOCK SMS] Sending OTP %s to %s", otp, mobile)
		return nil
	}

	message := fmt.Sprintf("Your CapiFy verification code is: %s. This code will expire in 5 minutes. Don't share this code with anyone.", otp)

	params := &twilioApi.CreateMessageParams{}
	params.SetTo(mobile)
	params.SetFrom(t.fromPhone)
	params.SetBody(message)

	resp, err := t.client.Api.CreateMessage(params)
	if err != nil {
		log.Printf("❌ Failed to send SMS: %v", err)
		return err
	}

	log.Printf("✅ SMS sent successfully. SID: %s", *resp.Sid)
	return nil
}

// MockSMSService for development/testing
type MockSMSService struct{}

// SendOTP mock implementation
func (m *MockSMSService) SendOTP(mobile, otp string) error {
	log.Printf("📱 [MOCK SMS] Sending OTP %s to %s", otp, mobile)
	fmt.Printf("\n🔐 Development OTP for %s: %s\n\n", mobile, otp)
	return nil
}

// GetSMSService returns the appropriate SMS service
func GetSMSService() SMSService {
	// Try to create Twilio service first
	twilioService := NewTwilioSMSService()
	if twilioService != nil {
		return twilioService
	}

	// Fall back to mock service for development
	return &MockSMSService{}
}
