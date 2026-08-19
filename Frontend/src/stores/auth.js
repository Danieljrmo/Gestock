import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  
  // Recuperar el usuario directamente del storage persistente
  const userGuardado = localStorage.getItem('usuario_gestock');
  const user = ref(userGuardado ? JSON.parse(userGuardado) : null);

  const setToken = (nuevoToken, datosUsuario = null) => {
    token.value = nuevoToken;
    localStorage.setItem('token', nuevoToken);
    
    if (datosUsuario) {
      // Normalizamos las propiedades para evitar discrepancias
      const usuarioNormalizado = {
        id: datosUsuario.id_usuario || datosUsuario.id,
        nombre: datosUsuario.nombre_usuario || datosUsuario.nombre || 'Usuario',
        correo: datosUsuario.correo,
        rol: (datosUsuario.rol || 'CAJERO').toUpperCase()
      };
      
      user.value = usuarioNormalizado;
      localStorage.setItem('usuario_gestock', JSON.stringify(usuarioNormalizado));
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('usuario_gestock');
  };

  return { token, user, setToken, logout };
});

