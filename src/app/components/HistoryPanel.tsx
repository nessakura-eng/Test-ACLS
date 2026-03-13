import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { History, ChevronRight } from "lucide-react";
import { GradingResult } from "../App";

interface HistoryPanelProps {
  history: GradingResult[];
  onSelectResult: (result: GradingResult) => void;
  currentResultId?: string;
}

export function HistoryPanel({
  history,
  onSelectResult,
  currentResultId,
}: HistoryPanelProps) {
  const getScoreBadgeClass = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-700";
    if (score >= 80) return "bg-blue-100 text-blue-700";
    if (score >= 70) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <Card className="p-6 shadow-lg border-0 bg-white sticky top-24">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Assessment History
        </h2>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <History className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            No assessments yet
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Upload a video or audio file to get started
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="space-y-2 pr-4">
            {history.map((result) => (
              <button
                key={result.id}
                onClick={() => onSelectResult(result)}
                className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                  currentResultId === result.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {result.studentName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(
                        result.uploadDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      currentResultId === result.id
                        ? "text-blue-600 translate-x-1"
                        : "text-gray-400"
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between mt-3">
                  <Badge
                    className={`${getScoreBadgeClass(result.overallScore)} text-xs`}
                  >
                    {result.overallScore}%
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {
                      result.megacodeScores.filter(
                        (m) => m.grade !== "C",
                      ).length
                    }{" "}
                    identified items
                  </span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}