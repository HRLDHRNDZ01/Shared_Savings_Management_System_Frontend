import { createRouter, createWebHistory } from 'vue-router'
import Login from '../pages/Login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: { name: 'login' },
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../pages/Register.vue'),
    },
    {
      path: '/dashboard',
      component: () => import('../layouts/AppLayout.vue'),
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../pages/Dashboard.vue'),
        },
        {
          path: 'spaces',
          name: 'spaces',
          component: () => import('../pages/SavingsSpaces.vue'),
        },
        {
          path: 'transactions',
          name: 'transactions',
          component: () => import('../pages/Transactions.vue'),
        },
        {
          path: 'notifications',
          name: 'notifications',
          component: () => import('../pages/Notifications.vue'),
        },
        {
          path: 'reports',
          name: 'reports',
          component: () => import('../pages/Reports.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../pages/Profile.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../pages/Settings.vue'),
        },
        {
          path: 'maintenance',
          name: 'maintenance',
          component: () => import('../pages/Maintenance.vue'),
        },
      ],
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
