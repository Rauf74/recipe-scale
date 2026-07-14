package validation

import (
	"errors"
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

func ValidateRequest(req interface{}) error {
	err := validate.Struct(req)
	if err == nil {
		return nil
	}

	var msgs []string
	for _, err := range err.(validator.ValidationErrors) {
		field := err.Field()
		tag := err.Tag()
		param := err.Param()

		switch tag {
		case "required":
			msgs = append(msgs, fmt.Sprintf("%s wajib diisi", field))
		case "gte":
			msgs = append(msgs, fmt.Sprintf("%s tidak boleh kurang dari %s", field, param))
		case "gt":
			msgs = append(msgs, fmt.Sprintf("%s harus lebih dari %s", field, param))
		case "min":
			msgs = append(msgs, fmt.Sprintf("%s minimal %s karakter", field, param))
		case "max":
			msgs = append(msgs, fmt.Sprintf("%s maksimal %s karakter", field, param))
		case "oneof":
			msgs = append(msgs, fmt.Sprintf("%s harus salah satu dari: %s", field, param))
		case "email":
			msgs = append(msgs, fmt.Sprintf("%s tidak valid", field))
		case "numeric":
			msgs = append(msgs, fmt.Sprintf("%s harus berupa angka", field))
		default:
			msgs = append(msgs, fmt.Sprintf("%s tidak valid", field))
		}
	}
	return errors.New(strings.Join(msgs, "; "))
}
