export interface CandidateSummary {
    _id: string;
    name: string;
    email: string;
    department?: string;
    totalExams: number;
    avgIntegrity: number;
    status: "active" | "verified" | "blocked";
}

export interface IBulkCandidateInput {
    name: string;
    email: string;
    phone?: string;
    department?: string;
}

export interface PopulatedSession {
    _id: string;
    examId: {
        _id: string;
        title: string;
        duration: number;
        proctoringMode: string;
        status: string;
    } | string;
    candidateId: string;
    status: "pending" | "biometric_check" | "in_progress" | "completed" | "flagged";
    startTime?: string;
    endTime?: string;
    integrityScore?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CandidateDashboardData {
    activeSessions: PopulatedSession[];
    pastSessions: PopulatedSession[];
}
