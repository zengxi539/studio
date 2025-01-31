import { Point, Rect } from "eez-studio-shared/geometry";

import { ITransform, Transform } from "home/designer/transform";

export { IHomeTab } from "home/tabs-store";

export interface IBaseObject {
    id: string;
    rect: Rect;
    children: IBaseObject[];
    isMoveable: boolean;
    getResizeHandlers?: () => IResizeHandler[] | undefined | false;
    open(): void;
}

export interface IDocument {
    rootObjects: IBaseObject[];

    findObjectById(id: string): IBaseObject | undefined;
    findObjectParent(object: IBaseObject): IBaseObject | undefined;

    // modify
    createObject(params: any): void;
    deleteObjects(objects: IBaseObject[]): void;

    // view
    objectFromPoint(point: Point): IBaseObject | undefined;
    getObjectsInsideRect(rect: Rect): IBaseObject[];
    resetTransform?(transform: ITransform): void;

    // misc.
    createContextMenu(objects: IBaseObject[]): Electron.Menu | undefined;

    // events
    onDragStart(op: "move" | "resize"): void;
    onDragEnd(
        op: "move" | "resize",
        changed: boolean,
        objects: IBaseObject[]
    ): void;
}

export type HandleType =
    | "nw-resize"
    | "n-resize"
    | "ne-resize"
    | "w-resize"
    | "e-resize"
    | "sw-resize"
    | "s-resize"
    | "se-resize";

export interface IResizeHandler {
    // Top-left: 0, 0
    // Bottom-right: 100, 100
    // Left: 0 50
    // ...
    x: number;
    y: number;
    type: HandleType;
    columnIndex?: number;
    rowIndex?: number;
}

export interface IViewState {
    transform: Transform;
    resetTransform(): void;

    // true if there is no active user interaction (like mouse) with the designer.
    isIdle: boolean;

    // selection
    selectedObjects: IBaseObject[];
    getResizeHandlers: () => IResizeHandler[] | undefined;

    isObjectSelected(object: IBaseObject): boolean;

    selectObject(object: IBaseObject): void;
    selectObjects(objects: IBaseObject[]): void;
    deselectAllObjects(): void;

    persistentState: IViewStatePersistantState;
}

export interface IDesignerOptions {
    center?: Point;
}

export interface IDesignerContext {
    document: IDocument;
    viewState: IViewState;
    options: IDesignerOptions;
    filterSnapLines?: (node: IBaseObject) => boolean;
}

export interface IViewStatePersistantState {
    transform?: ITransform;
    selectedObjects: string[];
}

export interface IToolbarButton {
    id: string;
    label: string;
    title: string;
    className?: string;
    onClick: (context: IDesignerContext) => void;
}

export interface IMouseHandler {
    cursor: string;
    down(context: IDesignerContext, event: MouseEvent): void;
    move(context: IDesignerContext, event: MouseEvent): void;
    up(context: IDesignerContext, event?: MouseEvent): void;
    selectionVisible: boolean;
    render?(context: IDesignerContext): React.ReactNode;
}

export interface IToolHandler {
    render(
        context: IDesignerContext,
        mouseHandler: IMouseHandler | undefined
    ): React.ReactNode;

    onClick(context: IDesignerContext, point: Point): void;

    onContextMenu(
        context: IDesignerContext,
        point: Point,
        showContextMenu: (menu: Electron.Menu) => void
    ): void;

    cursor: string;

    canDrag: boolean;
    drop(context: IDesignerContext, point: Point): void;

    createMouseHandler(
        context: IDesignerContext,
        event: MouseEvent
    ): IMouseHandler | undefined;
}
