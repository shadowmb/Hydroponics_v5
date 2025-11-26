import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      // Default redirect to dashboard
      {
        path: '',
        name: 'home',
        redirect: { name: 'dashboard' }
      },

      // Dashboard Route
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('../pages/DashboardPage.vue'),
        meta: { title: 'Табло' }
      },

      // Programs Routes
      {
        path: '/programs',
        name: 'programs',
        component: () => import('../pages/ProgramsPage.vue'),
        meta: { title: 'Програми' }
      },
      {
        path: '/programs/create',
        name: 'programs-create',
        component: () => import('../pages/ProgramCreate.vue'),
        meta: { title: 'Създаване на програма' }
      },
      {
        path: '/programs/:id/edit',
        name: 'programs-edit',
        component: () => import('../pages/ProgramCreate.vue'),
        meta: { title: 'Редактиране на програма' }
      },

      // Active Programs Route
      {
        path: '/active-programs',
        name: 'active-programs',
        component: () => import('../pages/ActiveProgramsPage.vue'),
        meta: { title: 'Активни програми' }
      },


      // Action Templates Routes
      {
        path: '/action-templates',
        name: 'action-templates',
        component: () => import('../pages/ActionTemplatesPage.vue'),
        meta: { title: 'Action Templates' }
      },
      {
        path: '/action-templates/create',
        name: 'action-templates-create',
        component: () => import('../pages/ActionTemplateForm.vue'),
        meta: { title: 'Създаване на Action Template' }
      },
      {
        path: '/action-templates/:id/edit',
        name: 'action-templates-edit',
        component: () => import('../pages/ActionTemplateForm.vue'),
        meta: { title: 'Редактиране на Action Template' }
      },

      // DEACTIVATED: Target Registry Route - Phase 1B
      // {
      //   path: '/target-registry',
      //   name: 'target-registry',
      //   component: () => import('../pages/TargetRegistryPage.vue'),
      //   meta: { title: 'Target Registry' }
      // },

      // Monitoring Control Route
      {
        path: '/monitoring',
        name: 'monitoring',
        component: () => import('../pages/MonitoringControlPage.vue'),
        meta: { title: 'Мониторинг Контрол' }
      },

      // Flow Management Route
      {
        path: '/flow-management',
        name: 'flow-management',
        component: () => import('../pages/FlowManagementPage.vue'),
        meta: { title: 'Управление на потоци' }
      },

      // FlowEditor Routes - Back to original component
      {
        path: '/flow-editor',
        name: 'flow-editor',
        component: () => import('../modules/flowEditorV2/FlowEditor.vue'),
        meta: { title: 'Flow Editor v3' }
      },
      {
        path: '/flow-editor/:id/edit',
        name: 'flow-editor-edit',
        component: () => import('../modules/flowEditorV2/FlowEditor.vue'),
        meta: { title: 'Редактиране на поток' }
      },

      // Target Config Demo Route - Phase 4 Testing
      {
        path: '/target-config-demo',
        name: 'target-config-demo',
        component: () => import('../pages/TargetConfigDemo.vue'),
        meta: { title: '🎯 Target Config Demo' }
      },

      // Device Management Route
      {
        path: '/devices',
        name: 'devices',
        component: () => import('../pages/settings/DeviceSettingsPage.vue'),
        meta: { title: 'Управление на устройства' }
      },

      // System Logs Route
      {
        path: '/logs',
        name: 'logs',
        component: () => import('../pages/SystemLogsPage.vue'),
        meta: { title: 'System Logs' }
      },

      // Notifications Route (independent)
      {
        path: '/notifications',
        name: 'notifications',
        component: () => import('../pages/settings/NotificationSettingsPage.vue'),
        meta: { title: 'Управление на Известия' }
      },

      // Tutorial Routes
      {
        path: '/tutorial',
        name: 'tutorials',
        redirect: '/dashboard', // Default redirect to dashboard with tutorial
        meta: { title: 'Ръководства' }
      },
      {
        path: '/tutorial/devices',
        name: 'tutorial-devices',
        component: () => import('../pages/settings/DeviceSettingsPage.vue'),
        meta: {
          title: 'Устройства - Ръководство',
          tutorialMode: true,
          tutorialCategory: 'devices'
        }
      },
      {
        path: '/tutorial/flow-editor',
        name: 'tutorial-flow-editor',
        component: () => import('../modules/flowEditorV2/FlowEditor.vue'),
        meta: {
          title: 'Flow Editor - Ръководство',
          tutorialMode: true,
          tutorialCategory: 'flow-editor'
        }
      },
      {
        path: '/tutorial/dashboard',
        name: 'tutorial-dashboard',
        component: () => import('../pages/DashboardPage.vue'),
        meta: {
          title: 'Табло - Ръководство',
          tutorialMode: true,
          tutorialCategory: 'dashboard'
        }
      },
      {
        path: '/tutorial/programs',
        name: 'tutorial-programs',
        component: () => import('../pages/ProgramsPage.vue'),
        meta: {
          title: 'Програми - Ръководство',
          tutorialMode: true,
          tutorialCategory: 'programs'
        }
      },
      {
        path: '/tutorial/monitoring',
        name: 'tutorial-monitoring',
        component: () => import('../pages/MonitoringControlPage.vue'),
        meta: {
          title: 'Мониторинг - Ръководство',
          tutorialMode: true,
          tutorialCategory: 'monitoring'
        }
      },

      // Settings Routes
      {
        path: '/settings',
        name: 'settings',
        component: () => import('../pages/SettingsPage.vue'),
        meta: { title: 'Настройки' },
        redirect: '/settings/general',
        children: [
          {
            path: 'general',
            name: 'settings-general',
            component: () => import('../pages/settings/GeneralSettingsPage.vue'),
            meta: { title: 'General Settings' }
          },
          {
            path: 'devices',
            name: 'settings-devices',
            component: () => import('../pages/settings/DeviceSettingsPage.vue'),
            meta: { title: 'Device Settings' }
          },
          {
            path: 'thresholds',
            name: 'settings-thresholds',
            component: () => import('../pages/settings/ThresholdSettingsPage.vue'),
            meta: { title: 'Threshold Settings' }
          }
        ]
      }
    ]
  },

  // Error pages
  {
    path: '/error',
    name: 'error',
    component: () => import('../pages/ErrorPage.vue'),
    meta: { title: 'Error' }
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound.vue'),
    meta: { title: '404 - Page Not Found' }
  }
]

export default routes