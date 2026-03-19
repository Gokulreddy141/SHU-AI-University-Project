export interface AnalyticsData {
    globalIntegrity: number;
    globalIntegrityTrend: number;
    totalFlagged: number;
    totalFlaggedTrend: number;
    avgGazeDeviation: string;
    avgGazeDeviationTrend: string;
    totalReports: string;
    integrityTrends: { date: string; score: number }[];
    heatmap: {
        category: string;
        densities: number[]; // 0 to 5 mapped to time blocks
    }[];
    recentViolations: {
        id: string;
        candidateName: string;
        candidateInitials?: string;
        candidateAvatar?: string;
        type: string;
        severity: "low" | "moderate" | "critical";
        timestamp: string;
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
}
