import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getConversationResponses, submitQuery } from "@/lib/api";
import QueryInput from "@/components/query-input";
import ResponseGrid from "@/components/response-grid";
import BulkActions from "@/components/bulk-actions";
import ConversationHistory from "@/components/conversation-history";
import CredentialsModal from "@/components/credentials-modal";
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
  const [activeTab, setActiveTab] = useState("ask");
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Swimming Pool Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 border-b-4 border-yellow-400 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center wave-animation">
                  <Waves className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-wide">Swim Meet</h1>
                  <p className="text-blue-100 text-sm">AI Racing Platform • Compare • Compete • Collaborate</p>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Combined Query Input with AI Selection */}
          <QueryInput
            onSubmit={handleQuerySubmit}
            selectedAIs={selectedAIs}
            onSelectionChange={setSelectedAIs}
            isLoading={isSubmitting}
          />

          {/* Response Grid */}
          <ResponseGrid
            responses={responses}
            onFactCheck={handleFactCheck}
            onReply={handleReply}
          />

          {/* Bulk Actions */}
          {responses.length > 0 && (
            <BulkActions
              responses={responses}
              onSubmitAllToGroup={handleBulkSubmitToGroup}
              onFactCheckAll={handleBulkFactCheck}
            />
          )}

          {/* Conversation History */}
          <ConversationHistory
            onOpenConversation={handleOpenConversation}
          />
        </div>
      </div>

      {/* Credentials Modal */}
      <CredentialsModal
        open={credentialsModalOpen}
        onClose={() => setCredentialsModalOpen(false)}
      />
    </div>
  );
}
