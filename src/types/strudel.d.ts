/**
 * Type declarations for Strudel and related packages
 * These modules don't provide their own @types packages, so we declare them here
 *
 * This file is automatically included via typeRoots in tsconfig.app.json
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module '@strudel/codemirror' {
  export function sliderPlugin(): any;
  export function sliderWithID(): any;
  export function widgetPlugin(): any;
  export function setWidget(id: string, element: any): void;
  export function updateSliderWidgets(view: any, widgets: any): void;
  export function updateWidgets(view: any, widgets: any): void;
  export function createEditorView(options: any): any;
  export function updateEditorView(view: any, options: any): void;
  export const CodeMirrorView: any;
  export const codeMirrorPlugin: any;
  export function highlight(view: any): any;
  export const highlighter: any;
}

declare module '@strudel/core' {
  export function reify(pattern: any): any;
  export function Hap(...args: any[]): any;
  export class Pattern {
    constructor(...args: any[]);
    [key: string]: any;
  }
  export function s(...args: any[]): any;
  export function pure(...args: any[]): any;
  export function silence(): any;
  export function stack(...patterns: any[]): any;
  export function sequence(...patterns: any[]): any;
  export function cat(...patterns: any[]): any;
  export function when(condition: any, pattern: any): any;
  export function every(n: any, pattern: any): any;
  export function rarely(pattern: any): any;
  export function often(pattern: any): any;
  export const time: any;
}

declare module '@strudel/hydra' {
  export function initHydra(): Promise<void>;
  export const hydra: any;
  export const h: any;
  export const H: any;
}

declare module '@strudel/web' {
  export function initStrudel(options?: any): Promise<any>;
  export function registerWidgetType(name: string): void;
  export function evaluatePattern(pattern: any): void;
  export const repl: any;
}

declare module '@strudel/webaudio' {
  export function initAudio(options?: any): Promise<any>;
  export const audioContext: any;
  export const scheduler: any;
  export const samples: (url: string) => Promise<any>;
}

declare module '@strudel/draw' {
  export function initDraw(options?: any): Promise<void>;
  export const draw: any;
}
