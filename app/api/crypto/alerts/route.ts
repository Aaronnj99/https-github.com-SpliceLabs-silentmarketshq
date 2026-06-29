import { NextRequest, NextResponse } from 'next/server'
import { getAlerts, createAlert, deleteAlert, updateAlert, getAlertHistory } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const alerts = await getAlerts()
    const history = await getAlertHistory()
    return NextResponse.json({ alerts, history })
  } catch (error) {
    console.error('Alerts GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      coin?: string
      condition?: string
      target_price?: number
      note?: string
    }

    const { coin, condition, target_price, note } = body

    if (!coin || !condition || target_price === undefined) {
      return NextResponse.json(
        { error: 'coin, condition, and target_price are required' },
        { status: 400 }
      )
    }

    if (!['above', 'below'].includes(condition)) {
      return NextResponse.json(
        { error: 'condition must be "above" or "below"' },
        { status: 400 }
      )
    }

    if (typeof target_price !== 'number' || isNaN(target_price) || target_price <= 0) {
      return NextResponse.json(
        { error: 'target_price must be a positive number' },
        { status: 400 }
      )
    }

    const alert = await createAlert(
      coin,
      condition as 'above' | 'below',
      target_price,
      note
    )
    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    console.error('Alerts POST error:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') ?? '', 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid or missing id' }, { status: 400 })
    }

    const body = await request.json() as Record<string, unknown>
    const updated = await updateAlert(id, body)
    if (!updated) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Alerts PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') ?? '', 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid or missing id' }, { status: 400 })
    }

    await deleteAlert(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Alerts DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}
