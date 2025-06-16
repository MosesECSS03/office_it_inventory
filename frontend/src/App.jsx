import React, { Component } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MainPage from './pages/MainPage'
import './App.css'

class App extends Component {
  componentDidMount() {
    // Prevent browser back navigation on swipe gestures
    this.preventSwipeNavigation();
  }

  componentWillUnmount() {
    // Clean up event listeners
    document.removeEventListener('touchstart', this.handleTouchStart, { passive: false });
    document.removeEventListener('touchmove', this.handleTouchMove, { passive: false });
  }

  preventSwipeNavigation = () => {
    let startX = 0;
    let startY = 0;

    // Handle touch start
    this.handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    // Handle touch move to prevent swipe navigation
    this.handleTouchMove = (e) => {
      if (!startX || !startY) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = startX - currentX;
      const diffY = startY - currentY;

      // If horizontal swipe is more significant than vertical
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Prevent swipe if it's from the edge (likely navigation gesture)
        if (startX < 50 || startX > window.innerWidth - 50) {
          e.preventDefault();
        }
      }
    };

    // Add event listeners
    document.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });

    // Prevent overscroll behavior
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
  };

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
