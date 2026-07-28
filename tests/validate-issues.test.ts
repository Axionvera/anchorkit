import { describe, it, expect } from 'vitest';
import { validateIssue } from '../scripts/validate-issues.mts';

describe('validateIssue', () => {
  it('should pass for a valid issue', () => {
    const validIssue = {
      title: 'Fix login bug',
      description: 'Users cannot log in when using Safari.',
      labels: ['bug'],
      complexity: 'high',
      acceptanceCriteria: ['Users can log in using Safari on iOS and macOS'],
    };

    const result = validateIssue(validIssue);
    expect(result.success).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should fail if missing required fields', () => {
    const invalidIssue = {
      title: 'Missing stuff',
      // description is missing
      labels: ['bug'],
      complexity: 'medium',
      acceptanceCriteria: ['This is criteria'],
    };

    const result = validateIssue(invalidIssue);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('description: Required');
  });

  it('should fail if using unsupported labels', () => {
    const invalidIssue = {
      title: 'Unsupported label',
      description: 'Has a bad label',
      labels: ['invalid-label'],
      complexity: 'low',
      acceptanceCriteria: ['This is criteria'],
    };

    const result = validateIssue(invalidIssue);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('labels: Contains unsupported labels');
  });

  it('should fail if complexity is invalid', () => {
    const invalidIssue = {
      title: 'Invalid complexity',
      description: 'Has bad complexity',
      labels: ['enhancement'],
      complexity: 'trivial', // not allowed
      acceptanceCriteria: ['This is criteria'],
    };

    const result = validateIssue(invalidIssue);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('complexity: Complexity must be low, medium, high, or expert');
  });

  it('should fail if acceptance criteria are weak', () => {
    const invalidIssue = {
      title: 'Weak criteria',
      description: 'Has weak criteria',
      labels: ['enhancement'],
      complexity: 'low',
      acceptanceCriteria: ['too short'],
    };

    const result = validateIssue(invalidIssue);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('acceptanceCriteria: Weak acceptance criteria detected (must be > 10 characters)');
  });
});
