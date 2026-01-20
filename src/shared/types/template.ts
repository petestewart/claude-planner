/**
 * Template metadata for display
 */
export interface TemplateInfo {
  id: string
  name: string
  description: string
  category: string
  builtIn: boolean
}

/**
 * Full template with content
 */
export interface Template extends TemplateInfo {
  files: TemplateFile[]
  variables: TemplateVariable[]
}

export interface TemplateFile {
  path: string
  content: string
}

export interface TemplateVariable {
  name: string
  description: string
  default?: string
  required: boolean
}
