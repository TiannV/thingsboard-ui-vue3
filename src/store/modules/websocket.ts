import { defineStore } from "pinia";
import { store } from '/@/store';
import { UseWebSocketReturn, useWebSocket } from '@vueuse/core';
import { useGlobSetting } from '/@/hooks/setting';
import { useUserStore } from '/@/store/modules/user';
import { sleep } from "/@/utils";
import { isArray } from "/@/utils/is";

interface WebsocketState {
  cmdId: number;
  websocket: Nullable<UseWebSocketReturn<any>>;
  callbackMap: Map<number, (data: any) => void>;
}

export const useWebsocketStore = defineStore({
  id: 'websocket-store',
  state: (): WebsocketState => ({
    cmdId: 0,
    websocket: null,
    callbackMap: new Map(),
  }),
  getters: {
    getCmdId(): number {
      return this.cmdId;
    },

  },
  actions: {
    close(): any {
      if (this.websocket!= null) {
        this.websocket.close();
      }
      this.websocket = null;
    },
    getAndIncrementCmdId(): number {
      this.cmdId = this.cmdId + 1;
      return this.cmdId;
    },
    async send(cmdId: number | Array<number>, data: any, callback?: (data: any) => void): Promise<boolean> {
      if (this.websocket == null) {
        this.initWebsocket();
      }
      if (this.websocket!= null) {
        if (this.websocket.status == 'CLOSED') {
          this.websocket.open();
          await sleep(500);
        }
        if (callback) {
          if (isArray(cmdId)) {
            cmdId.forEach(i => this.callbackMap.set(i, callback));
          } else {
            this.callbackMap.set(cmdId, callback);
          }
        }
        return this.websocket.send(JSON.stringify(data));
      }
      return false;
    },
    async unsubscribe(cmdId: number | Array<number>, data: any) {
      if (this.websocket!= null) {
        if (this.websocket.status == 'CLOSED') {
          this.websocket.open();
          await sleep(500);
        }
        this.websocket.send(JSON.stringify(data));
      }
      if (isArray(cmdId)) {
        cmdId.forEach(i => this.callbackMap.delete(i));
      } else {
        this.callbackMap.delete(cmdId);
      }
    },
    initWebsocket(): WebSocket | undefined {
      const userStore = useUserStore();
      const { wsPath } = useGlobSetting();
      const useWebSocketReturn = useWebSocket(
        `${wsPath}`,
        { autoReconnect: false, autoClose: false, onMessage: this.onMessage }
      )
      this.websocket = useWebSocketReturn;
      return this.websocket?.ws;
    },
    onMessage(ws: WebSocket, { data }: MessageEvent): any {
      const dataObj = JSON.parse(data);
      if (dataObj.hasOwnProperty('subscriptionId')) {
        this.callbackMap.get(dataObj.subscriptionId)?.(dataObj);
      } else if (dataObj.hasOwnProperty('cmdId')) {
        this.callbackMap.get(dataObj.cmdId)?.(dataObj);
      }
    }
  }
});


export function useWebsocketStoreWithOut() {
  return useWebsocketStore(store);
}