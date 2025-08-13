import React from 'react';
import { BookOpen, FileText, HelpCircle, Download, ExternalLink } from 'lucide-react';

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

        {/* Grid de Seções de Documentação */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Guia de Início Rápido */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Guia de Início</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Aprenda os conceitos básicos e como começar a usar o sistema de otimização.
            </p>
            <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
              Ler guia
              <ExternalLink className="h-4 w-4 ml-1" />
            </button>
          </div>

          {/* Manual do Usuário */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Manual do Usuário</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Documentação completa sobre todas as funcionalidades e recursos disponíveis.
            </p>
            <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
              Acessar manual
              <ExternalLink className="h-4 w-4 ml-1" />
            </button>
          </div>

          {/* FAQ */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <HelpCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Perguntas Frequentes</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Respostas para as dúvidas mais comuns sobre o uso do sistema.
            </p>
            <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
              Ver FAQ
              <ExternalLink className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Seção de Recursos */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recursos e Downloads</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200">
                <Download className="h-6 w-6 text-gray-600 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Template Excel</h4>
                  <p className="text-sm text-gray-600">Modelo de planilha para upload de dados</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200">
                <Download className="h-6 w-6 text-gray-600 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Guia de Treinamento</h4>
                  <p className="text-sm text-gray-600">PDF com instruções detalhadas</p>
                </div>
              </div>
            </div>
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

        {/* Seção de Suporte */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Suporte e Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Suporte Técnico</h3>
              <p className="text-gray-600 mb-2">
                Para questões técnicas e problemas com o sistema:
              </p>
              <p className="text-blue-600 font-medium">suporte@weavewise.com</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Treinamento</h3>
              <p className="text-gray-600 mb-2">
                Para solicitações de treinamento e consultoria:
              </p>
              <p className="text-blue-600 font-medium">treinamento@weavewise.com</p>
            </div>
          </div>
        </div>
      </div>