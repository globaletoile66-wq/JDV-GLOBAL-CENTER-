'use client';

import React, { useState } from 'react';
import AuthBrandPanel from './AuthBrandPanel';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen flex bg-background">
      {/* Brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[44%] 2xl:w-[40%] flex-shrink-0">
        <AuthBrandPanel />
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-12 xl:px-16 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-extrabold text-lg">J</div>
            <span className="font-extrabold text-xl text-foreground">JDV GLOBAL CENTER</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">Votre écosystème numérique international</p>
        </div>

        <div className="w-full max-w-md">
          {/* Tabs */}
          <div className="flex rounded-xl bg-muted/40 border border-border p-1 mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'login' ?'bg-accent text-white shadow-lg' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'register' ?'bg-accent text-white shadow-lg' :'text-muted-foreground hover:text-foreground'
              }`}
            >
              Créer un compte
            </button>
          </div>

          {/* Form */}
          <div className="animate-fade-in">
            {activeTab === 'login' ? (
              <LoginForm onSwitchToRegister={() => setActiveTab('register')} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setActiveTab('login')} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}