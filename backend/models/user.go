package types

import (
	"fmt"
	"regexp"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

type UserStatus string

const (
	bcryptCost                     = 12
	minFirstNameLen                = 2
	minLastNameLen                 = 2
	minPasswordLen                 = 7
	UserStatusActive    UserStatus = "active"
	UserStatusSuspended UserStatus = "suspended"
	UserStatusDeleted   UserStatus = "deleted"
)

type CreateUserParams struct {
	FirstName string   `json:"firstName"`
	LastName  string   `json:"lastName"`
	Email     string   `json:"email"`
	Password  string   `json:"password"`
	Admin     bool     `json:"admin"`
	Address   []string `json:"address"`
}

type UpdateUserParams struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

func (params UpdateUserParams) ToBSON() bson.M {
	m := bson.M{}
	if len(params.FirstName) > 0 {
		m["firstName"] = params.FirstName
	}
	if len(params.LastName) > 0 {
		m["lastName"] = params.LastName
	}
	return m

}

func (params CreateUserParams) Validate() map[string]string {
	errors := map[string]string{}
	if len(params.FirstName) < minFirstNameLen {
		errors["firstName"] = fmt.Sprintf("firstName length should be at least %d characters", minFirstNameLen)
	}
	if len(params.LastName) < minLastNameLen {
		errors["lastName"] = fmt.Sprintf("lastName length should be at least %d characters", minLastNameLen)
	}
	if len(params.Password) < minPasswordLen {
		errors["password"] = fmt.Sprintf("password length should be at least %d characters", minPasswordLen)
	}
	if !isEmailValid(params.Email) {
		errors["email"] = fmt.Sprintf("email %s is invalid", params.Email)
	}
	return errors
}

func isEmailValid(email string) bool {
	pattern := `^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`

	re := regexp.MustCompile(pattern)

	return re.MatchString(email)
}

func IsValidPassword(encryptedPassword, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(encryptedPassword), []byte(password)) == nil
}

type User struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	ClerkID           string             `bson:"clerkId,omitempty" json:"clerkId,omitempty"` // For Clerk integration
	FirstName         string             `bson:"firstName" json:"firstName"`
	LastName          string             `bson:"lastName" json:"lastName"`
	Email             string             `bson:"email" json:"email"`
	EncryptedPassword string             `bson:"EncryptedPassword" json:"-"` // Remove EncryptedPassword when migrating to Clerk
	Admin             bool               `bson:"admin" json:"admin"`
	Addresses         []Address          `bson:"addresses" json:"addresses"`

	Status    UserStatus `bson:"status" json:"status"` // active, suspended, deleted
	CreatedAt time.Time  `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time  `bson:"updatedAt" json:"updatedAt"`
	LastLogin time.Time  `bson:"lastLogin,omitempty" json:"lastLogin,omitempty"`

	// Analytics
	TotalOrders   int     `bson:"totalOrders" json:"totalOrders"`
	TotalSpent    float64 `bson:"totalSpent" json:"totalSpent"`
	LoyaltyPoints int     `bson:"loyaltyPoints" json:"loyaltyPoints"`
}

type Address struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Label       string             `bson:"label" json:"label"` // "Home", "Work", etc.
	Street1     string             `bson:"street1" json:"street1" validate:"required"`
	Street2     string             `bson:"street2,omitempty" json:"street2,omitempty"`
	City        string             `bson:"city" json:"city" validate:"required"`
	State       string             `bson:"state" json:"state" validate:"required"`
	PostalCode  string             `bson:"postalCode" json:"postalCode" validate:"required"`
	Country     string             `bson:"country" json:"country" validate:"required"`
	IsDefault   bool               `bson:"isDefault" json:"isDefault"`
	Coordinates Coordinates        `bson:"coordinates,omitempty" json:"coordinates,omitempty"`
}

// Coordinates represents geographical coordinates (latitude and longitude).
type Coordinates struct {
	Latitude  float64 `bson:"latitude" json:"latitude"`
	Longitude float64 `bson:"longitude" json:"longitude"`
}

func NewUserFromParams(params CreateUserParams) (*User, error) {
	encpw, err := bcrypt.GenerateFromPassword([]byte(params.Password), bcryptCost)
	if err != nil {
		return nil, err
	}
	return &User{
		FirstName:         params.FirstName,
		LastName:          params.LastName,
		Email:             params.Email,
		EncryptedPassword: string(encpw),
	}, nil
}
