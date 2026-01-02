import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo'
const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || ''
const apiSecret = process.env.CLOUDINARY_API_SECRET || ''
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ''

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
})

export { cloudinary as cloudinaryConfig }

export const uploadToCloudinary = async (
  file: File | Buffer | string,
  options?: {
    folder?: string
    transformation?: any
    resource_type?: 'image' | 'video' | 'auto'
  }
) => {
  try {
    let result

    if (file instanceof File) {
      // Convert File to Buffer and use upload_stream
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            upload_preset: uploadPreset,
            folder: options?.folder || 'instaclone',
            resource_type: options?.resource_type || 'image',
            transformation: options?.transformation
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        uploadStream.end(buffer)
      })
    } else {
      // For string paths or URLs
      result = await cloudinary.uploader.upload(file, {
        upload_preset: uploadPreset,
        folder: options?.folder || 'instaclone',
        resource_type: options?.resource_type || 'image',
        transformation: options?.transformation
      })
    }

    return {
      success: true,
      url: result.secure_url || result.url,
      publicId: result.public_id,
      assetId: result.asset_id
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return {
      success: false,
      url: null,
      publicId: null,
      assetId: null,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}
