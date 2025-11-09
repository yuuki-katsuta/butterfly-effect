import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { transformReactCode } from "./transform.js";
import type { ButterflyEffectOptions } from "./types";

const PLUGIN_NAME = "vite-plugin-butterfly-effect";
const RUNTIME_ENTRY_ID = "\0butterfly-effect-runtime";
const OVERLAY_ENTRY_ID = "\0butterfly-effect-overlay";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function butterflyEffect(
	options: ButterflyEffectOptions,
): Plugin {
	const {
		enabled = process.env.NODE_ENV === "development",
		theme = "default",
		showStatus = false,
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

		// Vite の依存関係の事前バンドル（pre-bundling）からプラグインを除外する
		config() {
			return {
				optimizeDeps: {
					exclude: ["vite-plugin-butterfly-effect"],
				},
			};
		},
		// モジュールの解決
		resolveId(id) {
			if (id === OVERLAY_ENTRY_ID || id === RUNTIME_ENTRY_ID) {
				return id;
			}
			if (id === "\0butterfly-effect-runtime") {
				return RUNTIME_ENTRY_ID;
			}
			// overlay.tsへのインポートを解決
			if (id === "vite-plugin-butterfly-effect/overlay") {
				const resolved = path.resolve(__dirname, "overlay.ts");
				return resolved;
			}
			// runtime.tsへのインポートを解決
			if (id === "vite-plugin-butterfly-effect/runtime") {
				const resolved = path.resolve(__dirname, "runtime.ts");
				return resolved;
			}
		},
		// モジュールの中身を提供
		load(id) {
			if (id === OVERLAY_ENTRY_ID) {
				return `
          import { initOverlay } from 'vite-plugin-butterfly-effect/overlay';

          initOverlay({
            theme: '${theme}',
            showStatus: ${showStatus},
            animationSpeed: ${animationSpeed},
            maxButterflies: ${maxButterflies},
            trackEffect: ${trackEffect},
            trackState: ${trackState},
          });
        `;
			}
		},
		// メインエントリーポイントにオーバーレイ初期化コードを注入
		transform(code, id) {
			// main.tsx または main.ts に対してオーバーレイ初期化コードを注入
			if (id.match(/\/main\.(ts|tsx|js|jsx)$/)) {
				return {
					code: `import '${OVERLAY_ENTRY_ID}';\n${code}`,
					map: null,
				};
			}

			// TSX/JSXファイルをスキップ
			if (!id.match(/\.(jsx|tsx)$/)) {
				return null;
			}

			// TSX/JSXファイルを変換
			try {
				const result = transformReactCode(code, {
					trackEffect,
					trackState,
				});

				return result;
			} catch (error) {
				console.error(`[${PLUGIN_NAME}] Error transforming ${id}:`, error);
				return null;
			}
		},
	};
}

export { butterflyEffect };
