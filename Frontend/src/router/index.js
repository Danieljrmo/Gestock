import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import ProductsTable from '../components/ProductsTable.vue'
import UsersTable from '../components/UsersTable.vue'
import DashboardHome from '../components/DashboardHome.vue' 
import VentasView from '../views/VentasView.vue' 
import ReportesView from '../views/ReportesView.vue'

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
        component: DashboardHome 
      },
      {
        path: 'usuarios', // Cuando la URL sea /dashboard/usuarios
        name: 'usuarios',
        component: UsersTable 
      },
      {
        path: 'productos', // Cuando la URL sea /dashboard/productos
        name: 'productos',
        component: ProductsTable 
      },
      {
        path: 'ventas', // Estructura de objeto limpia y nombre asignado
        name: 'ventas',
        component: VentasView 
      },
      {
        path: 'reportes', // Estructura de objeto limpia y nombre asignado
        name: 'reportes',
        component: ReportesView 
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router