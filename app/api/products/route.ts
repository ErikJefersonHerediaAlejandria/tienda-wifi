import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 1. OBTENER todos los productos y planes de Wi-Fi (GET)
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener los productos del almacén' },
      { status: 500 }
    )
  }
}

// 2. CREAR un nuevo plan de Wi-Fi o equipo en el almacén (POST)
export async function POST(request: Request) {
  try {
    const { title, description, price, stock, type } = await request.json()

    // Validar campos obligatorios
    if (!title || !price || stock === undefined || !type) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios para crear el producto' },
        { status: 400 }
      )
    }

    // Validar que el tipo sea correcto (PLAN_WIFI o EQUIPO)
    if (type !== 'PLAN_WIFI' && type !== 'EQUIPO') {
      return NextResponse.json(
        { error: 'El tipo de producto debe ser PLAN_WIFI o EQUIPO' },
        { status: 400 }
      )
    }

    // Guardar en la base de datos de Supabase
    const newProduct = await prisma.product.create({
      data: {
        title,
        description: description || '',
        price: parseFloat(price),
        stock: parseInt(stock),
        type,
      },
    })

    return NextResponse.json(
      { message: 'Producto/Plan Wi-Fi creado con éxito', product: newProduct },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno al crear el producto en el almacén' },
      { status: 500 }
    )
  }
}