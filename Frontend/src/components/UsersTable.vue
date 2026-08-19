<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center bg-[#0D1B2E] p-6 rounded-2xl border border-slate-800 shadow-sm">
      <div>
        <h3 class="text-lg font-bold text-white">Lista de Usuarios</h3>
        <p class="text-sm text-slate-400">Personal autorizado para operar el sistema Gestock</p>
      </div>
      <!-- 1. BOTÓN NUEVO USUARIO CON CONDICIÓN BLINDADA -->
      <button 
        v-if="authStore.user?.rol?.toUpperCase().startsWith('ADMIN')"
        @click="showModal = true"
        class="bg-[#00D2C4] text-[#0B192C] font-black px-5 py-3 rounded-xl transition-all text-sm flex items-center gap-2 active:scale-95 hover:bg-[#00b8ac] shadow-md shadow-cyan-500/10"
      >
        <span>➕</span> Nuevo Usuario
      </button>
    </div>

    <div v-if="errorMsg" class="bg-red-950/40 text-red-400 p-4 rounded-xl text-sm font-semibold border border-red-800/40">
      ⚠️ {{ errorMsg }}
    </div>
    <div v-if="successMsg" class="bg-emerald-950/40 text-emerald-400 p-4 rounded-xl text-sm font-semibold border border-emerald-800/40">
      ✅ {{ successMsg }}
    </div>

    <div class="bg-[#0D1B2E] rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-900/80 border-b border-slate-800">
              <th class="p-5 text-xs font-bold uppercase tracking-widest text-slate-400">Nombre</th>
              <th class="p-5 text-xs font-bold uppercase tracking-widest text-slate-400">Correo Electrónico</th>
              <th class="p-5 text-xs font-bold uppercase tracking-widest text-slate-400">Rol</th>
              <th class="p-5 text-xs font-bold uppercase tracking-widest text-slate-400">Estado</th>
              <!-- 2. ENCABEZADO ACCIONES CON CONDICIÓN BLINDADA -->
              <th v-if="authStore.user?.rol?.toUpperCase().startsWith('ADMIN')" class="p-5 text-xs font-bold uppercase tracking-widest text-slate-400 text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 text-sm font-medium text-slate-300">
            <tr v-if="loading">
              <td :colspan="authStore.user?.rol?.toUpperCase().startsWith('ADMIN') ? 5 : 4" class="p-10 text-center text-slate-500 font-semibold">
                Cargando registros de la base de datos...
              </td>
            </tr>
            
            <tr v-else-if="users.length === 0">
              <td :colspan="authStore.user?.rol?.toUpperCase().startsWith('ADMIN') ? 5 : 4" class="p-10 text-center text-slate-500 font-semibold">
                No se encontraron usuarios en el sistema.
              </td>
            </tr>

            <tr v-for="user in users" :key="user.id" class="hover:bg-slate-800/50 transition-colors">
              <td class="p-5 font-bold text-white">{{ user.nombre }}</td>
              <td class="p-5 text-slate-400">{{ user.correo }}</td>
              <td class="p-5">
                <span 
                  :class="user.rol?.toUpperCase().startsWith('ADMIN') ? 'bg-cyan-950/50 text-[#00D2C4] border border-cyan-800/40' : 'bg-purple-950/50 text-purple-400 border border-purple-800/40'"
                  class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                >
                  {{ user.rol || 'CAJERO' }}
                </span>
              </td>
              <td class="p-5">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Activo
                </span>
              </td>
              <!-- 3. ACCIONES EN FILAS CON CONDICIÓN BLINDADA -->
              <td v-if="authStore.user?.rol?.toUpperCase().startsWith('ADMIN')" class="p-5 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="openEditModal(user)"
                    class="text-cyan-400 hover:bg-slate-800 p-2 rounded-lg transition-all active:scale-90" 
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <!-- BOTÓN ELIMINAR BLINDADO -->
                  <button 
                    v-if="
                      (user.correo || user.email)?.toLowerCase().trim() !== (authStore.user?.correo || authStore.user?.email)?.toLowerCase().trim() &&
                      String(user.id || user.id_usuario) !== String(authStore.user?.id || authStore.user?.id_usuario)
                    "
                    @click="handleDeleteUser(user.id || user.id_usuario, user.nombre)"
                    class="text-red-400 hover:bg-slate-800 p-2 rounded-lg transition-all active:scale-90" 
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL REGISTRO / EDICIÓN -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div class="bg-[#0D1B2E] w-full max-w-md rounded-2xl border border-slate-800 p-6 space-y-6 text-white">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 class="text-lg font-black text-white">
            {{ isEditing ? 'Editar Usuario' : 'Registrar Nuevo Usuario' }}
          </h3>
          <button @click="closeModal" class="text-slate-400 hover:text-white text-xl font-bold">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase text-slate-400 tracking-wider">Nombre Completo</label>
            <input 
              v-model="form.nombre"
              type="text" 
              required
              class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-medium focus:outline-none focus:border-[#00D2C4]"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase text-slate-400 tracking-wider">Correo Electrónico</label>
            <input 
              v-model="form.correo"
              type="email" 
              required
              class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-medium focus:outline-none focus:border-[#00D2C4]"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase text-slate-400 tracking-wider">Contraseña</label>
            <input 
              v-model="form.password"
              type="password" 
              required
              class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-medium focus:outline-none focus:border-[#00D2C4]"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase text-slate-400 tracking-wider">Rol en el Sistema</label>
            <select 
              v-model="form.rol"
              class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-medium focus:outline-none focus:border-[#00D2C4]"
            >
              <option value="CAJERO">Cajero (Operador de ventas)</option>
              <option value="ADMINISTRADOR">Administrador (Control total)</option>
            </select>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button 
              type="button" 
              @click="closeModal"
              class="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-bold text-sm hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              :disabled="submitting"
              class="px-5 py-2.5 rounded-xl bg-[#00D2C4] text-[#0B192C] font-black text-sm hover:bg-[#00b8ac] disabled:opacity-50"
            >
              {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar Usuario' : 'Guardar Usuario') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const users = ref([]);
const loading = ref(true);
const submitting = ref(false);
const showModal = ref(false); // Estado que controla la visibilidad del modal
const isEditing = ref(false);      // Determina si el modal es para editar
const editingUserId = ref(null);  // Almacena el ID del usuario en edición

const errorMsg = ref('');
const successMsg = ref('');

// Estado del formulario reactivo
const form = ref({
  nombre: '',
  correo: '',
  password: '',
  rol: 'CAJERO'
});

// Obtener la lista de usuarios
const fetchUsers = async () => {
  try {
    loading.value = true;
    errorMsg.value = '';
    const response = await axios.get('http://localhost:4000/api/usuarios', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    users.value = response.data;
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    errorMsg.value = error.response?.data?.mensaje || 'Error al conectar con la base de datos.';
  } finally {
    loading.value = false;
  }
};

// Maneja el envío del formulario (Creación o Edición)
const handleSubmit = async () => {
  try {
    submitting.value = true;
    errorMsg.value = '';
    successMsg.value = '';

    if (isEditing.value) {
      // --- MODO EDICIÓN: Dispara PUT ---
      await axios.put(`http://localhost:4000/api/usuarios/${editingUserId.value}`, form.value, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      successMsg.value = '¡Usuario actualizado exitosamente!';
    } else {
      // --- MODO CREACIÓN: Dispara POST ---
      await axios.post('http://localhost:4000/api/usuarios', form.value, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      successMsg.value = '¡Usuario registrado exitosamente!';
    }

    closeModal();
    await fetchUsers(); // Recarga la tabla con los cambios reflejados
  } catch (error) {
    console.error('Error al procesar el formulario:', error);
    errorMsg.value = error.response?.data?.mensaje || 'No se pudo guardar la información del usuario.';
  } finally {
    submitting.value = false;
  }
};

// Abre el modal precargado con los datos del usuario a editar
const openEditModal = (user) => {
  isEditing.value = true;
  editingUserId.value = user.id || user.id_usuario;
  
  // Precargamos el formulario con los datos actuales de la tabla
  form.value = {
    nombre: user.nombre,
    correo: user.correo,
    password: '', // Dejamos la contraseña en blanco por seguridad; si no escribe nada, el back no la cambia
    rol: user.rol
  };
  
  showModal.value = true;
};

// Eliminar un usuario de la base de datos (DELETE)
const handleDeleteUser = async (id, nombre) => {
  // Una confirmación nativa simple y elegante para evitar accidentes
  const confirmar = confirm(`¿Estás seguro de que deseas eliminar al usuario "${nombre}"?`);
  
  if (!confirmar) return;

  try {
    errorMsg.value = '';
    successMsg.value = '';

    // Hacemos el DELETE inyectando el ID dinámicamente en la URL
    await axios.delete(`http://localhost:4000/api/usuarios/${id}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    successMsg.value = `¡Usuario "${nombre}" eliminado correctamente!`;
    
    // Volvemos a consultar la base de datos para refrescar las filas al instante
    await fetchUsers(); 
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    errorMsg.value = error.response?.data?.mensaje || 'No se pudo eliminar el usuario.';
  }
};

// Limpiar y cerrar el modal
const closeModal = () => {
  showModal.value = false;
  isEditing.value = false;
  editingUserId.value = null;
  form.value = {
    nombre: '',
    correo: '',
    password: '',
    rol: 'CAJERO'
  };
};

onMounted(() => {
  fetchUsers();
});
</script>