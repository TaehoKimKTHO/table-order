import { NextRequest, NextResponse } from 'next/server'
import { getCategories, createCategory } from '@/lib/menu'

// GET /api/admin/menu/categories
export async function GET() {
  try {
    const categories = getCategories(1)
    return NextResponse.json({ data: categories })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: { code: err.message, message: err.message } }, { status: 500 })
  }
}

// POST /api/admin/menu/categories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, sortOrder } = body
    if (!name || name.trim().length === 0 || name.length > 50) {
      return NextResponse.json(
        { error: { code: 'INVALID_CATEGORY_NAME', message: '카테고리명은 1~50자입니다.' } },
        { status: 400 }
      )
    }
    const category = createCategory(1, name, sortOrder)
    return NextResponse.json({ data: category }, { status: 201 })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: { code: err.message, message: err.message } }, { status: 500 })
  }
}
