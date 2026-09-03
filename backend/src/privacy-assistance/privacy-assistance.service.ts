import { Injectable } from '@nestjs/common';

export interface LeakFinding {
  type: 'JOB_TITLE' | 'SOLITARY_PHRASE' | 'LOCATION' | 'TEAM_NAME' | 'EMAIL' | 'PHONE';
  match: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestion: string;
}

export interface LeakCheckResult {
  hasLeak: boolean;
  score: number; // 0 to 100 (0 = safe, 100 = very high leak risk)
  findings: LeakFinding[];
}

@Injectable()
export class PrivacyAssistanceService {
  private jobTitles = [
    'principal engineer', 'staff engineer', 'vp of engineering', 'vp engineering',
    'chief technology officer', 'cto', 'chief executive officer', 'ceo',
    'head of product', 'lead recruiter', 'director of engineering', 'engineering manager',
    'senior director', 'general manager', 'country manager', 'scrum master',
    'devops lead', 'chief marketing officer', 'cmo', 'cfo', 'chief financial officer',
  ];

  private solitaryPhrases = [
    'i am the only', "i'm the only", 'only one who', 'sole developer',
    'only developer', 'only engineer', 'the sole person', 'only female in',
    'only guy in', 'single handedly', 'single-handedly', 'only employee in',
  ];

  private locations = [
    'surabaya branch', 'jakarta office', 'singapore hq', 'bali hub',
    'sydney office', 'london branch', 'tokyo hub', 'remote from bandung',
    'building b floor 4', '5th floor', '4th floor', '3rd floor',
  ];

  private teamNames = [
    'core infra team', 'growth squad', 'checkout squad', 'billing pod',
    'alpha team', 'platform ops', 'security team lead', 'data platform team',
  ];

  checkText(text: string): LeakCheckResult {
    const findings: LeakFinding[] = [];
    const lower = text.toLowerCase();

    // 1. Job Titles
    for (const title of this.jobTitles) {
      const regex = new RegExp(`\\b${title}\\b`, 'i');
      if (regex.test(lower)) {
        findings.push({
          type: 'JOB_TITLE',
          match: title,
          severity: 'HIGH',
          suggestion: `Avoid specific job title "${title}". Use generic terms like "engineer" or "contributor".`,
        });
      }
    }

    // 2. Solitary phrases
    for (const phrase of this.solitaryPhrases) {
      if (lower.includes(phrase)) {
        findings.push({
          type: 'SOLITARY_PHRASE',
          match: phrase,
          severity: 'HIGH',
          suggestion: `Phrase "${phrase}" uniquely identifies you. Rephrase more generally.`,
        });
      }
    }

    // 3. Locations
    for (const loc of this.locations) {
      if (lower.includes(loc)) {
        findings.push({
          type: 'LOCATION',
          match: loc,
          severity: 'MEDIUM',
          suggestion: `Location detail "${loc}" narrows down your identity. Remove or generalize.`,
        });
      }
    }

    // 4. Team names
    for (const team of this.teamNames) {
      if (lower.includes(team)) {
        findings.push({
          type: 'TEAM_NAME',
          match: team,
          severity: 'MEDIUM',
          suggestion: `Specific team "${team}" can deanonymize you in small organizations.`,
        });
      }
    }

    // 5. Raw email patterns
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatch) {
      for (const email of emailMatch) {
        findings.push({
          type: 'EMAIL',
          match: email,
          severity: 'HIGH',
          suggestion: 'Email address detected. Never post contact information.',
        });
      }
    }

    // Calculate risk score
    let score = 0;
    for (const f of findings) {
      score += f.severity === 'HIGH' ? 35 : f.severity === 'MEDIUM' ? 20 : 10;
    }
    score = Math.min(100, score);

    return {
      hasLeak: findings.length > 0,
      score,
      findings,
    };
  }
}
