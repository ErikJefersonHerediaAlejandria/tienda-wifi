import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // 1. Validar campos
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Correo y contraseña requeridos' },
        { status: 400 }
      )
    }

    // 2. Buscar usuario en Supabase
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // 3. Comparar la contraseña ingresada con la contraseña encriptada
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // 4. Retornar éxito si todo coincide
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { message: 'Inicio de sesión exitoso', user: userWithoutPassword },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor al iniciar sesión' },
      { status: 500 }
    )
  }
}