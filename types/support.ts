export interface SupportTicket {
    _id: string;
    userId?: string;
    publicEmail?: string;
    subject: string;
    message: string;
    category: "Technical" | "Billing" | "Account" | "Other";
    status: "Open" | "In Progress" | "Resolved" | "Closed";
    priority: "Low" | "Medium" | "High";
    createdAt: string;
    updatedAt: string;
}

export interface CreateSupportTicketPayload {
    subject: string;
    message: string;
    category: string;
    priority?: string;
    publicEmail?: string;
}

export interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: "General" | "Technical" | "Account" | "Proctoring";
}
