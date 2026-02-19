export interface SensitiveMatch {
  type: string;
  match: string;
}

interface PatternDef {
  type: string;
  regex: RegExp;
}

const SENSITIVE_PATTERNS: PatternDef[] = [
  {
    type: "Email Address",
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  },
  {
    type: "Phone Number",
    regex: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  },
  {
    type: "SSN",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    type: "Credit Card",
    regex: /\b(?:\d[ -]*?){13,19}\b/g,
  },
  {
    type: "API Key",
    regex: /\b(?:sk-|pk-|api_|key-|token-|bearer\s+)[a-zA-Z0-9_\-]{8,}/gi,
  },
];

function maskValue(value: string): string {
  if (value.length <= 6) return "***";
  const visibleStart = Math.min(3, Math.floor(value.length / 4));
  const visibleEnd = Math.min(2, Math.floor(value.length / 5));
  return (
    value.slice(0, visibleStart) +
    "***" +
    value.slice(value.length - visibleEnd)
  );
}

export function detectSensitiveInfo(text: string): SensitiveMatch[] {
  const matches: SensitiveMatch[] = [];
  const seen = new Set<string>();

  for (const pattern of SENSITIVE_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let result: RegExpExecArray | null;
    while ((result = pattern.regex.exec(text)) !== null) {
      const raw = result[0].trim();
      const key = `${pattern.type}:${raw}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({ type: pattern.type, match: maskValue(raw) });
      }
    }
  }

  return matches;
}
