// Upload Module — Unit 3 (스텁)

import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

export async function uploadImage(file: File): Promise<string> {
  ensureUploadDir()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const allowed = ['jpg', 'jpeg', 'png', 'webp']
  if (!allowed.includes(ext)) throw new Error('INVALID_IMAGE_FORMAT')
  if (file.size > 5 * 1024 * 1024) throw new Error('IMAGE_TOO_LARGE')

  const filename = `${uuidv4()}.${ext}`
  const filePath = path.join(UPLOAD_DIR, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(filePath, buffer)
  return `/uploads/${filename}`
}

export function deleteImage(filePath: string): void {
  const fullPath = path.join(process.cwd(), 'public', filePath)
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath)
  }
}

export function getImagePath(filename: string): string {
  return `/uploads/${filename}`
}
