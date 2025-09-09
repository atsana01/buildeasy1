import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import EnhancedQuestionnaireForm from '@/components/EnhancedQuestionnaireForm';
import ServiceGroups from '@/components/ServiceGroups';
import { AuthButton } from '@/components/AuthButton';
import { AuthModal } from '@/components/AuthModal';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useQuoteForm } from '@/contexts/QuoteFormContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Home, Users, Zap, ChevronRight } from 'lucide-react';
import { getRandomExamples } from '@/data/projectExamples';
import { TypingAnimation } from '@/components/TypingAnimation';
const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentStep, 
    setCurrentStep, 
    projectData, 
    setProjectData, 
    selectedTickets, 
    setSelectedTickets,
    setWasRedirectedFromAuth,
    setRedirectPath
  } = useQuoteForm();
  const [animatedText, setAnimatedText] = useState('Modern family house');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentExamples, setCurrentExamples] = useState(() => getRandomExamples(3));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExamples(getRandomExamples(3));
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedText(getRandomExamples(1)[0]);
    }, 7000);

    return () => clearInterval(interval);
  }, []);
  const handleProjectSubmit = () => {
    if (projectData.description.trim()) {
      setCurrentStep('questionnaire');
    }
  };
  const handleQuestionnaireComplete = (data: any) => {
    setProjectData({
      ...projectData,
      formData: data,
      serviceGroups: data.serviceGroups
    });
    setCurrentStep('services');
  };
  const handleVendorSelect = async (groupName: string, vendor: any) => {
    // Check if user is authenticated before allowing vendor selection
    if (!user) {
      // Store current progress and show auth modal
      setWasRedirectedFromAuth(true);
      setRedirectPath('/');
      setShowAuthModal(true);
      return;
    }

    try {
      // First, create or get the project
      let projectId = projectData.id;
      
      if (!projectId) {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            client_id: user.id,
            title: projectData.description.substring(0, 100),
            description: projectData.description,
            service_groups: projectData.serviceGroups,
            form_data: projectData.formData,
            status: 'active'
          })
          .select()
          .single();

        if (projectError) throw projectError;
        
        projectId = project.id;
        setProjectData({
          ...projectData,
          id: projectId
        });
      }

      // Create the quote request
      const { data: quoteRequest, error: quoteError } = await supabase
        .from('quote_requests')
        .insert({
          project_id: projectId,
          client_id: user.id,
          vendor_id: vendor.id,
          status: 'pending'
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create local ticket for immediate UI update
      const ticket = {
        id: quoteRequest.id,
        groupName,
        vendor,
        projectDescription: projectData.description,
        formData: projectData.formData,
        status: 'pending' as const,
        createdAt: new Date()
      };
      
      setSelectedTickets([...selectedTickets, ticket]);
      
      toast({
        title: "Quote Request Sent",
        description: `Your request has been sent to ${vendor.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send quote request",
        variant: "destructive",
      });
    }
  };
  const handleStartOver = () => {
    setCurrentStep('initial');
    setProjectData({
      description: ''
    });
    setSelectedTickets([]);
  };
  if (currentStep === 'questionnaire') {
    return <div className="min-h-screen bg-gradient-hero py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Button variant="ghost" onClick={handleStartOver} className="mb-4">
              ← Back to Start
            </Button>
            <h1 className="text-3xl font-bold mb-4">Let's Get More Details</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI needs a few more details to match you with the perfect professionals for: 
              <span className="italic block mt-2 text-foreground">"{projectData.description}"</span>
            </p>
          </div>
          
          <EnhancedQuestionnaireForm projectDescription={projectData.description} onComplete={handleQuestionnaireComplete} />
        </div>
      </div>;
  }
  if (currentStep === 'services') {
    return <div className="min-h-screen bg-background py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <Button variant="ghost" onClick={handleStartOver} className="mb-4">
              ← Start New Project
            </Button>
          </div>
          
          <ServiceGroups 
            serviceGroups={projectData.serviceGroups || []} 
            onVendorSelect={handleVendorSelect}
            projectDescription={projectData.description}
            formData={projectData.formData}
          />
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-8 pb-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Header with Auth Buttons */}
          <div className="flex items-center justify-between w-full mb-16">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/569809aa-baff-4dfd-a37e-09697c885f6d.png" alt="BuildEasy Logo" className="h-24 w-auto object-contain" />
            </div>
            
            {/* Single Login/Signup Button */}
            {!user ? (
              <Button onClick={() => setShowAuthModal(true)} variant="outline">
                Login / Sign Up
              </Button>
            ) : (
              <AuthButton />
            )}
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              I want to build
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                <TypingAnimation text=" anything" duration={2000} />
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Describe your dream project and let our AI connect you with the perfect professionals to make it happen.
            </p>
          </div>

          {/* Main Input Area */}
          <Card className="max-w-3xl mx-auto shadow-elegant bg-transparent backdrop-blur-sm border border-white/20">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Textarea 
                    placeholder={`I want a ${animatedText}...`}
                    value={projectData.description} 
                    onChange={e => setProjectData({
                      ...projectData,
                      description: e.target.value
                    })} 
                    className="min-h-[120px] text-lg resize-none border-2 focus:border-primary" 
                  />
                </div>
                
                {/* Example Projects - moved here */}
                  <div className="text-center">
                  <h2 className="text-lg font-semibold mb-3">Try these examples:</h2>
                  <div className="flex flex-wrap justify-center gap-2">
                    {currentExamples.map((example, index) => (
                      <Button 
                        key={`${example}-${index}`} 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setProjectData({
                          ...projectData,
                          description: example
                        })} 
                        className="text-xs hover:border-primary hover:text-primary"
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button onClick={handleProjectSubmit} disabled={!projectData.description.trim()} size="sm" className="bg-gradient-primary border-0 px-6">
                    Build
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
            <Card className="text-center p-6 shadow-card hover:shadow-elegant transition-shadow">
              <CardContent className="pt-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Smart Matching</h3>
                <p className="text-muted-foreground text-sm">
                  Our intelligent system analyzes your project and matches you with the most suitable professionals.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 shadow-card hover:shadow-elegant transition-shadow">
              <CardContent className="pt-4">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Vetted Professionals</h3>
                <p className="text-muted-foreground text-sm">
                  Connect with verified architects, contractors, and specialists who deliver quality work.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 shadow-card hover:shadow-elegant transition-shadow">
              <CardContent className="pt-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Fast Quotes</h3>
                <p className="text-muted-foreground text-sm">
                  Receive competitive quotes from multiple providers within 24 hours of your request.
                </p>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        userType="client"
        onSuccess={() => {
          setShowAuthModal(false);
          // Continue with the vendor selection process
        }}
      />
    </div>;
};
export default Index;