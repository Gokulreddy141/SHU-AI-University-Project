import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const ANALYSIS_PROMPT = `You are an expert AI exam integrity monitor. Analyze this webcam screenshot from a candidate taking a live proctored online exam.

Your vision must catch both obvious and sophisticated cheating that algorithmic detectors miss.

━━━ STANDARD VIOLATIONS ━━━
1. MULTIPLE_FACES — more than one face visible in frame
2. NO_FACE — no face detected (candidate absent, camera covered)
3. LOOKING_AWAY — candidate clearly looking away from screen
4. PHONE_DETECTED — mobile phone or tablet visible anywhere in frame
5. NOTES_DETECTED — physical papers, notes, books, or printed materials visible
6. SECOND_PERSON — another person visible or partially visible (arm, shadow, reflection)

━━━ ADVANCED VIOLATIONS — EXAMINE CAREFULLY ━━━

7. EARPIECE_DETECTED — Look closely at BOTH ears:
   - Any small in-ear device, earbud, or hearing-aid-like object in the ear canal
   - One earlobe has something inserted or clipped to it
   - Small wire running behind the ear toward collar
   Describe exactly which ear and what you see.

8. SMART_GLASSES_DETECTED — If the candidate is wearing glasses, examine the lenses and frame:
   - Any unusual glow, illumination, or colored reflection on a lens that doesn't match room lighting
   - A small camera dot, LED, or sensor on the bridge or temple arms
   - Lenses appear to have a subtle display or heads-up overlay
   - Frame is unusually thick at the temples compared to normal eyewear
   Describe what specifically looks different about the glasses.

9. SECOND_SCREEN_DETECTED — Look for evidence of a hidden secondary display:
   - A color glow or light on the candidate's face/glasses that doesn't match the primary monitor color
   - Background lighting changes or flickers from an off-camera source
   - Reflection of text, UI, or screen content visible on glasses lenses, a window behind the candidate, or a glossy surface
   - Partial view of another monitor bezel, keyboard, or desk area
   Describe the specific visual evidence of the second screen.

━━━ RESPONSE FORMAT ━━━
{
  "violations": [
    { "type": "VIOLATION_TYPE", "confidence": 0.0-1.0, "description": "specific observation" }
  ],
  "faceCount": 0,
  "candidateAttentive": true/false,
  "summary": "one sentence"
}

Rules:
- Only report violations with confidence >= 0.75
- For violations 7-9: confidence must be >= 0.80 and description must name the exact visual evidence
- If no violations, return violations as an empty array
- Do NOT flag normal eyeglasses, normal headphones worn around neck, or normal single-monitor room lighting`;

export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API not configured" }, { status: 503 });
        }

        const { imageBase64, mimeType = "image/jpeg" } = await req.json();

        if (!imageBase64) {
            return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
        }

        const model = genAI!.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent([
            {
                inlineData: {
                    data: imageBase64,
                    mimeType,
                },
            },
            ANALYSIS_PROMPT,
        ]);

        const text = result.response.text();

        // Extract JSON from response (Gemini sometimes wraps in markdown)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ violations: [], faceCount: 1, candidateAttentive: true, summary: "Analysis inconclusive" });
        }

        const analysis = JSON.parse(jsonMatch[0]);
        return NextResponse.json(analysis);

    } catch (error: unknown) {
        console.error("Gemini monitor error:", error);

        // Extract rate-limit details from the error if present
        const status = (error as { status?: number })?.status;
        if (status === 429) {
            // Parse the retryDelay from the error details if available
            let retryAfterMs = 60_000; // default 1 minute
            try {
                const details = (error as { errorDetails?: { "@type": string; retryDelay?: string }[] })?.errorDetails;
                const retryInfo = details?.find(d => d["@type"]?.includes("RetryInfo"));
                if (retryInfo?.retryDelay) {
                    const seconds = parseFloat(retryInfo.retryDelay.replace("s", ""));
                    retryAfterMs = Math.ceil(seconds) * 1000;
                }
            } catch { /* ignore parse errors */ }

            // Tell the client exactly how long to wait before retrying
            return NextResponse.json(
                { error: "quota_exceeded", retryAfterMs },
                {
                    status: 429,
                    headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) }
                }
            );
        }

        // Any other error — degrade gracefully, don't break the exam
        return NextResponse.json(
            { error: "unavailable" },
            { status: 503 }
        );
    }
}
