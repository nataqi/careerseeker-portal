
interface ParsedQuery {
  phrases: string[];    // Terms in quotes
  andTerms: string[];   // Terms with +
  notTerms: string[];   // Terms with -
  orTerms: string[];    // Regular terms
}

export const parseSearchQuery = (query: string): ParsedQuery => {
  const result: ParsedQuery = {
    phrases: [],
    andTerms: [],
    notTerms: [],
    orTerms: []
  };

  // Extract quoted phrases
  const phraseRegex = /"([^"]+)"/g;
  let remainingQuery = query.replace(phraseRegex, (match, phrase) => {
    result.phrases.push(phrase.trim());
    return '';
  });

  // Process remaining terms
  remainingQuery.split(/\s+/).filter(Boolean).forEach(term => {
    if (term.startsWith('+')) {
      result.andTerms.push(term.slice(1).toLowerCase());
    } else if (term.startsWith('-')) {
      result.notTerms.push(term.slice(1).toLowerCase());
    } else {
      result.orTerms.push(term.toLowerCase());
    }
  });

  return result;
};

export const buildSearchQuery = (parsed: ParsedQuery): string => {
  const parts: string[] = [];

  // Add phrases in quotes
  parts.push(...parsed.phrases.map(phrase => `"${phrase}"`));

  // Add AND terms with + prefix
  if (parsed.andTerms.length > 0) {
    parts.push(...parsed.andTerms.map(term => `+${term}`));
  }

  // Add OR terms (no special prefix)
  if (parsed.orTerms.length > 0) {
    parts.push(...parsed.orTerms);
  }

  // Add NOT terms with - prefix
  parts.push(...parsed.notTerms.map(term => `-${term}`));

  return parts.join(' ');
};
