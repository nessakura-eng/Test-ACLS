import { useState } from "react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  CheckCircle2, AlertTriangle, XCircle, Award, TrendingUp,
  Bot, Download, ChevronDown, ChevronUp, Zap, User, Brain,
  Activity, Code2, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { GradingResult, AlgorithmStep } from "../App";
import { Button } from "./ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface GradingResultsProps {
  result: GradingResult;
}

// ── Grade helpers ─────────────────────────────────────────────
const GRADE_CONFIG = {
  A: {
    icon: CheckCircle2,
    label: "Correct",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    icon_color: "text-emerald-500",
    bar: "bg-emerald-500",
  },
  B: {
    icon: AlertTriangle,
    label: "Incorrect",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    icon_color: "text-amber-500",
    bar: "bg-amber-500",
  },
  C: {
    icon: XCircle,
    label: "Missed",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    icon_color: "text-red-500",
    bar: "bg-red-500",
  },
  NotObserved: {
    icon: XCircle,
    label: "Not Observed",
    bg: "bg-gray-50",
    border: "border-gray-200",
    badge: "bg-gray-100 text-gray-500",
    icon_color: "text-gray-400",
    bar: "bg-gray-300",
  },
} as const;

const CATEGORY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  Universal:    { label: "Universal Steps",       color: "text-[#3C1053]", dot: "bg-[#3C1053]" },
  Shockable:    { label: "Shockable Pathway",     color: "text-blue-700",  dot: "bg-blue-600" },
  NonShockable: { label: "Non-Shockable Pathway", color: "text-indigo-700",dot: "bg-indigo-600" },
  PostArrest:   { label: "Post-Arrest Care",      color: "text-teal-700",  dot: "bg-teal-600" },
};

// ── Collapsible Step Card ─────────────────────────────────────
function StepCard({ step }: { step: AlgorithmStep }) {
  const [open, setOpen] = useState(false);
  const cfg = GRADE_CONFIG[step.grade] || GRADE_CONFIG.NotObserved;
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all`}>
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.icon_color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{step.stepName}</p>
          {!open && step.gradeJustification && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{step.gradeJustification}</p>
          )}
        </div>
        <Badge className={`${cfg.badge} text-xs font-semibold flex-shrink-0`}>
          {step.grade === "NotObserved" ? "Not Observed" : `Grade ${step.grade}`}
        </Badge>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
               : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {/* Expanded content — Digital Twin comparison */}
      {open && (
        <div className="border-t border-inherit px-4 pb-4 pt-3 space-y-3">
          {/* Two-column comparison */}
          <div className="grid md:grid-cols-2 gap-3">
            {/* Digital Twin side */}
            <div className="rounded-lg bg-[#3C1053]/6 border border-[#3C1053]/15 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Brain className="w-3.5 h-3.5 text-[#3C1053]" />
                <span className="text-xs font-semibold text-[#3C1053] uppercase tracking-wide">
                  Digital Twin — Ideal
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {step.digitalTwinExpected || "—"}
              </p>
            </div>

            {/* Student side */}
            <div className={`rounded-lg border p-3 ${
              step.grade === "A" ? "bg-emerald-50/60 border-emerald-200" :
              step.grade === "B" ? "bg-amber-50/60 border-amber-200" :
              "bg-red-50/60 border-red-200"
            }`}>
              <div className="flex items-center gap-1.5 mb-2">
                <User className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Student — Observed
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {step.studentPerformed || "Not observed in video"}
              </p>
            </div>
          </div>

          {/* Justification */}
          {step.gradeJustification && (
            <div className="rounded-lg bg-white/70 border border-gray-200 px-3 py-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Grading Rationale:{" "}
              </span>
              <span className="text-sm text-gray-700">{step.gradeJustification}</span>
            </div>
          )}

          {/* Clinical impact */}
          {step.clinicalImpact && step.grade !== "A" && (
            <div className="flex gap-2 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                  Clinical Impact:{" "}
                </span>
                <span className="text-sm text-orange-700">{step.clinicalImpact}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Score circle ──────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 85 ? "#10b981" : score >= 65 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="64" cy="64" r={r} fill="none" stroke={color}
          strokeWidth="10" strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold text-gray-900">{score}%</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export function GradingResults({ result }: GradingResultsProps) {
  const [activeTab, setActiveTab] = useState("comparison");

  const totalSteps = result.algorithmSteps.length;
  const gradeA = result.algorithmSteps.filter(s => s.grade === "A").length;
  const gradeB = result.algorithmSteps.filter(s => s.grade === "B").length;
  const gradeC = result.algorithmSteps.filter(s => s.grade === "C" || s.grade === "NotObserved").length;

  // Group steps by category
  const stepsByCategory = result.algorithmSteps.reduce<Record<string, AlgorithmStep[]>>((acc, step) => {
    const cat = step.category || "Universal";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(step);
    return acc;
  }, {});

  // Only show the relevant rhythm pathway — filter out the other one
  const rhythmPathway = (result.rhythmPathway || "").toLowerCase();
  const categoryOrder = (() => {
    const middle =
      rhythmPathway === "shockable"    ? ["Shockable"] :
      rhythmPathway === "nonshockable" ? ["NonShockable"] :
      // fallback: show whichever categories actually have steps (excluding the empty one)
      ["Shockable", "NonShockable"].filter(c => stepsByCategory[c]?.length > 0);
    return ["Universal", ...middle, "PostArrest"];
  })();

  const isPass = result.finalRecommendation === "PASS";

  const exportPDF = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const m = 20;

    // Header
    doc.setFillColor(60, 16, 83);
    doc.rect(0, 0, pw, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("Clinical Training Assessment", pw / 2, 16, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Student Information", m, 38);
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    doc.text(`Name: ${result.studentName}`, m, 47);
    doc.text(`Date: ${new Date(result.uploadDate).toLocaleString()}`, m, 54);
    doc.text(`Score: ${result.overallScore}%`, m, 61);
    doc.text(`Recommendation: ${result.finalRecommendation || "N/A"}`, m, 68);
    doc.text(`Scenario: ${result.scenarioIdentified || "N/A"}`, m, 75);
    doc.text(`Rhythm Pathway: ${result.rhythmPathway}`, m, 82);

    if (result.studentSummary) {
      doc.setFont(undefined, "bold");
      doc.setFontSize(11);
      doc.text("Summary", m, 95);
      doc.setFont(undefined, "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(result.studentSummary, pw - m * 2);
      doc.text(lines, m, 103);
    }

    // Step-by-step table
    if (result.algorithmSteps.length > 0) {
      doc.addPage();
      doc.setFillColor(60, 16, 83);
      doc.rect(0, 0, pw, 25, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text("Algorithm Step Analysis", pw / 2, 16, { align: "center" });

      autoTable(doc, {
        head: [["Step", "Category", "Digital Twin Expected", "Student Performed", "Grade"]],
        body: result.algorithmSteps.map(s => [
          s.stepName,
          s.category,
          s.digitalTwinExpected || "—",
          s.studentPerformed || "Not observed",
          s.grade === "NotObserved" ? "N/O" : s.grade,
        ]),
        startY: 30,
        theme: "striped",
        headStyles: { fillColor: [60, 16, 83], textColor: [255, 255, 255], fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 22 },
          2: { cellWidth: 45 },
          3: { cellWidth: 45 },
          4: { cellWidth: 14, halign: "center" },
        },
        styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak", valign: "top" },
        margin: { left: m, right: m },
      });
    }

    // Megacode table
    if (result.megacodeScores.length > 0) {
      doc.addPage();
      doc.setFillColor(60, 16, 83);
      doc.rect(0, 0, pw, 25, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text("Megacode Performance Rating", pw / 2, 16, { align: "center" });

      autoTable(doc, {
        head: [["Domain", "Grade", "Notes"]],
        body: result.megacodeScores.map(m => [m.name, m.grade, m.feedback || "—"]),
        startY: 30,
        theme: "striped",
        headStyles: { fillColor: [60, 16, 83], textColor: [255, 255, 255], fontSize: 9 },
        columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 16, halign: "center" }, 2: { cellWidth: "auto" } },
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak", valign: "top" },
        margin: { left: m, right: m },
      });
    }

    doc.save(`${result.studentName}_ACLS_Assessment.pdf`);
  };

  return (
    <Card className="p-6 shadow-lg border-0 bg-white">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-[#3C1053]" />
            <h2 className="text-xl font-semibold text-gray-900">Performance Assessment</h2>
          </div>
          <p className="text-sm text-gray-700 font-medium">{result.studentName}</p>
          <p className="text-xs text-gray-500">{new Date(result.uploadDate).toLocaleString()}</p>
          {result.scenarioIdentified && (
            <p className="text-xs text-indigo-600 mt-1 font-medium">
              📋 {result.scenarioIdentified}
            </p>
          )}
        </div>

        {result.finalRecommendation && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
            isPass
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-red-100 text-red-700 border border-red-200"
          }`}>
            {isPass
              ? <ShieldCheck className="w-4 h-4" />
              : <ShieldAlert className="w-4 h-4" />}
            {result.finalRecommendation}
          </div>
        )}
      </div>

      {/* ── Score summary bar ── */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-xl p-5 mb-6 border border-indigo-100">
        <div className="flex items-center gap-6">
          <ScoreRing score={result.overallScore} />
          <div className="flex-1 grid grid-cols-3 gap-3">
            {[
              { label: "Correct", count: gradeA, color: "text-emerald-600", bar: "bg-emerald-500" },
              { label: "Incorrect", count: gradeB, color: "text-amber-600", bar: "bg-amber-500" },
              { label: "Missed", count: gradeC, color: "text-red-600", bar: "bg-red-400" },
            ].map(({ label, count, color, bar }) => (
              <div key={label} className="text-center bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                <span className={`text-2xl font-bold ${color}`}>{count}</span>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${bar} rounded-full transition-all`}
                    style={{ width: totalSteps ? `${(count / totalSteps) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {result.rhythmPathway !== "Unknown" && (
          <div className="mt-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#3C1053]" />
            <span className="text-sm font-medium text-gray-700">
              Rhythm Pathway:{" "}
              <span className="text-[#3C1053] font-semibold">{result.rhythmPathway}</span>
            </span>
          </div>
        )}

        {result.studentSummary && (
          <p className="mt-3 text-sm text-gray-600 leading-relaxed border-t border-indigo-100 pt-3">
            {result.studentSummary}
          </p>
        )}
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="comparison" className="flex items-center gap-1.5 text-xs">
            <Brain className="w-3.5 h-3.5" />Step Comparison
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs">
            <TrendingUp className="w-3.5 h-3.5" />Megacodes
          </TabsTrigger>
          <TabsTrigger value="ai-analysis" className="flex items-center gap-1.5 text-xs">
            <Bot className="w-3.5 h-3.5" />AI Analysis
          </TabsTrigger>
          <TabsTrigger value="raw-data" className="flex items-center gap-1.5 text-xs">
            <Code2 className="w-3.5 h-3.5" />Raw Data
          </TabsTrigger>
        </TabsList>

        {/* ══ DIGITAL TWIN COMPARISON TAB ══ */}
        <TabsContent value="comparison" className="space-y-6">
          {result.algorithmSteps.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No step-by-step data available.</p>
              <p className="text-xs text-gray-400 mt-1">Check the AI Analysis tab for narrative feedback.</p>
            </div>
          ) : (
            <>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-500 font-medium self-center">Legend:</span>
                {(["A","B","C"] as const).map(g => {
                  const c = GRADE_CONFIG[g];
                  const I = c.icon;
                  return (
                    <span key={g} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.badge}`}>
                      <I className="w-3.5 h-3.5" />
                      Grade {g} — {c.label}
                    </span>
                  );
                })}
              </div>

              {/* Steps grouped by category — only show the identified rhythm pathway */}
              {categoryOrder
                .filter(cat => stepsByCategory[cat]?.length > 0)
                .map(cat => {
                  const steps = stepsByCategory[cat];
                  const catCfg = CATEGORY_CONFIG[cat] || { label: cat, color: "text-gray-700", dot: "bg-gray-400" };
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${catCfg.dot}`} />
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${catCfg.color}`}>
                          {catCfg.label}
                        </h3>
                        <span className="text-xs text-gray-400 ml-1">({steps.length} steps)</span>
                      </div>
                      <div className="space-y-2 pl-4">
                        {steps.map(step => <StepCard key={step.stepId} step={step} />)}
                      </div>
                    </div>
                  );
                })}

              {/* Strengths & Improvements */}
              {(result.strengths.length > 0 || result.improvements.length > 0) && (
                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  {result.strengths.length > 0 && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-sm font-bold text-emerald-800">Strengths</h4>
                      </div>
                      <ul className="space-y-2">
                        {result.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-emerald-700 flex gap-2">
                            <span className="text-emerald-400 flex-shrink-0">✓</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.improvements.length > 0 && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <h4 className="text-sm font-bold text-red-800">Areas for Improvement</h4>
                      </div>
                      <ul className="space-y-2">
                        {result.improvements.map((s, i) => (
                          <li key={i} className="text-sm text-red-700 flex gap-2">
                            <span className="text-red-400 flex-shrink-0">→</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ══ MEGACODE OVERVIEW TAB ══ */}
        <TabsContent value="overview" className="space-y-4">
          {result.megacodeScores.length > 0 ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#3C1053] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Domain</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold w-24">Grade</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.megacodeScores.map((mc, i) => {
                    const gradeKey = mc.grade as keyof typeof GRADE_CONFIG;
                    const cfg = GRADE_CONFIG[gradeKey] || GRADE_CONFIG.NotObserved;
                    return (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{mc.name}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`${cfg.badge} font-semibold`}>
                            {mc.grade === "NotObserved" ? "N/O" : mc.grade}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{mc.feedback || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No megacode scores parsed.</p>
              <p className="text-xs text-gray-400 mt-1">Check the AI Analysis or Raw Data tabs.</p>
            </div>
          )}
        </TabsContent>

        {/* ══ AI ANALYSIS TAB ══ */}
        <TabsContent value="ai-analysis" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-[#3C1053]" />
            <h3 className="font-semibold text-gray-900">AI-Generated Feedback</h3>
          </div>
          {result.detailedFeedback ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {result.detailedFeedback}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl">
              <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No AI analysis available</p>
            </div>
          )}
        </TabsContent>

        {/* ══ RAW DATA TAB ══ */}
        <TabsContent value="raw-data" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Complete n8n Response</h3>
          </div>
          {result.rawResponse ? (
            <div className="bg-gray-900 rounded-xl p-5 overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(result.rawResponse, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl">
              <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No raw data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Export */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <Button onClick={exportPDF} className="bg-[#3C1053] hover:bg-[#2a0b3a] text-white">
          <Download className="w-4 h-4 mr-2" />
          Export Full Report as PDF
        </Button>
      </div>
    </Card>
  );
}
