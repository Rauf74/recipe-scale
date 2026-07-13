package repository

import (
	"gorm.io/gorm"
	"recipe-scale/backend/internal/domain"
)

type WorkspaceRepository struct {
	db *gorm.DB
}

func NewWorkspaceRepository(db *gorm.DB) *WorkspaceRepository {
	return &WorkspaceRepository{db: db}
}

func (r *WorkspaceRepository) Create(ws *domain.Workspace) error {
	return r.db.Create(ws).Error
}

func (r *WorkspaceRepository) GetByID(id string) (*domain.Workspace, error) {
	var ws domain.Workspace
	err := r.db.First(&ws, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &ws, nil
}
