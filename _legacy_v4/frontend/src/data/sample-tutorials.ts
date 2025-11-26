// ABOUTME: Sample tutorial data for testing and demonstration of the tutorial system
// ABOUTME: Contains realistic tutorial flows for all major system components

import { Tutorial } from '../services/tutorial-service'

export const sampleTutorials: Tutorial[] = [
  {
    _id: 'add_controller_basics',
    name: 'add_controller_basics',
    title: 'Добавяне на Контролер - Основи',
    description: 'Научете как да добавите и конфигурирате нов контролер в системата. Това ръководство ще ви покаже стъпка по стъпка как да свържете ESP32 или Arduino контролер.',
    category: 'devices',
    difficulty: 'beginner',
    estimatedDuration: 15,
    steps: [
      {
        id: 'step_1_intro',
        title: 'Добре дошли в ръководството за контролери',
        description: 'В това ръководство ще научите как да добавите нов контролер към хидропонната система. Контролерите са основните устройства, които управляват сензорите и актуаторите.',
        position: 'center',
        nextButtonText: 'Започнем',
        skipable: false
      },
      {
        id: 'step_2_navigate',
        title: 'Отворете страницата с устройства',
        description: 'Първо трябва да отидем на страницата за управление на устройства. Кликнете на бутона "Устройства" в менюто.',
        targetSelector: 'a[href="/devices"]',
        targetElement: 'Линк към страницата с устройства',
        position: 'right',
        action: 'click',
        actionData: {
          info: 'Страницата с устройства съдържа всички контролери и техните свързани устройства.'
        }
      },
      {
        id: 'step_3_add_controller',
        title: 'Започнете добавяне на нов контролер',
        description: 'Сега кликнете на бутона "Добави Контролер" за да започнете процеса на добавяне.',
        targetSelector: 'button[data-cy="add-controller-btn"], .q-btn:contains("Добави")',
        targetElement: 'Бутон за добавяне на контролер',
        position: 'bottom',
        action: 'click',
        actionData: {
          info: 'Това ще отвори формата за конфигуриране на новия контролер.'
        }
      },
      {
        id: 'step_4_enter_name',
        title: 'Въведете име на контролера',
        description: 'Дайте описателно име на вашия контролер, например "Главен ESP32" или "Сензорен контролер".',
        targetSelector: 'input[label="Име"], input[placeholder*="име"], #controller-name',
        targetElement: 'Поле за име на контролера',
        position: 'top',
        action: 'input',
        actionData: {
          suggestedValue: 'Демо Контролер',
          info: 'Използвайте име, което лесно ще разпознаете в списъка с контролери.'
        }
      },
      {
        id: 'step_5_select_type',
        title: 'Изберете тип контролер',
        description: 'Изберете типа на вашия контролер. ESP32 е най-популярният избор заради Wi-Fi възможностите.',
        targetSelector: 'select[label="Тип"], .q-select:contains("Тип")',
        targetElement: 'Селектор за тип контролер',
        position: 'bottom',
        action: 'click',
        actionData: {
          info: 'ESP32 поддържа Wi-Fi и Bluetooth, Arduino Uno се свързва чрез USB или Ethernet.'
        }
      },
      {
        id: 'step_6_configure_network',
        title: 'Конфигурирайте мрежовите настройки',
        description: 'Въведете IP адреса на контролера. Ако не знаете IP-то, можете да използвате автоматичното откриване.',
        targetSelector: 'input[label*="IP"], input[placeholder*="192.168"]',
        targetElement: 'Поле за IP адрес',
        position: 'top',
        action: 'input',
        actionData: {
          suggestedValue: '192.168.1.100',
          info: 'IP адресът трябва да бъде в същата мрежа като компютъра ви.'
        }
      },
      {
        id: 'step_7_test_connection',
        title: 'Тествайте връзката',
        description: 'Преди да запазите контролера, добре е да тествате връзката. Кликнете "Тест на връзката".',
        targetSelector: 'button:contains("Тест"), .test-connection-btn',
        targetElement: 'Бутон за тест на връзката',
        position: 'bottom',
        action: 'click',
        actionData: {
          info: 'Тестът проверява дали контролерът отговаря на зададения IP адрес.'
        },
        isOptional: true
      },
      {
        id: 'step_8_save_controller',
        title: 'Запазете контролера',
        description: 'Когато всички настройки са готови, кликнете "Запази" за да добавите контролера към системата.',
        targetSelector: 'button:contains("Запази"), .save-btn, button[type="submit"]',
        targetElement: 'Бутон за запазване',
        position: 'bottom',
        action: 'click'
      },
      {
        id: 'step_9_completion',
        title: 'Поздравления!',
        description: 'Успешно добавихте нов контролер към системата! Сега можете да добавяте устройства към този контролер и да започнете да автоматизирате вашата хидропонна система.',
        position: 'center',
        nextButtonText: 'Завърши ръководството',
        actionData: {
          info: 'Следващата стъпка е да добавите сензори и актуатори към новия контролер.'
        }
      }
    ],
    isActive: true,
    prerequisites: [],
    tags: ['контролери', 'начинаещи', 'конфигурация'],
    mockDataSetup: {
      controllers: [],
      devices: [],
      flows: [],
      programs: []
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'device_management',
    name: 'device_management',
    title: 'Управление на Устройства',
    description: 'Научете как да добавяте, конфигурирате и управлявате сензори и актуатори. Включва pH сензори, помпи и осветление.',
    category: 'devices',
    difficulty: 'beginner',
    estimatedDuration: 20,
    steps: [
      {
        id: 'device_intro',
        title: 'Управление на устройства',
        description: 'В това ръководство ще научите как да добавяте и конфигурирате различни типове устройства към вашите контролери.',
        position: 'center'
      },
      {
        id: 'device_types_overview',
        title: 'Типове устройства',
        description: 'Системата поддържа различни типове устройства: сензори (pH, EC, температура), актуатори (помпи, клапани) и осветление.',
        position: 'center',
        actionData: {
          info: 'Всяко устройство се свързва към специфичен порт на контролера.'
        }
      },
      {
        id: 'add_ph_sensor',
        title: 'Добавете pH сензор',
        description: 'Кликнете "Добави Устройство" и изберете pH сензор от списъка.',
        targetSelector: 'button:contains("Добави Устройство")',
        position: 'bottom',
        action: 'click'
      }
    ],
    isActive: true,
    prerequisites: ['tutorial_add_controller_basics'],
    tags: ['устройства', 'сензори', 'актуатори'],
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'flow_editor_intro',
    name: 'flow_editor_intro',
    title: 'Flow Editor - Въведение',
    description: 'Създайте първия си автоматичен поток с визуалния редактор. Научете основите на блоковете и връзките.',
    category: 'flow-editor',
    difficulty: 'intermediate',
    estimatedDuration: 25,
    steps: [
      {
        id: 'flow_intro',
        title: 'Добре дошли във Flow Editor',
        description: 'Flow Editor е визуален инструмент за създаване на автоматични процеси. Можете да свързвате блокове за създаване на сложни логики.',
        position: 'center'
      },
      {
        id: 'canvas_overview',
        title: 'Работната област',
        description: 'Това е работната област където създавате вашите потоци. Можете да плъзгате блокове и да ги свързвате.',
        targetSelector: '.flow-canvas, #flow-editor-canvas',
        position: 'center'
      }
    ],
    isActive: true,
    prerequisites: ['tutorial_device_management'],
    tags: ['flow editor', 'автоматизация', 'визуално програмиране'],
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: new Date().toISOString()
  }
]

export default sampleTutorials