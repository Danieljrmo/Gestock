<template>
  <div class="h-screen w-full flex bg-gray-50 font-sans overflow-hidden">
    
    <aside class="w-64 bg-[#0B192C] text-white flex flex-col justify-between p-6 shrink-0 z-10 shadow-xl">
      <div>
        <div class="flex items-center gap-3 mb-10 pb-4 border-b border-gray-700/50">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-[#00D2C4]">
            <span class="text-[#0B192C] font-black text-base">G</span>
          </div>
          <h1 class="text-lg font-bold tracking-tight">
            GES<span class="text-[#00D2C4]">TOCK</span>
          </h1>
        </div>

        <nav class="space-y-2">
          
          <button 
            @click="currentView = 'inicio'"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-slate-800 hover:text-white font-semibold transition-all text-left group"
          >
            <svg class="w-5 h-5 text-gray-400 group-hover:text-[#00D2C4] transition-colors" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2"></path>
            </svg>
            <span>Dashboard</span>
          </button>

          <button 
            @click="currentView = 'usuarios'"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-slate-800 hover:text-white font-semibold transition-all text-left group"
          >
            <svg class="w-5 h-5 text-gray-400 group-hover:text-[#00D2C4] transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span>Gestión Usuarios</span>
          </button>

          <button class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-slate-800 hover:text-white font-semibold transition-all text-left group opacity-50 cursor-not-allowed">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
            <span>Inventario / Stock</span>
          </button>

          <button class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-slate-800 hover:text-white font-semibold transition-all text-left group opacity-50 cursor-not-allowed">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Registrar Venta</span>
          </button>
        </nav>
      </div>

      <div class="text-[11px] text-gray-500 font-medium">v1.0.0 — UACh 2026</div>
    </aside>

    <div class="flex-1 flex flex-col h-full overflow-hidden">
      
      <header class="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 shrink-0 shadow-sm">
        <div class="flex flex-col">
          <h2 class="text-xl font-black text-[#0B192C]">
            {{ currentView === 'inicio' ? 'Panel de Control' : 'Administración de Usuarios' }}
          </h2>
          <p class="text-xs text-gray-400 font-medium">
            {{ currentView === 'inicio' ? 'Resumen general del Minimarket' : 'Configuración de accesos y roles de Gestock' }}
          </p>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-bold text-[#0B192C]">Administrador Inicial</p>
            <p class="text-[11px] text-[#00D2C4] font-bold uppercase tracking-wider">Online</p>
          </div>
          
          <button 
            @click="handleLogout" 
            class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span>Salir</span>
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-10 bg-slate-50">
        
        <div v-if="currentView === 'inicio'" class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-3xl">
          <h3 class="text-2xl font-black text-[#0B192C] mb-2">¡Hola, Daniel! 👋</h3>
          <p class="text-gray-500 leading-relaxed">
            Este es el contenedor principal de tu Dashboard. Selecciona "Gestión Usuarios" en el menú para comenzar con el CRUD.
          </p>
        </div>

        <div v-else-if="currentView === 'usuarios'">
          <UsersTable />
        </div>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import UsersTable from '../components/UsersTable.vue';

const router = useRouter();
const authStore = useAuthStore();

const currentView = ref('inicio');

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};
</script>
