import React, { useState, useEffect } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const Notas = () => {
  const [notas, setNotas] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    // Asumimos que el ID del estudiante es 1 por ahora
    fetch(`${BACKEND_URL}/api/estudiantes/1/notas`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al obtener las notas')
        }
        return response.json()
      })
      .then(data => setNotas(data))
      .catch(error => {
        console.error('Error:', error)
        setError(error.message)
      })
  }, [])

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Notas del Estudiante</h2>
      {notas.length === 0 ? (
        <p>Cargando notas...</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Materia</th>
              <th className="p-2 text-left">Nota</th>
            </tr>
          </thead>
          <tbody>
            {notas.map((nota, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">{nota.materia}</td>
                <td className="p-2">{nota.nota}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Notas