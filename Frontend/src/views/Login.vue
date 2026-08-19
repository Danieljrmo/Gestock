<template>
  <div class="h-screen w-full flex flex-col md:flex-row bg-white overflow-hidden font-sans">
    
    <!-- COLUMNA IZQUIERDA: FORMULARIO DE LOGIN -->
    <div class="w-full md:w-[45%] flex flex-col justify-center items-center p-8 md:p-16 bg-white">
      
      <div class="w-full max-w-[400px]">
        
        <!-- LOGO Y TÍTULO -->
        <div class="flex items-center gap-2 mb-12">
          <h1 class="text-2xl font-black tracking-tighter" style="color: #0B192C;">
            GES<span class="text-[#00D2C4]">TOCK</span>
          </h1>
        </div>

        <div class="mb-10">
          <h2 class="text-4xl font-black mb-3" style="color: #0B192C;">¡Bienvenido!</h2>
          <p class="text-gray-500 font-medium">Ingresa tus datos para gestionar tu negocio.</p>
        </div>

        <!-- MENSAJE DE ERROR LOGIN -->
        <div v-if="errorMsg" class="mb-5 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold flex justify-between items-center">
          <span>⚠️ {{ errorMsg }}</span>
          <button @click="errorMsg = ''" class="text-red-400 hover:text-red-800">✕</button>
        </div>

        <!-- FORMULARIO DE ACCESO -->
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider mb-2" style="color: #0B192C;">Correo Electrónico</label>
            <input 
              v-model="email"
              type="email" 
              placeholder="admin@gestock.com"
              class="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00D2C4] focus:border-transparent outline-none transition-all bg-gray-50 text-gray-700 placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider mb-2" style="color: #0B192C;">Contraseña</label>
            <input 
              v-model="password"
              type="password" 
              placeholder="••••••••••••"
              class="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00D2C4] focus:border-transparent outline-none transition-all bg-gray-50 text-gray-700"
              required
            />
          </div>

          <div class="flex justify-end">
            <button 
              type="button" 
              @click="mostrarModalReset = true" 
              class="text-sm font-semibold hover:underline cursor-pointer" 
              style="color: #0B192C;"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button 
            type="submit"
            :disabled="cargando"
            class="w-full text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95 mt-4 flex justify-center items-center"
            style="background-color: #0B192C;"
          >
            <span v-if="!cargando">Iniciar Sesión</span>
            <span v-else class="animate-pulse">Verificando...</span>
          </button>
        </form>

        <p class="text-center text-xs text-gray-400 mt-20">
          © 2026 Universidad Austral de Chile — Ingeniería Civil en Informática
        </p>
      </div>
    </div>

    <!-- COLUMNA DERECHA: ILUSTRACIÓN CORPORATIVA -->
    <div 
      class="hidden md:flex w-[55%] flex-col justify-center p-20 relative overflow-hidden"
      style="background-color: #0B192C;"
    >
      <div class="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full opacity-10" style="background-color: #00D2C4;"></div>
      
      <div class="relative z-10">
        <h3 class="text-6xl font-black text-white leading-[1.1] mb-8">
          El control total de tu <br/>
          <span style="color: #00D2C4;">inventario</span> en un <br/>
          solo lugar.
        </h3>
        <p class="text-gray-300 text-xl leading-relaxed max-w-md">
          Optimiza tus ventas, gestiona tus productos y recibe alertas inteligentes de stock en tiempo real.
        </p>
      </div>

      <div class="absolute bottom-12 left-20">
        <div class="text-3xl font-black tracking-tighter">
          <span class="text-white">GES</span><span class="text-[#00D2C4]">TOCK</span>
        </div>
      </div>
    </div>

    <!-- MODAL POPUP: RECUPERACIÓN DE CONTRASEÑA -->
    <div v-if="mostrarModalReset" class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 relative">
        <button @click="cerrarModalReset" class="absolute top-5 right-5 text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
        
        <h3 class="text-xl font-black mb-2" style="color: #0B192C;">🔑 Recuperar Contraseña</h3>
        <p class="text-xs text-gray-400 mb-6">
          Por motivos de seguridad institucional, contacta al Administrador de tu minimarket para reestablecer tu clave o solicita un token de asistencia.
        </p>

        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 space-y-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl">👤</span>
            <div>
              <p class="text-xs font-bold" style="color: #0B192C;">Administrador del Sistema</p>
              <p class="text-[11px] text-gray-500">admin@gestock.cl</p>
            </div>
          </div>
          <div class="h-px bg-gray-200"></div>
          <p class="text-[11px] text-gray-400 leading-normal">
            El administrador puede editar tu clave directamente desde el módulo <strong>Gestión Usuarios</strong> en el panel de control.
          </p>
        </div>

        <button 
          @click="cerrarModalReset"
          class="w-full text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 text-sm"
          style="background-color: #00D2C4; color: #0B192C;"
        >
          Entendido, Volver al Login
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const email = ref('');
const password = ref('');
const errorMsg = ref('');
const cargando = ref(false);
const mostrarModalReset = ref(false);

const router = useRouter();
const authStore = useAuthStore();

const handleLogin = async () => {
  try {
    cargando.value = true;
    errorMsg.value = '';
    
    const response = await axios.post('http://localhost:4000/api/auth/login', {
      correo: email.value,
      password: password.value
    });

    if (response.data.token) {
      const backendUser = response.data.usuario || response.data.user || {};
      
      // Normalizamos todas las propiedades para evitar discrepancias con la base de datos
      const dataUser = {
        id: backendUser.id_usuario || backendUser.id || null,
        id_usuario: backendUser.id_usuario || backendUser.id || null,
        nombre: backendUser.nombre_usuario || backendUser.nombre || 'Usuario',
        nombre_usuario: backendUser.nombre_usuario || backendUser.nombre || 'Usuario',
        correo: backendUser.correo || backendUser.email || email.value,
        email: backendUser.correo || backendUser.email || email.value,
        rol: (backendUser.rol || 'CAJERO').toUpperCase()
      };

      // Guardamos en el Store y en LocalStorage
      authStore.setToken(response.data.token, dataUser);
      
      await router.push('/dashboard');
    }
  } catch (error) {
    errorMsg.value = error.response?.data?.mensaje || 'Error al conectar con el servidor';
  } finally {
    cargando.value = false;
  }
};

const cerrarModalReset = () => {
  mostrarModalReset.value = false;
};
</script>