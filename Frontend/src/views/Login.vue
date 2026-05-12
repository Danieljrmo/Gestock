<template>
  <div class="h-screen w-full flex flex-col md:flex-row bg-white overflow-hidden font-sans">
    
    <div class="w-full md:w-[45%] flex flex-col justify-center items-center p-8 md:p-16 bg-white">
      
      <div class="w-full max-w-[400px]">
        
        <div class="flex items-center gap-2 mb-12">
          <h1 class="text-2xl font-black tracking-tighter" style="color: #0B192C;">
            GES<span class="text-[#00D2C4]">TOCK</span>
          </h1>
        </div>

        <div class="mb-10">
          <h2 class="text-4xl font-black mb-3" style="color: #0B192C;">¡Bienvenido!</h2>
          <p class="text-gray-500 font-medium">Ingresa tus datos para gestionar tu negocio.</p>
        </div>

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
            <a href="#" class="text-sm font-semibold hover:underline" style="color: #0B192C;">¿Olvidaste tu contraseña?</a>
          </div>

          <button 
            type="submit"
            class="w-full text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95 mt-4"
            style="background-color: #0B192C;"
          >
            Iniciar Sesión
          </button>
        </form>

        <p class="text-center text-xs text-gray-400 mt-20">
          © 2026 Universidad Austral de Chile — Ingeniería Civil en Informática
        </p>
      </div>
    </div>

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
const router = useRouter();
const authStore = useAuthStore();

const handleLogin = async () => {
  try {
    errorMsg.value = '';
    // Llamada al Backend en el puerto 4000
    const response = await axios.post('http://localhost:4000/api/auth/login', {
      correo: email.value,
      password: password.value
    });

    if (response.data.token) {
      authStore.setToken(response.data.token);
      alert('¡Bienvenido a Gestock!');
      // router.push('/dashboard'); // Descomentar cuando tengamos el Dashboard
    }
  } catch (error) {
    errorMsg.value = error.response?.data?.mensaje || 'Error al conectar con el servidor';
  }
};

</script>