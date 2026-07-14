package repository

import (
	"gorm.io/gorm"
	"recipe-scale/backend/internal/domain"
)

type CustomUnitRepository struct {
	db *gorm.DB
}

func NewCustomUnitRepository(db *gorm.DB) *CustomUnitRepository {
	return &CustomUnitRepository{db: db}
}

func (r *CustomUnitRepository) Create(cu *domain.CustomUnit) error {
	return r.db.Create(cu).Error
}

func (r *CustomUnitRepository) GetByID(id string, workspaceID string) (*domain.CustomUnit, error) {
	var cu domain.CustomUnit
	err := r.db.First(&cu, "id = ? AND workspace_id = ?", id, workspaceID).Error
	if err != nil {
		return nil, err
	}
	return &cu, nil
}

func (r *CustomUnitRepository) ListByWorkspace(workspaceID string) ([]domain.CustomUnit, error) {
	var list []domain.CustomUnit
	err := r.db.Where("workspace_id = ?", workspaceID).Find(&list).Error
	if err != nil {
		return nil, err
	}
	return list, nil
}

func (r *CustomUnitRepository) Delete(id string, workspaceID string) error {
	return r.db.Where("id = ? AND workspace_id = ?", id, workspaceID).Delete(&domain.CustomUnit{}).Error
}

func (r *CustomUnitRepository) ExistsByName(workspaceID string, name string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.CustomUnit{}).Where("workspace_id = ? AND LOWER(name) = LOWER(?)", workspaceID, name).Count(&count).Error
	return count > 0, err
}
