import { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Iniciar Sesión · BotiGest',
  description: 'Acceso seguro al sistema farmacéutico BotiGest',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-sidebar">
      {/* Luz ambiente de fondo sutil */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      <LoginForm />
    </div>
  );
}
