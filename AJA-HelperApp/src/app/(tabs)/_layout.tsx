import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{ title: 'Tópicos', tabBarAccessibilityLabel: 'Tópicos do bairro' }}
      />

      <Tabs.Screen name="feed" options={{ title: 'Feed', tabBarAccessibilityLabel: 'Feed de postagens' }} />

      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarAccessibilityLabel: 'Meu perfil e minhas postagens' }}
      />
    </Tabs>
  );
}
