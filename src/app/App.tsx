import { useState } from "react";
import { VideoUpload } from "./components/VideoUpload";
import { GradingResults } from "./components/GradingResults";
import { HistoryPanel } from "./components/HistoryPanel";
import { Activity } from "lucide-react";
import { Toaster } from "./components/ui/sonner";

export interface GradingResult {
  id: string;
  studentName: string;
  uploadDate: string;
  overallScore: number;
  megacodeScores: {
    name: string;
    grade: string; // A, B, or C
    feedback: string;
  }[];
  videoUrl: string;
  detailedFeedback: string;
  rawResponse?: any; // Store the complete n8n response
  overallConclusion?: string; // Overall conclusion from AI agent
}

export default function App() {
  const [currentResult, setCurrentResult] =
    useState<GradingResult | null>(null);
  const [gradingHistory, setGradingHistory] = useState<
    GradingResult[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGradingComplete = (result: GradingResult) => {
    setCurrentResult(result);
    setGradingHistory((prev) => [result, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Toaster />

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#3C1053] rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Clinical Training Assessment
              </h1>
              <p className="text-sm text-gray-600">
                AI-Powered Performance Evaluation
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Current Result */}
          <div className="lg:col-span-2 space-y-6">
            <VideoUpload
              onGradingComplete={handleGradingComplete}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />

            {currentResult && (
              <GradingResults result={currentResult} />
            )}
          </div>

          {/* Right Column - History */}
          <div className="lg:col-span-1">
            <HistoryPanel
              history={gradingHistory}
              onSelectResult={setCurrentResult}
              currentResultId={currentResult?.id}
            />
          </div>
        </div>
      </main>
    </div>
  );
}