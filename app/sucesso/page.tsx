import Link from 'next/link';

export default function SucessoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="bg-white border border-navy/15 rounded max-w-[520px] w-full text-center py-16 px-8">
        <div className="w-14 h-14 rounded-full bg-gold text-navy-ink flex items-center justify-center mx-auto mb-5 text-2xl font-bold">
          ✓
        </div>
        <h2 className="text-navy text-2xl m-0 mb-2">Cadastro recebido!</h2>
        <p className="text-gray-500 text-sm mb-7">
          Obrigado por atualizar seus dados. Se precisar, você pode enviar o cadastro de outro
          familiar agora.
        </p>
        <Link
          href="/"
          className="inline-block bg-navy text-white font-bold text-sm px-6 py-3 rounded"
        >
          Cadastrar outro membro
        </Link>
      </div>
    </div>
  );
}
