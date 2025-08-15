import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share, CheckCheck, Download, Scale } from "lucide-react";
import type { AIResponse } from "@shared/schema";

interface BulkActionsProps {
  responses: AIResponse[];
  onSubmitAllToGroup?: () => void;
  onFactCheckAll?: () => void;
  onExportResponses?: () => void;
  onCompareResponses?: () => void;
}

export default function BulkActions({ 
  responses, 
  onSubmitAllToGroup, 
  onFactCheckAll, 
  onExportResponses, 
  onCompareResponses 
}: BulkActionsProps) {
  const completeResponses = responses.filter(r => r.status === 'complete');
  const hasResponses = completeResponses.length > 0;

  const handleExport = () => {
    if (!hasResponses) return;
    
    const exportData = {
      timestamp: new Date().toISOString(),
      responses: completeResponses.map(r => ({
        provider: r.aiProvider,
        content: r.content,
        timestamp: r.timestamp
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swim-meet-responses-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Bulk Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onSubmitAllToGroup}
            disabled={!hasResponses}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-submit-all"
          >
            <Share className="h-4 w-4 mr-2" />
            Submit All to Group
          </Button>
          
          <Button
            onClick={onFactCheckAll}
            disabled={!hasResponses}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            data-testid="button-fact-check-all"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Fact Check All
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!hasResponses}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
            data-testid="button-export-responses"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Responses
          </Button>
          
          <Button
            variant="outline"
            onClick={onCompareResponses}
            disabled={completeResponses.length < 2}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
            data-testid="button-compare-responses"
          >
            <Scale className="h-4 w-4 mr-2" />
            Compare Side-by-Side
          </Button>
        </div>
        
        {!hasResponses && (
          <p className="text-sm text-slate-500 mt-3">
            Complete at least one response to enable bulk actions
          </p>
        )}
        
        {hasResponses && (
          <p className="text-sm text-slate-600 mt-3">
            {completeResponses.length} of {responses.length} responses ready for bulk actions
          </p>
        )}
      </CardContent>
    </Card>
  );
}
