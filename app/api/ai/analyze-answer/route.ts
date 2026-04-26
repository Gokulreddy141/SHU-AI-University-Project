import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { handleApiError } from "@/lib/apiUtils";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

/**
 * POST /api/ai/analyze-answer
 *
 * Analyzes a candidate's answer for AI-generation signals:
 * 1. Semantic similarity to known GPT/Claude output patterns
 * 2. Vocabulary complexity vs. prior answers in the session
 * 3. Answer length anomaly (suspiciously perfect/complete answers)
 * 4. Temporal anomaly passed in from the client (typed too fast for the length)
 *
 * Returns:
 *   { isAiGenerated: boolean, confidence: number, reason: string }
 */
export async function POST(req: Request) {
    try {
        const {
            sessionId,
            candidateId,
            questionText,
            answerText,
            timeSpentSeconds,
            questionIndex,
        }: {
            sessionId: string;
            candidateId: string;
            questionText: string;
            answerText: string;
            timeSpentSeconds: number;
            questionIndex: number;
        } = await req.json();

        if (!sessionId || !candidateId || !answerText || answerText.trim().length < 30) {
            return NextResponse.json({ isAiGenerated: false, confidence: 0, reason: "answer too short" });
        }

        // ── Fast heuristic checks (no API call needed) ──

        const words = answerText.trim().split(/\s+/);
        const wordCount = words.length;
        const charCount = answerText.length;

        // Typing speed anomaly: if answer is long but was submitted very fast
        // Average human typing: 40 WPM = 0.67 words/sec
        const expectedMinSeconds = wordCount / 0.67;
        const isTypingTooFast = timeSpentSeconds > 0 && timeSpentSeconds < expectedMinSeconds * 0.4;

        // Lexical diversity (Type-Token Ratio) — AI tends to use more varied vocab
        const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, "")));
        const ttr = uniqueWords.size / wordCount;
        const isHighTTR = ttr > 0.82 && wordCount > 50; // Human average ~0.6-0.75

        // Very long answer (> 300 words) submitted quickly
        const isLongAndFast = wordCount > 300 && timeSpentSeconds < 120;

        // If heuristics already give high confidence, skip Gemini call
        let heuristicConfidence = 0;
        if (isTypingTooFast) heuristicConfidence += 0.45;
        if (isHighTTR) heuristicConfidence += 0.25;
        if (isLongAndFast) heuristicConfidence += 0.20;

        if (heuristicConfidence >= 0.70) {
            const reasons: string[] = [];
            if (isTypingTooFast) reasons.push(`typed ${Math.round(wordCount / timeSpentSeconds * 60)} WPM`);
            if (isHighTTR) reasons.push(`TTR=${ttr.toFixed(2)}`);
            if (isLongAndFast) reasons.push(`${wordCount}w in ${timeSpentSeconds}s`);

            // Log violation directly
            await fetch(new URL("/api/violation", req.url).toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    candidateId,
                    type: "SEMANTIC_ANSWER_ANOMALY",
                    direction: `Q${questionIndex + 1} ${reasons.join(" ")} CHARS:${charCount}`,
                    timestamp: new Date().toISOString(),
                    confidence: Math.min(0.95, heuristicConfidence),
                }),
            });

            return NextResponse.json({
                isAiGenerated: true,
                confidence: heuristicConfidence,
                reason: reasons.join(", "),
            });
        }

        // ── Gemini semantic analysis (for borderline cases) ──
        if (!GEMINI_API_KEY) {
            return NextResponse.json({ isAiGenerated: false, confidence: 0, reason: "no API key" });
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `You are an AI detection expert analyzing exam answers for AI generation.

Question: "${questionText}"

Candidate's Answer (${wordCount} words, written in ${timeSpentSeconds}s):
"${answerText.slice(0, 1500)}"

Analyze this answer for signs of AI generation. Look for:
1. Unnaturally formal or structured language for the context
2. Excessive completeness/hedging ("It's worth noting...", "In conclusion...")
3. Generic, non-specific phrasing that avoids personal experience
4. Consistent use of transitional phrases typical of AI (Furthermore, Moreover, Additionally)
5. Perfect grammar with no colloquialisms in informal questions

Respond with ONLY this JSON (no explanation):
{"isAiGenerated": true/false, "confidence": 0.0-1.0, "reason": "brief explanation"}

Be conservative — only flag as AI if confidence > 0.80.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ isAiGenerated: false, confidence: 0, reason: "parse error" });
        }

        const analysis = JSON.parse(jsonMatch[0]) as {
            isAiGenerated: boolean;
            confidence: number;
            reason: string;
        };

        // Log violation if Gemini flags it
        if (analysis.isAiGenerated && analysis.confidence >= 0.80) {
            await fetch(new URL("/api/violation", req.url).toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    candidateId,
                    type: "SEMANTIC_ANSWER_ANOMALY",
                    direction: `Q${questionIndex + 1} GEMINI:${analysis.reason?.slice(0, 100)} CHARS:${charCount}`,
                    timestamp: new Date().toISOString(),
                    confidence: analysis.confidence,
                }),
            });
        }

        return NextResponse.json(analysis);
    } catch (error) {
        return handleApiError(error);
    }
}
