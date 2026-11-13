import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Topico } from '@/types/topico';
import { separarItensTopico } from '@/utils/topicos';

type Props = {
  topico: Topico;
  curtido: boolean;
  enviando: boolean;
  erro?: string;
  onInteressar: () => void;
};

export default function TopicoCard({
  topico,
  curtido,
  enviando,
  erro,
  onInteressar,
}: Props) {
  const [expandido, setExpandido] = useState(false);
  const itens = separarItensTopico(topico.assuntos);
  const textoLongo = topico.texto.length > 280;
  const listaLonga = itens.length > 3;
  const podeExpandir = textoLongo || listaLonga;
  const itensVisiveis = expandido ? itens : itens.slice(0, 3);
  const titulo = topico.titulo || 'Tópico da comunidade';
  let textoInteresse = 'Tenho interesse';

  if (curtido) {
    textoInteresse = 'Interesse registrado';
  }

  if (enviando) {
    textoInteresse = 'Registrando interesse...';
  }

  return (
    <View style={styles.card}>
      <Text
        accessibilityLabel={`Publicado por ${topico.autor.nome}`}
        style={styles.autor}
      >
        {topico.autor.nome}
      </Text>

      <Text accessibilityRole="header" style={styles.titulo}>
        {titulo}
      </Text>

      {topico.texto.length > 0 && (
        <Text style={styles.texto}>
          {textoLongo && !expandido
            ? `${topico.texto.slice(0, 280).trimEnd()}\u2026`
            : topico.texto}
        </Text>
      )}

      {itensVisiveis.length > 0 && (
        <View style={styles.lista}>
          {itensVisiveis.map((item, index) => (
            <Text
              key={`${index}-${item}`}
              accessibilityLabel={`Item ${index + 1} de ${itens.length}: ${item}`}
              style={styles.item}
            >
              {`\u2022 ${item}`}
            </Text>
          ))}
        </View>
      )}

      {podeExpandir && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${expandido ? 'Ler menos' : 'Ler mais'}: ${titulo}`}
          accessibilityHint="Expande ou recolhe o texto e os itens deste tópico."
          accessibilityState={{ expanded: expandido }}
          onPress={() => setExpandido(atual => !atual)}
          style={styles.acao}
        >
          <Text>{expandido ? 'Ler menos' : 'Ler mais'}</Text>
        </Pressable>
      )}

      <Text
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${topico.interesses} interesses neste tópico`}
        style={styles.contador}
      >
        {topico.interesses} interesses
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${curtido ? 'Interesse já registrado' : 'Demonstrar interesse'}: ${titulo}`}
        accessibilityHint="Adiciona um interesse ao contador deste tópico."
        accessibilityState={{
          disabled: curtido || enviando,
          selected: curtido,
          busy: enviando,
        }}
        disabled={curtido || enviando}
        onPress={onInteressar}
        style={styles.acao}
      >
        <Text>
          {textoInteresse}
        </Text>
      </Pressable>

      {erro && (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.erro}>
          {erro}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  autor: {
    fontWeight: 'bold',
  },
  titulo: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  texto: {
    marginTop: 12,
    lineHeight: 22,
  },
  lista: {
    marginTop: 16,
    gap: 10,
  },
  item: {
    lineHeight: 22,
  },
  acao: {
    marginTop: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  contador: {
    marginTop: 20,
  },
  erro: {
    marginTop: 12,
  },
});
