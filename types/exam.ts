export interface IExamStage {
    _id?: string;
    title: string;
    type: "MCQ" | "CODING" | "LIVE_INTERVIEW";
    duration: number; // minutes
    order: number;
}

export interface IExam {
    _id: string;
    recruiterId: string;
    title: string;
    description?: string;
    duration: number;
    sessionCode: string;
    status: "draft" | "active" | "closed";
    flagThreshold: number;
    proctoringMode: "strict" | "standard" | "light";
    questionsCount: number;
    stages?: IExamStage[];
    createdAt: string;

    // Transient fields fetched via aggregation API
    activeSessionsCount?: number;
}

export interface CreateExamPayload {
    recruiterId: string;
    title: string;
    description?: string;
    duration: number;
    flagThreshold?: number;
}
