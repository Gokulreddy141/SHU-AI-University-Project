import mongoose from "mongoose";

const SupportTicketSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
        publicEmail: {
            type: String,
            trim: true,
            lowercase: true,
        },
        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true,
        },
        message: {
            type: String,
            required: [true, "Message is required"],
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            enum: ["Technical", "Billing", "Account", "Other"],
            default: "Technical",
        },
        status: {
            type: String,
            enum: ["Open", "In Progress", "Resolved", "Closed"],
            default: "Open",
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium",
        },
    },
    {
        timestamps: true,
    }
);

// Index for list views and admin queries
SupportTicketSchema.index({ status: 1, createdAt: -1 });
SupportTicketSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.SupportTicket || mongoose.model("SupportTicket", SupportTicketSchema);
