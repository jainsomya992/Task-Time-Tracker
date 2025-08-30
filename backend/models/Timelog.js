import mongoose from "mongoose";

const TimelogSchema = new mongoose.Schema(
  {
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: {
      type: Number, // Stores duration in seconds
      default: 0,
    },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Timelog = mongoose.model("Timelog", TimelogSchema);
export default Timelog;