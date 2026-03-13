import { useState, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Upload,
  Video,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AudioLines,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { GradingResult } from "../App";
import { Alert, AlertDescription } from "./ui/alert";

interface VideoUploadProps {
  onGradingComplete: (result: GradingResult) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export function VideoUpload({
  onGradingComplete,
  isProcessing,
  setIsProcessing,
}: VideoUploadProps) {
  const [studentName, setStudentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hardcoded n8n webhook URL
  const N8N_WEBHOOK_URL =
    "https://flow.aclsai.com/webhook/audio-upload";

  // Function to parse AI text response and extract scores/sections
  const parseAITextResponse = (text: string) => {
    const megacodeScores: {
      name: string;
      grade: string;
      feedback: string;
    }[] = [];

    let overallScore = 0;

    // Clean up markdown
    const cleanText = text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/^[-•]\s/gm, "")
      .trim();

    // Find Megacode Performance Rating section
    const recapStartIndex = cleanText.search(/Megacode Performance Rating:/i);
    
    if (recapStartIndex === -1) {
      return {
        overallScore: 0,
        megacodeScores,
        detailedFeedback: cleanText,
        fullText: cleanText,
        aiResponse: cleanText,
        overallConclusion: "",
      };
    }
    
    const recapSection = cleanText.substring(recapStartIndex);
    const recapLines = recapSection.split(/\n/);
    
    for (let i = 0; i < recapLines.length; i++) {
      const line = recapLines[i].trim();
      if (!line || line.match(/Megacode Performance Rating/i)) continue;
      
      // Parse grades: "1. Name: A (feedback)" or "Name: Not Observed (feedback)"
      const gradeMatch = line.match(/^(?:\d+\.\s*)?(.+?):\s*(A|B|C)(?:\s*\((.*?)\))?/i);
      const notObservedMatch = line.match(/^(?:\d+\.\s*)?(.+?):\s*Not Observed(?:\s*\((.*?)\))?/i);
      
      if (gradeMatch) {
        const megacodeName = gradeMatch[1].trim();
        const grade = gradeMatch[2].toUpperCase();
        const feedback = gradeMatch[3]?.trim() || `Performance rated as ${grade}.`;
        
        mapMegacodeToStandard(megacodeName, grade, feedback, megacodeScores);
      } else if (notObservedMatch) {
        const megacodeName = notObservedMatch[1].trim();
        const feedback = notObservedMatch[2]?.trim() || "Not observed during simulation.";
        
        mapMegacodeToStandard(megacodeName, "C", feedback, megacodeScores);
      }
    }

    // Helper function to map AI names to standard megacode names
    function mapMegacodeToStandard(
      megacodeName: string,
      grade: string,
      feedback: string,
      megacodeScores: { name: string; grade: string; feedback: string; }[],
    ) {
      const lowerName = megacodeName.toLowerCase();
      let standardName = "";

      if (
        lowerName.includes("ventricular fibrillation") ||
        lowerName.includes("v-fib") ||
        lowerName.includes("vfib") ||
        lowerName.match(/\bvf\b/) ||
        lowerName.includes("pulseless vt") ||
        lowerName.includes("pulseless ventricular tachycardia")
      ) {
        standardName = "VF/Pulseless VT Management";
      } else if (
        lowerName.includes("pea") ||
        lowerName.includes("asystole") ||
        lowerName.includes("pulseless electrical")
      ) {
        standardName = "PEA/Asystole Management";
      } else if (lowerName.includes("bradycardia")) {
        standardName = "Bradycardia";
      } else if (lowerName.includes("unstable") && lowerName.includes("tachy")) {
        standardName = "Unstable Tachycardia";
      } else if (lowerName.includes("stable") && lowerName.includes("tachy")) {
        standardName = "Stable Tachycardia";
      } else if (lowerName.includes("tachycardia")) {
        standardName = "Unstable Tachycardia";
      } else if (
        lowerName.includes("acute coronary") ||
        lowerName.includes("acs") ||
        lowerName.includes("coronary syndrome")
      ) {
        standardName = "Acute Coronary Syndrome";
      } else if (lowerName.includes("stroke")) {
        standardName = "Stroke Assessment";
      } else if (
        lowerName.includes("post-cardiac") ||
        lowerName.includes("post cardiac") ||
        lowerName.includes("rosc") ||
        lowerName.includes("return of spontaneous") ||
        (lowerName.includes("post") && lowerName.includes("arrest"))
      ) {
        standardName = "Post-Cardiac Arrest Care";
      } else if (
        lowerName.includes("respiratory") ||
        lowerName.includes("airway") ||
        lowerName.includes("obstruction")
      ) {
        standardName = "Respiratory Arrest";
      } else if (
        lowerName.includes("reversible") ||
        lowerName.includes("h's") ||
        lowerName.includes("t's") ||
        lowerName.includes("special situations") ||
        lowerName.includes("special situation")
      ) {
        standardName = "Special Situations (H's & T's)";
      } else if (
        lowerName.includes("opioid") ||
        lowerName.includes("overdose") ||
        lowerName.includes("narcan") ||
        lowerName.includes("naloxone")
      ) {
        standardName = "Opioid Overdose";
      } else if (
        lowerName.includes("cpr") ||
        lowerName.includes("quality") ||
        lowerName.includes("team") ||
        lowerName.includes("dynamic") ||
        lowerName.includes("compressor") ||
        lowerName.includes("pediatric cardiac arrest")
      ) {
        standardName = "CPR Quality & Team Dynamics";
      }

      if (standardName) {
        megacodeScores.push({
          name: standardName,
          grade: grade,
          feedback: feedback,
        });
      }
    }

    // Calculate overall score (exclude C/Not Observed)
    const scoredSections = megacodeScores.filter((m) => m.grade !== "C");
    const gradeToScore: { [key: string]: number } = { A: 95, B: 70, C: 0 };

    if (scoredSections.length > 0) {
      const totalScore = scoredSections.reduce(
        (sum, m) => sum + gradeToScore[m.grade],
        0,
      );
      overallScore = Math.round(totalScore / scoredSections.length);
    }

    // Extract overall conclusion
    let overallConclusion = "";
    const conclusionMatch = cleanText.match(
      /Overall Conclusion:?\s*([^\n]+(?:\n(?!.*:)[^\n]+)*)/i,
    );
    if (conclusionMatch) {
      overallConclusion = conclusionMatch[1].trim();
    }

    return {
      overallScore,
      megacodeScores,
      detailedFeedback: cleanText,
      fullText: cleanText,
      aiResponse: cleanText,
      overallConclusion,
    };
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (
        file.type.startsWith("video/") ||
        file.type.startsWith("audio/")
      ) {
        setSelectedFile(file);
        const fileType = file.type.startsWith("video/")
          ? "Video"
          : "Audio";
        toast.success(`${fileType} file selected successfully`);
      } else {
        toast.error(
          "Please select a valid video or audio file",
        );
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName.trim()) {
      toast.error("Please enter student name");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select a video file");
      return;
    }

    // Validate URL format
    try {
      new URL(N8N_WEBHOOK_URL);
    } catch {
      toast.error("Please enter a valid webhook URL");
      return;
    }

    setIsProcessing(true);
    const isVideo = selectedFile.type.startsWith("video/");
    const fileType = isVideo ? "video" : "audio";

    // Show initial loading message
    let loadingToast = toast.loading(
      `Uploading ${fileType} file...`,
    );

    try {
      const formData = new FormData();
      formData.append("video", selectedFile);
      formData.append("studentName", studentName);

      // Update loading message after upload starts
      setTimeout(() => {
        toast.loading(
          `${isVideo ? "Transcribing video" : "Transcribing audio"} - this may take a few minutes...`,
          { id: loadingToast },
        );
      }, 2000);

      // Add another update for video files (they take longer)
      if (isVideo) {
        setTimeout(() => {
          toast.loading(
            "Video transcription in progress - please wait...",
            { id: loadingToast },
          );
        }, 30000);
      }

      // Call the n8n workflow - NO TIMEOUT, wait for response no matter how long
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        body: formData,
        // No timeout - wait indefinitely for n8n to respond
      });

      if (!response.ok) {
        throw new Error(
          `Server responded with status: ${response.status}`,
        );
      }

      // Update loading message for AI analysis phase
      toast.loading("Processing AI analysis...", {
        id: loadingToast,
      });

      // Check content type and parse accordingly
      const contentType = response.headers.get("content-type");
      let result: any;

      if (
        contentType &&
        contentType.includes("application/json")
      ) {
        // Response is JSON
        const jsonResponse = await response.json();
        console.log(
          "n8n AI Agent Response (JSON):",
          jsonResponse,
        );

        // Check if it's an array with an output field (n8n format)
        if (
          Array.isArray(jsonResponse) &&
          jsonResponse[0]?.output
        ) {
          const textResponse = jsonResponse[0].output;
          console.log(
            "Extracted text from n8n output:",
            textResponse,
          );
          result = parseAITextResponse(textResponse);
        } else {
          result = jsonResponse;
        }
      } else {
        // Response is plain text
        const textResponse = await response.text();
        console.log(
          "n8n AI Agent Response (Text):",
          textResponse,
        );

        // Parse the AI text response to extract scores and sections
        result = parseAITextResponse(textResponse);
      }

      // Transform the n8n response into our GradingResult format
      // This handles flexible response structures from your n8n workflow
      const gradingResult: GradingResult = {
        id: Date.now().toString(),
        studentName: studentName,
        uploadDate: new Date().toISOString(),
        overallScore:
          result.overallScore ||
          result.overall_score ||
          result.score ||
          0,
        megacodeScores:
          result.megacodeScores ||
          result.megacode_scores ||
          result.scores ||
          [],
        videoUrl: selectedFile.type.startsWith("video/")
          ? URL.createObjectURL(selectedFile)
          : "",
        detailedFeedback:
          result.detailedFeedback ||
          result.detailed_feedback ||
          result.feedback ||
          result.analysis ||
          result.aiResponse ||
          result.fullText ||
          "",
        rawResponse: result, // Store the complete response from n8n
        overallConclusion: result.overallConclusion || "",
      };

      console.log("Processed Grading Result:", gradingResult);

      toast.dismiss(loadingToast);
      toast.success("Analysis complete!");
      onGradingComplete(gradingResult);

      // Reset form
      setStudentName("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.dismiss(loadingToast);

      // Provide specific error messages
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        // Timeout occurred
        toast.error(
          `${isVideo ? "Video" : "Audio"} processing timeout`,
          {
            description: `The ${isVideo ? "video transcription" : "audio transcription"} is taking longer than expected. This could mean:\n• The file is very large\n• n8n workflow is processing slowly\n• Try with a shorter recording or check your n8n workflow`,
            duration: 10000,
          },
        );
      } else if (
        error instanceof TypeError &&
        error.message === "Failed to fetch"
      ) {
        toast.error("Unable to connect to n8n webhook", {
          description:
            "Please ensure:\n• n8n workflow is active and running\n• Network connection is stable",
          duration: 8000,
        });
      } else if (error instanceof Error) {
        toast.error("Failed to process video", {
          description: error.message,
          duration: 5000,
        });
      } else {
        toast.error(
          "An unexpected error occurred. Please try again.",
        );
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
        <h2 className="text-xl font-semibold text-gray-900">
          Upload Training Recording
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Student Name */}
        <div className="space-y-2">
          <Label
            htmlFor="studentName"
            className="text-gray-700"
          >
            Student Name
          </Label>
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

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="mediaFile" className="text-gray-700">
            Training Video or Audio
          </Label>

          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <Video className="w-10 h-10 text-gray-400" />
                <span className="text-gray-300 text-2xl">
                  or
                </span>
                <AudioLines className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Click to upload video or audio
              </p>
              <p className="text-xs text-gray-500">
                Video: MP4, MOV, AVI | Audio: MP3, WAV, M4A
              </p>
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
                    {selectedFile.type.startsWith("video/") ? (
                      <Video className="w-5 h-5 text-blue-600" />
                    ) : (
                      <AudioLines className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(
                        selectedFile.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB •{" "}
                      {selectedFile.type.startsWith("video/")
                        ? "Video"
                        : "Audio"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={isProcessing}
                  className="hover:bg-red-100 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={
            isProcessing || !studentName || !selectedFile
          }
          className="w-full bg-[#3C1053] hover:from-[#3C1053] hover:to-[#1f082b]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Performance...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Analyze
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}