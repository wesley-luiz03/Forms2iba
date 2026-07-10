export type FieldType = 'texto' | 'multipla' | 'data' | 'numero';

export type Section = 'pessoal' | 'contato' | 'endereco' | 'familia' | 'extra';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  section: Section;
}

// Campos fixos do formulário — os "principais" do modelo Eklesia.
// Para adicionar/remover um campo fixo, edite esta lista.
export const BASE_FIELDS: FieldDef[] = [
  { key: 'nome', label: 'Nome completo', type: 'texto', required: true, section: 'pessoal' },
  { key: 'sexo', label: 'Sexo', type: 'multipla', required: true, section: 'pessoal', options: ['Masculino', 'Feminino'] },
  { key: 'data_nascimento', label: 'Data de nascimento', type: 'data', required: false, section: 'pessoal' },
  {
    key: 'estado_civil',
    label: 'Estado civil',
    type: 'multipla',
    required: false,
    section: 'pessoal',
    options: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Separado(a)', 'União estável', 'Viúvo(a)'],
  },
  { key: 'cpf', label: 'CPF', type: 'texto', required: false, section: 'pessoal' },
  { key: 'celular', label: 'Celular (com DDD)', type: 'texto', required: true, section: 'contato' },
  { key: 'email', label: 'E-mail', type: 'texto', required: false, section: 'contato' },
  { key: 'cep', label: 'CEP', type: 'texto', required: false, section: 'endereco' },
  { key: 'endereco', label: 'Endereço', type: 'texto', required: false, section: 'endereco' },
  { key: 'numero', label: 'Número', type: 'texto', required: false, section: 'endereco' },
  { key: 'complemento', label: 'Complemento', type: 'texto', required: false, section: 'endereco' },
  { key: 'bairro', label: 'Bairro', type: 'texto', required: false, section: 'endereco' },
  { key: 'cidade', label: 'Cidade', type: 'texto', required: false, section: 'endereco' },
  { key: 'uf', label: 'UF', type: 'texto', required: false, section: 'endereco' },
  { key: 'nome_conjuge', label: 'Nome do cônjuge (se também for membro)', type: 'texto', required: false, section: 'familia' },
  { key: 'observacao', label: 'Observação', type: 'texto', required: false, section: 'familia' },
];

export const SECTIONS: { id: Section; title: string; hint?: string }[] = [
  { id: 'pessoal', title: 'Dados pessoais' },
  { id: 'contato', title: 'Contato' },
  { id: 'endereco', title: 'Endereço' },
  { id: 'familia', title: 'Família', hint: 'Só preencha o nome do cônjuge se ele(a) também enviar o próprio cadastro.' },
  { id: 'extra', title: 'Informações adicionais', hint: 'Campos adicionados pela liderança da igreja.' },
];
