import React from 'react'
import {BrowserRouter , Routes ,Route} from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import ForgotPage from './pages/auth/ForgotPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'


const App = () => {
  return (
    <BrowserRouter>
    <Routes>
      {/* User auth */}
      <Route path='/login' element={<LoginPage/>} />
      <Route path='/forgot-password' element={<ForgotPage/>}/>
      <Route path='/reset-password' element={<ResetPasswordPage/>}/>
    </Routes>
    
    </BrowserRouter>
  )
}

export default App