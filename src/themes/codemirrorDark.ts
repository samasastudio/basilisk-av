/**
 * CodeMirror dark theme for Basilisk AV
 * Muted syntax colors designed to not compete with Hydra visuals
 * Used in dark mode for immersive live-coding experience
 */

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

/**
 * Dark theme editor styling
 * Transparent background with high-contrast cursor and selection
 */
export const basiliskDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    color: '#e0e0e0',
  },
  '.cm-content': {
    caretColor: '#ffffff',
  },
  '.cm-cursor': {
    borderLeftColor: '#ffffff',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: '#6a737d',
    border: 'none',
  },
  '.cm-lineNumbers': {
    color: '#6a737d',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}, { dark: true });

/**
 * Dark theme syntax highlighting
 * Muted colors that work well over Hydra visuals
 */
export const basiliskDarkHighlight = HighlightStyle.define([
  // Keywords - muted purple
  { tag: tags.keyword, color: '#c792ea' },

  // Strings - muted green
  { tag: tags.string, color: '#c3e88d' },
  { tag: tags.inserted, color: '#c3e88d' },

  // Numbers - soft orange
  { tag: tags.number, color: '#f78c6c' },

  // Comments - gray italic
  { tag: tags.comment, color: '#6a737d', fontStyle: 'italic' },

  // Functions - soft blue
  { tag: tags.function(tags.variableName), color: '#82aaff' },
  { tag: tags.labelName, color: '#82aaff' },

  // Operators - cyan
  { tag: tags.operator, color: '#89ddff' },
  { tag: tags.operatorKeyword, color: '#89ddff' },

  // Variables and properties - default text
  { tag: tags.variableName, color: '#e0e0e0' },
  { tag: tags.propertyName, color: '#e0e0e0' },
  { tag: tags.name, color: '#e0e0e0' },

  // Booleans - muted red
  { tag: tags.bool, color: '#ff5370' },
  { tag: tags.atom, color: '#ff5370' },

  // Types and classes - soft orange
  { tag: tags.typeName, color: '#ffcb6b' },
  { tag: tags.className, color: '#ffcb6b' },

  // Constants - muted cyan
  { tag: tags.constant(tags.name), color: '#89ddff' },

  // Special strings (regex, escape) - soft blue
  { tag: tags.special(tags.string), color: '#82aaff' },
  { tag: tags.regexp, color: '#82aaff' },
  { tag: tags.escape, color: '#89ddff' },

  // Definitions - brighter for visibility
  { tag: tags.definition(tags.variableName), color: '#eeffff' },

  // Invalid - muted red
  { tag: tags.invalid, color: '#ff5370' },
]);

/**
 * Combined dark mode extension
 * Use this in CodeMirror extensions array when theme is 'dark'
 */
export const basiliskDark = [
  basiliskDarkTheme,
  syntaxHighlighting(basiliskDarkHighlight),
];
