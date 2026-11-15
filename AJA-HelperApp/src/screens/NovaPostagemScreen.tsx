import { Button, Text, TextInput } from '@/components/ui';
import type { ThemeColors } from '@/constants/theme';
import { useEstilos } from '@/hooks/useEstilos';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { criarPostagem } from '@/services/postagens';
import { ApiError } from '@/services/http';

const criarEstilos = (colors: ThemeColors) =>
  StyleSheet.create({
    tela: {
      flex: 1,
      backgroundColor: colors.background,
    },

    conteudo: {
      padding: 22,
      gap: 8,
    },

    input: {
      borderWidth: 1,
      padding: 12,
      marginTop: 16,
      borderColor: colors.line,
      borderRadius: 14,
      backgroundColor: colors.surface,
    },

    texto: {
      minHeight: 120,
      textAlignVertical: 'top',
    },

    mensagem: {
      marginTop: 16,
    },

    acoes: {
      marginTop: 20,
    },
  });

export default function NovaPostagemScreen() {
  const styles = useEstilos(criarEstilos);

  const { sessao, sair } = useAuth();

  const [texto, setTexto] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const ocupado = useRef(false);

  async function publicar() {
    if (!sessao || ocupado.current) {
      return;
    }

    if (!texto.trim() && !imagemUrl.trim()) {
      setErro('Informe um texto ou uma URL de imagem.');

      return;
    }

    if (imagemUrl.trim()) {
      try {
        const url = new URL(imagemUrl.trim());

        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Protocolo inválido.');
        }
      } catch {
        setErro('Informe uma URL de imagem HTTP ou HTTPS válida.');

        return;
      }
    }

    ocupado.current = true;
    setEnviando(true);
    setErro(null);

    try {
      await criarPostagem(
        {
          texto: texto.trim() || null,
          imagemUrl: imagemUrl.trim() || null,
          usuarioId: sessao.usuario.id,
        },
        sessao.token,
      );

      router.back();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await sair();

        return;
      }

      const mensagem = error instanceof Error ? error.message : 'Não foi possível publicar.';

      setErro(mensagem);
    } finally {
      ocupado.current = false;
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.tela}>
      <KeyboardAvoidingView
        style={styles.tela}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.conteudo}>
          <Text accessibilityRole="header">Publicar como {sessao?.usuario.nome}</Text>

          <TextInput
            accessibilityLabel="Texto da postagem"
            accessibilityHint="Descreva a situação de acessibilidade que deseja compartilhar."
            accessibilityState={{ disabled: enviando }}
            placeholder="Texto da postagem"
            multiline
            value={texto}
            onChangeText={setTexto}
            editable={!enviando}
            style={[styles.input, styles.texto]}
          />

          <TextInput
            accessibilityLabel="URL da imagem"
            accessibilityHint="Campo opcional. Cole o endereço completo da imagem."
            accessibilityState={{ disabled: enviando }}
            placeholder="URL da imagem (opcional)"
            value={imagemUrl}
            onChangeText={setImagemUrl}
            editable={!enviando}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
          />

          {erro && (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={styles.mensagem}
            >
              {erro}
            </Text>
          )}

          <View style={styles.acoes}>
            <Button
              title={enviando ? 'Publicando...' : 'Publicar'}
              accessibilityLabel={enviando ? 'Publicando postagem' : 'Publicar postagem'}
              disabled={enviando}
              onPress={() => void publicar()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
