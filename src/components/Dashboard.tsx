import React from 'react'
import { Book, MessageCircle, User } from 'lucide-react'

const Dashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Book className="mr-2" /> Resumen de Notas
        </h2>
        <p>Promedio general: 4.2</p>
        <p>Materias aprobadas: 8/10</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <MessageCircle className="mr-2" /> Chats Activos
        </h2>
        <p>Matemáticas: 2 mensajes nuevos</p>
        <p>Ciencias: Próxima clase virtual en 2 horas</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <User className="mr-2" /> Perfil del Estudiante
        </h2>
        <p>Nombre: Juan Pérez</p>
        <p>Grado: 10°</p>
        <p>Grupo: A</p>
      </div>
    </div>
  )
}

export default Dashboard