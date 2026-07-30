const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeOrganizationName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function validateOrganizationName(name: string): void {
  const normalizedName = normalizeOrganizationName(name);

  if (normalizedName.length < 2 || normalizedName.length > 120) {
    throw new Error('Organization name must be between 2 and 120 characters');
  }
}

export function validateSlug(slug: string): void {
  const normalizedSlug = normalizeSlug(slug);

  if (normalizedSlug.length < 2 || normalizedSlug.length > 80) {
    throw new Error('Organization slug must be between 2 and 80 characters');
  }

  if (!slugPattern.test(normalizedSlug)) {
    throw new Error(
      'Organization slug must contain lowercase letters, numbers, and hyphens only',
    );
  }
}
