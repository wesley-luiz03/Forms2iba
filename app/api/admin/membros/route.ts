import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 1. Diagnóstico de variáveis de ambiente
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Falta NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return NextResponse.json({
        erro_diagnostico: 'Variáveis de ambiente do Supabase não foram encontradas no processo Node.',
        tem_url: Boolean(supabaseUrl),
        tem_key: Boolean(supabaseKey),
      }, { status: 500 });
    }

    // 2. Conexão direta
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const { data, error } = await supabase
      .from('membros')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro Supabase:', error);
      return NextResponse.json({ erro_diagnostico: error.message }, { status: 500 });
    }

    // 3. Processamento tolerante
    const membrosFormatados = (data || []).map((m: any) => {
      let dadosFam = m.dados_familiares;

      try {
        if (dadosFam && typeof dadosFam === 'object') {
          if (dadosFam.conjugeCompleto) {
            dadosFam.conjugeCompleto = {
              ...dadosFam.conjugeCompleto,
              cpf: decrypt(dadosFam.conjugeCompleto.cpf) || dadosFam.conjugeCompleto.cpf,
              rg: decrypt(dadosFam.conjugeCompleto.rg) || dadosFam.conjugeCompleto.rg,
              celular: decrypt(dadosFam.conjugeCompleto.celular) || dadosFam.conjugeCompleto.celular,
              email: decrypt(dadosFam.conjugeCompleto.email) || dadosFam.conjugeCompleto.email,
            };
          }

          if (Array.isArray(dadosFam.filhos)) {
            dadosFam.filhos = dadosFam.filhos.map((f: any) => ({
              ...f,
              cpf: decrypt(f?.cpf) || f?.cpf,
              telefone: decrypt(f?.telefone) || f?.telefone,
              email: decrypt(f?.email) || f?.email,
            }));
          }
        }
      } catch (errDecFam) {
        console.warn('Erro ao decifrar familiares:', errDecFam);
      }

      return {
        ...m,
        cpf: decrypt(m.cpf) || m.cpf,
        rg: decrypt(m.rg) || m.rg,
        celular: decrypt(m.celular) || m.celular,
        email: decrypt(m.email) || m.email,
        endereco: decrypt(m.endereco) || m.endereco,
        dados_familiares: dadosFam,
      };
    });

    return NextResponse.json(membrosFormatados);
  } catch (err: any) {
    console.error('❌ Exceção geral capturada em /api/admin/membros:', err);
    return NextResponse.json({
      erro_diagnostico: err?.message || 'Exceção não tratada',
      stack: err?.stack
    }, { status: 500 });
  }
}