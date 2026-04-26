export interface IQuestion {
    _id: string;
    examId: string;
    stageId?: string;
    type: "MCQ" | "CODING";
    text: string;
    points: number;
    order: number;
    // Sent to client
    options?: string[];
    allowedLanguages?: string[];
    starterCode?: string;
    correctOptionIndex?: number;
    expectedOutput?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IBulkQuestionInput {
    type: "MCQ" | "CODING";
    text: string;
    points: number;
    options?: string[];
    correctOptionIndex?: number;
    allowedLanguages?: string[];
    starterCode?: string;
    expectedOutput?: string;
    stageId?: string;
}

export interface ICandidateResponse {
    _id: string;
    sessionId: string;
    questionId: string;
    selectedOptionIndex?: number;
    submittedCode?: string;
    selectedLanguage?: string;
    isCorrect?: boolean;
    score?: number;
}
