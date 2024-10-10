import React from 'react'
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'
import { Book, MessageCircle, User } from 'lucide-react'
import Dashboard from './components/Dashboard'
import Notas from './components/Notas'
import SalaChat from './components/SalaChat'
import Login from './components/Login'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Colegio Colombia</h1>
            <div className="space-x-4">
              <Link to="/" className="hover:text-blue-200"><Book className="inline-block mr-1" />Dashboard</Link>
              <Link to="/notas" className="hover:text-blue-200"><User className="inline-block mr-1" />Notas</Link>
              <Link to="/chat" className="hover:text-blue-200"><MessageCircle className="inline-block mr-1" />Chat</Link>
            </div>
          </div>
        </nav>
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/notas" element={<Notas />} />
            <Route path="/chat" element={<SalaChat />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App