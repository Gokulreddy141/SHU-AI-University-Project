import { NextResponse } from "next/server";

const FAQ_DATA = [
    {
        id: "faq-1",
        question: "How do I ensure my camera is working correctly?",
        answer: "Before starting an exam, you will be prompted for camera permissions. Ensure your browser is allowed to access the camera and that you are in a well-lit environment.",
        category: "Technical"
    },
    {
        id: "faq-2",
        question: "What happens if I accidentally close the exam tab?",
        answer: "The proctoring system will flag a tab-exit violation. However, you can usually rejoin the exam within a short time window if the recruiter has allowed re-entry.",
        category: "Proctoring"
    },
    {
        id: "faq-3",
        question: "Why am I getting a 'Liveness Failure' alert?",
        answer: "Liveness failures occur when the AI cannot verify that a real person is present. This can be caused by low light, poor camera angles, or objects obstructing your face.",
        category: "Proctoring"
    },
    {
        id: "faq-4",
        question: "How do I update my profile department?",
        answer: "Go to Settings in your sidebar and update the 'Department' field under Profile Information.",
        category: "Account"
    }
];

export async function GET() {
    return NextResponse.json({ items: FAQ_DATA });
}
