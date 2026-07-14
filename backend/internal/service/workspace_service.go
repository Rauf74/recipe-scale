package service

import (
	"errors"
	"recipe-scale/backend/internal/domain"
	"recipe-scale/backend/internal/repository"
)

type WorkspaceService struct {
	workspaceRepo *repository.WorkspaceRepository
}

func NewWorkspaceService(workspaceRepo *repository.WorkspaceRepository) *WorkspaceService {
	return &WorkspaceService{
		workspaceRepo: workspaceRepo,
	}
}

type UpdateWorkspaceRequest struct {
	Name                  string  `json:"name"`
	DefaultTaxPercent     float64 `json:"defaultTaxPercent"`
	DefaultServicePercent float64 `json:"defaultServicePercent"`
	DefaultTargetFoodCost float64 `json:"defaultTargetFoodCost"`
	RoundPriceTo          float64 `json:"roundPriceTo"`
}

func (s *WorkspaceService) GetWorkspace(id string) (*domain.Workspace, error) {
	return s.workspaceRepo.GetByID(id)
}

func (s *WorkspaceService) UpdateWorkspace(id string, req UpdateWorkspaceRequest) (*domain.Workspace, error) {
	ws, err := s.workspaceRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("workspace not found")
	}

	if req.Name != "" {
		ws.Name = req.Name
	}
	if req.DefaultTaxPercent >= 0 {
		ws.DefaultTaxPercent = req.DefaultTaxPercent
	}
	if req.DefaultServicePercent >= 0 {
		ws.DefaultServicePercent = req.DefaultServicePercent
	}
	if req.DefaultTargetFoodCost > 0 && req.DefaultTargetFoodCost < 100 {
		ws.DefaultTargetFoodCost = req.DefaultTargetFoodCost
	}
	// Round price to: 1 (no rounding), 100, 500, 1000
	if req.RoundPriceTo == 1 || req.RoundPriceTo == 100 || req.RoundPriceTo == 500 || req.RoundPriceTo == 1000 {
		ws.RoundPriceTo = req.RoundPriceTo
	}

	if err := s.workspaceRepo.Update(ws); err != nil {
		return nil, err
	}

	return ws, nil
}
