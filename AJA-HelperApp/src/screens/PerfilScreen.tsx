import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PostagemCard from '@/components/PostagemCard';
import { useAuth } from '@/contexts/AuthContext';
import { buscarMinhasPostagens, excluirPostagem } from '@/services/postagens';
import type { Postagem } from '@/types/postagem';

export default function PerfilScreen() {
  const { sessao, sair } = useAuth();
  const token = sessao?.token;

  const [postagens, setPostagens] = useState<Postagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionada, setSelecionada] = useState<Postagem | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  const requisicao = useRef<AbortController | null>(null);
  const exclusaoEmAndamento = useRef(false);

  const carregarPostagens = useCallback(async (controller: AbortController) => {
    if (!token) {
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const resultado = await buscarMinhasPostagens(token, controller.signal);

      if (!controller.signal.aborted) {
        setPostagens(resultado);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        const mensagem = error instanceof Error
          ? error.message
          : 'Não foi possível carregar suas postagens.';

        setErro(mensagem);
      }
    } finally {
      if (!controller.signal.aborted) {
        setCarregando(false);
      }
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();

      requisicao.current = controller;
      void carregarPostagens(controller);

      return () => {
        controller.abort();
        requisicao.current?.abort();
      };
    }, [carregarPostagens]),
  );

  function atualizar() {
    if (exclusaoEmAndamento.current) {
      return;
    }

    requisicao.current?.abort();

    const controller = new AbortController();

    requisicao.current = controller;
    void carregarPostagens(controller);
  }

  function solicitarExclusao(postagem: Postagem) {
    setErroExclusao(null);
    setSelecionada(postagem);
  }

  function cancelarExclusao() {
    if (!exclusaoEmAndamento.current) {
      setSelecionada(null);
      setErroExclusao(null);
    }
  }

  async function confirmarExclusao() {
    if (!selecionada || !token || exclusaoEmAndamento.current) {
      return;
    }

    const id = selecionada.id;

    exclusaoEmAndamento.current = true;
    setExcluindo(true);
    setErroExclusao(null);

    try {
      await excluirPostagem(id, token);

      setPostagens(atuais => atuais.filter(postagem => postagem.id !== id));
      setSelecionada(null);
    } catch (error) {
      const mensagem = error instanceof Error
        ? error.message
        : 'Não foi possível excluir a postagem.';

      setErroExclusao(mensagem);
    } finally {
      exclusaoEmAndamento.current = false;
      setExcluindo(false);
    }
  }

  async function encerrarSessao() {
    setErro(null);

    try {
      await sair();
    } catch {
      setErro('Não foi possível encerrar a sessão.');
    }
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.tela}>
      <FlatList
        accessibilityElementsHidden={selecionada !== null}
        importantForAccessibility={selecionada ? 'no-hide-descendants' : 'auto'}
        data={postagens}
        keyExtractor={postagem => String(postagem.id)}
        contentContainerStyle={styles.conteudo}
        refreshing={carregando}
        onRefresh={atualizar}
        ListHeaderComponent={
          <View style={styles.cabecalho}>
            <View style={styles.dados}>
              <Text accessibilityRole="header" accessibilityLabel={`Perfil de ${sessao?.usuario.nome}`}>
                {sessao?.usuario.nome}
              </Text>

              <Text accessibilityLabel={`E-mail: ${sessao?.usuario.email}`}>
                {sessao?.usuario.email}
              </Text>

              <Text>ID: {sessao?.usuario.id}</Text>
            </View>

            <View style={styles.acoes}>
              <Button
                title="Sair da conta"
                disabled={excluindo}
                onPress={() => void encerrarSessao()}
              />
            </View>

            <Text accessibilityRole="header" style={styles.titulo}>
              Minhas postagens
            </Text>

            {erro && (
              <View style={styles.dados}>
                <Text accessibilityRole="alert" accessibilityLiveRegion="polite">{erro}</Text>

                <Button
                  title="Tentar novamente"
                  disabled={excluindo}
                  onPress={atualizar}
                />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.estado}>
            {carregando && (
              <ActivityIndicator accessibilityLabel="Carregando suas postagens" />
            )}

            {!carregando && !erro && (
              <Text>Você ainda não publicou nenhuma postagem.</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.postagem}>
            <PostagemCard postagem={item} altura={320} />

            <View style={styles.acaoPostagem}>
              <Button
                title="Excluir postagem"
                accessibilityLabel={`Excluir postagem de ${new Date(item.criadaEm).toLocaleString('pt-BR')}`}
                disabled={carregando || excluindo}
                onPress={() => solicitarExclusao(item)}
              />
            </View>
          </View>
        )}
      />

      <Modal
        visible={selecionada !== null}
        transparent
        animationType="fade"
        onRequestClose={cancelarExclusao}
      >
        <View style={styles.fundoModal}>
          <View
            style={styles.modal}
            accessibilityViewIsModal
            importantForAccessibility="yes"
          >
            <Text accessibilityRole="header">Excluir postagem?</Text>

            <Text>Esta ação não pode ser desfeita.</Text>

            {erroExclusao && (
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite">{erroExclusao}</Text>
            )}

            <View style={styles.botoesModal}>
              <Button
                title="Cancelar"
                accessibilityLabel="Cancelar exclusão e manter a postagem"
                disabled={excluindo}
                onPress={cancelarExclusao}
              />

              <Button
                title={excluindo ? 'Excluindo...' : 'Confirmar exclusão'}
                accessibilityLabel={excluindo ? 'Excluindo postagem' : 'Confirmar exclusão definitiva da postagem'}
                disabled={excluindo}
                onPress={() => void confirmarExclusao()}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
  },
  conteudo: {
    padding: 16,
  },
  cabecalho: {
    marginBottom: 16,
  },
  dados: {
    gap: 12,
  },
  acoes: {
    marginTop: 24,
  },
  titulo: {
    marginTop: 24,
    marginBottom: 16,
  },
  estado: {
    paddingVertical: 16,
  },
  postagem: {
    marginBottom: 24,
  },
  acaoPostagem: {
    marginTop: 12,
  },
  fundoModal: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 24,
    gap: 20,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  botoesModal: {
    gap: 16,
    marginTop: 4,
  },
});
