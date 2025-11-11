export function getRootDomain(url: string): string | null {
  try {
    // Normalize and parse the URL
    const { hostname } = new URL(url);

    // Split the hostname into parts
    const parts = hostname.split('.').filter(Boolean);

    // Handle cases like "localhost" or IP addresses
    if (parts.length <= 1) return hostname;

    // Handle country code top-level domains (ccTLDs) like ".co.uk" or ".com.au"
    const commonSecondLevelTLDs = new Set([
      'co.uk',
      'org.uk',
      'gov.uk',
      'ac.uk',
      'com.au',
      'net.au',
      'org.au',
      'co.nz',
      'org.nz',
      'gov.nz',
      'co.jp',
      'ne.jp',
    ]);

    const lastTwo = parts.slice(-2).join('.');
    const lastThree = parts.slice(-3).join('.');

    if (commonSecondLevelTLDs.has(lastTwo)) {
      return parts.slice(-3).join('.');
    } else if (commonSecondLevelTLDs.has(lastThree)) {
      return parts.slice(-4).join('.');
    } else {
      return parts.slice(-2).join('.');
    }
  } catch {
    return null; // Invalid URL
  }
}
