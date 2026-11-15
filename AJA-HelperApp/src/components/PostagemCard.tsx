import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { Postagem } from '@/types/postagem';

type Props = {
  postagem: Postagem;
  altura: number;
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginVertical: 6,
  },

  header: {
    padding: 6,
    gap: 4,
  },

  imagem: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  foto: {
    width: '100%',
    height: '100%',
  },

  texto: {
    padding: 6,
  },
});

export default function PostagemCard({ postagem, altura }: Props) {
  const [imagemComErro, setImagemComErro] = useState<string | null>(null);

  const mostrarImagem = postagem.imagemUrl !== null && postagem.imagemUrl !== imagemComErro;
  const dimensoesCard = { height: Math.max(1, altura - 12) };

  return (
    <View style={[styles.card, dimensoesCard]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" accessibilityLabel={`Postagem de ${postagem.autor.nome}`}>
          {postagem.autor.nome}
        </Text>

        <Text accessibilityLabel={`Publicada em ${new Date(postagem.criadaEm).toLocaleString('pt-BR')}`}>
          {new Date(postagem.criadaEm).toLocaleString('pt-BR')}
        </Text>
      </View>

      <View style={styles.imagem}>
        {mostrarImagem ? (
          <Image
            source={{ uri: postagem.imagemUrl! }}
            style={styles.foto}
            resizeMode="contain"
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Imagem publicada por ${postagem.autor.nome}`}
            onError={() => setImagemComErro(postagem.imagemUrl)}
          />
        ) : (
          <Text>{postagem.imagemUrl ? 'Imagem indisponível.' : 'Sem imagem.'}</Text>
        )}
      </View>

      <View style={styles.texto}>
        <Text numberOfLines={2} accessibilityLabel={postagem.texto ?? 'Sem texto.'}>
          {postagem.texto ?? 'Sem texto.'}
        </Text>
      </View>
    </View>
  );
}
