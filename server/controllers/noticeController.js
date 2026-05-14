import cloudinary from "cloudinary";
import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import Notice from "../models/noticeModel.js";

export const createNotice = asyncHandler(async (req, res, next) => {
  const { title, description, date, audience } = req.body;

  if (!title || !description || !date) {
    return next(new ErrorHandler("Notice title, description and date are required", 400));
  }

  if (!req.files?.noticeImage) {
    return next(new ErrorHandler("Notice image is required", 400));
  }

  const uploadResult = await cloudinary.v2.uploader.upload(req.files.noticeImage.tempFilePath, {
    folder: "NoticeImages",
  });

  if (!uploadResult?.secure_url) {
    return next(new ErrorHandler("Notice image upload failed", 500));
  }

  const notice = await Notice.create({
    title,
    description,
    date: new Date(date),
    audience: audience || "all",
    school: req.user._id,
    noticeImage: {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    },
  });

  res.status(201).json({
    success: true,
    notice,
  });
});

export const getAllNotices = asyncHandler(async (req, res) => {
  const notices = await Notice.find().sort({ date: -1 });
  res.status(200).json({
    success: true,
    notices,
  });
});

export const getNoticeById = asyncHandler(async (req, res, next) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) {
    return next(new ErrorHandler("Notice not found", 404));
  }

  res.status(200).json({
    success: true,
    notice,
  });
});

export const updateNotice = asyncHandler(async (req, res, next) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) {
    return next(new ErrorHandler("Notice not found", 404));
  }

  const { title, description, date, audience } = req.body;
  if (title) notice.title = title;
  if (description) notice.description = description;
  if (date) notice.date = new Date(date);
  if (audience) notice.audience = audience;

  if (req.files?.noticeImage) {
    const uploadResult = await cloudinary.v2.uploader.upload(req.files.noticeImage.tempFilePath, {
      folder: "NoticeImages",
    });
    if (!uploadResult?.secure_url) {
      return next(new ErrorHandler("Notice image upload failed", 500));
    }
    notice.noticeImage = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  await notice.save();

  res.status(200).json({
    success: true,
    notice,
  });
});

export const deleteNotice = asyncHandler(async (req, res, next) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) {
    return next(new ErrorHandler("Notice not found", 404));
  }

  await notice.deleteOne();

  res.status(200).json({
    success: true,
    message: "Notice deleted successfully",
  });
});