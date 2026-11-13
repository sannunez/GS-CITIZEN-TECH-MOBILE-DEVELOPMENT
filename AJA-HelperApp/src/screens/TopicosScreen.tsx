import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopicoCard from '@/components/TopicoCard';
import {
  buscarTopicos,
  demonstrarInteresse,
  jaDemonstrouInteresse,
} from '@/services/topicos';
import { useAuth } from '@/contexts/AuthContext';
import type { Topico } from '@/types/topico';

export default function TopicosScreen() {
  const { sessao } = useAuth();
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [curtindo, setCurtindo] = useState<number[]>([]);
  const [errosInteresse, setErrosInteresse] = useState<Record<number, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const requisicao = useRef<AbortController | null>(null);

  const carregar = useCallback(async (controller: AbortController) => {
    setCarregando(true);
    setErro(null);

    try {
      const resultado = await buscarTopicos(controller.signal);

      if (!controller.signal.aborted) {
        setTopicos(atuais => resultado.map(topico => {
          const anterior = atuais.find(item => item.id === topico.id);

          return {
            ...topico,
            interesses: Math.max(topico.interesses, anterior?.interesses ?? 0),
          };
        }));
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        const mensagem = error instanceof Error
          ? error.message
          : 'Não foi possível carregar os tópicos.';

        setErro(mensagem);
      }
    } finally {
      if (!controller.signal.aborted) {
        setCarregando(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();

      requisicao.current = controller;
      void carregar(controller);

      return () => requisicao.current?.abort();
    }, [carregar]),
  );

  function atualizar() {
    requisicao.current?.abort();

    const controller = new AbortController();

    requisicao.current = controller;
    void carregar(controller);
  }

  async function curtir(topicoId: number) {
    if (!sessao || jaDemonstrouInteresse(sessao.usuario.id, topicoId)) {
      return;
    }

    setCurtindo(atuais => [...new Set([...atuais, topicoId])]);
    setErrosInteresse(atuais => ({ ...atuais, [topicoId]: '' }));

    try {
      const resultado = await demonstrarInteresse(topicoId, sessao.usuario.id, sessao.token);

      setTopicos(atuais => atuais.map(topico => {
        if (topico.id !== topicoId) {
          return topico;
        }

        return {
          ...topico,
          interesses: Math.max(topico.interesses, resultado.interesses),
        };
      }));
    } catch (error) {
      const mensagem = error instanceof Error
        ? error.message
        : 'Não foi possível registrar seu interesse.';

      setErrosInteresse(atuais => ({ ...atuais, [topicoId]: mensagem }));
    } finally {
      setCurtindo(atuais => atuais.filter(id => id !== topicoId));
    }
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.tela}>
      <FlatList
        data={topicos}
        keyExtractor={topico => String(topico.id)}
        renderItem={({ item }) => (
          <TopicoCard
            topico={item}
            curtido={!!sessao && jaDemonstrouInteresse(sessao.usuario.id, item.id)}
            enviando={curtindo.includes(item.id)}
            erro={errosInteresse[item.id]}
            onInteressar={() => void curtir(item.id)}
          />
        )}
        contentContainerStyle={styles.conteudo}
        refreshing={carregando}
        onRefresh={atualizar}
        ListHeaderComponent={
          <View style={styles.cabecalho}>
            <Text accessibilityRole="header">Conversas do Parque Doroteia</Text>

            <Text style={styles.aviso}>
              Os perfis institucionais, convites e propostas iniciais são fictícios para demonstrar o AJA.
            </Text>

            {erro && (
              <View style={styles.erro}>
                <Text accessibilityRole="alert" accessibilityLiveRegion="polite">{erro}</Text>

                <Button title="Tentar novamente" onPress={atualizar} />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            {carregando && (
              <ActivityIndicator accessibilityLabel="Carregando tópicos" />
            )}

            {!carregando && !erro && (
              <Text>Nenhum tópico publicado por enquanto.</Text>
            )}
          </View>
        }
      />
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
    marginBottom: 24,
  },
  aviso: {
    marginTop: 12,
    lineHeight: 22,
  },
  erro: {
    marginTop: 16,
    gap: 16,
  },
  vazio: {
    paddingVertical: 16,
  },
});
