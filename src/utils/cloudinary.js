import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // upload to cloudinary

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file uploaded successfully
    fs.unlinkSync(localFilePath); // delete local file after upload
    console.log("File deleted from local storage:", localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // delete local file on error as well
    return null;
  }
};

export { uploadToCloudinary };
