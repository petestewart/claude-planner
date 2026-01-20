import type { ReactElement } from 'react'
import { useCallback } from 'react'
import { Toolbar } from './components/layout/Toolbar'
import { MainLayout } from './components/layout/MainLayout'
import { StatusBar } from './components/layout/StatusBar'
import { NewProjectWizard } from './components/templates'
import type { NewProjectConfig } from './components/templates'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useLayoutStore } from './stores/layoutStore'
import { useProjectStore } from './stores/projectStore'
import { useFileStore } from './stores/fileStore'

export function App(): ReactElement {
  useKeyboardShortcuts()

  const newProjectWizardOpen = useLayoutStore((state) => state.newProjectWizardOpen)
  const closeNewProjectWizard = useLayoutStore((state) => state.closeNewProjectWizard)
  const createProject = useProjectStore((state) => state.createProject)
  const setTemplateId = useProjectStore((state) => state.setTemplateId)
  const setRootPath = useFileStore((state) => state.setRootPath)

  const handleProjectCreate = useCallback(
    (config: NewProjectConfig) => {
      // Create the project with the selected template
      createProject(config.folderPath, config.template.name)
      setTemplateId(config.templateId)
      // Set the file browser root path
      void setRootPath(config.folderPath)
    },
    [createProject, setTemplateId, setRootPath]
  )

  return (
    <div className="app">
      <Toolbar />
      <MainLayout />
      <StatusBar />
      <NewProjectWizard
        isOpen={newProjectWizardOpen}
        onClose={closeNewProjectWizard}
        onProjectCreate={handleProjectCreate}
      />
    </div>
  )
}
