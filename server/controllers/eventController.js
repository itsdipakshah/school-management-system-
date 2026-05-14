import cloudinary from "cloudinary";
import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import Event from "../models/eventModel.js";

export const createEvent = asyncHandler(async (req, res, next) => {
  const { title, description, eventDate, startTime, endTime, location } = req.body;

  if (!title || !description || !eventDate || !startTime || !location) {
    return next(new ErrorHandler("Event title, description, date, start time, and location are required", 400));
  }

  let imagePayload = undefined;
  if (req.files?.eventImage) {
    const uploadResult = await cloudinary.v2.uploader.upload(req.files.eventImage.tempFilePath, {
      folder: "EventImages",
    });
    if (!uploadResult?.secure_url) {
      return next(new ErrorHandler("Event image upload failed", 500));
    }
    imagePayload = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  const event = await Event.create({
    title,
    description,
    eventDate: new Date(eventDate),
    startTime,
    endTime,
    location,
    school: req.user._id,
    eventImage: imagePayload || {},
  });

  res.status(201).json({
    success: true,
    event,
  });
});

export const getAllEvents = asyncHandler(async (req, res) => {
  const events = await Event.find().sort({ eventDate: 1 });
  res.status(200).json({ success: true, events });
});

export const getEventById = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  res.status(200).json({ success: true, event });
});

export const updateEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  const { title, description, eventDate, startTime, endTime, location } = req.body;
  if (title) event.title = title;
  if (description) event.description = description;
  if (eventDate) event.eventDate = new Date(eventDate);
  if (startTime) event.startTime = startTime;
  if (endTime !== undefined) event.endTime = endTime;
  if (location) event.location = location;

  if (req.files?.eventImage) {
    const uploadResult = await cloudinary.v2.uploader.upload(req.files.eventImage.tempFilePath, {
      folder: "EventImages",
    });
    if (!uploadResult?.secure_url) {
      return next(new ErrorHandler("Event image upload failed", 500));
    }
    event.eventImage = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  await event.save();

  res.status(200).json({ success: true, event });
});

export const deleteEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  await event.deleteOne();

  res.status(200).json({ success: true, message: "Event deleted successfully" });
});