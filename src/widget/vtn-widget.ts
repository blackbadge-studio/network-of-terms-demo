/**
 * The embed script: /widget/vtn-widget.js (built by vite.widget.config.ts). Loading it registers
 * <vtn-search>; everything else is attributes and events on that element (see element.ts).
 */
import {defineVtnSearch} from './element';

defineVtnSearch();

export {VtnSearchElement, defineVtnSearch} from './element';
export type {VtnSelectDetail, VtnSearchDetail, VtnErrorDetail} from './element';
