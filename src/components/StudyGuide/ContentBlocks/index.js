// Export all content block components
export { default as ObjectivesBlock } from './ObjectivesBlock';
export { default as TextBlock } from './TextBlock';
export { default as FormulaBlock } from './FormulaBlock';
export { default as ConceptHelperBlock } from './ConceptHelperBlock';
export { default as WarningBlock } from './WarningBlock';
export { default as RealWorldBlock } from './RealWorldBlock';
export { default as VideoBlock } from './VideoBlock';
export { default as ImageBlock } from './ImageBlock';

/**
 * Map content types to their respective block components
 */
export const CONTENT_TYPE_MAP = {
  introduction: 'text',
  text: 'text',
  formula: 'formula',
  concept_helper: 'conceptHelper',
  tip: 'conceptHelper',
  warning: 'warning',
  real_world: 'realWorld',
  application: 'realWorld',
  video: 'video',
  image: 'image'
};
