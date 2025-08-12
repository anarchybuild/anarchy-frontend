
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateImageFile = (file: File): FileValidationResult => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: "Invalid file type. Please select an image file"
    };
  }

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return {
      isValid: false,
      error: "File too large. Please select an image smaller than 5MB"
    };
  }

  return { isValid: true };
};

export const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};
