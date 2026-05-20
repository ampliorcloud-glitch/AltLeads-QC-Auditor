import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  FolderKanban, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  ChevronRight,
  HelpCircle,
  X
} from 'lucide-react';

interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdAt?: any;
}

interface ProbingQuestion {
  id: string;
  projectId: string;
  questionText: string;
  isRequired: boolean;
}

const SAMPLE_PROJECTS: ProjectData[] = [
  {
    id: 'proj_sample_1',
    name: 'Q3 B2B Tech Outreach',
    description: 'Outbound campaign targeting CTOs in mid-market SaaS companies.',
    status: 'Active',
    createdAt: new Date()
  },
  {
    id: 'proj_sample_2',
    name: 'Healthcare Inbound 2024',
    description: 'Handling inbound inquiries for our new healthcare compliance module.',
    status: 'Active',
    createdAt: new Date()
  },
  {
    id: 'proj_sample_3',
    name: 'Legacy Reactivation',
    description: 'Re-engaging churned customers from 2022-2023.',
    status: 'Inactive',
    createdAt: new Date()
  }
];

const SAMPLE_QUESTIONS: Record<string, ProbingQuestion[]> = {
  'proj_sample_1': [
    { id: 'q_1', projectId: 'proj_sample_1', questionText: 'What is your current timeline for implementing a new solution?', isRequired: true },
    { id: 'q_2', projectId: 'proj_sample_1', questionText: 'Who else is involved in the evaluation process?', isRequired: true },
    { id: 'q_3', projectId: 'proj_sample_1', questionText: 'What is the primary technical challenge you are facing right now?', isRequired: false }
  ],
  'proj_sample_2': [
    { id: 'q_4', projectId: 'proj_sample_2', questionText: 'Are you currently HIPAA compliant?', isRequired: true },
    { id: 'q_5', projectId: 'proj_sample_2', questionText: 'How many patient records do you process monthly?', isRequired: true }
  ]
};

export default function Projects() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Project Modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null);
  const [projectFormData, setProjectFormData] = useState<Partial<ProjectData>>({
    name: '',
    description: '',
    status: 'Active'
  });

  // Selected Project for details view
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [questions, setQuestions] = useState<ProbingQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Question Modal state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ProbingQuestion | null>(null);
  const [questionFormData, setQuestionFormData] = useState<Partial<ProbingQuestion>>({
    questionText: '',
    isRequired: true
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'projects'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const projectsData: ProjectData[] = [];
      querySnapshot.forEach((doc) => {
        projectsData.push({ id: doc.id, ...doc.data() } as ProjectData);
      });
      
      if (projectsData.length === 0) {
        setProjects(SAMPLE_PROJECTS);
      } else {
        setProjects(projectsData);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects(SAMPLE_PROJECTS); // Fallback to sample data on error
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (projectId: string) => {
    try {
      setQuestionsLoading(true);
      const q = query(collection(db, `projects/${projectId}/probing_questions`));
      const querySnapshot = await getDocs(q);
      const questionsData: ProbingQuestion[] = [];
      querySnapshot.forEach((doc) => {
        questionsData.push({ id: doc.id, ...doc.data() } as ProbingQuestion);
      });
      
      if (questionsData.length === 0 && SAMPLE_QUESTIONS[projectId]) {
        setQuestions(SAMPLE_QUESTIONS[projectId]);
      } else {
        setQuestions(questionsData);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      if (SAMPLE_QUESTIONS[projectId]) {
        setQuestions(SAMPLE_QUESTIONS[projectId]); // Fallback to sample data on error
      } else {
        setQuestions([]);
      }
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchQuestions(selectedProject.id);
    }
  }, [selectedProject]);

  // Project Handlers
  const handleOpenProjectModal = (project?: ProjectData) => {
    if (project) {
      setEditingProject(project);
      setProjectFormData({
        name: project.name,
        description: project.description,
        status: project.status
      });
    } else {
      setEditingProject(null);
      setProjectFormData({
        name: '',
        description: '',
        status: 'Active'
      });
    }
    setIsProjectModalOpen(true);
  };

  const handleCloseProjectModal = () => {
    setIsProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        try {
          if (!editingProject.id.startsWith('proj_sample_')) {
            const projectRef = doc(db, 'projects', editingProject.id);
            await updateDoc(projectRef, {
              name: projectFormData.name,
              description: projectFormData.description,
              status: projectFormData.status
            });
          }
        } catch (error) {
          console.warn("Firestore error, updating local state only", error);
        }
        
        const updatedProjects = projects.map(p => 
          p.id === editingProject.id ? { ...p, ...projectFormData } as ProjectData : p
        );
        setProjects(updatedProjects);
        if (selectedProject?.id === editingProject.id) {
          setSelectedProject({ ...selectedProject, ...projectFormData } as ProjectData);
        }
      } else {
        const newId = `proj_${Date.now()}`;
        const newProject = {
          id: newId,
          name: projectFormData.name,
          description: projectFormData.description,
          status: projectFormData.status,
          createdAt: new Date()
        } as ProjectData;
        
        try {
          await setDoc(doc(db, 'projects', newId), {
            name: projectFormData.name,
            description: projectFormData.description,
            status: projectFormData.status,
            createdAt: new Date()
          });
        } catch (error) {
          console.warn("Firestore error, adding to local state only", error);
        }
        
        setProjects([...projects, newProject]);
      }
      handleCloseProjectModal();
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    // We use a custom modal instead of window.confirm for better UX, but for now we'll keep it simple
    if (window.confirm("Are you sure you want to delete this project? All associated questions will be lost.")) {
      try {
        if (!id.startsWith('proj_sample_')) {
          try {
            await deleteDoc(doc(db, 'projects', id));
          } catch (error) {
            console.warn("Firestore error, deleting from local state only", error);
          }
        }
        setProjects(projects.filter(p => p.id !== id));
        if (selectedProject?.id === id) {
          setSelectedProject(null);
        }
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  // Question Handlers
  const handleOpenQuestionModal = (question?: ProbingQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionFormData({
        questionText: question.questionText,
        isRequired: question.isRequired
      });
    } else {
      setEditingQuestion(null);
      setQuestionFormData({
        questionText: '',
        isRequired: true
      });
    }
    setIsQuestionModalOpen(true);
  };

  const handleCloseQuestionModal = () => {
    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      if (editingQuestion) {
        try {
          if (!editingQuestion.id.startsWith('q_')) {
            const questionRef = doc(db, `projects/${selectedProject.id}/probing_questions`, editingQuestion.id);
            await updateDoc(questionRef, {
              questionText: questionFormData.questionText,
              isRequired: questionFormData.isRequired
            });
          }
        } catch (error) {
          console.warn("Firestore error, updating local state only", error);
        }
        
        const updatedQuestions = questions.map(q => 
          q.id === editingQuestion.id ? { ...q, ...questionFormData } as ProbingQuestion : q
        );
        setQuestions(updatedQuestions);
      } else {
        const newId = `q_new_${Date.now()}`;
        const newQuestion = {
          id: newId,
          projectId: selectedProject.id,
          questionText: questionFormData.questionText || '',
          isRequired: questionFormData.isRequired || false
        };
        
        try {
          if (!selectedProject.id.startsWith('proj_sample_')) {
            await setDoc(doc(db, `projects/${selectedProject.id}/probing_questions`, newId), {
              projectId: selectedProject.id,
              questionText: questionFormData.questionText,
              isRequired: questionFormData.isRequired
            });
          }
        } catch (error) {
          console.warn("Firestore error, adding to local state only", error);
        }
        
        setQuestions([...questions, newQuestion]);
      }
      handleCloseQuestionModal();
    } catch (error) {
      console.error("Error saving question:", error);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!selectedProject) return;
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        if (!id.startsWith('q_')) {
          try {
            await deleteDoc(doc(db, `projects/${selectedProject.id}/probing_questions`, id));
          } catch (error) {
            console.warn("Firestore error, deleting from local state only", error);
          }
        }
        setQuestions(questions.filter(q => q.id !== id));
      } catch (error) {
        console.error("Error deleting question:", error);
      }
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto flex gap-6 h-[calc(100vh-8rem)]">
      {/* Projects List Sidebar */}
      <div className={`flex flex-col bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 ${selectedProject ? 'w-1/3' : 'w-full'}`}>
        <div className="p-6 border-b border-[#F1F3F5] flex justify-between items-center bg-white">
          <h2 className="font-bold font-display text-black flex items-center gap-2 text-xl">
            <FolderKanban className="w-5 h-5 text-[#6B7280]" />
            Projects
          </h2>
          <button 
            onClick={() => handleOpenProjectModal()}
            className="p-2 bg-[#F1F3F5] text-black hover:bg-black hover:text-white rounded-xl transition-all shadow-sm"
            title="Add Project"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 border-b border-[#F1F3F5] bg-[#F8F9FA]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6B7280]" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border-none rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-black font-medium text-[#111827] placeholder:text-[#9CA3AF] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F8F9FA]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280] text-sm font-medium">
              No projects found.
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div 
                key={project.id} 
                onClick={() => setSelectedProject(project)}
                className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                  selectedProject?.id === project.id 
                    ? 'bg-black text-white shadow-md' 
                    : 'bg-white text-black hover:bg-[#F1F3F5] shadow-sm'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold font-display truncate ${selectedProject?.id === project.id ? 'text-white' : 'text-black'}`}>
                      {project.name}
                    </h3>
                    {project.status === 'Inactive' && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${selectedProject?.id === project.id ? 'bg-white/20 text-white' : 'bg-[#F1F3F5] text-[#6B7280]'}`}>
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate mt-1 font-medium ${selectedProject?.id === project.id ? 'text-white/70' : 'text-[#6B7280]'}`}>{project.description}</p>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenProjectModal(project); }}
                    className={`p-1.5 rounded-lg transition-colors ${selectedProject?.id === project.id ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-[#6B7280] hover:text-black hover:bg-[#E5E7EB]'}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                    className={`p-1.5 rounded-lg transition-colors ${selectedProject?.id === project.id ? 'text-white/70 hover:text-rose-300 hover:bg-white/20' : 'text-[#6B7280] hover:text-rose-600 hover:bg-rose-50'}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {!selectedProject && (
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF] ml-1" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Project Details & Probing Questions */}
      {selectedProject && (
        <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="p-8 border-b border-[#F1F3F5] bg-white flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-display font-bold text-black tracking-tight">{selectedProject.name}</h2>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold font-display uppercase tracking-wider ${
                  selectedProject.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F1F3F5] text-[#6B7280]'
                }`}>
                  {selectedProject.status}
                </span>
              </div>
              <p className="text-[#6B7280] font-medium">{selectedProject.description}</p>
            </div>
            <button 
              onClick={() => setSelectedProject(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F5] text-[#6B7280] hover:bg-black hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex flex-col p-8 overflow-hidden bg-[#F8F9FA]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-bold text-black flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#6B7280]" />
                Probing Questions
              </h3>
              <button 
                onClick={() => handleOpenQuestionModal()}
                className="flex items-center gap-2 bg-black hover:bg-[#1F2937] text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {questionsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                  <HelpCircle className="w-12 h-12 text-[#E5E7EB] mx-auto mb-4" />
                  <h4 className="text-lg font-display font-bold text-black">No probing questions yet</h4>
                  <p className="text-sm text-[#6B7280] mt-2 max-w-sm mx-auto font-medium">
                    Add specific questions that agents must ask during calls for this project. The AI will use these to evaluate the call.
                  </p>
                  <button 
                    onClick={() => handleOpenQuestionModal()}
                    className="mt-6 text-sm font-bold text-black hover:text-[#6B7280] transition-colors"
                  >
                    + Add first question
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div key={q.id} className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all group">
                      <div className="w-8 h-8 rounded-xl bg-[#F1F3F5] text-black flex items-center justify-center text-sm font-display font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-black font-medium">{q.questionText}</p>
                        <div className="mt-3">
                          <span className={`text-[10px] font-bold font-display uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                            q.isRequired ? 'bg-amber-50 text-amber-700' : 'bg-[#F1F3F5] text-[#6B7280]'
                          }`}>
                            {q.isRequired ? 'Required' : 'Optional'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenQuestionModal(q)}
                          className="p-2 text-[#6B7280] hover:text-black hover:bg-[#F1F3F5] rounded-xl transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-2 text-[#6B7280] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-8 py-6 flex justify-between items-center">
              <h3 className="text-2xl font-display font-bold text-black tracking-tight">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h3>
              <button onClick={handleCloseProjectModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F5] text-[#6B7280] hover:bg-black hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleProjectSubmit} className="p-8 pt-2 space-y-5">
              <div>
                <label className="block text-sm font-bold font-display text-black mb-2">Project Name</label>
                <input 
                  type="text" 
                  required
                  value={projectFormData.name}
                  onChange={(e) => setProjectFormData({...projectFormData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium text-[#111827] transition-all"
                  placeholder="e.g. Q3 B2B Tech Outreach"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold font-display text-black mb-2">Description</label>
                <textarea 
                  required
                  rows={3}
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({...projectFormData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium text-[#111827] transition-all resize-none"
                  placeholder="Brief description of the project goals..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold font-display text-black mb-2">Status</label>
                <select 
                  value={projectFormData.status}
                  onChange={(e) => setProjectFormData({...projectFormData, status: e.target.value as any})}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium text-[#111827] transition-all appearance-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={handleCloseProjectModal}
                  className="px-6 py-3 text-[#6B7280] hover:text-black hover:bg-[#F1F3F5] font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-black hover:bg-[#1F2937] text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.2)]"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-8 py-6 flex justify-between items-center">
              <h3 className="text-2xl font-display font-bold text-black tracking-tight">
                {editingQuestion ? 'Edit Question' : 'Add Probing Question'}
              </h3>
              <button onClick={handleCloseQuestionModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F5] text-[#6B7280] hover:bg-black hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleQuestionSubmit} className="p-8 pt-2 space-y-5">
              <div>
                <label className="block text-sm font-bold font-display text-black mb-2">Question Text</label>
                <textarea 
                  required
                  rows={3}
                  value={questionFormData.questionText}
                  onChange={(e) => setQuestionFormData({...questionFormData, questionText: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F8F9FA] border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-medium text-[#111827] transition-all resize-none"
                  placeholder="e.g. What is your current timeline for implementing a solution?"
                />
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-[#F8F9FA] rounded-xl">
                <input 
                  type="checkbox" 
                  id="isRequired"
                  checked={questionFormData.isRequired}
                  onChange={(e) => setQuestionFormData({...questionFormData, isRequired: e.target.checked})}
                  className="w-5 h-5 text-black rounded border-gray-300 focus:ring-black"
                />
                <label htmlFor="isRequired" className="text-sm font-bold font-display text-black cursor-pointer">
                  This question is mandatory
                </label>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={handleCloseQuestionModal}
                  className="px-6 py-3 text-[#6B7280] hover:text-black hover:bg-[#F1F3F5] font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-black hover:bg-[#1F2937] text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.2)]"
                >
                  {editingQuestion ? 'Save Changes' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
