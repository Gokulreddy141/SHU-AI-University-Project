import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const INTEGRITY_PROMPT = (violationSummary: string, sessionMeta: string) => `
You are an expert exam integrity analyst reviewing a proctored online interview session.

SESSION METADATA:
${sessionMeta}

VIOLATION LOG (type → count):
${violationSummary}

Analyse the violation pattern and produce a structured integrity assessment for the recruiter.
Respond ONLY in this exact JSON format:

{
  "verdict": "CLEAN" | "SUSPICIOUS" | "HIGH_RISK",
  "confidence": 0.0-1.0,
  "headline": "One concise sentence summarising the integrity status",
  "riskFactors": [
    { "factor": "short name", "severity": "low"|"medium"|"high", "explanation": "1-2 sentence explanation" }
  ],
  "positiveIndicators": ["list of behaviours that support legitimacy"],
  "recommendation": "clear recruiter action: PASS | MANUAL_REVIEW | DISQUALIFY",
  "reasoning": "2-3 paragraph detailed analysis for the recruiter"
}

Rules:
- CLEAN = no significant patterns, minor/isolated incidents only
- SUSPICIOUS = notable patterns that warrant human review  
- HIGH_RISK = clear evidence of cheating or coordinated misconduct
- Be objective. An absence of violations is a strong positive signal.
- Do NOT fabricate violations that aren't in the log.
`;

export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API not configured" }, { status: 503 });
        }

        await connectToDatabase();

        const { sessionId } = await req.json();
        if (!sessionId) {
            return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
        }

        const session = await ExamSession.findById(sessionId)
            .populate("examId", "title duration proctoringMode")
            .populate("candidateId", "name email")
            .select("status integrityScore totalViolations violationSummary startTime endTime")
            .lean();

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Build violation summary string
        const summary = session.violationSummary as Record<string, number> | undefined;
        const violationLines = summary && Object.keys(summary).length > 0
            ? Object.entries(summary)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([type, count]) => `  • ${type}: ${count}`)
                .join("\n")
            : "  • No violations recorded";

        const examTitle = (session.examId as { title?: string })?.title || "Unknown Exam";
        const examDuration = (session.examId as { duration?: number })?.duration || 0;
        const proctoringMode = (session.examId as { proctoringMode?: string })?.proctoringMode || "standard";
        const candidateName = (session.candidateId as { name?: string })?.name || "Unknown Candidate";

        const durationMins = session.startTime && session.endTime
            ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)
            : examDuration;

        const sessionMeta = [
            `Exam: ${examTitle}`,
            `Candidate: ${candidateName}`,
            `Proctoring mode: ${proctoringMode}`,
            `Session status: ${session.status}`,
            `Integrity score: ${session.integrityScore ?? "N/A"}%`,
            `Total violations: ${session.totalViolations ?? 0}`,
            `Duration: ${durationMins} minutes`,
        ].join("\n");

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        });

        const result = await model.generateContent(
            INTEGRITY_PROMPT(violationLines, sessionMeta)
        );

        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ error: "AI response malformed" }, { status: 502 });
        }

        const report = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ report, generatedAt: new Date().toISOString() });

    } catch (error: unknown) {
        console.error("Integrity report error:", error);
        return NextResponse.json({ error: "Failed to generate integrity report" }, { status: 500 });
    }
}
