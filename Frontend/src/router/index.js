import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import ProductsTable from '../components/ProductsTable.vue'
import UsersTable from '../components/UsersTable.vue'
import DashboardHome from '../components/DashboardHome.vue' // <-- Importamos tu nueva bienvenida

const routes = [
  { 
    path: '/', 
    name: 'login',
    component: Login 
  },
  { 
    path: '/dashboard', 
    component: () => import('../views/Dashboard.vue'),
    children: [
      {
        path: '', // Cuando la URL sea exactamente /dashboard
        name: 'dashboard-inicio',
        component: DashboardHome // <-- Muestra la bienvenida
      },
      {
        path: 'usuarios', // Cuando la URL sea /dashboard/usuarios
        name: 'usuarios',
        component: UsersTable // <-- Muestra la gestión de usuarios
      },
      {
        path: 'productos', // Cuando la URL sea /dashboard/productos
        name: 'productos',
        component: ProductsTable // <-- Muestra la gestión de productos
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router