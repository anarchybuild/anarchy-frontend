
export interface DisplayNameValidation {
  isValid: boolean;
  error?: string;
}

export const validateDisplayName = (displayName: string): DisplayNameValidation => {
  // Allow empty display name
  if (!displayName || displayName.trim() === '') {
    return { isValid: true };
  }

  const trimmedDisplayName = displayName.trim();

  // Check length
  if (trimmedDisplayName.length > 15) {
    return {
      isValid: false,
      error: "Display name must be 15 characters or less"
    };
  }

  // Check format (letters, numbers, underscores only)
  const validFormat = /^[a-zA-Z0-9_]+$/.test(trimmedDisplayName);
  if (!validFormat) {
    return {
      isValid: false,
      error: "Display name can only contain letters, numbers, and underscores"
    };
  }

  return { isValid: true };
};
