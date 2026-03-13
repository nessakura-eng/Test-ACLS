import { useState, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Upload, Video, X, Loader2, AudioLines,
} from "lucide-react";
import { toast } from "sonner";
import { GradingResult, AlgorithmStep } from "../App";
import { Alert, AlertDescription } from "./ui/alert";

interface VideoUploadProps {
  onGradingComplete: (result: GradingResult) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export function VideoUpload({ onGradingComplete, isProcessing, setIsProcessing }: VideoUploadProps) {
  const [studentName, setStudentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const N8N_WEBHOOK_URL = "https://flow.aclsai.com/webhook/audio-upload";

  // ── Parse structured JSON response from n8n ──────────────
  const parseStructuredResponse = (raw: any): Partial<GradingResult> => {
    // If the agent returned a JSON object with our expected keys
    if (raw && typeof raw === "object" && raw.algorithmSteps) {
      return raw as Partial<GradingResult>;
    }

    // If it came back as a string (text/plain from n8n)
    const text = typeof raw === "string" ? raw : JSON.stringify(raw);

    // Try to extract embedded JSON block first
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i) ||
                      text.match(/\{[\s\S]*"algorithmSteps"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        if (parsed.algorithmSteps) return parsed;
      } catch (_) {}
    }

    // Fallback: parse the markdown text into our structure
    return parseFallbackText(text);
  };

  const parseFallbackText = (text: string): Partial<GradingResult> => {
    const clean = text.replace(/\*\*/g, "").replace(/\*/g, "").trim();
    const algorithmSteps: AlgorithmStep[] = [];
    const megacodeScores: GradingResult["megacodeScores"] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Extract scenario
    const scenarioMatch = clean.match(/Scenario Identified[:\s]+([^\n]+)/i);
    const scenarioIdentified = scenarioMatch?.[1]?.trim() || "Not identified";

    // Extract rhythm pathway
    const rhythmMatch = clean.match(/\b(shockable|non-shockable|nonshockable)\b/i);
    const rhythmPathway = rhythmMatch
      ? rhythmMatch[1].toLowerCase().includes("non") ? "NonShockable" : "Shockable"
      : "Unknown";

    // Extract student summary
    const summaryMatch = clean.match(/Student Summary[:\s]*\n([^\n#]+(?:\n(?![#])[^\n]+)*)/i);
    const studentSummary = summaryMatch?.[1]?.trim() || "";

    // Extract recommendation
    const recMatch = clean.match(/Final Recommendation[:\s]*(PASS|NEEDS REMEDIATION)/i);
    const finalRecommendation = (recMatch?.[1] || "") as GradingResult["finalRecommendation"];

    // Extract overall score
    const scoreMatch = clean.match(/Overall Score[:\s]*(\d+)%/i) ||
                       clean.match(/(\d+)%\s*overall/i);
    const overallScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    // Parse Universal Criteria steps
    const universalSection = clean.match(/SECTION 1[:\s\S]*?(?=SECTION 2|##)/i)?.[0] || "";
    const stepBlocks = universalSection.split(/###\s+\d+\./g).slice(1);
    const universalNames = ["CPR Quality","Team Role Assignment","Equipment Setup","IV/IO Access","Ventilation","Rhythm Identification"];
    stepBlocks.forEach((block, i) => {
      const dtMatch = block.match(/Digital Twin Standard[:\s]+([^\n📹]+)/i);
      const studentMatch = block.match(/Student Performance[:\s]+([^\n📊]+)/i);
      const gradeMatch = block.match(/Grade[:\s]+([ABC])/i);
      const justMatch = block.match(/Grade[:\s]+[ABC]\s*[—–-]\s*([^\n]+)/i);
      const impactMatch = block.match(/clinical impact[:\s]+([^\n]+)/i);

      algorithmSteps.push({
        stepId: `universal_${i + 1}`,
        stepName: universalNames[i] || `Step ${i + 1}`,
        category: "Universal",
        digitalTwinExpected: dtMatch?.[1]?.trim() || "",
        studentPerformed: studentMatch?.[1]?.trim() || "",
        grade: (gradeMatch?.[1]?.toUpperCase() as "A"|"B"|"C") || "C",
        gradeJustification: justMatch?.[1]?.trim() || "",
        clinicalImpact: impactMatch?.[1]?.trim(),
      });
    });

    // Parse rhythm-specific steps
    const rhythmSection = clean.match(/SECTION 2[:\s\S]*?(?=SECTION 3|##)/i)?.[0] || "";
    const rhythmBlocks = rhythmSection.split(/####\s+Step\s+\d+/gi).slice(1);
    rhythmBlocks.forEach((block, i) => {
      const dtMatch = block.match(/Digital Twin Standard[:\s]+([^\n📹]+)/i);
      const studentMatch = block.match(/Student Performance[:\s]+([^\n📊]+)/i);
      const gradeMatch = block.match(/Grade[:\s]+([ABC]|Not Observed)/i);
      const justMatch = block.match(/Grade[:\s]+[^\n]+[—–-]\s*([^\n]+)/i);

      const gradeRaw = gradeMatch?.[1] || "C";
      const grade = gradeRaw === "Not Observed" ? "NotObserved" :
                    (gradeRaw.toUpperCase() as "A"|"B"|"C");

      algorithmSteps.push({
        stepId: `${rhythmPathway.toLowerCase()}_${i + 1}`,
        stepName: `${rhythmPathway === "Shockable" ? "Shockable" : "Non-Shockable"} Step ${i + 1}`,
        category: rhythmPathway === "Shockable" ? "Shockable" : "NonShockable",
        digitalTwinExpected: dtMatch?.[1]?.trim() || "",
        studentPerformed: studentMatch?.[1]?.trim() || "",
        grade,
        gradeJustification: justMatch?.[1]?.trim() || "",
      });
    });

    // Parse strengths
    const strengthSection = clean.match(/Strengths[:\s\S]*?(?=⚠️|Areas for Improvement|SECTION|##)/i)?.[0] || "";
    strengthSection.split("\n").forEach(line => {
      const trimmed = line.replace(/^[-✅•]\s*/, "").trim();
      if (trimmed.length > 10) strengths.push(trimmed);
    });

    // Parse improvements
    const improvSection = clean.match(/Areas for Improvement[:\s\S]*?(?=SECTION 5|---)/i)?.[0] || "";
    improvSection.split("\n").forEach(line => {
      const trimmed = line.replace(/^[-⚠️•]\s*/, "").trim();
      if (trimmed.length > 10) improvements.push(trimmed);
    });

    // Parse megacode table
    const tableSection = clean.match(/SECTION 5[\s\S]*?(?=SECTION 6|---|\Z)/i)?.[0] || "";
    const tableRows = tableSection.match(/Megacode \d+[^\n]*/gi) || [];
    tableRows.forEach(row => {
      const parts = row.split("|").map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const gradeVal = parts[1] === "Not Observed" ? "C" : parts[1];
        megacodeScores.push({
          name: parts[0],
          grade: gradeVal,
          feedback: parts[2] || "",
        });
      }
    });

    return {
      overallScore,
      finalRecommendation,
      scenarioIdentified,
      rhythmPathway: rhythmPathway as GradingResult["rhythmPathway"],
      algorithmSteps,
      megacodeScores,
      studentSummary,
      strengths,
      improvements,
      detailedFeedback: clean,
      overallConclusion: finalRecommendation,
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
        setSelectedFile(file);
        toast.success(`${file.type.startsWith("video/") ? "Video" : "Audio"} file selected`);
      } else {
        toast.error("Please select a valid video or audio file");
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) { toast.error("Please enter student name"); return; }
    if (!selectedFile) { toast.error("Please select a video file"); return; }

    setIsProcessing(true);
    const isVideo = selectedFile.type.startsWith("video/");
    const fileType = isVideo ? "video" : "audio";
    let loadingToast = toast.loading(`Uploading ${fileType} file...`);

    try {
      const formData = new FormData();
      formData.append("video", selectedFile);
      formData.append("studentName", studentName);

      setTimeout(() => {
        toast.loading(`Transcribing ${fileType} — this may take a few minutes...`, { id: loadingToast });
      }, 2000);
      if (isVideo) {
        setTimeout(() => {
          toast.loading("Video transcription in progress — please wait...", { id: loadingToast });
        }, 30000);
      }

      const response = await fetch(N8N_WEBHOOK_URL, { method: "POST", body: formData });
      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);

      toast.loading("Processing AI analysis...", { id: loadingToast });

      const contentType = response.headers.get("content-type");
      let rawData: any;

      if (contentType?.includes("application/json")) {
        const jsonResponse = await response.json();
        rawData = Array.isArray(jsonResponse) && jsonResponse[0]?.output
          ? jsonResponse[0].output
          : jsonResponse;
      } else {
        rawData = await response.text();
      }

      const parsed = parseStructuredResponse(rawData);

      const gradingResult: GradingResult = {
        id: Date.now().toString(),
        studentName,
        uploadDate: new Date().toISOString(),
        overallScore: parsed.overallScore || 0,
        finalRecommendation: parsed.finalRecommendation || "",
        scenarioIdentified: parsed.scenarioIdentified || "",
        rhythmPathway: parsed.rhythmPathway || "Unknown",
        algorithmSteps: parsed.algorithmSteps || [],
        megacodeScores: parsed.megacodeScores || [],
        studentSummary: parsed.studentSummary || "",
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        videoUrl: isVideo ? URL.createObjectURL(selectedFile) : "",
        detailedFeedback: parsed.detailedFeedback || "",
        rawResponse: rawData,
        overallConclusion: parsed.overallConclusion || "",
      };

      toast.dismiss(loadingToast);
      toast.success("Analysis complete!");
      onGradingComplete(gradingResult);

      setStudentName("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.dismiss(loadingToast);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        toast.error("Unable to connect to n8n webhook", {
          description: "Ensure n8n workflow is active and network is stable.",
          duration: 8000,
        });
      } else if (error instanceof Error) {
        toast.error("Failed to process video", { description: error.message, duration: 5000 });
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
      console.error("Error details:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6 shadow-lg border-0 bg-white">
      <div className="flex items-center gap-2 mb-6">
        <Upload className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Upload Training Recording</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="studentName" className="text-gray-700">Student Name</Label>
          <Input
            id="studentName"
            type="text"
            placeholder="Enter student's full name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            disabled={isProcessing}
            className="border-gray-300"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mediaFile" className="text-gray-700">Training Video or Audio</Label>
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <Video className="w-10 h-10 text-gray-400" />
                <span className="text-gray-300 text-2xl">or</span>
                <AudioLines className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">Click to upload video or audio</p>
              <p className="text-xs text-gray-500">Video: MP4, MOV, AVI | Audio: MP3, WAV, M4A</p>
              <input
                ref={fileInputRef}
                id="mediaFile"
                type="file"
                accept="video/*,audio/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded">
                    {selectedFile.type.startsWith("video/")
                      ? <Video className="w-5 h-5 text-blue-600" />
                      : <AudioLines className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{" "}
                      {selectedFile.type.startsWith("video/") ? "Video" : "Audio"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button" variant="ghost" size="sm"
                  onClick={handleRemoveFile} disabled={isProcessing}
                  className="hover:bg-red-100 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isProcessing || !studentName || !selectedFile}
          className="w-full bg-[#3C1053] hover:bg-[#2a0b3a]"
        >
          {isProcessing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing Performance...</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" />Upload & Analyze</>
          )}
        </Button>
      </form>
    </Card>
  );
}
