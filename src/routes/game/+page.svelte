<script lang="ts">
	interface Message {
		type: 'INFO' | 'CHAT' | 'GAME' | 'OPPONENT' | 'TIMER' | 'RESULT' | 'RESET' | 'REPLAY';
		text: string;
		data?: Game;
	}

	type Pick = 'Rock' | 'Paper' | 'Scissor';

	interface Game {
		[key: string]: Pick;
	}

	import { PUBLIC_WS_HOST } from '$env/static/public';
	import Modal from '$lib/components/Modal.svelte';
	import Deck from './Deck.svelte';
	import Intro from './Intro.svelte';

	let name: string;
	let room: string;
	let socket: WebSocket;
	let wsEstablished: boolean = false;
	let timer: string | null = null;
	let isFinish: boolean = false;
	let userPick: Pick | null = null;
	let gameData: Game | undefined;

	let opponentText: string | null = 'Waiting for your opponent...';
	let opponent: string;
	let infoText: string = '';
	let winnerText: string = '';

	const connectToRoom = () => {
		const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
		socket = new WebSocket(
			`${protocol}://${PUBLIC_WS_HOST}/chat?userName=${name}&roomName=${room}`
		);
		socket.addEventListener('open', (event) => {
			wsEstablished = true;
			console.log('[websocket] connection open', event);
		});
		socket.addEventListener('close', (event) => {
			console.log('[websocket] connection closed', event);
		});
		socket.addEventListener('message', (event) => {
			console.log('[websocket] message received', event);
			const message: Message = JSON.parse(event.data);
			if (message.type === 'OPPONENT') {
				opponent = message.text;
				opponentText = `${opponent} is still picking`;
			}
			if (message.type === 'TIMER') {
				timer = message.text;
			}
			if (message.type === 'RESULT') {
				winnerText = message.text;
				isFinish = true;
				gameData = message.data;
			}
			if (message.type === 'INFO') {
				infoText = message.text;
			}
			if (message.type === 'REPLAY') {
				opponentText = `Your opponent is ${opponent}`;
				infoText = '';
			}
		});
	};

	const sendPick = (pick: Pick) => {
		userPick = pick;
		const msg: Message = {
			type: 'GAME',
			text: pick
		};
		socket.send(JSON.stringify(msg));
	};

	const showWinner = (winner: string) => {
		if (winner === 'DRAW') {
			return 'Draw, you guys pick the same';
		}
		if (winner === opponent) {
			return 'You lose, sorry 😢';
		}
		return 'You win, congrats 🥳';
	};

	const resetGame = () => {
		const msg: Message = {
			type: 'RESET',
			text: ''
		};
		opponentText = 'Waiting your opponent to replay...';
		timer = null;
		userPick = null;
		socket.send(JSON.stringify(msg));
	};
</script>

<div class="text-center py-10">
	{#if wsEstablished}
		<Modal bind:isOpen={isFinish} closeHandler={resetGame}>
			<h1 slot="header" class="text-4xl">{showWinner(winnerText)}</h1>
			<div class="my-5" slot="content">
				{#if gameData}
					<p>You pick: {gameData[name] || 'Nothing 😢'}</p>
					<p>{opponent} pick: {gameData[opponent] || 'Nothing 😢'}</p>
				{/if}
			</div>
			<div slot="button-action-footer">
				{#if infoText === ''}
					<button class="mx-auto my-auto w-20 text-black"
						><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
							><path
								fill="currentColor"
								d="M12 17q-2.075 0-3.537-1.463Q7 14.075 7 12h1.5q0 1.45 1.025 2.475Q10.55 15.5 12 15.5q1.45 0 2.475-1.025Q15.5 13.45 15.5 12q0-1.45-1.025-2.475Q13.45 8.5 12 8.5h-.075l1.225 1.25l-1.05 1.075l-3-3l3-3L13.175 5.9l-1.1 1.1q2.05.05 3.487 1.5Q17 9.95 17 12q0 2.075-1.462 3.537Q14.075 17 12 17Zm0 5q2.075 0 3.9-.788q1.825-.787 3.175-2.137q1.35-1.35 2.137-3.175Q22 14.075 22 12t-.788-3.9q-.787-1.825-2.137-3.175q-1.35-1.35-3.175-2.138Q14.075 2 12 2t-3.9.787q-1.825.788-3.175 2.138q-1.35 1.35-2.137 3.175Q2 9.925 2 12t.788 3.9q.787 1.825 2.137 3.175q1.35 1.35 3.175 2.137Q9.925 22 12 22Z"
							/></svg
						>
					</button>
				{:else}
					<h1 class="text-3xl">{infoText}</h1>
				{/if}
			</div>
		</Modal>
		{#if timer}
			<div class="p-5 shadow-md rounded-full">
				<h2 class="text-2xl">Timer: {timer}</h2>
			</div>
		{/if}
		<div class="grid grid-rows-3 gap-5 text-4xl items-center">
			<h1 class="">{opponentText}</h1>
			<Deck {sendPick} active={userPick} />
			<h1>{userPick ? `You Choose ${userPick}` : 'Your Turn'}</h1>
		</div>
	{:else}
		<div class="text-center py-20">
			<Intro {connectToRoom} bind:name bind:room />
		</div>
	{/if}
</div>
