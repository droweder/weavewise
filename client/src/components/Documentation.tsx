import React from 'react';
import { BookOpen } from 'lucide-react';

export const Documentation: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Documentação</h1>
        </div>

        {/* Seção de Introdução */}
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              Bem-vindo ao Weavewise
            </h2>
            <p className="text-blue-800 leading-relaxed">
              O Weavewise é um sistema avançado de otimização têxtil que utiliza inteligência artificial 
              para otimizar quantidades de corte em enfestos industriais. Esta documentação irá guiá-lo 
              através de todas as funcionalidades do sistema.
            </p>
          </div>
        </div>

        {/* Seção de Conceitos Técnicos */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Conceitos Técnicos</h2>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Otimização de Enfesto</h3>
              <p className="text-gray-600">
                O enfesto é o processo de empilhamento de tecidos em camadas para corte simultâneo. 
                O sistema otimiza as quantidades para maximizar a eficiência do corte, considerando 
                fatores como número de camadas ideais e repetições por tamanho.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Treinamento de Modelo</h3>
              <p className="text-gray-600">
                O sistema utiliza dados históricos de analistas experientes para treinar modelos 
                de machine learning que aprendem padrões de otimização específicos para cada tipo 
                de produto e configuração de produção.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Tolerância de Otimização</h3>
              <p className="text-gray-600">
                A tolerância define a flexibilidade permitida nas otimizações. Uma tolerância maior 
                permite ajustes mais significativos nas quantidades, enquanto uma menor mantém os 
                valores mais próximos aos originais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};