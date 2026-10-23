import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nivora.care",
  appName: "Nivora Care Hospital",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ffffff",
    },
  },
};

export default config;
