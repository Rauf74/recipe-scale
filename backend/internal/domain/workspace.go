package domain

import "time"

type Workspace struct {
	ID                    string    `json:"id" gorm:"type:varchar(191);primaryKey"`
	Name                  string    `json:"name"`
	DefaultTaxPercent     float64   `json:"defaultTaxPercent" gorm:"type:decimal(5,2);default:10"`
	DefaultServicePercent float64   `json:"defaultServicePercent" gorm:"type:decimal(5,2);default:5"`
	DefaultTargetFoodCost float64   `json:"defaultTargetFoodCost" gorm:"type:decimal(5,2);default:30"`
	RoundPriceTo          float64   `json:"roundPriceTo" gorm:"type:decimal(15,2);default:100"` // Pembulatan (e.g. 1, 100, 500, 1000)
	CreatedAt             time.Time `json:"createdAt"`
}

type UserRole string

const (
	RoleOwner UserRole = "OWNER"
	RoleChef  UserRole = "CHEF"
	RoleStaff UserRole = "STAFF"
)

type User struct {
	ID          string    `json:"id" gorm:"type:varchar(191);primaryKey"`
	Name        string    `json:"name"`
	Email       string    `json:"email" gorm:"type:varchar(191);unique"`
	Password    string    `json:"-"`
	Role        UserRole  `json:"role"`
	WorkspaceID string    `json:"workspaceId" gorm:"type:varchar(191)"`
	CreatedAt   time.Time `json:"createdAt"`
}
