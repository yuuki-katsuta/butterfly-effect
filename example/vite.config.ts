import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import butterflyEffect from "../src/index.ts";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		butterflyEffect({
			enabled: true,
			showStatus: true,
			animationSpeed: 1000,
			maxButterflies: 10,
		}),
	],
});
