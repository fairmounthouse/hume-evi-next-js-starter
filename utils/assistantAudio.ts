export class AssistantAudioBus {
	private audioContext: AudioContext;
	private destination: MediaStreamAudioDestinationNode;
	private scheduleTime: number;
	private sampleRateFallback = 48000;

	constructor() {
		this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		this.destination = this.audioContext.createMediaStreamDestination();
		this.scheduleTime = this.audioContext.currentTime;
	}

	getStream(): MediaStream {
		return this.destination.stream;
	}

	attachStream(stream: MediaStream) {
		try {
			const src = this.audioContext.createMediaStreamSource(stream);
			src.connect(this.destination);
			src.connect(this.audioContext.destination);
			this.resume();
		} catch {}
	}

	async pushBase64Wav(base64: string) {
		try {
			const ab = base64ToArrayBuffer(base64);
			const buffer = await this.audioContext.decodeAudioData(ab);
			this.playBuffer(buffer);
			this.resume();
		} catch {}
	}

	pushPcm16(int16: Int16Array, sampleRate?: number, channels: number = 1) {
		const sr = sampleRate || this.sampleRateFallback;
		const numChannels = Math.max(1, Math.min(2, channels));
		const frames = Math.floor(int16.length / numChannels);
		const buffer = this.audioContext.createBuffer(numChannels, frames, sr);
		for (let ch = 0; ch < numChannels; ch++) {
			const channelData = buffer.getChannelData(ch);
			for (let i = 0; i < frames; i++) {
				const s16 = int16[i * numChannels + ch] || 0;
				channelData[i] = Math.max(-1, Math.min(1, s16 / 32768));
			}
		}
		this.playBuffer(buffer);
	}

	pushFloat32(float32: Float32Array, sampleRate?: number, channels: number = 1) {
		const sr = sampleRate || this.sampleRateFallback;
		const numChannels = Math.max(1, Math.min(2, channels));
		const frames = Math.floor(float32.length / numChannels);
		const buffer = this.audioContext.createBuffer(numChannels, frames, sr);
		for (let ch = 0; ch < numChannels; ch++) {
			const channelData = buffer.getChannelData(ch);
			for (let i = 0; i < frames; i++) {
				channelData[i] = float32[i * numChannels + ch] || 0;
			}
		}
		this.playBuffer(buffer);
	}

	private playBuffer(buffer: AudioBuffer) {
		const src = this.audioContext.createBufferSource();
		src.buffer = buffer;
		src.connect(this.destination);
		src.connect(this.audioContext.destination);
		const startAt = Math.max(this.scheduleTime, this.audioContext.currentTime);
		src.start(startAt);
		this.scheduleTime = startAt + buffer.duration;
	}

	resume() {
		if (this.audioContext.state !== "running") {
			this.audioContext.resume().catch(() => {});
		}
	}

	close() {
		try { this.destination.disconnect(); } catch {}
		try { this.audioContext.close(); } catch {}
	}
}

export function base64ToInt16(base64: string): Int16Array {
	const bin = atob(base64);
	const len = bin.length / 2;
	const arr = new Int16Array(len);
	for (let i = 0; i < len; i++) {
		const lo = bin.charCodeAt(i * 2);
		const hi = bin.charCodeAt(i * 2 + 1);
		arr[i] = (hi << 8) | lo;
	}
	return arr;
}

export function base64ToFloat32(base64: string): Float32Array {
	const bin = atob(base64);
	const len = bin.length / 4;
	const arr = new Float32Array(len);
	const view = new DataView(new ArrayBuffer(bin.length));
	for (let i = 0; i < bin.length; i++) (view as any).setUint8(i, bin.charCodeAt(i));
	for (let i = 0; i < len; i++) {
		arr[i] = view.getFloat32(i * 4, true);
	}
	return arr;
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary_string = atob(base64);
	const len = binary_string.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) bytes[i] = binary_string.charCodeAt(i);
	return bytes.buffer;
}
