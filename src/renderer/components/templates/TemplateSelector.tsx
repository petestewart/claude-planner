import type { ReactElement } from 'react'
import { useState, useMemo, useCallback } from 'react'
import type { TemplateInfo, TemplateCategory } from '../../../shared/types/template'
import styles from './templates.module.css'

interface TemplateSelectorProps {
  /** List of templates to display */
  templates: TemplateInfo[]
  /** Currently selected template ID */
  selectedId: string | null
  /** Callback when a template is selected */
  onSelect: (templateId: string) => void
  /** Callback to open template manager */
  onManageTemplates: () => void
  /** Optional loading state */
  isLoading?: boolean
}

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  'web-app': 'Web App',
  'cli-tool': 'CLI Tool',
  'library': 'Library',
  'api-service': 'API Service',
  'mobile-app': 'Mobile App',
  'desktop-app': 'Desktop App',
  'other': 'Other',
}

const CATEGORY_ICONS: Record<TemplateCategory, string> = {
  'web-app': '🌐',
  'cli-tool': '⌨️',
  'library': '📦',
  'api-service': '🔌',
  'mobile-app': '📱',
  'desktop-app': '🖥️',
  'other': '📄',
}

/**
 * TemplateSelector - Card grid showing available templates
 *
 * Features:
 * - Built-in templates first, custom templates section
 * - Filter by category/tags
 * - "Manage Templates" button
 */
export function TemplateSelector({
  templates,
  selectedId,
  onSelect,
  onManageTemplates,
  isLoading = false,
}: TemplateSelectorProps): ReactElement {
  const [filterCategory, setFilterCategory] = useState<TemplateCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Get unique categories from templates
  const categories = useMemo(() => {
    const cats = new Set<TemplateCategory>()
    templates.forEach((t) => cats.add(t.category))
    return Array.from(cats)
  }, [templates])

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Category filter
      if (filterCategory !== 'all' && template.category !== filterCategory) {
        return false
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = template.name.toLowerCase().includes(query)
        const matchesDesc = template.description.toLowerCase().includes(query)
        const matchesTags = template.tags.some((tag) =>
          tag.toLowerCase().includes(query)
        )
        if (!matchesName && !matchesDesc && !matchesTags) {
          return false
        }
      }
      return true
    })
  }, [templates, filterCategory, searchQuery])

  // Separate built-in and custom templates
  const { builtInTemplates, customTemplates } = useMemo(() => {
    const builtIn = filteredTemplates.filter((t) => t.isBuiltIn)
    const custom = filteredTemplates.filter((t) => !t.isBuiltIn)
    return { builtInTemplates: builtIn, customTemplates: custom }
  }, [filteredTemplates])

  const handleTemplateClick = useCallback(
    (templateId: string) => {
      onSelect(templateId)
    },
    [onSelect]
  )

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilterCategory(e.target.value as TemplateCategory | 'all')
    },
    []
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
    },
    []
  )

  if (isLoading) {
    return (
      <div className={styles.templateSelector}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <span>Loading templates...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.templateSelector}>
      {/* Header with filters */}
      <div className={styles.selectorHeader}>
        <h2 className={styles.selectorTitle}>Choose a Template</h2>
        <div className={styles.selectorFilters}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search templates..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
          <select
            className={styles.categoryFilter}
            value={filterCategory}
            onChange={handleCategoryChange}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.manageButton}
            onClick={onManageTemplates}
          >
            Manage Templates
          </button>
        </div>
      </div>

      {/* Template grid */}
      <div className={styles.templateGrid}>
        {/* Built-in templates section */}
        {builtInTemplates.length > 0 && (
          <div className={styles.templateSection}>
            <h3 className={styles.sectionTitle}>Built-in Templates</h3>
            <div className={styles.cardGrid}>
              {builtInTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedId === template.id}
                  onClick={() => handleTemplateClick(template.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Custom templates section */}
        {customTemplates.length > 0 && (
          <div className={styles.templateSection}>
            <h3 className={styles.sectionTitle}>Custom Templates</h3>
            <div className={styles.cardGrid}>
              {customTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedId === template.id}
                  onClick={() => handleTemplateClick(template.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredTemplates.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📭</span>
            <p className={styles.emptyText}>
              {searchQuery || filterCategory !== 'all'
                ? 'No templates match your filters'
                : 'No templates available'}
            </p>
            {(searchQuery || filterCategory !== 'all') && (
              <button
                type="button"
                className={styles.clearFiltersButton}
                onClick={() => {
                  setSearchQuery('')
                  setFilterCategory('all')
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: TemplateInfo
  isSelected: boolean
  onClick: () => void
}

function TemplateCard({
  template,
  isSelected,
  onClick,
}: TemplateCardProps): ReactElement {
  return (
    <button
      type="button"
      className={`${styles.templateCard} ${isSelected ? styles['templateCard--selected'] : ''}`}
      onClick={onClick}
    >
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon}>
          {CATEGORY_ICONS[template.category]}
        </span>
        {template.isBuiltIn && (
          <span className={styles.builtInBadge}>Built-in</span>
        )}
      </div>
      <div className={styles.cardContent}>
        <h4 className={styles.cardTitle}>{template.name}</h4>
        <p className={styles.cardDescription}>{template.description}</p>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.categoryBadge}>
          {CATEGORY_LABELS[template.category]}
        </span>
        {template.tags.length > 0 && (
          <div className={styles.tagList}>
            {template.tags.slice(0, 2).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
            {template.tags.length > 2 && (
              <span className={styles.tagMore}>+{template.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
      {isSelected && (
        <div className={styles.selectedIndicator}>
          <span>✓</span>
        </div>
      )}
    </button>
  )
}
