import type { ButterflyEffectOptions } from "./types";

type TransformOptions = Pick<
	ButterflyEffectOptions,
	"trackEffect" | "trackState"
>;

/**
 * Transform React code to inject state tracking ONLY for setState calls within useEffect
 * This helps visualize useEffect chains and catch infinite loops
 */
export const transformReactCode = (code: string, options: TransformOptions) => {
	const { trackState } = options;

	if (!trackState) {
		return null;
	}

	if (!code.includes("useState") || !code.includes("useEffect")) {
		return null;
	}

	let transformedCode = code;
	let hasTransformed = false;

	if (!code.includes("__trackStateUpdate")) {
		// Import the tracking function at the top
		transformedCode =
			`import { __trackStateUpdate } from 'vite-plugin-butterfly-effect/runtime';\n` +
			transformedCode;
		hasTransformed = true;
	}

	// 関数宣言または関数式のコンポーネント名を取得
	const componentNameMatch = code.match(
		/function\s+(\w+)|const\s+(\w+)\s*=\s*\(/,
	);
	const componentName = componentNameMatch
		? componentNameMatch[1] || componentNameMatch[2] || "Unknown"
		: "Unknown";

	// useState フックから setter 関数の名前を抽出
	// const [count, setCount] = useState(0);
	// const [name, setName] = useState("");
	// const [isOpen, setIsOpen] = useState(false);
	// -> setterNames = Set { 'setCount', 'setName', 'setIsOpen' }
	const setterNames = new Set<string>();
	const useStateRegex = /const\s+\[[^,]+,\s*([^\]]+)\]\s*=\s*useState\(/g;
	const matches = code.matchAll(useStateRegex);
	for (const match of matches) {
		setterNames.add(match[1].trim());
	}

	const lines = transformedCode.split("\n"); // コードを行ごとに分割
	const newLines: string[] = []; // 変換後の行を格納
	let inUseEffect = false; // useEffect内にいるかどうかのフラグ
	let braceDepth = 0; // 波括弧の深さ
	let useEffectStartDepth = 0; // useEffect開始時の深さ

	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];

		// 波括弧の深さを追跡
		// 行: "function foo() {"
		// -> openBraces = 1, closeBraces = 0
		// 行: "}"
		// -> openBraces = 0, closeBraces = 1
		const openBraces = (line.match(/\{/g) || []).length;
		const closeBraces = (line.match(/\}/g) || []).length;

		// useEffect の開始を検出
		if (line.includes("useEffect(") && !inUseEffect) {
			inUseEffect = true;
			useEffectStartDepth = braceDepth;
		}

		// 波括弧の深さを更新
		braceDepth += openBraces - closeBraces;

		// useEffect の終了を検出
		// useEffect(() => {      // useEffectStartDepth = 1
		//   setCount(x + 1);     // braceDepth = 2
		// }, []);                // braceDepth = 1, closeBraces = 1
		// → useEffect終了を検出
		if (inUseEffect && braceDepth <= useEffectStartDepth && closeBraces > 0) {
			inUseEffect = false;
		}

		// setState 呼び出しを検出して変換
		// setCount(count + 1);
		// -> __trackStateUpdate({ componentName: 'Counter', line: 4, timestamp: Date.now() }); setCount(count + 1);
		if (inUseEffect) {
			for (const setterName of setterNames) {
				const setterCallRegex = new RegExp(`\\b${setterName}\\s*\\(`, "g");
				if (setterCallRegex.test(line)) {
					const leadingWhitespace = line.match(/^\s*/)?.[0] || "";

					// トラッキングコードを注入
					line = `${leadingWhitespace}__trackStateUpdate({ componentName: '${componentName}', line: ${i + 1}, timestamp: Date.now() }); ${line.trim()}`;
					hasTransformed = true;
					break;
				}
			}
		}

		newLines.push(line);
	}

	if (!hasTransformed) {
		return null;
	}

	return {
		code: newLines.join("\n"),
		map: null,
	};
};
