import {FunctionalComponent, h} from 'vue';

/** A line of text in which `backticks` mark a field or type name, shown as code. */
const InlineCode: FunctionalComponent<{text: string}> = (props) =>
  props.text.split('`').map((part, position) => position % 2 ? h('code', part) : part);
InlineCode.props = ['text'];

export default InlineCode;
