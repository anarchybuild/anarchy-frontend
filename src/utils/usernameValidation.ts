
export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
  if (!username) {
    return { isValid: false, error: "Username is required" };
  }
  
  if (username.length > 15) {
    return { isValid: false, error: "Username must be 15 characters or less" };
  }
  
  // Check for alphanumeric characters and underscores only
  const validPattern = /^[a-zA-Z0-9_]+$/;
  if (!validPattern.test(username)) {
    return { isValid: false, error: "Username can only contain letters, numbers, and underscores" };
  }
  
  return { isValid: true };
};
