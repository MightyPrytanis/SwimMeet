import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getConversationResponses, submitQuery } from "@/lib/api";
import QueryInput from "@/components/query-input";
import ResponseGrid from "@/components/response-grid";
import BulkActions from "@/components/bulk-actions";
import ConversationHistory from "@/components/conversation-history";
import CredentialsModal from "@/components/credentials-modal";
import HelpModal from "@/components/help-modal";
import { EventIcon } from "@/components/event-icons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, History, MessageSquare, Search, Users, HelpCircle, Play, BookOpen, Waves } from "lucide-react";
import type { AIResponse } from "@shared/schema";

export default function Dashboard() {
  const [selectedAIs, setSelectedAIs] = useState<string[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("freestyle");
  const { toast } = useToast();

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
    toast({
      title: "Fact Check",
      description: "Fact checking feature will be implemented soon",
    });
  };

  const handleReply = (response: AIResponse) => {
    toast({
      title: "Reply",
      description: "Reply feature will be implemented soon",
    });
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
      title: "Fact Check All",
      description: "Bulk fact checking feature will be implemented soon",
    });
  };

  const handleOpenConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // This will trigger the query to fetch responses for this conversation
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

      {/* Swimming Events */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Event Selection Podium */}
          <div className="bg-white rounded-xl shadow-lg border-4 border-yellow-400 p-4">
            <TabsList className="grid w-full grid-cols-3 gap-4 bg-gradient-to-r from-blue-100 to-blue-50 p-2 rounded-lg">
              <TabsTrigger 
                value="freestyle" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex flex-col items-center space-y-2 py-6 rounded-lg transition-all hover:scale-105"
                data-testid="tab-freestyle"
              >
                <EventIcon event="freestyle" className="w-8 h-8" />
                <div className="text-center">
                  <span className="font-varsity text-lg">Freestyle</span>
                  <p className="text-xs opacity-75">Direct Analysis</p>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="backstroke" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex flex-col items-center space-y-2 py-6 rounded-lg transition-all hover:scale-105"
                data-testid="tab-backstroke"
              >
                <EventIcon event="backstroke" className="w-8 h-8" />
                <div className="text-center">
                  <span className="font-varsity text-lg">Backstroke</span>
                  <p className="text-xs opacity-75">Verification</p>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="relay" 
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex flex-col items-center space-y-2 py-6 rounded-lg transition-all hover:scale-105"
                data-testid="tab-relay"
              >
                <EventIcon event="relay" className="w-8 h-8" />
                <div className="text-center">
                  <span className="font-varsity text-lg">Relay</span>
                  <p className="text-xs opacity-75">Collaboration</p>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Freestyle Event - Main Competition Pool */}
          <TabsContent value="freestyle" className="space-y-8">
            <Card className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 border-blue-400 border-2 shadow-2xl">
              <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-pulse"></div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-300 to-cyan-400"></div>
                <CardTitle className="text-3xl font-varsity-bold flex items-center justify-center space-x-3 relative z-10">
                  <EventIcon event="freestyle" className="w-10 h-10 text-cyan-300" />
                  <span className="text-white">Freestyle Analysis</span>
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

            <ResponseGrid
              responses={responses}
              onFactCheck={handleFactCheck}
              onReply={handleReply}
            />

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
          </TabsContent>

          {/* Backstroke Event - Verification Pool */}
          <TabsContent value="backstroke" className="space-y-8">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-300 border-2">
              <CardHeader className="text-center bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="text-3xl font-bold flex items-center justify-center space-x-3">
                  <span className="text-4xl">🤾‍♂️</span>
                  <span>Backstroke Verification</span>
                </CardTitle>
                <CardDescription className="text-green-100 text-lg">
                  Look back and verify accuracy - check facts, cross-reference sources, and ensure reliability
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-5xl">🔍</span>
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-4">Starting Blocks Ready</h3>
                <p className="text-green-600 max-w-lg mx-auto text-lg leading-relaxed">
                  Advanced fact-checking lanes are being prepared. Soon you'll be able to verify AI responses 
                  against multiple sources, check citations, and identify potential inaccuracies.
                </p>
                <div className="mt-8 flex justify-center space-x-4">
                  <div className="bg-green-200 px-4 py-2 rounded-full">
                    <span className="text-green-800 font-semibold">🚧 Lane 1: Source Verification</span>
                  </div>
                  <div className="bg-green-200 px-4 py-2 rounded-full">
                    <span className="text-green-800 font-semibold">🚧 Lane 2: Cross-Reference Check</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relay Event - Collaboration Pool */}
          <TabsContent value="relay" className="space-y-8">
            <Card className="bg-gradient-to-r from-purple-50 to-pink-100 border-purple-300 border-2">
              <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="text-3xl font-bold flex items-center justify-center space-x-3">
                  <span className="text-4xl">🏃‍♂️🏃‍♀️</span>
                  <span>AI Relay Team</span>
                </CardTitle>
                <CardDescription className="text-purple-100 text-lg">
                  Team up multiple AI swimmers for collaborative problem-solving and iterative refinement
                </CardDescription>
              </CardHeader>
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
          </TabsContent>

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
        </Tabs>
      </div>

      {/* Modals */}
      <CredentialsModal
        open={credentialsModalOpen}
        onClose={() => setCredentialsModalOpen(false)}
      />
      <HelpModal 
        open={helpModalOpen}
        onOpenChange={setHelpModalOpen}
      />
    </div>
  );
}
