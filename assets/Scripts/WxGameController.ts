import GameView from './GameView';
import { WxClient } from './WxClient';
import { WorkerStatus } from './Config';

const { ccclass, property } = cc._decorator;

@ccclass
export default class WxGameController extends cc.Component {
    @property(GameView)
    view: GameView = null;

    client: WxClient = null;
    worker: WxWorker = null;

    handleIncomingMessage(message: any): void {
        const command: string = message.command;
        if (command === 'REG_OK') {
            let playerId: number = message.playerId;
            let roomId: number = message.roomId;
            this.client.onRegisterSuccess(playerId, roomId);
        } else if (command === 'WORLD') {
            let payload: ArrayBuffer = message.payload;
            this.client.pushNewWorldResponse(new Uint8Array(payload));
        }
    }

    onEnable(): void {
        this.worker = wx.createWorker('workers/workerscripts/WxRoomManager.js');
        WorkerStatus.workerTerminated = false;

        this.worker.onMessage(this.handleIncomingMessage.bind(this));
        this.client = new WxClient(this, this.view);
        this.view.startGame();
        // start the first tick in WxClient
    }

    onDestroy(): void {
        if (this.worker !== null) {
            WorkerStatus.workerRef = this.worker;
            this.worker = null;
            WorkerStatus.workerRef.onMessage((obj) => {
                if (obj.command === 'STOP_OK') {
                    WorkerStatus.workerRef.terminate();
                    WorkerStatus.workerTerminated = true;
                    WorkerStatus.workerRef = null;
                }
            });

            WorkerStatus.workerRef.postMessage({
                command: 'STOP'
            });
        }
    }
}
