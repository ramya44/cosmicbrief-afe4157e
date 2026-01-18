export const MIN_DATE = '1900-01-01';
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface BirthFormData {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  email: string;
  name?: string;
}

export interface ValidationOptions {
  requireAge18?: boolean;
  hasPlaceCoords: boolean;
}

export type ValidationErrors = Record<string, string>;

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function validateBirthDate(
  birthDate: string,
  options: { requireAge18?: boolean } = {}
): string | null {
  if (!birthDate) {
    return 'Please enter your birth date';
  }

  const selectedDate = new Date(birthDate);
  const minDate = new Date(MIN_DATE);
  const today = new Date();

  if (selectedDate < minDate) {
    return 'Date cannot be before 1900';
  }

  if (selectedDate > today) {
    return 'Date cannot be in the future';
  }

  if (options.requireAge18) {
    const age = calculateAge(selectedDate);
    if (age < 18) {
      return 'You must be at least 18 years old to use this service';
    }
  }

  return null;
}

export function validateBirthTime(birthTime: string): string | null {
  if (!birthTime) {
    return 'Please enter your birth time';
  }
  return null;
}

export function validateBirthPlace(
  birthPlace: string,
  hasPlaceCoords: boolean
): string | null {
  if (!birthPlace.trim()) {
    return 'Please enter your birth place';
  }
  if (!hasPlaceCoords) {
    return 'Please select a location from the dropdown to confirm coordinates';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return 'Please enter your email address';
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return null;
}

export function validateBirthForm(
  formData: BirthFormData,
  options: ValidationOptions
): ValidationErrors {
  const errors: ValidationErrors = {};

  const birthDateError = validateBirthDate(formData.birthDate, {
    requireAge18: options.requireAge18,
  });
  if (birthDateError) {
    errors.birthDate = birthDateError;
  }

  const birthTimeError = validateBirthTime(formData.birthTime);
  if (birthTimeError) {
    errors.birthTime = birthTimeError;
  }

  const birthPlaceError = validateBirthPlace(
    formData.birthPlace,
    options.hasPlaceCoords
  );
  if (birthPlaceError) {
    errors.birthPlace = birthPlaceError;
  }

  const emailError = validateEmail(formData.email);
  if (emailError) {
    errors.email = emailError;
  }

  return errors;
}

export function isFormValid(errors: ValidationErrors): boolean {
  return Object.keys(errors).length === 0;
}
