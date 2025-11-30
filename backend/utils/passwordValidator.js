// Password validation utility
// Requirements: At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 symbol

const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
  if (uppercaseCount < 1) {
    errors.push('Password must contain at least 1 uppercase letter');
  }

  const lowercaseCount = (password.match(/[a-z]/g) || []).length;
  if (lowercaseCount < 1) {
    errors.push('Password must contain at least 1 lowercase letter');
  }

  const numberCount = (password.match(/[0-9]/g) || []).length;
  if (numberCount < 1) {
    errors.push('Password must contain at least 1 number');
  }

  const symbolCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
  if (symbolCount < 1) {
    errors.push('Password must contain at least 1 symbol (!@#$%^&*()_+-=[]{};\':"|,.<>?/)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = { validatePassword };
