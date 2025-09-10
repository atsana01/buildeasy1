import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Project {
  id: string;
  project_name: string | null;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

interface ProjectTabsProps {
  activeProjectId: string | null;
  onProjectChange: (projectId: string) => void;
  children: (projectId: string) => React.ReactNode;
}

export const ProjectTabsFixed: React.FC<ProjectTabsProps> = ({ 
  activeProjectId, 
  onProjectChange, 
  children 
}) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    
    try {
      // Use a simple query without TypeScript strict typing
      const response = await supabase
        .rpc('get_user_projects', { user_id: user.id })
        .then(() => null)
        .catch(() => null);

      // Fallback to direct query with any typing
      const { data, error } = await (supabase as any)
        .from('projects')
        .select('id, project_name, title, description, status, created_at')
        .eq('client_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }
      
      setProjects(data || []);
      
      // If no active project selected, select the first one
      if (!activeProjectId && data && data.length > 0) {
        onProjectChange(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!user || !newProjectName.trim()) return;

    try {
      const { data, error } = await (supabase as any)
        .from('projects')
        .insert({
          client_id: user.id,
          project_name: newProjectName.trim(),
          title: newProjectName.trim(),
          description: '',
          status: 'draft',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      await fetchProjects();
      onProjectChange(data.id);
      setNewProjectName('');
      setShowNewProjectDialog(false);
      
      toast({
        title: "Success",
        description: "New project created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    if (!newName.trim()) return;

    try {
      const { error } = await (supabase as any)
        .from('projects')
        .update({ 
          project_name: newName.trim(),
          title: newName.trim()
        })
        .eq('id', projectId)
        .eq('client_id', user?.id);

      if (error) throw error;

      await fetchProjects();
      setEditingProject(null);
      
      toast({
        title: "Success",
        description: "Project renamed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to rename project",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-4">Loading projects...</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No projects yet</p>
        <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject}>
                  Create Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Tabs value={activeProjectId || undefined} onValueChange={onProjectChange}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="flex-1 mr-4">
            {projects.map((project) => (
              <TabsTrigger key={project.id} value={project.id} className="group relative">
                {editingProject === project.id ? (
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-6 text-xs px-1"
                      onBlur={() => {
                        if (editName.trim()) {
                          handleRenameProject(project.id, editName);
                        } else {
                          setEditingProject(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameProject(project.id, editName);
                        } else if (e.key === 'Escape') {
                          setEditingProject(null);
                        }
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <span>{project.project_name || project.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project.id);
                        setEditName(project.project_name || project.title);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject}>
                    Create Project
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {projects.map((project) => (
          <TabsContent key={project.id} value={project.id}>
            {children(project.id)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};