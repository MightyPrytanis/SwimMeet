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
import { Settings, History } from "lucide-react";
import type { AIResponse } from "@shared/schema";

export default function Dashboard() {
  const [selectedAIs, setSelectedAIs] = useState<string[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-slate-800">Swim Meet</h1>
                <p className="text-xs text-slate-500">Multi-AI Query Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {/* Navigate to history */}}
                className="text-slate-600 hover:text-slate-900"
                data-testid="button-history"
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCredentialsModalOpen(true)}
                className="text-slate-600 hover:text-slate-900"
                data-testid="button-api-keys"
              >
                <Settings className="h-4 w-4 mr-2" />
                API Keys
              </Button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </div>
            </div>
          </div>
        </div>
      </header>

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
