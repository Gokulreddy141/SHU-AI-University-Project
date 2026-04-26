"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ExamReport, ExamCandidate } from "@/hooks/useExamReports";

interface ExamReportSectionProps {
    exams: ExamReport[];
    loading: boolean;
}

function statusColor(status: string) {
    switch (status) {
        case "completed": return "text-green-400 bg-green-500/10 border-green-500/20";
        case "flagged": return "text-[#e64d4d] bg-[#e64d4d]/10 border-[#e64d4d]/20";
        case "in_progress": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
        case "biometric_check": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
        default: return "text-slate-400 bg-[#262626] border-[#3b3b3b]";
    }
}

function statusLabel(status: string) {
    switch (status) {
        case "completed": return "Completed";
        case "flagged": return "Flagged";
        case "in_progress": return "In Progress";
        case "biometric_check": return "Biometric";
        case "pending": return "Pending";
        default: return status;
    }
}

function examStatusDot(status: string) {
    switch (status) {
        case "active": return "bg-green-400";
        case "closed": return "bg-slate-500";
        case "draft": return "bg-amber-400";
        default: return "bg-slate-500";
    }
}

function IntegrityBar({ score }: { score: number }) {
    const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-[#e64d4d]";
    return (
        <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-[#3b3b3b] overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
            </div>
            <span className={`text-xs font-mono font-bold ${score >= 80 ? "text-green-400" : score >= 60 ? "text-amber-400" : "text-[#e64d4d]"}`}>
                {score}
            </span>
        </div>
    );
}

function CandidateRow({ candidate, onClick }: { candidate: ExamCandidate; onClick: () => void }) {
    return (
        <tr
            onClick={onClick}
            className="hover:bg-primary/5 cursor-pointer transition-colors border-b border-[#3b3b3b]/30 last:border-0"
        >
            <td className="px-6 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#262626] border border-[#3b3b3b] flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
                        {candidate.initials}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white leading-none">{candidate.name}</p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">{candidate.email}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColor(candidate.status)}`}>
                    {statusLabel(candidate.status)}
                </span>
            </td>
            <td className="px-6 py-3">
                <IntegrityBar score={candidate.integrityScore} />
            </td>
            <td className="px-6 py-3 text-center">
                {candidate.totalViolations > 0 ? (
                    <span className="text-[#e64d4d] font-bold font-mono text-sm">{candidate.totalViolations}</span>
                ) : (
                    <span className="text-slate-500 font-mono text-sm">0</span>
                )}
            </td>
            <td className="px-6 py-3 font-mono text-[10px] text-slate-500">
                {candidate.startTime
                    ? new Date(candidate.startTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "—"}
            </td>
            <td className="px-6 py-3 text-right">
                <span className="text-primary text-xs hover:underline">View Report →</span>
            </td>
        </tr>
    );
}

function ExamAccordionRow({ exam }: { exam: ExamReport }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const hasFlagged = exam.summary.flagged > 0;

    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${hasFlagged ? "border-[#e64d4d]/30" : "border-[#3b3b3b]"}`}>
            {/* Exam Header — click to expand */}
            <button
                onClick={() => setOpen((p) => !p)}
                className="w-full flex items-center justify-between px-6 py-4 bg-[#1a1a1a] hover:bg-[#262626] transition-colors text-left"
            >
                <div className="flex items-center gap-4">
                    {/* Exam status dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${examStatusDot(exam.status)}`} />

                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-white font-semibold text-sm">{exam.title}</span>
                            <span className="text-[10px] font-mono text-slate-500 bg-[#0f0f0f] border border-[#3b3b3b] px-2 py-0.5 rounded">
                                {exam.sessionCode}
                            </span>
                            {exam.proctoringMode && (
                                <span className="text-[10px] font-mono text-primary/70 bg-primary/5 border border-primary/20 px-2 py-0.5 rounded uppercase">
                                    {exam.proctoringMode}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-[10px] text-slate-500 font-mono">{exam.duration}m</span>
                            <span className="text-[10px] text-slate-500 font-mono">{exam.questionsCount} questions</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                                Created {new Date(exam.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right side: summary pills + chevron */}
                <div className="flex items-center gap-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="text-center">
                            <p className="text-lg font-bold text-white leading-none">{exam.summary.total}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-mono mt-0.5">Attended</p>
                        </div>
                        <div className="w-px h-8 bg-[#3b3b3b]" />
                        <div className="text-center">
                            <p className="text-lg font-bold text-green-400 leading-none">{exam.summary.completed}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-mono mt-0.5">Completed</p>
                        </div>
                        {exam.summary.inProgress > 0 && (
                            <>
                                <div className="w-px h-8 bg-[#3b3b3b]" />
                                <div className="text-center">
                                    <p className="text-lg font-bold text-blue-400 leading-none">{exam.summary.inProgress}</p>
                                    <p className="text-[9px] text-slate-500 uppercase font-mono mt-0.5">Live</p>
                                </div>
                            </>
                        )}
                        {exam.summary.flagged > 0 && (
                            <>
                                <div className="w-px h-8 bg-[#3b3b3b]" />
                                <div className="text-center">
                                    <p className="text-lg font-bold text-[#e64d4d] leading-none">{exam.summary.flagged}</p>
                                    <p className="text-[9px] text-slate-500 uppercase font-mono mt-0.5">Flagged</p>
                                </div>
                            </>
                        )}
                    </div>

                    <span className={`material-symbols-outlined text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>
                        expand_more
                    </span>
                </div>
            </button>

            {/* Candidate Table — shown when expanded */}
            {open && (
                <div className="bg-[#0f0f0f] border-t border-[#3b3b3b]">
                    {exam.candidates.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-sm">
                            <span className="material-symbols-outlined text-3xl block mb-2 text-slate-600">person_off</span>
                            No candidates have attended this exam yet.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#3b3b3b] text-slate-500 font-mono text-[10px] uppercase">
                                    <th className="px-6 py-3">Candidate</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Integrity Score</th>
                                    <th className="px-6 py-3 text-center">Violations</th>
                                    <th className="px-6 py-3">Started At</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exam.candidates.map((c) => (
                                    <CandidateRow
                                        key={c.sessionId}
                                        candidate={c}
                                        onClick={() => router.push(`/dashboard/session/${c.sessionId}`)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}

function ExamReportSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="border border-[#3b3b3b] rounded-xl bg-[#1a1a1a] p-5 animate-pulse">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-4 w-48 bg-[#262626] rounded" />
                            <div className="h-3 w-32 bg-[#262626] rounded" />
                        </div>
                        <div className="flex gap-4">
                            <div className="h-8 w-12 bg-[#262626] rounded" />
                            <div className="h-8 w-12 bg-[#262626] rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function ExamReportSection({ exams, loading }: ExamReportSectionProps) {
    return (
        <div className="rounded-xl border border-[#3b3b3b] bg-[#1a1a1a] overflow-hidden">
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-[#3b3b3b] flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">Exam-wise Report</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Click an exam to see which candidates attended and their violation details.</p>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-[#0f0f0f] border border-[#3b3b3b] px-3 py-1 rounded">
                    {exams.length} exam{exams.length !== 1 ? "s" : ""}
                </span>
            </div>

            <div className="p-4 space-y-3">
                {loading ? (
                    <ExamReportSkeleton />
                ) : exams.length === 0 ? (
                    <div className="py-16 text-center text-slate-500">
                        <span className="material-symbols-outlined text-4xl block mb-3 text-slate-600">assignment</span>
                        <p className="text-sm">No exams found. Create an exam to get started.</p>
                    </div>
                ) : (
                    exams.map((exam) => <ExamAccordionRow key={exam.id} exam={exam} />)
                )}
            </div>
        </div>
    );
}
