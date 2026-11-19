import type {Component} from 'vue';
import {BuildingLibraryIcon, CircleStackIcon, CodeBracketIcon, LinkIcon} from '@heroicons/vue/24/outline';

/** The four audiences the questions are grouped by, in the order of the overview. */
export const FAQ_AUDIENCES: Array<{route: string; key: string; icon: Component; questions: {nl: number; en: number}}> = [
  {route: 'faq1', key: 'c', icon: BuildingLibraryIcon, questions: {nl: 15, en: 14}},
  {route: 'faq2', key: 'b', icon: CircleStackIcon, questions: {nl: 10, en: 10}},
  {route: 'faq4', key: 'r', icon: LinkIcon, questions: {nl: 4, en: 4}},
  {route: 'faq3', key: 'o', icon: CodeBracketIcon, questions: {nl: 18, en: 17}},
];
