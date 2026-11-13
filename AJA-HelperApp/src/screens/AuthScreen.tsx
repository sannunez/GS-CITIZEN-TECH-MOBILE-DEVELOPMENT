import { useState } from 'react';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

type Props = {
  modo: 'login' | 'cadastro';
};

export default function AuthScreen({ modo }: Props) {
  const { entrar } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cadastrando = modo === 'cadastro';

  async function enviar() {
    if (enviando) {
      return;
    }

    if (!email.trim() || !senha || (cadastrando && !nome.trim())) {
      setErro('Preencha os campos obrigatórios.');
      return;
    }

    if (cadastrando && senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      await entrar(modo, {
        nome: nome.trim(),
        email: email.trim(),
        senha,
      });
    } catch (error) {
      const mensagem = error instanceof Error
        ? error.message
        : 'Não foi possível entrar.';

      setErro(mensagem);
    } finally {
      setEnviando(false);
      setSenha('');
    }
  }

  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAvoidingView
        style={styles.tela}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
        >
          <Text accessibilityRole="header">
            {cadastrando ? 'Crie sua conta no AJA' : 'Entrar no AJA'}
          </Text>

          <View style={styles.campos}>
            {cadastrando && (
              <TextInput
                accessibilityLabel="Nome"
                accessibilityHint="Informe o nome que será exibido no seu perfil."
                accessibilityState={{ disabled: enviando }}
                placeholder="Nome"
                value={nome}
                onChangeText={setNome}
                style={styles.input}
                editable={!enviando}
                maxLength={100}
              />
            )}

            <TextInput
              accessibilityLabel="E-mail"
              accessibilityHint="Informe o e-mail usado para entrar na sua conta."
              accessibilityState={{ disabled: enviando }}
              placeholder="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              editable={!enviando}
              maxLength={254}
            />

            <TextInput
              accessibilityLabel="Senha"
              accessibilityHint={cadastrando ? 'Crie uma senha com pelo menos oito caracteres.' : 'Informe a senha da sua conta.'}
              accessibilityState={{ disabled: enviando }}
              placeholder="Senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              editable={!enviando}
              maxLength={128}
            />
          </View>

          {erro && (
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.mensagem}>
              {erro}
            </Text>
          )}

          {enviando && (
            <ActivityIndicator
              accessible
              accessibilityLabel={cadastrando ? 'Criando sua conta' : 'Validando seu acesso'}
              accessibilityRole="progressbar"
              style={styles.mensagem}
            />
          )}

          <View style={styles.acoes}>
            <Button
              title={cadastrando ? 'Cadastrar' : 'Entrar'}
              accessibilityLabel={cadastrando ? 'Cadastrar nova conta' : 'Entrar na conta'}
              disabled={enviando}
              onPress={() => void enviar()}
            />
          </View>

          <Link
            href={cadastrando ? '/login' : '/cadastro'}
            accessibilityRole="link"
            accessibilityLabel={cadastrando ? 'Já tenho conta. Ir para login' : 'Ainda não tenho conta. Ir para cadastro'}
            style={styles.link}
          >
            {cadastrando ? 'Já tenho conta' : 'Ainda não tenho conta'}
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
  },
  conteudo: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  campos: {
    gap: 16,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    padding: 12,
  },
  mensagem: {
    marginTop: 16,
  },
  acoes: {
    marginTop: 20,
  },
  link: {
    paddingVertical: 20,
  },
});
