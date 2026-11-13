import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PostagemCard from '@/components/PostagemCard';
import { useFeed } from '@/hooks/useFeed';

export default function FeedScreen() {
  const [altura, setAltura] = useState(0);
  const [alturaConteudo, setAlturaConteudo] = useState(0);
  const feed = useFeed();
  const primeiraVez = useRef(true);

  const { atualizar, carregarMais, carregando, erro, temMais } = feed;

  useEffect(() => {
    if (
      altura > 0 &&
      alturaConteudo > 0 &&
      alturaConteudo <= altura * 1.35 &&
      feed.postagens.length > 0 &&
      temMais &&
      !carregando &&
      !erro
    ) {
      carregarMais();
    }
  }, [altura, alturaConteudo, feed.postagens.length, temMais, carregando, erro, carregarMais]);

  useFocusEffect(
    useCallback(() => {
      if (primeiraVez.current) {
        primeiraVez.current = false;
        return;
      }

      atualizar();
    }, [atualizar]),
  );

  function renderizarEstadoVazio() {
    if (feed.carregando) {
      return (
        <View style={styles.estado}>
          <ActivityIndicator accessibilityLabel="Carregando postagens" />
        </View>
      );
    }

    if (feed.erro) {
      return null;
    }

    return (
      <View style={styles.estado}>
        <Text>Nenhuma postagem encontrada.</Text>
      </View>
    );
  }

  function renderizarRodape() {
    if (feed.erro) {
      return (
        <View style={styles.rodape}>
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite">{feed.erro}</Text>

          <View style={styles.acaoRodape}>
            <Button
              title="Tentar novamente"
              onPress={feed.tentarNovamente}
            />
          </View>
        </View>
      );
    }

    if (feed.carregando && !feed.atualizando && feed.postagens.length > 0) {
      return (
        <View style={styles.rodape}>
          <ActivityIndicator accessibilityLabel="Carregando mais postagens" />
        </View>
      );
    }

    if (!feed.temMais && feed.postagens.length > 0) {
      return (
        <View style={styles.rodape}>
          <Text>Todas as postagens foram carregadas.</Text>
        </View>
      );
    }

    if (feed.temMais && !feed.carregando && feed.postagens.length > 0) {
      return (
        <View style={styles.rodape}>
          <Button title="Carregar mais postagens" onPress={carregarMais} />
        </View>
      );
    }

    return null;
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.tela}>
      <View
        style={styles.tela}
        onLayout={event => setAltura(event.nativeEvent.layout.height)}
      >
        <FlatList
          data={feed.postagens}
          keyExtractor={postagem => String(postagem.id)}
          renderItem={({ item }) => (
            <PostagemCard
              postagem={item}
              altura={altura > 0 ? altura / 3 : 200}
            />
          )}
          contentContainerStyle={styles.lista}
          onContentSizeChange={(_, alturaLista) => setAlturaConteudo(alturaLista)}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          onEndReached={feed.carregarMais}
          onEndReachedThreshold={0.2}
          onScroll={({ nativeEvent }) => {
            const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
            const distanciaDoFim = contentSize.height - contentOffset.y - layoutMeasurement.height;

            if (distanciaDoFim <= layoutMeasurement.height * 0.35) {
              carregarMais();
            }
          }}
          scrollEventThrottle={100}
          refreshing={feed.atualizando}
          onRefresh={feed.atualizar}
          ListEmptyComponent={renderizarEstadoVazio() ?? undefined}
          ListFooterComponent={renderizarRodape() ?? undefined}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Criar postagem"
          accessibilityHint="Abre o formulário para publicar texto e imagem."
          onPress={() => router.push('/nova-postagem')}
          style={styles.botaoPublicar}
        >
          <Text style={styles.iconePublicar}>+</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
  },
  lista: {
    paddingHorizontal: 16,
  },
  estado: {
    paddingVertical: 24,
  },
  rodape: {
    paddingVertical: 12,
  },
  acaoRodape: {
    marginTop: 16,
  },
  botaoPublicar: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconePublicar: {
    fontSize: 28,
  },
});
