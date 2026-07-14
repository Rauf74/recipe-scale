package validation

import (
	"testing"
)

type testReq struct {
	Name  string  `json:"name" validate:"required"`
	Email string  `json:"email" validate:"required,email"`
	Age   float64 `json:"age" validate:"gte=0"`
}

func TestValidateRequest_Valid(t *testing.T) {
	req := testReq{
		Name:  "John",
		Email: "john@example.com",
		Age:   25,
	}
	err := ValidateRequest(&req)
	if err != nil {
		t.Errorf("expected no error, got: %v", err)
	}
}

func TestValidateRequest_MissingRequired(t *testing.T) {
	req := testReq{
		Name:  "",
		Email: "john@example.com",
		Age:   25,
	}
	err := ValidateRequest(&req)
	if err == nil {
		t.Fatal("expected error for missing required field")
	}
}

func TestValidateRequest_InvalidEmail(t *testing.T) {
	req := testReq{
		Name:  "John",
		Email: "not-an-email",
		Age:   25,
	}
	err := ValidateRequest(&req)
	if err == nil {
		t.Fatal("expected error for invalid email")
	}
}

func TestValidateRequest_NegativeAge(t *testing.T) {
	req := testReq{
		Name:  "John",
		Email: "john@example.com",
		Age:   -1,
	}
	err := ValidateRequest(&req)
	if err == nil {
		t.Fatal("expected error for negative age")
	}
}
