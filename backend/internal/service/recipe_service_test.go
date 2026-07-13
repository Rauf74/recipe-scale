package service

import (
	"testing"
)

func TestConvertQuantity(t *testing.T) {
	tests := []struct {
		name     string
		qty      float64
		fromUnit string
		toUnit   string
		want     float64
	}{
		{"Same unit g to g", 100.0, "g", "g", 100.0},
		{"Same unit grams to g", 100.0, "grams", "g", 100.0},
		{"Grams to kg", 1000.0, "g", "kg", 1.0},
		{"Kg to grams", 1.5, "kg", "g", 1500.0},
		{"Ml to L", 500.0, "ml", "L", 0.5},
		{"L to ml", 2.0, "L", "ml", 2000.0},
		{"Incompatible unit g to ml", 100.0, "g", "ml", 100.0}, // returns qty as fallback
		{"Case insensitive Gram to KG", 500.0, "Gram", "KG", 0.5},
		{"Portions to porsi", 5.0, "portions", "porsi", 5.0},
		{"Porsi to portions", 10.0, "porsi", "portions", 10.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := convertQuantity(tt.qty, tt.fromUnit, tt.toUnit)
			if got != tt.want {
				t.Errorf("convertQuantity(%v, %q, %q) = %v; want %v", tt.qty, tt.fromUnit, tt.toUnit, got, tt.want)
			}
		})
	}
}
