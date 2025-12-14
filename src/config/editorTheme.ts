/**
 * Custom CodeMirror syntax theme for Basilisk AV
 * Muted, desaturated color scheme with subtle variations
 */

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
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
