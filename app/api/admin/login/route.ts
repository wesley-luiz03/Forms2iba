import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const adminUser = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
    const adminPass = (process.env.ADMIN_PASSWORD || '').trim();

    const viewerUser = (process.env.VIEWER_USERNAME || '').trim().toLowerCase();
    const viewerPass = (process.env.VIEWER_PASSWORD || '').trim();

    // Verificação de segurança: se as variáveis não foram carregadas do .env
    if (!adminUser || !adminPass) {
      console.error('ERRO CRÍTICO: ADMIN_USERNAME ou ADMIN_PASSWORD não foram configurados no .env.local!');
    }

    let role: 'admin' | 'viewer' | null = null;

    if (cleanUser === adminUser && cleanPass === adminPass) {
      role = 'admin';
    } else if (cleanUser === viewerUser && cleanPass === viewerPass) {
      role = 'viewer';
    }

    if (!role) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique o usuário e a senha.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, role });

    // Define os cookies de sessão para o middleware
    response.cookies.set({
      name: 'dev_authenticated',
      value: 'true',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 horas
    });

    response.cookies.set({
      name: 'user_role',
      value: role,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno ao autenticar.' }, { status: 500 });
  }
}