import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    // Dá prioridade total à chave de serviço para ignorar o bloqueio do RLS
    const supabaseKey = 
      process.env.SUPABASE_SERVICE_ROLE_KEY || 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      '';

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Chaves de ambiente ausentes.' }, { status: 500 });
    }

    // Cria o cliente com privilégios de administração (bypassa RLS)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const { data, error } = await supabase
      .from('membros')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro na leitura do Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Processamento com tolerância total a dados decifrados e novos
    const membrosHigienizados = (data || []).map((m: any) => {
      let dadosFam = m.dados_familiares;

      if (dadosFam && typeof dadosFam === 'object') {
        try {
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
        } catch {
          // Mantém dados intactos em caso de inconsistência
        }
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

    return NextResponse.json(membrosHigienizados, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro de servidor' }, { status: 500 });
  }
}