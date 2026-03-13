import { useState } from "react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  CheckCircle2,
  AlertCircle,
  Award,
  TrendingUp,
  FileText,
  Code2,
  Bot,
  Download,
} from "lucide-react";
import { GradingResult } from "../App";
import { Button } from "./ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface GradingResultsProps {
  result: GradingResult;
}

export function GradingResults({
  result,
}: GradingResultsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90)
      return {
        label: "Excellent",
        variant: "default" as const,
        className:
          "bg-green-100 text-green-700 hover:bg-green-100",
      };
    if (score >= 80)
      return {
        label: "Good",
        variant: "default" as const,
        className:
          "bg-blue-100 text-blue-700 hover:bg-blue-100",
      };
    if (score >= 70)
      return {
        label: "Satisfactory",
        variant: "default" as const,
        className:
          "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
      };
    return {
      label: "Needs Improvement",
      variant: "default" as const,
      className: "bg-red-100 text-red-700 hover:bg-red-100",
    };
  };

  const getGradeBadge = (grade: string) => {
    if (grade === "A")
      return {
        label: "A",
        className: "bg-green-100 text-green-700",
      };
    if (grade === "B")
      return {
        label: "B",
        className: "bg-orange-100 text-orange-700",
      };
    return {
      label: "C",
      className: "bg-gray-100 text-gray-600",
    };
  };

  const overallBadge = getScoreBadge(result.overallScore);

  // Function to render any value from the raw response
  const renderValue = (
    value: any,
    depth: number = 0,
  ): JSX.Element => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }

    if (typeof value === "boolean") {
      return (
        <span className="text-purple-600">
          {value.toString()}
        </span>
      );
    }

    if (typeof value === "number") {
      return <span className="text-blue-600">{value}</span>;
    }

    if (typeof value === "string") {
      // Check if it's a long text (likely AI analysis)
      if (value.length > 100) {
        return (
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {value}
          </p>
        );
      }
      return <span className="text-gray-700">{value}</span>;
    }

    if (Array.isArray(value)) {
      return (
        <div className={`space-y-2 ${depth > 0 ? "ml-4" : ""}`}>
          {value.map((item, index) => (
            <div
              key={index}
              className="border-l-2 border-gray-200 pl-3"
            >
              <span className="text-xs text-gray-500 font-mono">
                #{index}
              </span>
              <div className="mt-1">
                {renderValue(item, depth + 1)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === "object") {
      return (
        <div className={`space-y-2 ${depth > 0 ? "ml-4" : ""}`}>
          {Object.entries(value).map(([key, val]) => (
            <div
              key={key}
              className="border-l-2 border-blue-200 pl-3 py-1"
            >
              <span className="text-sm font-medium text-gray-900">
                {key}:
              </span>
              <div className="mt-1">
                {renderValue(val, depth + 1)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <span className="text-gray-700">{String(value)}</span>
    );
  };

  // Function to export the grading results as a PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Page 1 - Summary with better formatting
    doc.setFillColor(60, 16, 83); // NCH color header
    doc.rect(0, 0, pageWidth, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Clinical Assessment", pageWidth / 2, 16, {
      align: "center",
    });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Student Information Section
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Student Information", margin, 55);
    doc.setFont(undefined, "normal");

    doc.setFontSize(11);
    doc.text("Name:", margin, 65);
    doc.setFont(undefined, "bold");
    doc.text(result.studentName, margin + 25, 65);
    doc.setFont(undefined, "normal");

    doc.text("Date:", margin, 73);
    doc.text(
      new Date(result.uploadDate).toLocaleString(),
      margin + 25,
      73,
    );

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 80, pageWidth - margin, 80);

    // Overall Score Section
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Overall Score", margin, 92);
    doc.setFont(undefined, "normal");

    // Score box with dynamic color based on performance
    const scoreBoxY = 100;
    const scoreBoxHeight = 30;

    // Set color based on score: Green (90+), Orange (70-89), Red (<70)
    if (result.overallScore >= 90) {
      doc.setFillColor(34, 197, 94); // Green
    } else if (result.overallScore >= 70) {
      doc.setFillColor(249, 115, 22); // Orange
    } else {
      doc.setFillColor(239, 68, 68); // Red
    }

    doc.roundedRect(
      margin,
      scoreBoxY,
      50,
      scoreBoxHeight,
      3,
      3,
      "F",
    );

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(
      `${result.overallScore}%`,
      margin + 25,
      scoreBoxY + 20,
      { align: "center" },
    );

    // Performance level
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    const badge = getScoreBadge(result.overallScore);
    doc.text(
      `Performance: ${badge.label}`,
      margin + 60,
      scoreBoxY + 18,
    );

    // Separator line
    doc.setTextColor(0, 0, 0);
    doc.line(margin, 138, pageWidth - margin, 138);

    // Instructor's Conclusion Section
    if (result.overallConclusion) {
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Instructor's Conclusion", margin, 150);
      doc.setFont(undefined, "normal");

      doc.setFontSize(10);
      // Split text into lines that fit within the page width
      const conclusionLines = doc.splitTextToSize(
        result.overallConclusion,
        contentWidth,
      );
      let currentY = 160;

      conclusionLines.forEach((line: string) => {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(line, margin, currentY);
        currentY += 6; // Line height
      });
    }

    // Footer on page 1
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      "Generated by Clinical Assessment Grader",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" },
    );

    // Page 2 - ACLS Megacodes Table
    if (
      result.megacodeScores &&
      result.megacodeScores.length > 0
    ) {
      doc.addPage();
      doc.setTextColor(0, 0, 0);

      // Smaller header to save space
      doc.setFillColor(60, 16, 83);
      doc.rect(0, 0, pageWidth, 25, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("Clinical Assessment", pageWidth / 2, 16, {
        align: "center",
      });

      doc.setTextColor(0, 0, 0);

      autoTable(doc, {
        head: [["Domain Item", "Score", "Feedback"]],
        body: result.megacodeScores.map((megacode) => [
          megacode.name,
          megacode.grade,
          megacode.feedback || "N/A",
        ]),
        startY: 30,
        theme: "striped",
        headStyles: {
          fillColor: [60, 16, 83],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
          halign: "center",
          cellPadding: 2.5,
        },
        columnStyles: {
          0: { cellWidth: 42, halign: "left" },
          1: { cellWidth: 16, halign: "center" },
          2: { cellWidth: "auto", halign: "left" },
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
          cellWidth: "wrap",
          lineHeight: 1.2,
          valign: "top",
        },
        margin: { left: margin, right: margin, bottom: 30 },
        tableWidth: "auto",
      });

      // Footer at bottom
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        "Generated by Clinical Assessment Grader",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" },
      );
    }

    doc.save(`${result.studentName}_Assessment_Report.pdf`);
  };

  return (
    <Card className="p-6 shadow-lg border-0 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Performance Assessment
            </h2>
          </div>
          <p className="text-sm text-gray-600">
            {result.studentName}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(result.uploadDate).toLocaleString()}
          </p>
        </div>
        <Badge className={overallBadge.className}>
          {overallBadge.label}
        </Badge>
      </div>

      {/* Overall Score */}
      {result.overallScore > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-large text-gray-700">
              Overall Score
            </span>
            <span
              className={`text-2xl font-bold ${getScoreColor(result.overallScore)}`}
            >
              {result.overallScore}%
            </span>
          </div>
          <Progress
            value={result.overallScore}
            className="h-3"
          />

          {result.overallConclusion && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Instructor's Conclusion:
              </p>
              <p className="text-sm text-gray-800 leading-relaxed">
                {result.overallConclusion}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="ai-analysis"
            className="flex items-center gap-2"
          >
            <Bot className="w-4 h-4" />
            AI Analysis
          </TabsTrigger>
          <TabsTrigger
            value="raw-data"
            className="flex items-center gap-2"
          >
            <Code2 className="w-4 h-4" />
            Raw Data
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {result.megacodeScores &&
          result.megacodeScores.length > 0 ? (
            <>
              {/* Assessed Megacodes Table */}
              {result.megacodeScores.filter(
                (m) => m.grade !== "C",
              ).length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">
                      Assessed Clinical Domains
                    </h3>
                  </div>

                  {/* Table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-[#3C1053] text-white">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Domain Item
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold w-24">
                            Grade
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Actions/Feedback
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {result.megacodeScores
                          .filter(
                            (megacode) =>
                              megacode.grade !== "C",
                          )
                          .map((megacode, index) => {
                            const gradeBadge = getGradeBadge(
                              megacode.grade,
                            );
                            return (
                              <tr
                                key={index}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {megacode.name}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Badge
                                    className={`${gradeBadge.className} font-semibold`}
                                  >
                                    {gradeBadge.label}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {megacode.feedback ||
                                    "No feedback provided."}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Not Observed Megacodes */}
              {result.megacodeScores.filter(
                (m) => m.grade === "C",
              ).length > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-6">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">
                      Not Observed During Simulation
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {result.megacodeScores
                      .filter(
                        (megacode) => megacode.grade === "C",
                      )
                      .map((megacode, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">
                              {megacode.name}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-xs text-gray-600 border-gray-300"
                            >
                              Not Observed
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                No megacode scores available
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Check the AI Analysis or Raw Data tabs
              </p>
            </div>
          )}
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="ai-analysis" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              AI-Generated Feedback
            </h3>
          </div>

          {result.detailedFeedback ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100">
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {result.detailedFeedback}
              </div>
            </div>
          ) : result.rawResponse ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs text-amber-800 mb-2">
                  📋 Displaying all data from your n8n AI agent:
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                {renderValue(result.rawResponse)}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                No AI analysis available
              </p>
            </div>
          )}
        </TabsContent>

        {/* Raw Data Tab */}
        <TabsContent value="raw-data" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900">
              Complete n8n Response
            </h3>
          </div>

          {result.rawResponse ? (
            <div className="bg-gray-900 rounded-lg p-5 overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(result.rawResponse, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Code2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                No raw data available
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Export Button */}
      <div className="mt-6">
        <Button
          onClick={exportPDF}
          className="bg-[#3C1053] hover:bg-[#1f082b] text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export as PDF
        </Button>
      </div>
    </Card>
  );
}