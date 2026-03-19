import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
  },
  mobile: {
    type: String,
  },
  role: {
    type: String,
    enum: ["candidate", "recruiter"],
    default: "candidate",
  },
  department: {
    type: String,
    default: "Unassigned",
  },
  biometricEnrolled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);