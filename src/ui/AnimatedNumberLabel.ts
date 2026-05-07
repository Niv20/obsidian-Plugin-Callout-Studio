import NumberFlow, {
	canAnimate,
	type Format,
} from "../../node_modules/number-flow";

export type AnimatedNumberLabel = {
	el: NumberFlow;
	update: (value: number) => void;
};

export type AnimatedNumberLabelOptions = {
	initialValue: number;
	prefix?: string;
	suffix?: string;
	format?: Format;
	locales?: Intl.LocalesArgument;
};

const transformTiming: EffectTiming = {
	duration: 160,
	easing: "cubic-bezier(0.2, 0, 0, 1)",
};

const opacityTiming: EffectTiming = {
	duration: 100,
	easing: "ease-out",
};

export function createAnimatedNumberLabel(
	parentEl: HTMLElement,
	options: AnimatedNumberLabelOptions,
): AnimatedNumberLabel {
	const flow = document.createElement("number-flow");
	flow.classList.add(
		"callout-studio-slider-value",
		"callout-studio-number-flow",
	);
	flow.locales = options.locales ?? "en-US";
	flow.format = options.format;
	flow.numberPrefix = options.prefix;
	flow.numberSuffix = options.suffix;
	flow.setAttribute("dir", "ltr");
	flow.trend = 0;
	flow.transformTiming = transformTiming;
	flow.spinTiming = transformTiming;
	flow.opacityTiming = opacityTiming;
	flow.respectMotionPreference = true;
	flow.animated = false;
	parentEl.appendChild(flow);
	flow.update(options.initialValue);

	window.requestAnimationFrame(() => {
		flow.animated = canAnimate;
	});

	return {
		el: flow,
		update: (value: number) => {
			if (!Number.isFinite(value)) return;
			flow.update(value);
		},
	};
}
