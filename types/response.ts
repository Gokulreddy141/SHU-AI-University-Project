export interface IResponse {
    _id: string;
    sessionId: string;
    candidateId: string;
    questionId: string;
    type: "MCQ" | "CODING";
    mcqAnswerIndex?: number;
    codeAnswer?: string;
    score?: number;
    isEvaluated: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export type CreateResponsePayload = {
    sessionId: string;
    questionId: string;
    type: "MCQ" | "CODING";
    mcqAnswerIndex?: number;
    codeAnswer?: string;
};
