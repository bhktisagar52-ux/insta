import { v2 as cloudinary } from "cloudinary"
import { NextResponse } from "next/server"

// Configure Cloudinary (required)
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

if (!cloudName || !apiKey || !apiSecret || !uploadPreset) {
  console.error('Cloudinary configuration missing. Please set all required environment variables.')
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  })
}

export async function POST(req: Request) {
  try {
    console.log('=== UPLOAD API CALLED ===')
    console.log('Cloudinary config check:')
    console.log('cloudName:', cloudName ? 'set' : 'missing')
    console.log('apiKey:', apiKey ? 'set' : 'missing')
    console.log('apiSecret:', apiSecret ? 'set' : 'missing')
    console.log('uploadPreset:', uploadPreset ? 'set' : 'missing')

    // Check if Cloudinary is configured
    if (!cloudName || !apiKey || !apiSecret || !uploadPreset) {
      console.error('Cloudinary not configured')
      return NextResponse.json(
        { error: 'Cloudinary not configured. Please set all required environment variables.' },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const folder = formData.get('folder') as string || 'stories'

    if (!file) {
      console.log('No file provided')
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      console.log(`File too large: ${file.size} bytes`)
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    // Cloudinary upload using upload method (more reliable for large files)
    console.log('Using Cloudinary upload')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('Starting Cloudinary upload...')
    const base64String = `data:${file.type};base64,${buffer.toString('base64')}`

    console.log('Starting Cloudinary upload_stream...')
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "image",
          upload_preset: uploadPreset,
          timeout: 120000, // 120 second timeout
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload_stream error:', error)
            reject(error)
          } else {
            console.log('Cloudinary upload_stream success')
            resolve(result)
          }
        }
      )
      uploadStream.end(buffer)
    })

    console.log('Cloudinary upload success:', uploadResult.secure_url)

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      assetId: uploadResult.asset_id
    })
  } catch (error) {
    console.error("UPLOAD ERROR:", error)
    console.error("Error type:", typeof error)
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack')

    let errorMessage = 'Unknown upload error'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'object' && error !== null) {
      // Handle Cloudinary error objects
      errorMessage = (error as any).message || (error as any).error?.message || JSON.stringify(error)
    } else {
      errorMessage = String(error)
    }

    return NextResponse.json(
      { error: `Upload failed: ${errorMessage}` },
      { status: 500 }
    )
  }
}
