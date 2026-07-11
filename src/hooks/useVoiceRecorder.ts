import { useCallback, useRef, useState } from "react";

export interface UseVoiceRecorderResult {
	recording: boolean;
	audioUrl: string | null;
	error: string | null;
	startRecording: () => void;
	stopRecording: () => void;
	clearRecording: () => void;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
	const [recording, setRecording] = useState(false);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);

	const clearRecording = useCallback(() => {
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl);
		}
		setAudioUrl(null);
		setError(null);
		chunksRef.current = [];
		mediaRecorderRef.current = null;
	}, [audioUrl]);

	const startRecording = useCallback(() => {
		setError(null);

		if (!navigator.mediaDevices?.getUserMedia) {
			setError("Tu navegador no permite grabar audio desde el micrófono.");
			return;
		}

		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then((stream) => {
				const recorder = new MediaRecorder(stream);
				mediaRecorderRef.current = recorder;
				chunksRef.current = [];

				recorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						chunksRef.current.push(event.data);
					}
				};

				recorder.onstop = () => {
					const blob = new Blob(chunksRef.current, { type: "audio/webm" });
					setAudioUrl(URL.createObjectURL(blob));
					stream.getTracks().forEach((track) => track.stop());
				};

				recorder.onerror = () => {
					setError("La grabación se interrumpió. Volvé a intentarlo.");
					stream.getTracks().forEach((track) => track.stop());
				};

				recorder.start();
				setRecording(true);
			})
			.catch((err: unknown) => {
				if (err instanceof DOMException && err.name === "NotAllowedError") {
					setError("Necesitamos tu permiso para usar el micrófono.");
					return;
				}
				if (err instanceof DOMException && err.name === "NotFoundError") {
					setError("No se detectó ningún micrófono en este dispositivo.");
					return;
				}
				setError("No se pudo iniciar la grabadora. Revisá los permisos.");
			});
	}, []);

	const stopRecording = useCallback(() => {
		const recorder = mediaRecorderRef.current;
		if (!recorder || recorder.state === "inactive") return;
		recorder.stop();
		setRecording(false);
	}, []);

	return {
		recording,
		audioUrl,
		error,
		startRecording,
		stopRecording,
		clearRecording,
	};
}
