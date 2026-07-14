package service

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"recipe-scale/backend/internal/domain"
	"recipe-scale/backend/internal/jwtutil"
	"recipe-scale/backend/internal/repository"
)

type AuthService struct {
	userRepo      *repository.UserRepository
	workspaceRepo *repository.WorkspaceRepository
}

func NewAuthService(userRepo *repository.UserRepository, workspaceRepo *repository.WorkspaceRepository) *AuthService {
	return &AuthService{
		userRepo:      userRepo,
		workspaceRepo: workspaceRepo,
	}
}

type RegisterRequest struct {
	WorkspaceName string `json:"workspaceName"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	Password      string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  *domain.User `json:"user"`
}

type JWTCustomClaims struct {
	UserID      string          `json:"userId"`
	Email       string          `json:"email"`
	Role        domain.UserRole `json:"role"`
	WorkspaceID string          `json:"workspaceId"`
	jwt.RegisteredClaims
}

func (s *AuthService) RegisterWorkspace(req RegisterRequest) (*AuthResponse, error) {
	// 1. Basic validation
	if req.WorkspaceName == "" || req.Name == "" || req.Email == "" || req.Password == "" {
		return nil, errors.New("all fields (workspaceName, name, email, password) are required")
	}

	// 2. Check if user already exists
	existing, _ := s.userRepo.GetByEmail(req.Email)
	if existing != nil {
		return nil, errors.New("email is already registered")
	}

	// 3. Create Workspace
	workspaceID := uuid.New().String()
	ws := &domain.Workspace{
		ID:        workspaceID,
		Name:      req.WorkspaceName,
		CreatedAt: time.Now(),
	}
	if err := s.workspaceRepo.Create(ws); err != nil {
		return nil, err
	}

	// 4. Hash Password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 5. Create User (Owner)
	userID := uuid.New().String()
	user := &domain.User{
		ID:          userID,
		Name:        req.Name,
		Email:       req.Email,
		Password:    string(hashedPassword),
		Role:        domain.RoleOwner,
		WorkspaceID: workspaceID,
		CreatedAt:   time.Now(),
	}
	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// 6. Generate Token
	token, err := s.generateJWT(user)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User:  user,
	}, nil
}

func (s *AuthService) Login(req LoginRequest) (*AuthResponse, error) {
	// 1. Get User by Email
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// 2. Verify Password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// 3. Generate Token
	token, err := s.generateJWT(user)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User:  user,
	}, nil
}

func (s *AuthService) GetUserByID(userID string) (*domain.User, error) {
	return s.userRepo.GetByID(userID)
}

func (s *AuthService) generateJWT(user *domain.User) (string, error) {
	jwtSecret, err := jwtutil.Secret()
	if err != nil {
		return "", errors.New("konfigurasi server tidak lengkap")
	}

	claims := JWTCustomClaims{
		UserID:      user.ID,
		Email:       user.Email,
		Role:        user.Role,
		WorkspaceID: user.WorkspaceID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * 7 * time.Hour)), // 7 Days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
