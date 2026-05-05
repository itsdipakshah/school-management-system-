import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    eventDate: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
    },
    location: {
      type: String,
      required: true
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    eventImage: {
      public_id: { type: String },
      url: { type: String }
    }
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;