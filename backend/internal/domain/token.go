package domain

import "time"

type BlacklistedToken struct {
	ID        string    `json:"id" gorm:"type:varchar(191);primaryKey"`
	Signature string    `json:"signature" gorm:"type:varchar(255);uniqueIndex"` // The unique signature of the JWT token
	ExpiresAt time.Time `json:"expiresAt" gorm:"index"`                         // Token natural expiration timestamp
	CreatedAt time.Time `json:"createdAt"`
}
