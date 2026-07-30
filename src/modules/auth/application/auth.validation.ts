export function validateIdToken(idToken: string): void {
  if (idToken.trim().length < 10) {
    throw new Error('firebase id token is invalid');
  }
}

export function splitDisplayName(displayName: string | null): {
  firstName: string;
  lastName: string;
} {
  const normalizedDisplayName = displayName?.trim().replace(/\s+/g, ' ');

  if (!normalizedDisplayName) {
    return {
      firstName: 'Helix',
      lastName: 'User',
    };
  }

  const [firstName, ...lastNameParts] = normalizedDisplayName.split(' ');

  return {
    firstName,
    lastName: lastNameParts.join(' ') || 'User',
  };
}
