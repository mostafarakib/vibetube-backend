import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;

  console.log("Registering user:", { username, email, fullName, password });
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
});

export { registerUser };
