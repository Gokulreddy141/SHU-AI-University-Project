export interface AnalyticsData {
    globalIntegrity: number;
    globalIntegrityTrend: number;
    totalFlagged: number;
    totalFlaggedTrend: number;
    avgGazeDeviation: string;
    avgGazeDeviationTrend: string;
    totalReports: string;
    // Extended real stats
    totalSessions: number;
    completedSessions: number;
    passRate: number | null; // null = no finished sessions yet
    avgViolationsPerSession: number;
    integrityTrends: { date: string; score: number }[];
    heatmap: {
        category: string;
        densities: number[];
    }[];
    recentViolations: {
        id: string;
        sessionId?: string | null;
        candidateName: string;
        candidateInitials?: string;
        candidateAvatar?: string;
        type: string;
        severity: "low" | "moderate" | "critical";
        timestamp: string;
    }[];
    topFlaggedSessions: {
        sessionId: string;
        candidateName: string;
        examTitle: string;
        integrityScore: number;
        totalViolations: number;
        status: string;
    }[];
    violationBreakdown: {
        type: string;
        count: number;
    }[];
}

export interface LiveSessionFeed {
    id: string;
    candidateName: string;
    candidateInitials: string;
    candidateAvatar?: string;
    examCode: string;
    videoUrl?: string; // Optional real stream url
    status: "active" | "flagged" | "loading";
    activeViolation?: {
        message: string;
        type: string;
    };
    snapshot?: string | null; // base64 JPEG from candidate webcam
}
