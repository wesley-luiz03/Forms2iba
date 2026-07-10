import { NextResponse, type NextRequest } from 'next/server';

// Protege tudo dentro de /admin, exceto a página de login.
export async function middleware(request: NextRequest) {
  // Verifica se o cookie customizado de sessão do administrador existe
  const adminSession = request.cookies.get('admin_session')?.value;

  const isLoginPage = request.nextUrl.pathname === '/admin/login';
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');

  // Se o utilizador tentar aceder ao admin sem estar logado, redireciona para o login
  if (isAdminPath && !isLoginPage && adminSession !== 'true') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Se já estiver logado e tentar ir para a página de login, redireciona para o painel principal
  if (isLoginPage && adminSession === 'true') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};