import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Copy, MoreVertical, Search, UserCog, Reply } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { humanizeResponse } from "@/lib/api";
import { AIProviderIcon, getProviderDisplayName } from "@/components/ai-provider-icons";
import type { AIResponse } from "@shared/schema";

interface ResponseGridProps {
  responses: AIResponse[];
  onFactCheck?: (response: AIResponse) => void;
  onReply?: (response: AIResponse) => void;
}

export default function ResponseGrid({ responses, onFactCheck, onReply }: ResponseGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const humanizeMutation = useMutation({
    mutationFn: (responseText: string) => humanizeResponse(responseText),
    onSuccess: (data, variables) => {
      toast({
        title: "Response Humanized",
        description: "The response has been humanized and is ready to submit.",
      });
      // You could open a modal here with the humanized response
      console.log("Humanized response:", data.humanizedResponse);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to humanize response",
        variant: "destructive",
      });
    },
  });



  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      openai: 'ChatGPT-4',
      anthropic: 'Claude 3.5',
      google: 'Gemini Pro',
      microsoft: 'Copilot',
      perplexity: 'Perplexity',
      deepseek: 'DeepSeek',
      grok: 'Grok',
      llama: 'Llama 3.2'
    };
    return names[provider] || provider;
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      openai: 'bg-green-500',
      anthropic: 'bg-orange-500',
      google: 'bg-blue-500',
      microsoft: 'bg-blue-600',
      perplexity: 'bg-purple-500',
      deepseek: 'bg-indigo-500',
      grok: 'bg-red-500',
      llama: 'bg-yellow-500'
    };
    return colors[provider] || 'bg-gray-500';
  };

  const handleCopyResponse = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied",
        description: "Response copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy response",
        variant: "destructive",
      });
    }
  };

  const handleHumanizeAndSubmit = (response: AIResponse) => {
    if (response.content) {
      humanizeMutation.mutate(response.content);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  if (responses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-slate-400 text-2xl">💭</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready for Analysis</h3>
        <p className="text-slate-600 max-w-md mx-auto">
          Submit your query above to get diverse perspectives from multiple AI models. 
          Compare accuracy and insights across different approaches.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">AI Responses</h2>
        <div className="text-sm text-slate-600">
          {responses.filter(r => r.status === 'complete').length} of {responses.length} complete
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {responses.map((response) => (
          <Card key={response.id} className="border-slate-200 hover:shadow-md transition-shadow" data-testid={`card-response-${response.id}`}>
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AIProviderIcon provider={response.aiProvider} className="w-10 h-10" />
                  <div>
                    <h3 className="font-semibold text-slate-900" data-testid={`text-provider-name-${response.id}`}>
                      {getProviderDisplayName(response.aiProvider)}
                    </h3>
                    <p className="text-sm text-slate-500" data-testid={`text-timestamp-${response.id}`}>
                      {formatTimestamp(response.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={response.status === 'complete' ? 'default' : response.status === 'error' ? 'destructive' : 'secondary'}
                    className={
                      response.status === 'complete' 
                        ? 'bg-emerald-500 text-white' 
                        : response.status === 'error'
                        ? 'bg-red-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }
                    data-testid={`badge-status-${response.id}`}
                  >
                    {response.status === 'complete' ? 'Complete' : response.status === 'error' ? 'Error' : 'Analyzing'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyResponse(response.content)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                    data-testid={`button-copy-${response.id}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-slate-400 hover:text-slate-600"
                        data-testid={`button-menu-${response.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopyResponse(response.content)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Response
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onFactCheck?.(response)}>
                        <Search className="h-4 w-4 mr-2" />
                        Fact Check
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleHumanizeAndSubmit(response)}>
                        <UserCog className="h-4 w-4 mr-2" />
                        Humanize & Submit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onReply?.(response)}>
                        <Reply className="h-4 w-4 mr-2" />
                        Reply
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          
          <CardContent className="p-4">
            {response.status === 'pending' && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-slate-600">Generating response...</span>
              </div>
            )}
            
            {response.status === 'error' && (
              <div className="py-4 text-center">
                <div className="text-red-500 text-lg mb-2">⚠️</div>
                <p className="text-red-600 font-medium">Error generating response</p>
                <p className="text-sm text-slate-600 mt-1">{response.content}</p>
              </div>
            )}
            
            {response.status === 'complete' && response.content && (
              <div className="prose prose-sm max-w-none text-slate-700" data-testid={`text-content-${response.id}`}>
                {response.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
            
            {response.status === 'complete' && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFactCheck?.(response)}
                      className="text-blue-600 hover:text-blue-700"
                      data-testid={`button-fact-check-${response.id}`}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Fact Check
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHumanizeAndSubmit(response)}
                      disabled={humanizeMutation.isPending}
                      className="text-blue-600 hover:text-blue-700"
                      data-testid={`button-humanize-${response.id}`}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      {humanizeMutation.isPending ? 'Processing...' : 'Humanize & Submit'}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReply?.(response)}
                    className="text-slate-600 hover:text-slate-900"
                    data-testid={`button-reply-${response.id}`}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  );
}
