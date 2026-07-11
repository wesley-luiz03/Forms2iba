// app/api/notificar/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Apenas consome o corpo da requisição para evitar travamentos
    await request.json();

    // Retorna sucesso direto para o formulário seguir adiante
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na rota interna de notificação:', error);
    return NextResponse.json({ success: false, error: 'Falha interna' });
  }
}