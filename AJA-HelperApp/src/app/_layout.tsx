import { useState } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Navegacao />
    </AuthProvider>
  );
}

function Navegacao() {
  const auth = useAuth();
  const [erroSaida, setErroSaida] = useState<string | null>(null);

  async function trocarConta() {
    setErroSaida(null);

    try {
      await auth.sair();
    } catch {
      setErroSaida('Não foi possível remover a sessão salva. Tente novamente.');
    }
  }

  if (auth.carregando) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator accessible accessibilityRole="progressbar" accessibilityLabel="Validando sessão" />
      </View>
    );
  }

  if (auth.erroRestauracao) {
    return (
      <View style={styles.recuperacao}>
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite">
          Não foi possível validar sua sessão. Confira a conexão com a API.
        </Text>

        {erroSaida && (
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite">
            {erroSaida}
          </Text>
        )}

        <View style={styles.acoes}>
          <Button
            title="Tentar novamente"
            onPress={auth.tentarRestaurar}
          />

          <Button
            title="Usar outra conta"
            onPress={() => void trocarConta()}
          />
        </View>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!auth.sessao}>
        <Stack.Screen name="cadastro" />

        <Stack.Screen name="login" />
      </Stack.Protected>

      <Stack.Protected guard={!!auth.sessao}>
        <Stack.Screen name="(tabs)" />

        <Stack.Screen
          name="nova-postagem"
          options={{
            headerShown: true,
            title: 'Nova postagem',
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  carregando: {
    flex: 1,
    justifyContent: 'center',
  },
  recuperacao: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    gap: 16,
  },
  acoes: {
    gap: 16,
    marginTop: 8,
  },
});
