import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configurações de ambiente ausentes.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Busca todos os membros cadastrados
    const { data: membros, error } = await supabase.from('membros').select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let totalAtualizados = 0;
    const jaEstavaCriptografado = (str: any) => typeof str === 'string' && str.split(':').length === 3;

    // 2. Itera membro por membro aplicando a cifra nos dados legados
    for (const m of membros || []) {
      let precisaAtualizar = false;
      const updates: any = {};

      // Criptografia dos campos do titular
      if (m.cpf && !jaEstavaCriptografado(m.cpf)) {
        updates.cpf = encrypt(m.cpf);
        precisaAtualizar = true;
      }
      if (m.rg && !jaEstavaCriptografado(m.rg)) {
        updates.rg = encrypt(m.rg);
        precisaAtualizar = true;
      }
      if (m.celular && !jaEstavaCriptografado(m.celular)) {
        updates.celular = encrypt(m.celular);
        precisaAtualizar = true;
      }
      if (m.email && m.email !== 'NÃO SE APLICA' && !jaEstavaCriptografado(m.email)) {
        updates.email = encrypt(m.email);
        precisaAtualizar = true;
      }
      if (m.endereco && !jaEstavaCriptografado(m.endereco)) {
        updates.endereco = encrypt(m.endereco);
        precisaAtualizar = true;
      }

      // Criptografia recursiva nos dados familiares (JSONB)
      if (m.dados_familiares && typeof m.dados_familiares === 'object') {
        const fam = { ...m.dados_familiares };
        let mudouFam = false;

        if (fam.conjugeCompleto) {
          if (fam.conjugeCompleto.cpf && !jaEstavaCriptografado(fam.conjugeCompleto.cpf)) {
            fam.conjugeCompleto.cpf = encrypt(fam.conjugeCompleto.cpf);
            mudouFam = true;
          }
          if (fam.conjugeCompleto.rg && !jaEstavaCriptografado(fam.conjugeCompleto.rg)) {
            fam.conjugeCompleto.rg = encrypt(fam.conjugeCompleto.rg);
            mudouFam = true;
          }
          if (fam.conjugeCompleto.celular && !jaEstavaCriptografado(fam.conjugeCompleto.celular)) {
            fam.conjugeCompleto.celular = encrypt(fam.conjugeCompleto.celular);
            mudouFam = true;
          }
          if (fam.conjugeCompleto.email && fam.conjugeCompleto.email !== 'NÃO SE APLICA' && !jaEstavaCriptografado(fam.conjugeCompleto.email)) {
            fam.conjugeCompleto.email = encrypt(fam.conjugeCompleto.email);
            mudouFam = true;
          }
        }

        if (Array.isArray(fam.filhos)) {
          fam.filhos = fam.filhos.map((f: any) => {
            const filhoAtualizado = { ...f };
            if (filhoAtualizado.cpf && !jaEstavaCriptografado(filhoAtualizado.cpf)) {
              filhoAtualizado.cpf = encrypt(filhoAtualizado.cpf);
              mudouFam = true;
            }
            if (filhoAtualizado.telefone && !jaEstavaCriptografado(filhoAtualizado.telefone)) {
              filhoAtualizado.telefone = encrypt(filhoAtualizado.telefone);
              mudouFam = true;
            }
            if (filhoAtualizado.email && filhoAtualizado.email !== 'NÃO SE APLICA' && !jaEstavaCriptografado(filhoAtualizado.email)) {
              filhoAtualizado.email = encrypt(filhoAtualizado.email);
              mudouFam = true;
            }
            return filhoAtualizado;
          });
        }

        if (mudouFam) {
          updates.dados_familiares = fam;
          precisaAtualizar = true;
        }
      }

      if (precisaAtualizar) {
        await supabase.from('membros').update(updates).eq('id', m.id);
        totalAtualizados++;
      }
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: `Migração concluída com sucesso! ${totalAtualizados} registros legados foram criptografados.`,
      totalProcessados: membros?.length || 0,
      totalAtualizados,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}