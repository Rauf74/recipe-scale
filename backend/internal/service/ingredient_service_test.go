package service

import (
	"testing"
)

func TestCalculateCostPerRecipeUnit(t *testing.T) {
	tests := []struct {
		name  string
		price float64
		qty   float64
		yield float64
		want  float64
	}{
		{"Sugar 1kg at 15000", 15000, 1000, 100, 15},
		{"Rice 5kg at 75000", 75000, 5000, 100, 15},
		{"Onion 1kg at 40000 with 80 percent yield", 40000, 1000, 80, 50},
		{"Oil 2L at 36000 with 90 percent yield", 36000, 2000, 90, 20},
		{"Zero quantity division guard", 15000, 0, 100, 0},
		{"Invalid yield over 100 defaults to 100", 15000, 1000, 120, 15},
		{"Invalid yield below 0 defaults to 100", 15000, 1000, -10, 15},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := calculateCostPerRecipeUnit(tt.price, tt.qty, tt.yield)
			if got != tt.want {
				t.Errorf("calculateCostPerRecipeUnit(%v, %v, %v) = %v; want %v", tt.price, tt.qty, tt.yield, got, tt.want)
			}
		})
	}
}

func TestCalculateCostPerRecipeUnit_EdgeCases(t *testing.T) {
	tests := []struct {
		name  string
		price float64
		qty   float64
		yield float64
		want  float64
	}{
		{"Zero price", 0, 1000, 100, 0},
		{"Very small quantity", 10000, 1, 100, 10000},
		{"Very low yield", 10000, 1000, 1, 1000},
		{"Large values", 1000000, 100000, 100, 10},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := calculateCostPerRecipeUnit(tt.price, tt.qty, tt.yield)
			if got != tt.want {
				t.Errorf("calculateCostPerRecipeUnit(%v, %v, %v) = %v; want %v", tt.price, tt.qty, tt.yield, got, tt.want)
			}
		})
	}
}
