import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { userId, items } = await request.json()

    // 1. Validar datos básicos
    if (!userId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Datos de compra incompletos o carrito vacío' },
        { status: 400 }
      )
    }

    let totalAmount = 0
    const orderItemsData = []

    // 2. Verificar stock y calcular el total de la compra
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return NextResponse.json(
          { error: `El producto con ID ${item.productId} no existe` },
          { status: 404 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para el producto: ${product.title}` },
          { status: 400 }
        )
      }

      const itemPrice = Number(product.price)
      totalAmount += itemPrice * item.quantity

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      })
    }

    // 3. Simular un pequeño retraso de procesamiento de pago (2 segundos)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // 4. Ejecutar la transacción en la base de datos de Supabase (Todo o nada)
    const order = await prisma.$transaction(async (tx) => {
      // A. Crear la orden de compra
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          paymentStatus: 'PAID', // Simulamos pago exitoso
          paymentMethod: 'TARJETA_SIMULADA',
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      })

      // B. Descontar el stock de cada producto en el almacén
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      }

      // C. Generar la Factura Digital Única
      const invoiceNumber = `FAC-${Math.floor(100000 + Math.random() * 900000)}`
      const newInvoice = await tx.invoice.create({
        data: {
          orderId: newOrder.id,
          invoiceNumber,
        },
      })

      return { newOrder, newInvoice }
    })

    return NextResponse.json(
      {
        message: '¡Pago procesado con éxito y factura generada!',
        order: order.newOrder,
        invoice: order.newInvoice,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno al procesar el pago y la factura' },
      { status: 500 }
    )
  }
}