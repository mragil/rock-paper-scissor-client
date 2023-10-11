import { browser } from '$app/environment';
import { writable } from 'svelte/store';

interface Message {
	type: 'INFO' | 'CHAT' | 'GAME' | 'OPPONENT' | 'TIMER' | 'RESULT' | 'RESET' | 'REPLAY';
	text: string;
	data?: Game;
}

type Pick = 'Rock' | 'Paper' | 'Scissor';

interface Game {
	[key: string]: Pick;
}

type GameState = {
	timer: string | null;
	isFinish: boolean;
	userPick: Pick | null;
	gameData: Game | undefined;
	opponent: string;
	winner: string;
	info: string;
};

const store = () => {
	const gameState: GameState = {
		timer: null,
		isFinish: false,
		userPick: null,
		opponent: '',
		winner: '',
		gameData: undefined,
		info: '',
	};

	const { update, subscribe } = writable(gameState);

	const connectToRoom = (socket: WebSocket) => {
		if (browser) {
			socket.addEventListener('open', (event) => {
				console.log('[websocket] connection open', event);
			});
			socket.addEventListener('close', (event) => {
				console.log('[websocket] connection closed', event);
			});
			socket.addEventListener('message', (event) => {
				console.log('[websocket] message received', event);
				const message: Message = JSON.parse(event.data);
				if (message.type === 'OPPONENT') {
					update((state) => ({ ...state, opponent: message.text }));
				}
				if (message.type === 'TIMER') {
					update((state) => ({ ...state, timer: message.text }));
				}
				if (message.type === 'RESULT') {
					update((state) => ({
						...state,
						isFinish: true,
						winner: message.text,
						gameData: message.data
					}));
				}
				if (message.type === 'INFO') {
					update((state) => ({ ...state, info: message.text }));
				}
				if (message.type === 'REPLAY') {
					update((state) => ({ ...state, info: '', isFinish: false }));
				}
			});
		}
	};

	const sendPick = (socket: WebSocket, pick: Pick) => {
		update((state) => ({ ...state, userPick: pick }));
		const msg: Message = {
			type: 'GAME',
			text: pick
		};
		socket.send(JSON.stringify(msg));
	};

	const resetGame = (socket: WebSocket) => {
		const msg: Message = {
			type: 'RESET',
			text: ''
		};
		update((state) => ({ ...state, userPick: null, timer: null }));
		socket.send(JSON.stringify(msg));
	};

	return {
		subscribe,
		connectToRoom,
		sendPick,
		resetGame
	};
};

export default store();
