import React, { Component } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MainPage from './pages/MainPage'
import './App.css'

class App extends Component {
  render() {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<MainPage />} />
        </Routes>
      </Router>
    )
  }
}

export default App
