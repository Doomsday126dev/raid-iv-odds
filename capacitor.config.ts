import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.amitya.raidivodds",
  appName: "Raid IV Odds",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
