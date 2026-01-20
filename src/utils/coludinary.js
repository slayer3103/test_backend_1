import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'




// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localpath) => {
    try {
        if (!localpath) return null // file not found

        // if file found , aadd it to cloudinary
        const response = await cloudinary.uploader.upload(localpath, {
            resource_type: "auto"
        })
        console.log('file upload successfull', response.url);

        // SAFE CLEANUP: Check if file exists before deleting
        try {
            if (fs.existsSync(localpath)) {
                fs.unlinkSync(localpath)
            }
        } catch (unlinkError) {
            console.error("Error deleting local file after upload:", unlinkError);
        }

        return response

    } catch (error) {
        // SAFE CLEANUP in catch block
        try {
            if (fs.existsSync(localpath)) {
                fs.unlinkSync(localpath)
            }
        } catch (unlinkError) {
            console.error("Error deleting local file after failed upload:", unlinkError);
        }

        console.error("Error uploading to cloudinary:", error);
        return null
    }
}

const deleteFromCloudinary = async (url) => {
    try {
        if (!url) return null
        // Extract public_id from URL
        // Matches pattern: .../upload/(optional version v123/)(public_id).(extension)
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
        const match = url.match(regex);
        const publicId = match ? match[1] : null;

        if (!publicId) {
            console.log("Could not extract public_id from url", url);
            return null;
        }
        const response = await cloudinary.uploader.destroy(publicId)
        console.log("File deleted from cloudinary", response);
        return response
    } catch (error) {
        console.error("Error deleting from cloudinary:", error);
        return null
    }
}
export { uploadOnCloudinary, deleteFromCloudinary }