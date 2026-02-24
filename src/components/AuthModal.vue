<template>
  <div class="auth-modal-overlay" v-if="isVisible" @click.self="close">
    <div class="auth-modal">
      <div class="auth-header">
        <h3>{{ isLogin ? t('login') : t('register') }}</h3>
        <button class="close-btn" @click="close">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="auth-tabs">
        <button 
          :class="['tab-btn', { active: isLogin }]" 
          @click="isLogin = true"
        >
          {{ t('login') }}
        </button>
        <button 
          :class="['tab-btn', { active: !isLogin }]" 
          @click="isLogin = false"
        >
          {{ t('register') }}
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label>{{ t('email') }}</label>
          <input 
            type="email" 
            v-model="email" 
            required
            :placeholder="t('emailPlaceholder')"
          />
        </div>
        <div class="form-group">
          <label>{{ t('password') }}</label>
          <input 
            type="password" 
            v-model="password" 
            required
            minlength="6"
            :placeholder="t('passwordPlaceholder')"
          />
        </div>
        <div class="form-group" v-if="!isLogin">
          <label>{{ t('confirmPassword') }}</label>
          <input 
            type="password" 
            v-model="confirmPassword" 
            required
            minlength="6"
            :placeholder="t('confirmPasswordPlaceholder')"
          />
        </div>

        <div class="error-message" v-if="error">{{ error }}</div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <i class="fas fa-spinner fa-spin" v-if="loading"></i>
          <span v-else>{{ isLogin ? t('login') : t('register') }}</span>
        </button>
      </form>

      <div class="auth-footer">
        <p v-if="isLogin">
          {{ t('noAccount') }} 
          <a href="#" @click.prevent="isLogin = false">{{ t('registerNow') }}</a>
        </p>
        <p v-else>
          {{ t('hasAccount') }} 
          <a href="#" @click.prevent="isLogin = true">{{ t('loginNow') }}</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useSupabase } from '../lib/supabase';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  t: {
    type: Function,
    required: true
  }
});

const emit = defineEmits(['close', 'success']);

const { signIn, signUp } = useSupabase();

const isLogin = ref(true);
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);

const handleSubmit = async () => {
  error.value = '';
  
  if (!isLogin.value && password.value !== confirmPassword.value) {
    error.value = props.t('passwordMismatch');
    return;
  }

  loading.value = true;

  try {
    let result;
    if (isLogin.value) {
      result = await signIn(email.value, password.value);
    } else {
      result = await signUp(email.value, password.value);
    }

    if (result.error) {
      error.value = result.error.message;
    } else {
      emit('success', result.data);
      close();
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const close = () => {
  email.value = '';
  password.value = '';
  confirmPassword.value = '';
  error.value = '';
  emit('close');
};
</script>

<style scoped>
.auth-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.auth-modal {
  background: var(--bg-primary);
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.auth-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
}

.auth-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-tertiary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.auth-tabs {
  display: flex;
  padding: 16px 24px 0;
  gap: 8px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background: var(--bg-tertiary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: var(--accent-color, #3b82f6);
  color: #fff;
}

.auth-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-color, #3b82f6);
}

.form-group input::placeholder {
  color: var(--text-muted);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 16px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  border: none;
  background: var(--accent-color, #3b82f6);
  color: #fff;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  padding: 0 24px 20px;
  text-align: center;
}

.auth-footer p {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

.auth-footer a {
  color: var(--accent-color, #3b82f6);
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>
