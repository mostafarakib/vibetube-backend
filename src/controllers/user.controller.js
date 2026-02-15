import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cleanupLocalFiles } from "../utils/cleanupLocalFiles.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens. Please try again.");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (
      [username, email, password, fullName].some((field) => {
        return field?.trim() === "";
      })
    ) {
      throw new ApiError(400, "All fields are required");
    }

    //validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email!");
    }

    // validate username format
    const usernameRegex = /^[a-zA-Z0-9._]{3,10}$/; // 3-10 characters long, letters, numbers, dots and underscores are allowed only
    if (!usernameRegex.test(username)) {
      throw new ApiError(
        400,
        "Username must be 3-10 characters long and can only contain letters, numbers, dots, and underscores!"
      );
    }
    // prevents username from containing consecutive dots or underscores
    if (username.includes("..") || username.includes("__")) {
      throw new ApiError(
        400,
        "Username cannot contain consecutive dots or underscores!"
      );
    }
    // prevents username from starting or ending with a dot or underscore
    if (
      username.startsWith(".") ||
      username.startsWith("_") ||
      username.endsWith(".") ||
      username.endsWith("_")
    ) {
      throw new ApiError(
        400,
        "Username cannot start or ends with a dot or underscore!"
      );
    }
    // check if user with the same email or username already exists
    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
      throw new ApiError(
        400,
        "User with the same email or username already exists"
      );
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadToCloudinary(avatarLocalPath);
    let coverImage;
    if (coverImageLocalPath) {
      // only attempt to upload if cover image was provided
      coverImage = await uploadToCloudinary(coverImageLocalPath);
    }

    if (!avatar) {
      throw new ApiError(
        400,
        "Failed to upload avatar image. Please try again."
      );
    }

    const user = await User.create({
      username: username.trim().toLowerCase(),
      fullName,
      avatar: avatar.secure_url,
      coverImage: coverImage?.secure_url || "",
      email,
      password,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "Failed to create user. Please try again.");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, "User registered successfully", createdUser));
  } catch (error) {
    cleanupLocalFiles(req.files);
    throw error;
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email?.trim() && !username?.trim()) {
    throw new ApiError(400, "Email or username is required");
  }

  const user = await User.findOne({
    $or: [
      { email: email?.toLowerCase().trim() },
      { username: username?.toLowerCase().trim() },
    ],
  });

  if (!user) {
    throw new ApiError(400, "Invalid email or username");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  await User.findByIdAndUpdate(
    userId,
    { $set: { refreshToken: null } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully", null));
});

export { registerUser, loginUser, logoutUser };
