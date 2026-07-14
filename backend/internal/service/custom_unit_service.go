package service

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"recipe-scale/backend/internal/domain"
	"recipe-scale/backend/internal/repository"
)

type CustomUnitService struct {
	cuRepo *repository.CustomUnitRepository
}

func NewCustomUnitService(cuRepo *repository.CustomUnitRepository) *CustomUnitService {
	return &CustomUnitService{cuRepo: cuRepo}
}

type CreateCustomUnitRequest struct {
	Name             string  `json:"name"`
	BaseUnit         string  `json:"baseUnit"` // g, kg, ml, L, pcs
	ConversionFactor float64 `json:"conversionFactor"`
}

func (s *CustomUnitService) List(workspaceID string) ([]domain.CustomUnit, error) {
	return s.cuRepo.ListByWorkspace(workspaceID)
}

func (s *CustomUnitService) Create(workspaceID string, req CreateCustomUnitRequest) (*domain.CustomUnit, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, errors.New("nama satuan tidak boleh kosong")
	}

	baseUnit := strings.TrimSpace(req.BaseUnit)
	switch baseUnit {
	case "g", "kg", "ml", "L", "pcs", "porsi":
		// valid
	default:
		return nil, errors.New("satuan dasar tidak valid. Harus salah satu dari: g, kg, ml, L, pcs, porsi")
	}

	if req.ConversionFactor <= 0 {
		return nil, errors.New("faktor konversi harus lebih besar dari 0")
	}

	exists, err := s.cuRepo.ExistsByName(workspaceID, name)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("satuan kustom dengan nama tersebut sudah terdaftar")
	}

	cu := &domain.CustomUnit{
		ID:               uuid.New().String(),
		WorkspaceID:      workspaceID,
		Name:             name,
		BaseUnit:         baseUnit,
		ConversionFactor: req.ConversionFactor,
	}

	if err := s.cuRepo.Create(cu); err != nil {
		return nil, err
	}

	return cu, nil
}

func (s *CustomUnitService) Delete(workspaceID string, id string) error {
	// Guard: check if unit exists
	_, err := s.cuRepo.GetByID(id, workspaceID)
	if err != nil {
		return errors.New("satuan kustom tidak ditemukan")
	}

	// We can delete it. In a fully production system we might also verify if it's used by active ingredients.
	return s.cuRepo.Delete(id, workspaceID)
}
