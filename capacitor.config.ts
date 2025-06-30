import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wave2music.app',
  appName: 'Wave2Music',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'automatic'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;