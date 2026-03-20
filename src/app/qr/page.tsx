'use client';

import React from 'react';
import QRCode from 'react-qr-code';
import { Bot, Shield, Printer } from 'lucide-react';
import Link from 'next/link';

export default function QRCodePage() {
  const url = 'https://852.egos.ia.br';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-black print:bg-white flex flex-col items-center justify-center p-8">
      
      {/* Non-printable header/actions */}
      <div className="absolute top-6 right-6 flex items-center gap-4 print:hidden">
        <Link href="/admin" className="text-sm font-medium text-neutral-600 hover:text-black transition">
          Voltar ao Painel
        </Link>
        <button 
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          <Printer className="w-4 h-4" />
          Imprimir Cartaz
        </button>
      </div>

      {/* Printable Poster Area */}
      <div className="w-full max-w-2xl bg-white border-2 border-dashed border-neutral-300 print:border-none p-12 rounded-3xl flex flex-col items-center text-center">
        
        {/* Header symbols */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-amber-50 shadow-inner">
            <Shield className="h-12 w-12 text-amber-600" />
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-black shadow-lg">
              <Bot className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-6xl font-black tracking-tight text-neutral-900 mb-4">
          Tira-Voz 852
        </h1>
        
        <p className="text-2xl font-medium text-neutral-600 mb-12 max-w-lg">
          O canal de inteligência e sugestões operacionais da Polícia Civil.
        </p>

        {/* QR Code */}
        <div className="p-4 bg-white rounded-3xl border-4 border-black shadow-2xl mb-12">
          <QRCode 
            value={url} 
            size={320}
            level="H"
            className="w-full h-full"
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-bold text-neutral-800">
            Aponte a câmera do seu celular
          </p>
          <p className="text-lg text-neutral-500 font-medium">
            100% Digital e Anônimo
          </p>
          <p className="text-md text-neutral-400 font-mono mt-4">
            {url}
          </p>
        </div>
      </div>
    </div>
  );
}
