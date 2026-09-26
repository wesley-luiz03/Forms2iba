import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Criptografa os dados sensíveis do titular
    const payloadCriptografado = {
      ...payload,
      cpf: encrypt(payload.cpf),
      rg: encrypt(payload.rg),
      celular: encrypt(payload.celular),
      email: payload.email === 'NÃO SE APLICA' ? payload.email : encrypt(payload.email),
      endereco: encrypt(payload.endereco),
    };

    // Criptografa os dados sensíveis de cônjuge e filhos dentro do JSONB
    if (payloadCriptografado.dados_familiares) {
      const fam = payloadCriptografado.dados_familiares;

      if (fam.conjugeCompleto) {
        fam.conjugeCompleto.cpf = encrypt(fam.conjugeCompleto.cpf);
        fam.conjugeCompleto.rg = encrypt(fam.conjugeCompleto.rg);
        fam.conjugeCompleto.celular = encrypt(fam.conjugeCompleto.celular);
        if (fam.conjugeCompleto.email !== 'NÃO SE APLICA') {
          fam.conjugeCompleto.email = encrypt(fam.conjugeCompleto.email);
        }
      }

      if (Array.isArray(fam.filhos)) {
        fam.filhos = fam.filhos.map((f: any) => ({
          ...f,
          cpf: encrypt(f.cpf),
          telefone: encrypt(f.telefone),
          email: f.email === 'NÃO SE APLICA' ? f.email : encrypt(f.email),
        }));
      }

      payloadCriptografado.dados_familiares = fam;
    }

    const { error } = await supabase.from('membros').insert(payloadCriptografado);

    if (error) {
      if (error.code === '23505' || error.message?.includes('membros_cpf_unique')) {
        return NextResponse.json(
          { error: 'Este CPF já está cadastrado no sistema.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno ao processar o cadastro.' }, { status: 500 });
  }
}