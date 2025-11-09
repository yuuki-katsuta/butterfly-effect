/// <reference types="vite/client" />

// Viteプラグインの仮想モジュールの型定義
declare module "vite-plugin-butterfly-effect/runtime" {
	import type {
		ButterflyEvent,
		ButterflyEventListener,
		StateUpdateData,
	} from "./types";

	export class ButterflyEventEmitter {
		on(listener: ButterflyEventListener): () => void;
		emit(event: ButterflyEvent): void;
	}

	export const ButterflyEvents: ButterflyEventEmitter;
	export function __trackStateUpdate(data: StateUpdateData): void;
}

declare module "vite-plugin-butterfly-effect/overlay" {
	import type { ButterflyEffectOptions } from "./types";
	export function initOverlay(options: ButterflyEffectOptions): void;
}
