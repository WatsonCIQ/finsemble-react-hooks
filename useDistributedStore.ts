import * as React from "react";
import { promisify } from "util";
import { useState } from "react";

// interface StoreModel {
// 	Dispatcher: { register: Function; dispatch: Function };
// 	clientReadyQueue: [];
// 	finsembleWindow: null;
// 	handleChanges: Function;
// 	initialize: Function;
// 	initialized: boolean;
// 	isGlobal: undefined;
// 	listeners: [];
// 	logger: {};
// 	lst: [];
// 	mapping: {};
// 	name: { store: string; values: {} };
// 	onClose: Function;
// 	onReady: Function;
// 	processClientReadyQueue: Function;
// 	registeredDispatchListeners: [];
// 	routerClient: {};
// 	setClientOnline: Function;
// 	startupDependencies: { services: []; clients: [] };
// 	startupTime: number;
// 	status: string;
// 	values: object;
// 	windowName: string;
// }
interface Params {
  store: string;
  global?: boolean;
  persist?: boolean;
  values?: any;
}

interface FSBLPromise {
  err: string | null;
  response: any;
}

export default function useDistributedStore() {
  const FSBL = window.FSBL;
  const { DistributedStoreClient } = FSBL.Clients;
  const [stores, setStores] = useState([]);

  const createStore = async ({
    store,
    global = true,
    persist = false,
    values
  }: Params): Promise<StoreModel> => {
    try {
      const initializedStore = DistributedStoreClient.createStore({
        store,
        global,
        persist,
        values
      });
      const { data } = await initializedStore;
      const newStore = { [data.name]: data };
      setStores([newStore, ...stores]);
      return data;
    } catch (error) {
      console.error(error);
      return error;
    }
  };

  const getStore = async ({
    store,
    global = true
  }: {
    store?: string;
    global: boolean;
  }): Promise<StoreModel> => {
    try {
      const storeData: (arg1: {
        store?: string;
        global?: boolean;
      }) => Promise<StoreModel> = promisify(DistributedStoreClient.getStore);

      return await storeData({
        store,
        global
      });
    } catch (error) {
      console.error(error);
      return error;
    }
  };

  const removeStore = async (store: string, global: boolean) => {
    const removeStore = promisify(DistributedStoreClient.removeStore);
    return await removeStore({ store, global });
  };

  const getStoreFromLocalState = (storeName: string): StoreModel => {
    try {
      const store = stores.find((store): {} => store[storeName]);
      if (typeof store === "object") {
        return store[storeName];
      } else {
        throw `store is not an object: ${store}`;
      }
    } catch (error) {
      return error;
    }
  };

  const setValues = async (
    storeName: string,
    storeItem: { field: string; value: any }
  ): Promise<{ header: object; data: object }> => {
    const store = getStoreFromLocalState(storeName);
    const { response } = await store.setValue(storeItem);
    return response;
  };

  return {
    createStore,
    getStore,
    removeStore,
    stores,
    setValues
  };
}
