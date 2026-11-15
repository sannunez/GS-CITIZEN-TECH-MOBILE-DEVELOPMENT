import { usePreferencias } from '@/contexts/PreferenciasContext';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import type { ThemeColors } from '@/constants/theme';
import { useEstilos } from '@/hooks/useEstilos';
import type { Postagem } from '@/types/postagem';
import AutorPerfil from '@/components/AutorPerfil';

type Props = { postagem: Postagem; altura?: number };

const criarEstilos = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 20,
      marginBottom: 18,
      overflow: 'hidden',
    },

    header: {
      padding: 16,
    },

    data: {
      color: colors.muted,
      fontSize: 11,
    },

    foto: {
      width: '100%',
      aspectRatio: 1.15,
      backgroundColor: colors.softBlue,
    },

    legenda: {
      padding: 16,
      gap: 12,
    },

    selo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    comunidade: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '700',
    },

    texto: {
      fontSize: 14,
      lineHeight: 22,
    },

    lerMais: {
      color: colors.primary,
      fontWeight: '600',
      paddingVertical: 8,
    },
  });

export default function PostagemCard({ postagem }: Props) {
  const styles = useEstilos(criarEstilos);
  const { colors } = usePreferencias();

  const [imagemComErro, setImagemComErro] = useState<string | null>(null);
  const [expandido, setExpandido] = useState(false);
  const mostrarImagem = !!postagem.imagemUrl && postagem.imagemUrl !== imagemComErro;
  const texto = postagem.texto ?? '';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AutorPerfil
          autor={postagem.autor}
          detalhe={new Date(postagem.criadaEm).toLocaleString('pt-BR')}
        />
      </View>

      {mostrarImagem && (
        <Image
          source={{ uri: postagem.imagemUrl! }}
          style={styles.foto}
          resizeMode="cover"
          accessibilityLabel={'Imagem publicada por ' + postagem.autor.nome}
          onError={() => setImagemComErro(postagem.imagemUrl)}
        />
      )}

      <View style={styles.legenda}>
        <View style={styles.selo}>
          <Ionicons name="location-outline" size={14} color={colors.primary} />

          <Text style={styles.comunidade}>VOZES DA COMUNIDADE</Text>
        </View>

        {!!texto && (
          <Text
            style={styles.texto}
            numberOfLines={texto.length > 160 && !expandido ? 4 : undefined}
            accessibilityLabel={texto}
          >
            {texto}
          </Text>
        )}

        {texto.length > 160 && (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: expandido }}
            onPress={() => setExpandido((valor) => !valor)}
          >
            <Text style={styles.lerMais}>{expandido ? 'Mostrar menos' : 'Continuar lendo'}</Text>
          </Pressable>
        )}

        {imagemComErro === postagem.imagemUrl && !!postagem.imagemUrl && (
          <Text style={styles.data}>Não foi possível carregar a imagem.</Text>
        )}
      </View>
    </View>
  );
}
