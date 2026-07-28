import fs from 'node:fs';
import path from 'node:path';

const ALLOWED_LABELS = [
  'bug',
  'enhancement',
  'documentation',
  'good first issue',
  'help wanted',
  'feature',
];

const ALLOWED_COMPLEXITIES = ['low', 'medium', 'high', 'expert'];

export interface Issue {
  title: string;
  description: string;
  labels: string[];
  complexity: 'low' | 'medium' | 'high' | 'expert';
  acceptanceCriteria: string[];
}

export function validateIssue(data: unknown): { success: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return { success: false, errors: ['Issue payload must be an object'] };
  }

  const issue = data as Record<string, unknown>;

  if (typeof issue.title !== 'string' || issue.title.trim().length === 0) {
    errors.push('title: Required');
  }

  if (typeof issue.description !== 'string' || issue.description.trim().length === 0) {
    errors.push('description: Required');
  }

  if (!Array.isArray(issue.labels) || issue.labels.length === 0) {
    errors.push('labels: At least one label is required');
  } else {
    const hasUnsupported = issue.labels.some(
      (label) => typeof label !== 'string' || !ALLOWED_LABELS.includes(label)
    );
    if (hasUnsupported) {
      errors.push('labels: Contains unsupported labels');
    }
  }

  if (
    typeof issue.complexity !== 'string' ||
    !ALLOWED_COMPLEXITIES.includes(issue.complexity)
  ) {
    errors.push('complexity: Complexity must be low, medium, high, or expert');
  }

  if (!Array.isArray(issue.acceptanceCriteria) || issue.acceptanceCriteria.length === 0) {
    errors.push('acceptanceCriteria: At least one acceptance criteria is required');
  } else {
    const hasWeak = issue.acceptanceCriteria.some(
      (criterion) => typeof criterion !== 'string' || criterion.trim().length <= 10
    );
    if (hasWeak) {
      errors.push('acceptanceCriteria: Weak acceptance criteria detected (must be > 10 characters)');
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true };
}

async function run() {
  const issuesDir = path.join(process.cwd(), 'issues');
  
  if (!fs.existsSync(issuesDir)) {
    console.warn(`Issues directory not found at ${issuesDir}`);
    process.exit(0);
  }

  const files = fs.readdirSync(issuesDir).filter(f => f.endsWith('.json'));
  let hasErrors = false;

  for (const file of files) {
    const filePath = path.join(issuesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch (e) {
      console.error(`❌ [${file}] Invalid JSON formatting`);
      hasErrors = true;
      continue;
    }

    const { success, errors } = validateIssue(json);
    
    if (success) {
      console.log(`✅ [${file}] Valid issue`);
    } else {
      console.error(`❌ [${file}] Validation failed:`);
      errors?.forEach(err => console.error(`   - ${err}`));
      hasErrors = true;
    }
  }

  if (hasErrors) {
    process.exit(1);
  } else {
    console.log('All issues are valid!');
  }
}

// Run script directly when executed via CLI
if (process.argv[1] && process.argv[1].includes('validate-issues')) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
