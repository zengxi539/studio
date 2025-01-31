import { observable, action, runInAction, autorun } from "mobx";

import { confirmSave, objectClone } from "eez-studio-shared/util";
import {
    IStore,
    beginTransaction,
    commitTransaction
} from "eez-studio-shared/store";

interface ICommand {
    execute: () => void;
    undo: () => void;
}

export interface IModel {
    modified: boolean;
    commit(): void;
    rollback(): void;
    canUndo: boolean;
    undo(): void;
    canRedo: boolean;
    redo(): void;
}

export class UndoManager {
    @observable dbObject: boolean;
    store: IStore;
    object: any;
    transactionLabel: string;
    @observable.shallow undoStack: ICommand[] = [];
    @observable.shallow redoStack: ICommand[] = [];
    @observable.shallow _model: IModel | undefined;
    autorunDisposer: any;

    constructor() {
        this.autorunDisposer = autorun(() => {
            EEZStudio.electron.ipcRenderer.send("windowSetState", {
                modified: this.modified,
                undo: this.canUndo,
                redo: this.canRedo
            });
        });
    }

    onTerminate() {
        this.autorunDisposer();
    }

    confirmSave() {
        return new Promise<boolean>(resolve => {
            if (this.modified) {
                confirmSave({
                    saveCallback: () => {
                        this.commit();
                        resolve(true);
                    },
                    dontSaveCallback: () => {
                        this.rollback();
                        resolve(true);
                    },
                    cancelCallback: () => resolve(false)
                });
            } else {
                resolve(true);
            }
        });
    }

    get modified() {
        return (
            (this.dbObject && this.undoStack.length > 0) ||
            (this._model && this._model.modified)
        );
    }

    @action.bound
    commit() {
        if (this.dbObject) {
            beginTransaction(this.transactionLabel);
            this.store.updateObject(objectClone(this.object));
            commitTransaction();

            this.dbObject = false;
            this.object = undefined;
            this.undoStack = [];
            this.redoStack = [];
        } else if (this._model) {
            this._model.commit();
            this._model = undefined;
        }
    }

    @action
    rollback() {
        if (this.dbObject) {
            runInAction(() => {
                while (this.canUndo) {
                    this.undo();
                }
            });

            this.dbObject = false;
            this.object = undefined;
            this.undoStack = [];
            this.redoStack = [];
        } else if (this._model) {
            this._model.rollback();
            this._model = undefined;
        }
    }

    set model(value: IModel | undefined) {
        if (this.model) {
            throw "try to set model while object is already set";
        }

        runInAction(() => {
            this._model = value;
        });
    }

    @action
    addCommand(
        transactionLabel: string,
        store: IStore,
        object: any,
        command: ICommand
    ) {
        if (this._model) {
            throw "try to add command while model is already set";
        }

        if (this.dbObject) {
            if (store !== this.store) {
                throw "try to add command to undo stack for different store";
            }

            if (object !== this.object) {
                throw "try to add command to undo stack for different object";
            }

            this.transactionLabel = transactionLabel;
        } else {
            this.dbObject = true;
            this.store = store;
            this.transactionLabel = transactionLabel;
            this.object = object;
        }

        this.undoStack.push(command);
        this.redoStack = [];

        command.execute();
    }

    get canUndo() {
        if (this._model) {
            return this._model.canUndo;
        }
        if (this.dbObject) {
            return this.undoStack.length > 0;
        }
        return undefined;
    }

    @action.bound
    undo() {
        if (this._model) {
            this._model.undo();
            return;
        }

        const command = this.undoStack.pop();
        if (command) {
            command.undo();
            this.redoStack.push(command);
        } else {
            console.error("Undo stack is empty");
            return;
        }
    }

    get canRedo() {
        if (this._model) {
            return this._model.canRedo;
        }
        if (this.dbObject) {
            return this.redoStack.length > 0;
        }
        return undefined;
    }

    @action.bound
    redo() {
        if (this._model) {
            this._model.redo();
            return;
        }

        const command = this.redoStack.pop();
        if (command) {
            command.execute();
            this.undoStack.push(command);
        } else {
            console.error("Redo stack is empty");
            return;
        }
    }
}
