import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/workbench',
    },
    {
      path: '/workbench',
      name: 'workbench',
      component: () => import('../views/workbench/index.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/workbench',
    },
  ],
})

export default router
