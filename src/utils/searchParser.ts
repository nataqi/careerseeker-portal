
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
      result.andTerms.push(term.slice(1));
    } else if (term.startsWith('-')) {
      result.notTerms.push(term.slice(1));
    } else {
      result.orTerms.push(term);
    }
  });

  return result;
};

export const buildSearchQuery = (parsed: ParsedQuery): string => {
  const parts: string[] = [];

  // Add phrases in quotes
  parts.push(...parsed.phrases.map(phrase => `"${phrase}"`));

  // Add AND terms
  if (parsed.andTerms.length > 0) {
    parts.push(parsed.andTerms.join(' AND '));
  }

  // Add OR terms
  if (parsed.orTerms.length > 0) {
    parts.push(parsed.orTerms.join(' OR '));
  }

  // Add NOT terms
  parts.push(...parsed.notTerms.map(term => `-${term}`));

  return parts.join(' ');
};
