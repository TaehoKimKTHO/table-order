import { NextRequest, NextResponse } from 'next/server'
import { getMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/menu'
import { uploadImage, deleteImage } from '@/lib/upload'

// PUT /api/admin/menu/items/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()
    const updateData: Record<string, unknown> = {}

    const name = formData.get('name') as string | null
    if (name) updateData.name = name
    const price = formData.get('price')
    if (price) updateData.price = Number(price)
    const description = formData.get('description')
    if (description !== null) updateData.description = description as string
    const categoryId = formData.get('categoryId')
    if (categoryId) updateData.categoryId = Number(categoryId)
    const isAvailable = formData.get('isAvailable')
    if (isAvailable !== null) updateData.isAvailable = isAvailable === 'true'

    const imageFile = formData.get('image') as File | null
    if (imageFile && imageFile.size > 0) {
      // 기존 이미지 삭제
      const existing = getMenuItem(Number(id))
      if (existing?.imagePath) deleteImage(existing.imagePath)
      updateData.imagePath = await uploadImage(imageFile)
    }

    const item = updateMenuItem(Number(id), updateData)
    return NextResponse.json({ data: item })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: { code: err.message, message: err.message } }, { status: 500 })
  }
}

// DELETE /api/admin/menu/items/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = getMenuItem(Number(id))
    if (existing?.imagePath) deleteImage(existing.imagePath)
    deleteMenuItem(Number(id))
    return NextResponse.json({ data: { success: true } })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: { code: err.message, message: err.message } }, { status: 500 })
  }
}
