import { NextRequest, NextResponse } from 'next/server'
import { getAllMenuItems, createMenuItem } from '@/lib/menu'
import { uploadImage } from '@/lib/upload'

// GET /api/admin/menu/items
export async function GET() {
  try {
    const items = getAllMenuItems(1)
    return NextResponse.json({ data: items })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: { code: err.message, message: err.message } }, { status: 500 })
  }
}

// POST /api/admin/menu/items — 메뉴 등록 (multipart)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const price = Number(formData.get('price'))
    const description = (formData.get('description') as string) || ''
    const categoryId = Number(formData.get('categoryId'))
    const imageFile = formData.get('image') as File | null

    if (!name || name.length > 100) {
      return NextResponse.json({ error: { code: 'INVALID_MENU_NAME', message: '메뉴명은 1~100자입니다.' } }, { status: 400 })
    }
    if (price < 100 || price > 10000000) {
      return NextResponse.json({ error: { code: 'INVALID_PRICE', message: '가격은 100~10,000,000원입니다.' } }, { status: 400 })
    }

    let imagePath: string | undefined
    if (imageFile && imageFile.size > 0) {
      imagePath = await uploadImage(imageFile)
    }

    const item = createMenuItem({ name, price, description, categoryId, imagePath })
    return NextResponse.json({ data: item }, { status: 201 })
  } catch (e) {
    const err = e as Error
    const statusCode = ['INVALID_IMAGE_FORMAT', 'IMAGE_TOO_LARGE'].includes(err.message) ? 400 : 500
    return NextResponse.json({ error: { code: err.message, message: err.message } }, { status: statusCode })
  }
}
