package repository

import (
	"gorm.io/gorm"
	"recipe-scale/backend/internal/domain"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(u *domain.User) error {
	return r.db.Create(u).Error
}

func (r *UserRepository) GetByID(id string) (*domain.User, error) {
	var u domain.User
	err := r.db.First(&u, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) GetByEmail(email string) (*domain.User, error) {
	var u domain.User
	err := r.db.First(&u, "email = ?", email).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}
