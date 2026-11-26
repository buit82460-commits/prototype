import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AiWorkspacePage } from './features/ai-workspace/AiWorkspacePage';
import { OverviewPage } from './features/overview/OverviewPage';
import { TasksPage } from './features/tasks/TasksPage';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { SchedulesPage } from './features/schedules/SchedulesPage';
import { WorkflowsPage } from './features/workflows/WorkflowsPage';
import { BrowserPage } from './features/browser/BrowserPage';
import { ResearchPage } from './features/research/ResearchPage';
import { MediaStudioPage } from './features/media/MediaStudioPage';
import { PublishingPage } from './features/publishing/PublishingPage';
import { KnowledgePage } from './features/knowledge/KnowledgePage';
import { ActivityPage } from './features/activity/ActivityPage';
import { IntegrationsPage } from './features/integrations/IntegrationsPage';
import { SettingsPage } from './features/settings/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/workspace" replace />} />
          <Route path="/workspace" element={<AiWorkspacePage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:taskId" element={<TasksPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectsPage />} />
          <Route path="/schedules" element={<SchedulesPage />} />
          <Route path="/schedules/:scheduleId" element={<SchedulesPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/workflows/:workflowId" element={<WorkflowsPage />} />
          <Route path="/browser" element={<BrowserPage />} />
          <Route path="/browser/:profileId" element={<BrowserPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/research/:researchId" element={<ResearchPage />} />
          <Route path="/media" element={<MediaStudioPage />} />
          <Route path="/media/:assetId" element={<MediaStudioPage />} />
          <Route path="/publishing" element={<PublishingPage />} />
          <Route path="/publishing/:publicationId" element={<PublishingPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/workspace" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
