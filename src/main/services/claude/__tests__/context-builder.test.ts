import { ContextBuilder } from '../context-builder'
import type { ProjectContext } from '../types'

describe('ContextBuilder', () => {
  const createMinimalContext = (): ProjectContext => ({
    projectId: 'test-123',
    projectName: 'Test Project',
    rootPath: '/test/path',
    targetLanguage: 'TypeScript',
    generationMode: 'incremental',
    requirements: [],
    decisions: [],
    existingSpecs: [],
  })

  describe('build', () => {
    it('builds context with minimal data', () => {
      const builder = new ContextBuilder()
      const context = createMinimalContext()

      const result = builder.build(context)

      expect(result).toContain('Test Project')
      expect(result).toContain('TypeScript')
      expect(result).toContain('incremental')
      expect(result).toContain('/test/path')
    })

    it('includes requirements section when requirements exist', () => {
      const builder = new ContextBuilder()
      const context: ProjectContext = {
        ...createMinimalContext(),
        requirements: [
          { category: 'Functional', items: ['User login', 'Password reset'] },
          { category: 'Non-functional', items: ['Fast response times'] },
        ],
      }

      const result = builder.build(context)

      expect(result).toContain('## Requirements Gathered')
      expect(result).toContain('### Functional')
      expect(result).toContain('- User login')
      expect(result).toContain('- Password reset')
      expect(result).toContain('### Non-functional')
      expect(result).toContain('- Fast response times')
    })

    it('omits requirements section when no requirements', () => {
      const builder = new ContextBuilder()
      const context = createMinimalContext()

      const result = builder.build(context)

      expect(result).not.toContain('## Requirements Gathered')
    })

    it('includes decisions section when decisions exist', () => {
      const builder = new ContextBuilder()
      const context: ProjectContext = {
        ...createMinimalContext(),
        decisions: [
          { topic: 'Database', choice: 'PostgreSQL' },
          { topic: 'Frontend', choice: 'React' },
        ],
      }

      const result = builder.build(context)

      expect(result).toContain('## Decisions Made')
      expect(result).toContain('**Database:** PostgreSQL')
      expect(result).toContain('**Frontend:** React')
    })

    it('includes existing specs section when specs exist', () => {
      const builder = new ContextBuilder()
      const context: ProjectContext = {
        ...createMinimalContext(),
        existingSpecs: [
          { path: 'specs/auth.md', title: 'Authentication', status: 'complete' },
          { path: 'specs/api.md', title: 'API Design', status: 'draft' },
        ],
      }

      const result = builder.build(context)

      expect(result).toContain('## Existing Spec Files')
      expect(result).toContain('specs/auth.md: Authentication')
      expect(result).toContain('specs/api.md: API Design (draft)')
    })

    it('includes incremental mode instructions', () => {
      const builder = new ContextBuilder()
      const context: ProjectContext = {
        ...createMinimalContext(),
        generationMode: 'incremental',
      }

      const result = builder.build(context)

      expect(result).toContain('Generate one file at a time')
      expect(result).toContain('Wait for user approval')
    })

    it('includes all-at-once mode instructions', () => {
      const builder = new ContextBuilder()
      const context: ProjectContext = {
        ...createMinimalContext(),
        generationMode: 'all-at-once',
      }

      const result = builder.build(context)

      expect(result).toContain('Generate all spec files in sequence')
    })

    it('includes draft-then-refine mode instructions', () => {
      const builder = new ContextBuilder()
      const context: ProjectContext = {
        ...createMinimalContext(),
        generationMode: 'draft-then-refine',
      }

      const result = builder.build(context)

      expect(result).toContain('Generate all files as drafts')
      expect(result).toContain('[DRAFT]')
    })
  })

  describe('context size limits', () => {
    it('handles large number of requirements', () => {
      const builder = new ContextBuilder()
      const manyItems = Array.from({ length: 100 }, (_, i) => `Requirement ${i + 1}`)
      const context: ProjectContext = {
        ...createMinimalContext(),
        requirements: [{ category: 'Functional', items: manyItems }],
      }

      const result = builder.build(context)

      // Should still build successfully
      expect(result).toContain('Requirement 1')
      expect(result).toContain('Requirement 100')
    })

    it('handles large number of decisions', () => {
      const builder = new ContextBuilder()
      const manyDecisions = Array.from({ length: 50 }, (_, i) => ({
        topic: `Topic ${i + 1}`,
        choice: `Choice ${i + 1}`,
      }))
      const context: ProjectContext = {
        ...createMinimalContext(),
        decisions: manyDecisions,
      }

      const result = builder.build(context)

      expect(result).toContain('Topic 1')
      expect(result).toContain('Topic 50')
    })

    it('handles large number of specs', () => {
      const builder = new ContextBuilder()
      const manySpecs = Array.from({ length: 30 }, (_, i) => ({
        path: `specs/spec-${i + 1}.md`,
        title: `Spec ${i + 1}`,
        status: 'complete' as const,
      }))
      const context: ProjectContext = {
        ...createMinimalContext(),
        existingSpecs: manySpecs,
      }

      const result = builder.build(context)

      expect(result).toContain('spec-1.md')
      expect(result).toContain('spec-30.md')
    })

    it('context size is reasonable for typical project', () => {
      const builder = new ContextBuilder()
      const context: ProjectContext = {
        ...createMinimalContext(),
        requirements: [
          { category: 'Functional', items: ['Login', 'Logout', 'Profile'] },
          { category: 'Non-functional', items: ['Performance', 'Security'] },
        ],
        decisions: [
          { topic: 'Database', choice: 'PostgreSQL' },
          { topic: 'Auth', choice: 'JWT' },
        ],
        existingSpecs: [
          { path: 'specs/auth.md', title: 'Auth', status: 'complete' },
          { path: 'specs/api.md', title: 'API', status: 'draft' },
        ],
      }

      const result = builder.build(context)

      // A typical context should be under 4KB
      expect(result.length).toBeLessThan(4096)
    })

    it('extreme context is still under safe limits', () => {
      const builder = new ContextBuilder()
      const context: ProjectContext = {
        ...createMinimalContext(),
        requirements: Array.from({ length: 10 }, (_, i) => ({
          category: `Category ${i}`,
          items: Array.from({ length: 20 }, (_, j) => `Requirement item ${j} with some detailed description`),
        })),
        decisions: Array.from({ length: 50 }, (_, i) => ({
          topic: `Decision Topic ${i}`,
          choice: `A detailed choice explanation for decision ${i}`,
        })),
        existingSpecs: Array.from({ length: 50 }, (_, i) => ({
          path: `specs/detailed-spec-name-${i}.md`,
          title: `Detailed Specification Title ${i}`,
          status: (i % 2 === 0 ? 'complete' : 'draft') as 'complete' | 'draft',
        })),
      }

      const result = builder.build(context)

      // Even extreme context should be under 32KB (typical system prompt limit)
      expect(result.length).toBeLessThan(32768)
    })
  })

  describe('context summarization', () => {
    it('summarizes context when it exceeds max size', () => {
      const builder = new ContextBuilder({ maxSize: 2000 })
      const context: ProjectContext = {
        ...createMinimalContext(),
        requirements: Array.from({ length: 5 }, (_, i) => ({
          category: `Category ${i}`,
          items: Array.from({ length: 30 }, (_, j) => `Requirement ${j} with a detailed description that takes up space`),
        })),
        decisions: Array.from({ length: 50 }, (_, i) => ({
          topic: `Topic ${i}`,
          choice: `A detailed choice for decision ${i}`,
        })),
      }

      const result = builder.build(context)

      // Should be summarized and contain truncation notice
      expect(result).toContain('(Summary)')
      expect(result).toContain('omitted')
    })

    it('respects maxRequirementsPerCategory option', () => {
      // Use a very small maxSize to force summarization
      const builder = new ContextBuilder({ maxSize: 100, maxRequirementsPerCategory: 3 })
      const context: ProjectContext = {
        ...createMinimalContext(),
        requirements: [
          {
            category: 'Functional',
            items: ['Req 1', 'Req 2', 'Req 3', 'Req 4', 'Req 5', 'Req 6', 'Req 7'],
          },
        ],
      }

      const result = builder.build(context)

      // Should show last 3 requirements (Req 5, 6, 7) plus omission notice
      expect(result).toContain('Req 5')
      expect(result).toContain('Req 6')
      expect(result).toContain('Req 7')
      expect(result).toContain('4 earlier items omitted')
    })

    it('respects maxDecisions option', () => {
      // Use a very small maxSize to force summarization
      const builder = new ContextBuilder({ maxSize: 100, maxDecisions: 2 })
      const context: ProjectContext = {
        ...createMinimalContext(),
        decisions: [
          { topic: 'Old Decision', choice: 'Old choice' },
          { topic: 'Middle Decision', choice: 'Middle choice' },
          { topic: 'Recent Decision', choice: 'Recent choice' },
        ],
      }

      const result = builder.build(context)

      // Should show last 2 decisions
      expect(result).toContain('Recent Decision')
      expect(result).toContain('Middle Decision')
      expect(result).toContain('1 earlier decisions omitted')
    })

    it('respects maxSpecs option', () => {
      // Use a very small maxSize to force summarization
      const builder = new ContextBuilder({ maxSize: 100, maxSpecs: 2 })
      const context: ProjectContext = {
        ...createMinimalContext(),
        existingSpecs: [
          { path: 'spec1.md', title: 'Spec 1', status: 'complete' },
          { path: 'spec2.md', title: 'Spec 2', status: 'complete' },
          { path: 'spec3.md', title: 'Spec 3', status: 'draft' },
        ],
      }

      const result = builder.build(context)

      // Should show last 2 specs
      expect(result).toContain('spec2.md')
      expect(result).toContain('spec3.md')
      expect(result).toContain('1 earlier specs omitted')
    })

    it('estimateSize returns accurate size', () => {
      const builder = new ContextBuilder()
      const context = createMinimalContext()

      const size = builder.estimateSize(context)
      const actual = builder.build(context)

      expect(size).toBe(actual.length)
    })

    it('does not summarize when under max size', () => {
      const builder = new ContextBuilder({ maxSize: 50000 })
      const context: ProjectContext = {
        ...createMinimalContext(),
        requirements: [{ category: 'Functional', items: ['Single req'] }],
        decisions: [{ topic: 'Topic', choice: 'Choice' }],
      }

      const result = builder.build(context)

      // Should not contain summary indicators
      expect(result).not.toContain('(Summary)')
      expect(result).not.toContain('omitted')
    })
  })
})
