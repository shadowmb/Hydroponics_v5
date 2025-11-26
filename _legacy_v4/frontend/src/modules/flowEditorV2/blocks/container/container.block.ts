/**
 * 📦 Container Block Definition
 * ✅ Container block for grouping related blocks
 * Part of Phase C: Integration Testing - Day 2
 */

import { 
  FLOW_IN_PORT, 
  FLOW_OUT_PORT 
} from '../shared/helpers/PortHelpers';
import { 
  withCommonParams 
} from '../shared/helpers/ParameterHelpers';
import type { BlockDefinition } from '../../types/BlockConcept';

/**
 * Container block - Groups related blocks for organization
 * Provides visual grouping and encapsulation of block logic
 */
const containerBlockDefinition: BlockDefinition = {
  id: 'container',
  type: 'container',
  blockType: 'container',
  name: 'КОНТЕЙНЕР',
  category: 'Контейнери',
  description: 'Групира свързани блокове за по-добра организация',
  icon: 'folder',
  color: '#607D8B',
  
  // Container block inputs: flow control
  inputs: [
    FLOW_IN_PORT          // Flow control input
  ],
  
  // Container block outputs: flow control
  outputs: [
    FLOW_OUT_PORT         // Flow control output
  ],
  
  // Container parameters: organization + styling + common visual params
  parameters: withCommonParams([
    {
      id: 'containerTitle',
      label: 'Заглавие на контейнера',
      type: 'string',
      required: true,
      defaultValue: 'Нов контейнер',
      validation: { 
        min: 1, 
        max: 100 
      },
      description: 'Заглавието, което ще се показва на контейнера'
    },
    {
      id: 'containerDescription',
      label: 'Описание',
      type: 'string',
      required: false,
      defaultValue: '',
      validation: { 
        max: 500 
      },
      description: 'Подробно описание на функцията на контейнера'
    },
    {
      id: 'collapsible',
      label: 'Може да се свива',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Дали контейнерът може да се свива и разтваря'
    },
    {
      id: 'startCollapsed',
      label: 'Започва свит',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Дали контейнерът да започва в свито състояние'
    },
    {
      id: 'containerColor',
      label: 'Цвят на контейнера',
      type: 'select',
      required: false,
      defaultValue: 'default',
      options: [
        { label: 'По подразбиране', value: 'default' },
        { label: 'Синьо', value: 'blue' },
        { label: 'Зелено', value: 'green' },
        { label: 'Жълто', value: 'yellow' },
        { label: 'Червено', value: 'red' },
        { label: 'Лилаво', value: 'purple' },
        { label: 'Сиво', value: 'gray' }
      ],
      description: 'Цветовата схема на контейнера'
    },
    {
      id: 'borderStyle',
      label: 'Стил на рамката',
      type: 'select',
      required: false,
      defaultValue: 'solid',
      options: [
        { label: 'Плътна линия', value: 'solid' },
        { label: 'Пунктирана', value: 'dashed' },
        { label: 'Точкована', value: 'dotted' },
        { label: 'Без рамка', value: 'none' }
      ],
      description: 'Стилът на рамката около контейнера'
    },
    {
      id: 'minWidth',
      label: 'Минимална ширина (px)',
      type: 'number',
      required: false,
      defaultValue: 200,
      validation: { min: 100, max: 2000 },
      description: 'Минималната ширина на контейнера в пиксели'
    },
    {
      id: 'minHeight',
      label: 'Минимална височина (px)',
      type: 'number',
      required: false,
      defaultValue: 150,
      validation: { min: 100, max: 2000 },
      description: 'Минималната височина на контейнера в пиксели'
    }
  ]),
  
  // Container block metadata
  meta: {
    version: '1.0.0',
    experimental: false,
  }
};

export default containerBlockDefinition;
export const version = '1.0.0';
export const deprecated = false;