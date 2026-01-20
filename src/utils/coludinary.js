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

export { uploadOnCloudinary }