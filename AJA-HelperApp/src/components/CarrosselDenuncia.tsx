import { useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Button, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { imagensDemonstracao, separarImagens } from '@/utils/denuncias';

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    gap: 8,
  },

  foto: {
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf1f4',
  },

  imagem: {
    width: '100%',
    height: '100%',
  },

  contador: {
    textAlign: 'center',
  },

  controles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});

function Foto({
  url,
  indice,
  total,
  largura,
}: {
  url: string;
  indice: number;
  total: number;
  largura: number;
}) {
  const [falhou, setFalhou] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const dimensoesFoto = { width: largura };

  return (
    <View style={[styles.foto, dimensoesFoto]}>
      {falhou ? (
        <Text accessibilityRole="alert">Imagem {indice + 1} indisponível.</Text>
      ) : (
        <Image
          source={{ uri: url }}
          style={styles.imagem}
          resizeMode="contain"
          accessibilityLabel={`Foto ${indice + 1} de ${total} da denúncia. O relato descreve a situação.`}
          onLoad={() => setCarregando(false)}
          onError={() => {
            setFalhou(true);
            setCarregando(false);
          }}
        />
      )}

      {carregando && (
        <ActivityIndicator
          style={StyleSheet.absoluteFill}
          accessibilityLabel={`Carregando foto ${indice + 1}`}
        />
      )}
    </View>
  );
}

export default function CarrosselDenuncia({ imagensUrls }: { imagensUrls: string | null }) {
  return <Galeria key={imagensUrls} imagensUrls={imagensUrls} />;
}

function Galeria({ imagensUrls }: { imagensUrls: string | null }) {
  const urls = separarImagens(imagensUrls);

  const [largura, setLargura] = useState(0);
  const [indice, setIndice] = useState(0);

  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  if (!urls.length) return null;

  function ir(novo: number) {
    setIndice(novo);
    scroll.current?.scrollTo({ x: novo * largura, animated: true });
  }

  return (
    <View onLayout={e => setLargura(e.nativeEvent.layout.width)} style={styles.container}>
      {largura > 0 && (
        <ScrollView
          ref={scroll}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator
          accessibilityLabel="Fotos da denúncia. Deslize horizontalmente ou use os botões."
          onMomentumScrollEnd={e =>
            setIndice(
              Math.min(urls.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.x / largura))),
            )
          }
        >
          {urls.map((url, i) => (
            <Foto key={`${i}:${url}`} url={url} indice={i} total={urls.length} largura={largura} />
          ))}
        </ScrollView>
      )}

      <Text accessibilityLiveRegion="polite" style={styles.contador}>
        Foto {indice + 1} de {urls.length}
      </Text>

      {urls.length > 1 && (
        <View style={styles.controles}>
          <Button
            title="Anterior"
            accessibilityLabel="Foto anterior"
            disabled={indice === 0}
            onPress={() => ir(indice - 1)}
          />

          <Button
            title="Próxima"
            accessibilityLabel="Próxima foto"
            disabled={indice >= urls.length - 1}
            onPress={() => ir(indice + 1)}
          />
        </View>
      )}

      {urls.some(url => imagensDemonstracao.includes(url)) && (
        <Text>Fotos de demonstração: não representam o local denunciado.</Text>
      )}
    </View>
  );
}
