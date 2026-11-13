import { solicitar } from '@/services/http';
import type { Sessao, UsuarioSessao } from '@/types/sessao';

export function validarSessao(token: string) {
  return solicitar<UsuarioSessao>('/api/auth/me', {}, token);
}

type DadosAcesso = {
  nome?: string;
  email: string;
  senha: string;
};

type RespostaAcesso = {
  accessToken: string;
  expiresIn: number;
};

export async function autenticar(
  modo: 'login' | 'cadastro',
  dados: DadosAcesso,
): Promise<Sessao> {
  const resposta = await solicitar<RespostaAcesso>(
    `/api/auth/${modo}`,
    {
      method: 'POST',
      body: JSON.stringify(dados),
    },
  );

  const usuario = await validarSessao(resposta.accessToken);

  return {
    token: resposta.accessToken,
    expiraEm: Date.now() + resposta.expiresIn * 1000,
    usuario,
  };
}
