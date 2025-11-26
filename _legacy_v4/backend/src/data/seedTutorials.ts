import { Tutorial, ITutorial } from '../models/Tutorial'

/**
 * Seed data for tutorial system
 * Contains the first tutorial "add_controller_basics" with step-by-step instructions
 */

export const tutorialSeeds: any[] = [
  {
    id: 'add_controller_basics',
    title: 'Добавяне на вашия първи контролер',
    description: 'Научете как да добавите и конфигурирате физически контролер в хидропонната система. Това ръководство обхваща основите на откриване, конфигуриране и проверка на връзката.',
    category: 'basics',
    prerequisites: [],
    estimatedMinutes: 15,
    isActive: true,
    steps: [
      {
        id: 'introduction',
        title: 'Добре дошли в настройката на контролер',
        description: 'В това ръководство ще научите как да добавите физически контролер към вашата хидропонна система. Контролерите управляват сензори и актуатори, което ги прави основна част от автоматизацията.',
        type: 'explanation',
        estimatedMinutes: 2,
        hints: [
          'Контролерите могат да бъдат Arduino платки, Raspberry Pi или други микроконтролери',
          'Всеки контролер може да управлява множество устройства като сензори и помпи'
        ]
      },
      {
        id: 'navigate_to_devices',
        title: 'Отидете на страницата Устройства',
        description: 'Кликнете на менюто "Управление на устройства" в страничната лента, за да получите достъп до управлението на устройства и контролери.',
        type: 'action',
        targetElement: '[data-test="sidebar-devices"]',
        targetSelector: '[data-test="sidebar-devices"]',
        action: 'click',
        position: 'right',
        expectedResult: 'The Devices page should open with tabs for Devices, Relays, and Controllers',
        estimatedMinutes: 1,
        hints: [
          'Потърсете "Управление на устройства" в лявата странична лента',
          'Страницата има три раздела: Устройства, Релета и Контролери'
        ]
      },
      {
        id: 'click_controllers_tab',
        title: 'Отворете раздела Контролери',
        description: 'Кликнете на раздела "Контролери", за да видите и управлявате контролерите.',
        type: 'action',
        targetElement: '[data-test="controllers-tab"]',
        targetSelector: '[data-test="controllers-tab"]',
        action: 'click',
        position: 'bottom',
        expectedResult: 'Controllers tab should open showing controller management interface',
        estimatedMinutes: 1,
        hints: [
          'Разделът е в горната част на страницата',
          'Показва съществуващи контролери и техния статус'
        ]
      },
      {
        id: 'click_add_controller',
        title: 'Започнете да добавяте нов контролер',
        description: 'Кликнете бутона "Добави контролер", за да отворите формата за създаване на контролер.',
        type: 'action',
        targetElement: '[data-test="add-controller-btn"]',
        targetSelector: '[data-test="add-controller-btn"]',
        action: 'click',
        position: 'left',
        expectedResult: 'A form dialog should appear for adding a new controller',
        estimatedMinutes: 1,
        hints: [
          'Бутонът е в горния десен ъгъл на страницата',
          'Ще се появи модален прозорец с полета за конфигурация на контролера'
        ]
      },
      {
        id: 'enter_controller_name',
        title: 'Въведете име на контролера',
        description: 'В полето "Име на контролер" в горната част на формата, въведете описателно име като "Arduino Main" или "Оранжерия Контролер". Използвайте имена, които показват местоположение или предназначение.',
        type: 'explanation',
        targetElement: '[data-test="controller-form-dialog"]',
        targetSelector: '[data-test="controller-form-dialog"]',
        position: 'right',
        estimatedMinutes: 1,
        hints: [
          'Пример: "Arduino Main", "Оранжерия Контролер"',
          'Избягвайте специални символи или много дълги имена'
        ]
      },
      {
        id: 'select_controller_type',
        title: 'Изберете тип контролер',
        description: 'От падащото меню "Тип контролер", изберете типа на вашия контролер. Arduino Uno R3 се препоръчва за наченачещи и вече е избран по подразбиране.',
        type: 'explanation',
        targetElement: '[data-test="controller-form-dialog"]',
        targetSelector: '[data-test="controller-form-dialog"]',
        position: 'right',
        estimatedMinutes: 1,
        hints: [
          'Arduino Uno R3 вече е избран по подразбиране',
          'Можете да запазите този избор или да изберете друг тип, ако имате друг хардуер'
        ]
      },
      {
        id: 'select_communication_by',
        title: 'Изберете физическа връзка',
        description: 'От падащото меню "Физическа връзка", изберете как се свързва вашият контролер. Изберете "WiFi мрежа" за безжична връзка. Други опции включват Serial (USB кабел), Network (Ethernet) или Bluetooth.',
        type: 'explanation',
        targetElement: '[data-test="controller-form-dialog"]',
        targetSelector: '[data-test="controller-form-dialog"]',
        position: 'right',
        estimatedMinutes: 1,
        hints: [
          'WiFi е най-гъвкавата опция за безжично управление',
          'След избиране на WiFi, падащото меню Протокол ще се появи отдолу'
        ]
      },
      {
        id: 'select_communication_type',
        title: 'Изберете комуникационен протокол',
        description: 'От падащото меню "Протокол", изберете комуникационния протокол. За WiFi, изберете "HTTP REST", тъй като е по-прост и широко поддържан. MQTT също е наличен за pub/sub съобщения.',
        type: 'explanation',
        targetElement: '[data-test="controller-form-dialog"]',
        targetSelector: '[data-test="controller-form-dialog"]',
        position: 'right',
        estimatedMinutes: 1,
        hints: [
          'HTTP REST е най-лесен за конфигуриране',
          'След избор, IP адрес и други полета ще се появят отдолу'
        ]
      },
      {
        id: 'enter_ip_address',
        title: 'Въведете IP адрес',
        description: 'В полето "IP адрес", въведете IP адреса на вашия контролер в WiFi мрежата. Например: 192.168.1.100. Можете да намерите този IP в администраторския панел на рутера или в Arduino serial monitor. Други полета като Порт и MAC адрес имат стойности по подразбиране и могат да бъдат оставени както са.',
        type: 'explanation',
        targetElement: '[data-test="controller-form-dialog"]',
        targetSelector: '[data-test="controller-form-dialog"]',
        position: 'right',
        estimatedMinutes: 2,
        hints: [
          'Примерен IP формат: 192.168.1.100',
          'Други полета (Порт, MAC адрес и т.н.) имат стойности по подразбиране и могат да бъдат оставени'
        ]
      },
      {
        id: 'save_controller',
        title: 'Запазване на конфигурацията',
        description: 'Когато сте готови в реален сценарий, кликнете бутона "💾 Запази" в долната част на формата, за да добавите контролера към вашата система. В този туториал, бутонът за запис няма да запази реално в базата данни - той ще симулира действието за запис и ще затвори прозореца.',
        type: 'explanation',
        targetElement: '[data-test="controller-form-dialog"]',
        targetSelector: '[data-test="controller-form-dialog"]',
        position: 'right',
        estimatedMinutes: 1,
        hints: [
          'Бутонът "💾 Запази" е долу вдясно',
          'В режим на туториал, кликването му НЯМА да запише в базата данни',
          'Можете безопасно да го кликнете, за да видите какво се случва'
        ]
      },
      {
        id: 'completion',
        title: 'Ръководството е завършено!',
        description: 'Поздравления! Успешно завършихте ръководството за добавяне на контролер. Сега можете да добавяте устройства и да конфигурирате автоматизация.',
        type: 'explanation',
        position: 'center',
        nextButtonText: 'Завърши ръководството',
        estimatedMinutes: 1,
        hints: [
          'Можете да добавите повече контролери, използвайки същите стъпки',
          'Следваща стъпка: Добавете сензори и актуатори към вашия контролер'
        ]
      },
    ],
    mockData: {
      sampleController: {
        name: 'Arduino Main',
        type: 'arduino_uno',
        address: '192.168.1.100',
        connectionType: 'http',
        status: 'online'
      },
      testConnection: {
        success: true,
        responseTime: 150,
        firmwareVersion: '1.2.0'
      },
      validationMessages: {
        nameRequired: 'Controller name is required',
        addressInvalid: 'Please enter a valid IP address',
        connectionFailed: 'Cannot connect to controller. Check IP and network.'
      }
    }
  }
]

/**
 * Seeds tutorial data into the database
 * Only creates tutorials that don't already exist
 */
export async function seedTutorials() {
  console.log('🎓 Seeding tutorials...')

  try {
    for (const tutorialData of tutorialSeeds) {
      // Check if tutorial already exists
      const existingTutorial = await Tutorial.findOne({ id: tutorialData.id })

      if (!existingTutorial) {
        await Tutorial.create(tutorialData)
        console.log(`✅ Created tutorial: ${tutorialData.title}`)
      } else {
        // Update existing tutorial with new data
        await Tutorial.findOneAndUpdate(
          { id: tutorialData.id },
          tutorialData,
          { new: true }
        )
        console.log(`🔄 Updated tutorial: ${tutorialData.title}`)
      }
    }

    console.log('🎓 Tutorial seeding completed')
  } catch (error) {
    console.error('❌ Error seeding tutorials:', error)
    throw error
  }
}