import { useState } from 'react'
import BrandPill from './components/BrandPill.jsx'
import AuthVisualPanel from './components/AuthVisualPanel.jsx'
import LoginForm from './components/LoginForm.jsx'
import RegisterForm from './components/RegisterForm.jsx'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const isRegister = mode === 'register'

  return (
    <div className="min-h-screen w-full bg-neutral-50 px-4 py-8 sm:px-6 lg:px-8">
      <BrandPill />
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="relative overflow-hidden rounded-[40px] bg-white shadow-xl shadow-black/5 ring-1 ring-neutral-200">
          <div className="relative hidden min-h-[700px] lg:block">
            <div
              className={`absolute left-0 top-0 h-full w-1/2 p-6 transition-transform duration-[700ms] [transition-timing-function:cubic-bezier(0.65,0,0.35,1)] ${
                isRegister ? 'translate-x-full' : 'translate-x-0'
              }`}
            >
              <AuthVisualPanel />
            </div>
            <div
              className={`absolute right-0 top-0 h-full w-1/2 px-8 py-8 transition-transform duration-[700ms] [transition-timing-function:cubic-bezier(0.65,0,0.35,1)] ${
                isRegister ? '-translate-x-full' : 'translate-x-0'
              }`}
            >
              <div className={`h-full transition-opacity duration-300 ${isRegister ? 'opacity-0 delay-0' : 'opacity-100 delay-[350ms]'}`}>
                <LoginForm onSwitch={() => setMode('register')} />
              </div>
              <div className={`absolute inset-x-8 inset-y-10 transition-opacity duration-300 ${isRegister ? 'opacity-100 delay-[350ms]' : 'pointer-events-none opacity-0 delay-0'}`}>
                <RegisterForm onSwitch={() => setMode('login')} />
              </div>
            </div>
          </div>

          <div className="block min-h-[640px] px-5 py-8 sm:px-8 lg:hidden">
            <div className="mx-auto flex h-full w-full max-w-md flex-col">
              <div className={`transition-all duration-500 ${isRegister ? 'hidden opacity-0' : 'block opacity-100'}`}>
                <LoginForm onSwitch={() => setMode('register')} />
              </div>
              <div className={`transition-all duration-500 ${isRegister ? 'block opacity-100' : 'hidden opacity-0'}`}>
                <RegisterForm onSwitch={() => setMode('login')} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
