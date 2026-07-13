package domain

import "time"

type Workspace struct {
	ID        string    `json:"id" gorm:"type:varchar(191);primaryKey"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
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
