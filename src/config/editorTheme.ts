/**
 * Custom CodeMirror syntax theme for Basilisk AV
 * Muted, desaturated color scheme with subtle variations
 */

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/**
 * Basilisk muted syntax highlighting color scheme
 * Inspired by low-contrast, desaturated aesthetics
 */
const basiliskHighlightStyle = HighlightStyle.define([
  // Comments - muted gray-teal
  {
    tag: t.comment,
    color: '#6b7d8c',
    fontStyle: 'italic'
  },
  // Keywords - muted purple-gray
  {
    tag: t.keyword,
    color: '#8b92a6'
  },
  // Variables and property names - light gray
  {
    tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
    color: '#a8b5c2'
  },
  // Function names - muted teal
  {
    tag: [t.function(t.variableName), t.labelName],
    color: '#7da0a8'
  },
  // Constants - muted warm gray
  {
    tag: [t.color, t.constant(t.name), t.standard(t.name)],
    color: '#9b9588'
  },
  // Definitions - slightly brighter gray
  {
    tag: [t.definition(t.name), t.separator],
    color: '#c5d0db'
  },
  // Types, classes, numbers - muted amber-gray
  {
    tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace],
    color: '#9d9179'
  },
  // Operators - muted cyan-gray
  {
    tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)],
    color: '#748a93'
  },
  // Meta/comments - muted blue-gray
  {
    tag: [t.meta, t.comment],
    color: '#6b7d8c'
  },
  // Emphasis
  {
    tag: t.strong,
    fontWeight: 'bold',
    color: '#9b9588'
  },
  {
    tag: t.emphasis,
    fontStyle: 'italic',
    color: '#8b92a6'
  },
  {
    tag: t.strikethrough,
    textDecoration: 'line-through'
  },
  // Links - muted blue
  {
    tag: t.link,
    color: '#7891a3',
    textDecoration: 'underline'
  },
  // Headings - muted warm
  {
    tag: t.heading,
    fontWeight: 'bold',
    color: '#9b9588'
  },
  // Booleans and special vars - muted green-gray
  {
    tag: [t.atom, t.bool, t.special(t.variableName)],
    color: '#7d9184'
  },
  // Strings - muted green-gray
  {
    tag: [t.processingInstruction, t.string, t.inserted],
    color: '#7d9184'
  },
  // Invalid/errors - muted red-gray
  {
    tag: t.invalid,
    color: '#a37378'
  }
]);

/**
 * Syntax highlighting extension for CodeMirror
 * Exports the styled syntax theme
 */
export const basiliskSyntaxTheme = syntaxHighlighting(basiliskHighlightStyle);

/**
 * Transparent glassmorphic editor theme for CodeMirror
 */
export const transparentEditorTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent !important', height: '100%' },
  '.cm-scroller': {
    backgroundColor: 'transparent !important',
    fontFamily: 'JetBrains Mono, Fira Code, SF Mono, Consolas, Monaco, monospace',
    fontSize: '12px', lineHeight: '1.5',
    scrollbarWidth: 'thin', scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
  },
  '.cm-scroller::-webkit-scrollbar': { width: '8px', height: '8px' },
  '.cm-scroller::-webkit-scrollbar-track': { background: 'transparent' },
  '.cm-scroller::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px',
    border: '2px solid transparent', backgroundClip: 'padding-box'
  },
  '.cm-scroller::-webkit-scrollbar-thumb:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  '.cm-gutters': {
    backgroundColor: 'transparent !important', backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)', border: 'none', borderRight: '1px solid rgba(71, 85, 105, 0.3)'
  },
  '.cm-gutter, .cm-lineNumbers': { backgroundColor: 'rgba(15, 23, 42, 0.15) !important', color: 'rgba(255, 255, 255, 0.65) !important' },
  '.cm-gutterElement': { color: 'rgba(255, 255, 255, 0.65) !important' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(255, 255, 255, 0.2) !important', borderRadius: '2px' },
  '.cm-activeLine': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  '.cm-content': { caretColor: '#ffffff', color: 'rgba(255, 255, 255, 0.95)', padding: '8px 0' },
  '.cm-line': { color: 'rgba(255, 255, 255, 0.95) !important' },
  '.cm-cursor': { borderLeftColor: '#ffffff' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(255, 255, 255, 0.2) !important' }
});
