// Package jwtutil menyediakan helper terpusat untuk konfigurasi JWT
// agar signing path (service) dan verifying path (middleware) selalu pakai
// secret yang sama dan me-fail-fast ketika JWT_SECRET tidak di-set.
package jwtutil

import (
	"errors"
	"os"
)

// ErrSecretNotSet dikembalikan ketika JWT_SECRET environment variable kosong.
// Caller harus log.Fatal untuk menghindari silent fallback ke secret default
// yang akan menyebabkan token forgery jika environment misconfigured.
var ErrSecretNotSet = errors.New("JWT_SECRET is not set")

// Secret membaca JWT_SECRET dari environment. Jika kosong, kembalikan error
// alih-alih diam-diam menggunakan default — semua pemanggil (sign + verify)
// Wajib fail-fast di startup.
func Secret() (string, error) {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		return "", ErrSecretNotSet
	}
	return s, nil
}
