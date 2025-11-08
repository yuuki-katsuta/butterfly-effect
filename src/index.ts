import type { Plugin } from "vite";

const PLUGIN_NAME = "vite-plugin-butterfly-effect";

export default function butterflyEffect(options: any): Plugin {
	const {
		enabled = process.env.NODE_ENV === "development",
		theme = "default",
		shouwStatus = false,
		animationSpeed = 1000,
		maxButterflies = 10,
		trackEffect = true,
		trackState = true,
	} = options;

	if (!enabled) {
		return {
			name: PLUGIN_NAME,
			enforce: "pre",
		};
	}

	return {
		name: PLUGIN_NAME,
		enforce: "pre",
	};
}

export { butterflyEffect };
