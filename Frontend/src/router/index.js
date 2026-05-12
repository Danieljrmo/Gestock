import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/dashboard', component: () => import('../views/Dashboard.vue') } // Lo crearemos pronto
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router