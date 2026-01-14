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
        fs.unlinkSync(localpath) // remove file locally for server if operation succeded

        return response

    } catch (error) {
        fs.unlinkSync(localpath) // remove the locally stored files as operation failed 
        console.error("Error uploading to cloudinary:", error);
        return null
    }
}

export { uploadOnCloudinary }