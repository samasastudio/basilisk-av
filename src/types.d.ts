/* eslint-disable @typescript-eslint/no-explicit-any */
// Module declarations for libraries without type definitions require `any`
declare module 'hydra-synth';
declare module '@strudel/core';
declare module '@strudel/webaudio';
declare module '@strudel/hydra';
declare module '@strudel/transpiler';

declare module '@strudel/web' {
  export function initStrudel(config: any): Promise<any>;
  export function registerWidgetType(config: any): void;
  export * from '@strudel/web';
}

declare module '@strudel/codemirror' {
  import type { EditorView } from '@codemirror/view';

  export function sliderPlugin(config: any): any;
  export function sliderWithID(config: any): any;
  export function widgetPlugin(config: any): any;
  export function setWidget(id: string, element: HTMLElement): void;
  export function updateSliderWidgets(view: EditorView, widgets: any[]): void;
  export function updateWidgets(view: EditorView, widgets: any[]): void;
  export * from '@strudel/codemirror';
}
