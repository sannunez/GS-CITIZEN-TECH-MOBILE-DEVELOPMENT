import { Platform } from 'react-native';

function obterUrlPadrao() {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5080';
  }

  return 'http://localhost:5080';
}

const urlConfigurada = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_URL = (urlConfigurada || obterUrlPadrao()).replace(/\/+$/, '');
