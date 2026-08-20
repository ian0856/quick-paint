import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
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
