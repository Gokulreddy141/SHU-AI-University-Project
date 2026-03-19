export interface IViolationSummary {
    lookingAway: number;
    multipleFaces: number;
    noFace: number;
    lipSyncMismatch: number;
    faceMismatch: number;
    tabSwitch: number;
    copyPaste: number;
    virtualCamera: number;
    devtoolsAccess: number;
    livenessFailure: number;
    secondaryMonitor: number;
    fullscreenExit: number;
    windowBlur: number;
    keyboardShortcut: number;
    clipboardPaste: number;
}

export type SessionStatus =
    | "pending"
    | "biometric_check"
    | "in_progress"
    | "completed"
    | "flagged"
    | "scheduled"
    | "ongoing_call";

export interface IExamSession {
    _id: string;
    examId: string;
    candidateId: string | { _id: string; name: string; email: string };
    recruiterId: string;
    status: SessionStatus;
    startTime?: string;
    endTime?: string;
    scheduledAt?: string;
    stageId?: string;
    examScore?: number;
    maxScore?: number;
    gradingStatus?: "pending" | "auto_graded" | "manual_review_required" | "finalized";
    advancedToSessionId?: string;
    integrityScore: number;
    totalViolations: number;
    violationSummary: IViolationSummary;
    createdAt: string;
}

export interface ICandidateSession {
    _id: string;
    examId: {
        _id: string;
        title: string;
        description?: string;
        duration: number;
    };
    status: SessionStatus;
    examScore?: number;
    maxScore?: number;
    gradingStatus: "pending" | "auto_graded" | "manual_review_required" | "finalized";
    createdAt: string;
}
