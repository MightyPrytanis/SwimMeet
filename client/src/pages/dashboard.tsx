import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getConversationResponses, submitQuery } from "@/lib/api";
import { getProviderDisplayName, AIProviderIcon } from "@/components/ai-provider-icons";
import { createTruthfulnessPrompt } from "@/components/truthfulness-standards";
import { HelpContent } from "@/components/help-content";
import QueryInput from "@/components/query-input";
import ResponseGrid from "@/components/response-grid";
import { ResponseCard } from "@/components/response-card";

import ConversationHistory from "@/components/conversation-history";
import CredentialsModal from "@/components/credentials-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// Removed unused import
import { Button } from "@/components/ui/button";
import { SimpleTabs, SimpleTabsContent, SimpleTabsList, SimpleTabsTrigger } from "@/components/simple-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, History, MessageSquare, Search, Users, HelpCircle, Play, BookOpen, Waves } from "lucide-react";
import type { AIResponse } from "@shared/schema";
import { EventDiagnostic } from "@/components/event-diagnostic";
import SimpleTest from "@/components/simple-test";
import { RawHtmlTest } from "@/components/raw-html-test";
import { AwardButton } from "@/components/award-button";
import { ActionDropdown } from "@/components/action-dropdown";
import { ModeSelector } from "@/components/mode-selector";
import { BulkActions } from "@/components/bulk-actions";

export default function Dashboard() {
  const [selectedAIs, setSelectedAIs] = useState<string[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dive");
  const [awards, setAwards] = useState<Record<string, string>>({});
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const { toast } = useToast();

  // Award handler following the roadmap pattern
  const handleAward = useCallback((responseId: string, awardType: string) => {
    console.log('Award handler called:', responseId, awardType);
    
    // Update state
    setAwards(prev => ({
      ...prev,
      [responseId]: awardType
    }));
    
    // Persist to localStorage
    localStorage.setItem('swim-meet-awards', JSON.stringify({
      ...JSON.parse(localStorage.getItem('swim-meet-awards') || '{}'),
      [responseId]: { type: awardType, timestamp: Date.now() }
    }));
  }, []);

  // Action handler for dropdowns
  const handleAction = useCallback((responseId: string, action: string) => {
    console.log(`Action ${action} on response ${responseId}`);
    
    if (action === 'fact-check') {
      // Implement fact check
      toast({ title: "Fact Check", description: `Starting fact check for response ${responseId}` });
    } else if (action === 'humanize') {
      // Implement humanize
      toast({ title: "Humanize", description: `Humanizing response ${responseId}` });
    } else if (action === 'reply') {
      // Implement reply
      toast({ title: "Reply", description: `Generating reply for response ${responseId}` });
    }
  }, [toast]);

  // Mode change handler
  const handleModeChange = useCallback((newMode: string) => {
    console.log('Mode changing to:', newMode);
    setActiveTab(newMode);
  }, []);

  // Bulk action handler
  const handleBulkAction = useCallback((action: string, selectedResponses: string[]) => {
    console.log(`Bulk action ${action} on:`, selectedResponses);
    toast({ 
      title: "Bulk Action", 
      description: `${action} on ${selectedResponses.length} responses` 
    });
  }, [toast]);

  // Poll for response updates when we have a conversation
  const { data: latestResponses } = useQuery({
    queryKey: ['/api/conversations', currentConversationId, 'responses'],
    queryFn: () => getConversationResponses(currentConversationId!),
    enabled: !!currentConversationId,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Update responses when new data comes in
  useEffect(() => {
    if (latestResponses) {
      setResponses(latestResponses);
    }
  }, [latestResponses]);

  const handleQuerySubmit = async (query: string) => {
    if (selectedAIs.length === 0) {
      toast({
        title: "No AIs Selected",
        description: "Please select at least one AI model",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setCurrentQuery(query); // Store the current query for fact-checking and replies
    try {
      const result = await submitQuery(query, selectedAIs);
      setCurrentConversationId(result.conversationId);
      setResponses(result.responses);
      
      toast({
        title: "Query Submitted",
        description: `Sent to ${selectedAIs.length} AI${selectedAIs.length === 1 ? '' : 's'}`,
      });
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit query",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFactCheck = (response: AIResponse) => {
    // This is handled within the ResponseGrid component
    // The ResponseGrid component has the real fact-checking functionality
  };

  const handleReply = (response: AIResponse) => {
    // This is handled within the ResponseGrid component  
    // The ResponseGrid component has the real reply functionality
  };

  const handleBulkSubmitToGroup = () => {
    const completeResponses = responses.filter(r => r.status === 'complete');
    if (completeResponses.length === 0) {
      toast({
        title: "No Complete Responses",
        description: "Wait for responses to complete before submitting to group",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Submit to Group",
      description: "Group submission feature will be implemented soon",
    });
  };

  const handleBulkFactCheck = () => {
    const completeResponses = responses.filter(r => r.status === 'complete');
    if (completeResponses.length === 0) {
      toast({
        title: "No Complete Responses",
        description: "Wait for responses to complete before fact checking",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Bulk Fact Check Started",
      description: `Fact checking ${completeResponses.length} responses. Use individual fact-check buttons below each response.`,
    });
  };

  const handleOpenConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // This will trigger the query to fetch responses for this conversation
  };

  const handleTurnVerification = async (responseToVerify: AIResponse) => {
    if (!currentQuery || !responseToVerify.content) {
      toast({
        title: "Cannot Verify",
        description: "Original query or response content not available",
        variant: "destructive",
      });
      return;
    }

    // Get other connected AI providers to do the verification
    const availableVerifiers = selectedAIs.filter(ai => ai !== responseToVerify.aiProvider);
    
    if (availableVerifiers.length === 0) {
      toast({
        title: "No Verifiers Available", 
        description: "Select other AI models to perform verification",
        variant: "destructive",
      });
      return;
    }

    const verificationPrompt = createTruthfulnessPrompt(currentQuery).replace(
      '[RESPONSE TO BE ANALYZED]', 
      `${getProviderDisplayName(responseToVerify.aiProvider)}: "${responseToVerify.content}"`
    );

    setIsSubmitting(true);
    try {
      const verificationResult = await submitQuery(verificationPrompt, availableVerifiers);
      setCurrentConversationId(verificationResult.conversationId);
      setResponses(verificationResult.responses);
      setActiveTab("dive"); // Switch to show verification results
      
      toast({
        title: "Verification Started",
        description: `${availableVerifiers.length} AI agents are fact-checking the response`,
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to start verification",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWorkSubmit = async (query: string) => {
    if (selectedAIs.length < 2) {
      toast({
        title: "Need Multiple AIs",
        description: "Select at least 2 AI models for work collaboration",
        variant: "destructive",
      });
      return;
    }

    setCurrentQuery(query);
    await handleQuerySubmit(query);
  };

  const handleWorkRefinement = async () => {
    if (!currentQuery || responses.length === 0) {
      toast({
        title: "Cannot Continue Work",
        description: "No previous responses to build upon",
        variant: "destructive",
      });
      return;
    }

    const completeResponses = responses.filter(r => r.status === 'complete');
    if (completeResponses.length === 0) {
      toast({
        title: "Wait for Responses",
        description: "Wait for initial responses before continuing the work",
        variant: "destructive",
      });
      return;
    }

    const previousResponsesSummary = completeResponses.map(r => 
      `${getProviderDisplayName(r.aiProvider)}: ${r.content?.substring(0, 300)}...`
    ).join('\n\n');

    const refinementPrompt = `WORK REFINEMENT TASK: Building on previous AI responses to improve the answer to "${currentQuery}".

Original Query: "${currentQuery}"

Previous Team Responses:
${previousResponsesSummary}

Your task: Review the above responses and provide an improved, refined answer that:
1. Builds upon the best ideas from previous responses
2. Addresses any gaps or weaknesses you notice
3. Adds new insights or perspectives
4. Provides a more comprehensive solution

Please synthesize and improve upon what has been shared so far.`;

    setIsSubmitting(true);
    try {
      const refinementResult = await submitQuery(refinementPrompt, selectedAIs);
      setCurrentConversationId(refinementResult.conversationId);
      setResponses(refinementResult.responses);
      
      toast({
        title: "Work Continued",
        description: "AI agents are building on previous responses",
      });
    } catch (error: any) {
      toast({
        title: "Refinement Failed",
        description: error.message || "Failed to continue work",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWorkSynthesis = async () => {
    if (!currentQuery || responses.length < 2) {
      toast({
        title: "Need More Responses",
        description: "Need at least 2 responses to synthesize",
        variant: "destructive",
      });
      return;
    }

    const completeResponses = responses.filter(r => r.status === 'complete');
    if (completeResponses.length < 2) {
      toast({
        title: "Wait for More Responses",
        description: "Wait for more responses before synthesizing",
        variant: "destructive",
      });
      return;
    }

    const allResponsesSummary = completeResponses.map(r => 
      `${getProviderDisplayName(r.aiProvider)}: ${r.content}`
    ).join('\n\n---\n\n');

    const synthesisPrompt = `WORK SYNTHESIS TASK: Create the final, best possible answer by synthesizing all team responses to "${currentQuery}".

Original Query: "${currentQuery}"

All Team Responses:
${allResponsesSummary}

Your task: Provide the ultimate synthesized answer that:
1. Combines the best elements from all responses
2. Resolves any contradictions between responses
3. Fills in any remaining gaps
4. Presents a clear, comprehensive, and authoritative final answer
5. Acknowledges the collaborative process

This is the final stage of the work - make it count!`;

    // Use just one AI (preferably Anthropic or OpenAI) for synthesis to avoid confusion
    const synthesisAI = selectedAIs.includes('anthropic') ? ['anthropic'] : 
                       selectedAIs.includes('openai') ? ['openai'] : 
                       [selectedAIs[0]];

    setIsSubmitting(true);
    try {
      const synthesisResult = await submitQuery(synthesisPrompt, synthesisAI);
      setCurrentConversationId(synthesisResult.conversationId);
      setResponses(synthesisResult.responses);
      
      toast({
        title: "Work Complete",
        description: "Final synthesis has been generated",
      });
    } catch (error: any) {
      toast({
        title: "Synthesis Failed",
        description: error.message || "Failed to synthesize final answer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 relative overflow-hidden">

      {/* Underwater effect with floating particles */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-300 rounded-full animate-bounce"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-200 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-60 right-1/3 w-1 h-1 bg-blue-300 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* Water surface shimmer effect */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cyan-400/10 to-transparent"></div>
      
      {/* Swimming Pool Header */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-900 border-b-4 border-cyan-400 sticky top-0 z-50 shadow-2xl relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center wave-animation">
                  <Waves className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-varsity text-white tracking-wide">Swim Meet</h1>
                  <p className="text-blue-100 text-sm">AI Analysis Platform • Compare • Verify • Collaborate</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHelpModalOpen(true)}
                className="text-blue-100 hover:text-white hover:bg-blue-700"
                data-testid="button-help"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCredentialsModalOpen(true)}
                className="text-blue-100 hover:text-white hover:bg-blue-700"
                data-testid="button-api-keys"
              >
                <Settings className="h-4 w-4 mr-2" />
                Setup
              </Button>
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-blue-800 text-sm font-bold">SW</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Swimming Lane Divider */}
      <div className="h-2 lane-divider"></div>

      {/* Event Diagnostic - Step 1 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <RawHtmlTest />
        <SimpleTest />
        <EventDiagnostic />
      </div>

      {/* Swimming Events */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SimpleTabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Event Selection Podium */}
          <div className="bg-white rounded-xl shadow-lg border-4 border-yellow-400 p-4">
            <ModeSelector currentMode={activeTab} onModeChange={handleModeChange} />

          </div>

          {/* Bulk Actions */}
          {responses.length > 0 && (
            <BulkActions 
              selectedResponses={selectedResponses} 
              onBulkAction={handleBulkAction} 
            />
          )}

          {/* Dive Event - Main Competition Pool */}
          <SimpleTabsContent value="dive" className="space-y-8">
            <Card className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 border-blue-400 border-2 shadow-2xl">
              <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-pulse"></div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-300 to-cyan-400"></div>
                <CardTitle className="text-3xl font-varsity-bold flex items-center justify-center space-x-3 relative z-10">
                  <svg className="w-10 h-10 text-cyan-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 12c0-1 1-2 2-2h2c1 0 2 1 2 2v4c0 1-1 2-2 2H5c-1 0-2-1-2-2v-4z"/>
                    <path d="M10 8c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z"/>
                    <path d="M15 12l6 2-6 2v-4z"/>
                    <path d="M9 14h4v2H9v-2z"/>
                  </svg>
                  <span className="text-white">Dive Analysis</span>
                </CardTitle>
                <CardDescription className="text-blue-200 text-lg relative z-10">
                  Submit queries for comprehensive multi-model analysis and comparison
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 bg-gradient-to-b from-blue-800 to-blue-900">
                <QueryInput
                  onSubmit={handleQuerySubmit}
                  selectedAIs={selectedAIs}
                  onSelectionChange={setSelectedAIs}
                  isLoading={isSubmitting}
                />
              </CardContent>
            </Card>

            {/* Response Cards with New Award System */}
            {responses.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {responses.map((response) => (
                  <ResponseCard
                    key={response.id}
                    response={response}
                    onAward={handleAward}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}

            {responses.length > 0 && (
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-100 border-yellow-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yellow-800">
                    <span className="text-2xl">🏆</span>
                    <span>Race Results & Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulkActions
                    responses={responses}
                    onSubmitAllToGroup={handleBulkSubmitToGroup}
                    onFactCheckAll={handleBulkFactCheck}
                  />
                </CardContent>
              </Card>
            )}
          </SimpleTabsContent>

          {/* Turn Event - AI-to-AI Verification Pool */}
          <SimpleTabsContent value="turn" className="space-y-8">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-300 border-2">
              <CardHeader className="text-center bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="text-3xl font-varsity-bold flex items-center justify-center space-x-3">
                  <svg className="w-10 h-10 text-green-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 8c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z"/>
                    <path d="M3 12c0-1 1-2 2-2h2c1 0 2 1 2 2v4c0 1-1 2-2 2H5c-1 0-2-1-2-2v-4z"/>
                    <path d="M1 12l4-2v4l-4-2z"/>
                    <path d="M14 6l2 2 4-4"/>
                    <path d="M14 14l2 2 4-4"/>
                  </svg>
                  <span>Turn Verification</span>
                </CardTitle>
                <CardDescription className="text-green-100 text-lg">
                  AI agents fact-check each other's responses - looking back for accuracy and reliability
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {responses.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-5xl">🔍</span>
                    </div>
                    <h3 className="text-2xl font-varsity text-green-800 mb-4">Verification Lanes Ready</h3>
                    <p className="text-green-600 max-w-lg mx-auto text-lg leading-relaxed">
                      Submit a query in Dive first, then return here to have other AI agents fact-check and verify the responses.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h3 className="text-xl font-varsity text-green-800 mb-2">Select Response to Verify</h3>
                      <p className="text-green-600">Choose an AI response below to have other agents fact-check it</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {responses.filter(r => r.status === 'completed').map((response) => (
                        <ResponseCard
                          key={response.id}
                          response={response}
                          onAward={handleAward}
                          onAction={handleAction}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </SimpleTabsContent>

          {/* Work Event - Collaboration Pool */}
          <SimpleTabsContent value="work" className="space-y-8">
            <Card className="bg-gradient-to-r from-purple-50 to-pink-100 border-purple-300 border-2">
              <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="text-3xl font-varsity-bold flex items-center justify-center space-x-3">
                  <svg className="w-10 h-10 text-purple-300" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="4" cy="8" r="2"/>
                    <circle cx="12" cy="8" r="2"/>
                    <circle cx="20" cy="8" r="2"/>
                    <path d="M2 12h4v2H2v-2z"/>
                    <path d="M10 12h4v2h-4v-2z"/>
                    <path d="M18 12h4v2h-4v-2z"/>
                    <path d="M6 10l4 0-1-1"/>
                    <path d="M6 11l4 0-1 1"/>
                    <path d="M14 10l4 0-1-1"/>
                    <path d="M14 11l4 0-1 1"/>
                  </svg>
                  <span>AI Work Team</span>
                </CardTitle>
                <CardDescription className="text-purple-100 text-lg">
                  Multiple AI agents collaborate, build on each other's ideas, and refine solutions together
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-xl font-varsity text-purple-800 mb-4 flex items-center">
                      <span className="text-2xl mr-2">🏊‍♂️</span>
                      Work Query Input
                    </h3>
                    <QueryInput
                      onSubmit={handleWorkSubmit}
                      selectedAIs={selectedAIs}
                      onSelectionChange={setSelectedAIs}
                      isLoading={isSubmitting}
                    />
                  </div>
                  
                  {responses.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-varsity text-purple-800 flex items-center">
                          <span className="text-2xl mr-2">🔄</span>
                          Work Progress
                        </h3>
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleWorkRefinement}
                            disabled={isSubmitting || responses.filter(r => r.status === 'complete').length === 0}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Continue Work
                          </Button>
                          <Button
                            onClick={handleWorkSynthesis}
                            disabled={isSubmitting || responses.filter(r => r.status === 'complete').length < 2}
                            className="bg-pink-600 hover:bg-pink-700"
                          >
                            Synthesize Final
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-center mb-4">
                        <p className="text-purple-600">
                          {responses.filter(r => r.status === 'complete').length} of {responses.length} swimmers completed their leg
                        </p>
                      </div>
                      
                      <ResponseGrid
                        responses={responses}
                        originalQuery={currentQuery}
                        onFactCheck={handleFactCheck}
                        onReply={handleReply}
                      />
                    </div>
                  )}
                  
                  {responses.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-5xl">🏊‍♂️</span>
                      </div>
                      <h3 className="text-2xl font-varsity text-purple-800 mb-4">Work Team Ready</h3>
                      <p className="text-purple-600 max-w-lg mx-auto text-lg leading-relaxed">
                        Start a collaborative session where AI agents build on each other's responses,
                        refine ideas, and work together toward the best solution.
                      </p>
                      <div className="mt-8 flex justify-center space-x-4">
                        <div className="bg-purple-200 px-4 py-2 rounded-full">
                          <span className="text-purple-800 font-semibold">🏊‍♀️ Initial Response</span>
                        </div>
                        <div className="bg-purple-200 px-4 py-2 rounded-full">
                          <span className="text-purple-800 font-semibold">🔄 Refinement</span>
                        </div>
                        <div className="bg-purple-200 px-4 py-2 rounded-full">
                          <span className="text-purple-800 font-semibold">🏆 Synthesis</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-5xl">🤝</span>
                </div>
                <h3 className="text-2xl font-bold text-purple-800 mb-4">Team Formation</h3>
                <p className="text-purple-600 max-w-lg mx-auto text-lg leading-relaxed">
                  Multi-AI relay features are warming up. Soon you'll be able to chain conversations, 
                  pass the baton between different AI models, and achieve collaborative excellence.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="bg-purple-200 p-4 rounded-lg">
                    <span className="text-purple-800 font-semibold">🚧 Conversation Chains</span>
                  </div>
                  <div className="bg-purple-200 p-4 rounded-lg">
                    <span className="text-purple-800 font-semibold">🚧 Iterative Refinement</span>
                  </div>
                  <div className="bg-purple-200 p-4 rounded-lg">
                    <span className="text-purple-800 font-semibold">🚧 Team Strategies</span>
                  </div>
                  <div className="bg-purple-200 p-4 rounded-lg">
                    <span className="text-purple-800 font-semibold">🚧 Baton Passing</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SimpleTabsContent>

          {/* Performance Metrics - Race History */}
          <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-slate-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-slate-800">
                <span className="text-2xl">📊</span>
                <span>Performance Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConversationHistory
                onOpenConversation={handleOpenConversation}
              />
            </CardContent>
          </Card>
        </SimpleTabs>
      </div>

      {/* Modals */}
      <CredentialsModal
        open={credentialsModalOpen}
        onClose={() => setCredentialsModalOpen(false)}
      />
      <Dialog open={helpModalOpen} onOpenChange={setHelpModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-varsity">Platform Guide</DialogTitle>
          </DialogHeader>
          <HelpContent />
        </DialogContent>
      </Dialog>
    </div>
  );
}
