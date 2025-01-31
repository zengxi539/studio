import { UNITS } from "eez-studio-shared/units";
import { IStore } from "eez-studio-shared/store";
import { IActivityLogEntry } from "eez-studio-shared/activity-log-interfaces";
import { IToolbarButton, IHomeTab } from "home/designer/designer-interfaces";

import { IShortcut } from "shortcuts/interfaces";

import { IFieldProperties } from "eez-studio-ui/generic-dialog";

export { IFieldProperties } from "eez-studio-ui/generic-dialog";

import type { IEezStudio } from "eez-studio-types";

export interface IActivityLogEntryInfo {
    name: string;
    content: JSX.Element | string;
}

export interface IEditor {
    onCreate(): void;
    onActivate(): void;
    onDeactivate(): void;
    onTerminate(): void;
    onBeforeAppClose(): Promise<boolean>;

    render(): JSX.Element;
}

export interface IObject {
    id: string;
    name: string;
    content: JSX.Element | null;
    activityLogEntryInfo(
        logEntry: IActivityLogEntry
    ): IActivityLogEntryInfo | null;
    details: JSX.Element | null;
    isEditable: boolean;
    getEditor?(): IEditor;
    getEditorWindowArgs?(): {
        url: string;
        args: any;
    };
    openEditor?(target: "tab" | "window" | "default"): void;
    afterDelete?(): void;
    addToContextMenu?(menu: Electron.Menu): void;
    getIcon(): React.ReactNode;
}

export interface IExtensionProperties {
    properties?: any;
    shortcuts?: IShortcut[];
    moreDescription?: string;
}

export interface IHomeSection {
    id: string;
    name?: string;
    title: string;
    icon: string;
    renderContent: () => JSX.Element;
    selectItem?: (itemId: string) => void;
}

export interface IActivityLogController {
    store: IStore;
    selection: IActivityLogEntry[];
}

interface IActivityLogTool1 {
    id: string;
    name?: string;
    title: string;
    icon: string;
    isEnabled: (controller: IActivityLogController) => boolean;
    handler: (controller: IActivityLogController) => void;
}

type IActivityLogTool2 = (
    controller: IActivityLogController
) => JSX.Element | null;

type IActivityLogTool = IActivityLogTool1 | IActivityLogTool2;

export type IMeasurementFunctionResultType = "value" | "chart";

export interface IMeasurementFunction {
    id: string;
    name: string;
    script: string;

    // On how much channels function operates?
    // Usually only 1, but some functions like add or sub operates on 2.
    // Default value is 1.
    arity?: number;

    parametersDescription?: IFieldProperties[];

    resultType?: IMeasurementFunctionResultType;
}

export interface IChart {
    data: number[];
    samplingRate: number;
    xAxes: {
        unit: keyof typeof UNITS;
        logarithmic?: boolean;
    };
    yAxes: {
        minValue?: number;
        maxValue?: number;
        unit: keyof typeof UNITS;
    };
}

interface IInput {
    // no. of samples per second
    samplingRate: number;
    getSampleValueAtIndex(index: number): number;
    valueUnit: keyof typeof UNITS;
    values: any;
}

export interface IMeasureTask extends IInput {
    // x value of the first sample (at xStartIndex)
    xStartValue: number;
    // index of the first sample to use for measurement
    xStartIndex: number;
    // total number of samples to use for measurement
    xNumSamples: number;

    // inputs in case when arity is > 1
    inputs: IInput[];

    parameters?: any;

    // store measurement result to this property
    result: number | string | IChart | null;

    resultUnit?: keyof typeof UNITS;
}

export interface IExtensionDescription {
    id: string;
    name: string;
    displayName?: string;
    version: string;
    author: string;
    description?: string;
    moreDescription?: string;
    image?: string;
    download?: string;
    sha256?: string;
    installationFolderPath?: string;
    shortName?: string;
    revisionNumber?: string;
    supportedModels?: string;
    revisionComments?: string;
}

export interface IExtensionHost {
    activeTab: IHomeTab;
}

export interface IExtensionDefinition {
    preInstalled?: boolean;

    type?: string;

    init?: () => void;
    destroy?: () => void;

    toolbarButtons?: IToolbarButton[];
    objectTypes?: {
        [type: string]: (oid: string) => IObject | undefined;
    };
    loadExtension?: (
        extensionFolderPath: string
    ) => Promise<IExtension | undefined>;
    renderPropertiesComponent?: () => Promise<JSX.Element>;
    properties?: IExtensionProperties;
    isEditable?: boolean;
    isDirty?: boolean;

    homeSections?: IHomeSection[];

    activityLogTools?: IActivityLogTool[];

    measurementFunctions?: IMeasurementFunction[];

    eezFlowExtensionInit?: (eezStudio: IEezStudio) => void;

    handleDragAndDropFile?(
        filePath: string,
        host: IExtensionHost
    ): Promise<boolean>;
}

export type IExtension = IExtensionDescription & IExtensionDefinition;
